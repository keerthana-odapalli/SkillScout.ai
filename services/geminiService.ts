import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Curriculum, UserPreferences, CuratedContent, ResourceLink } from "../types";

// Initialize the client. API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper Functions ---

const getYouTubeVideoId = (url: string): string | undefined => {
  if (!url) return undefined;
  // Robust regex to handle standard watch URLs, shorts, embeds, and youtu.be shortlinks
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : undefined;
};

const getYouTubeThumbnail = (url: string): string | undefined => {
  const id = getYouTubeVideoId(url);
  // 'mqdefault.jpg' is 320x180 and very reliable. 'hqdefault.jpg' is 480x360.
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined;
};

// Simple normalization to help match URLs (ignores protocol and www)
const normalizeUrl = (url: string) => {
  try {
    // Basic cleanup
    let clean = url.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '').toLowerCase();
    return clean;
  } catch (e) {
    return url;
  }
};

// Intelligent title cleaner to prevent "youtube.com" or generic titles
const cleanTitle = (title: string | undefined, uri: string, topicTitle: string): string => {
  const cleanUri = normalizeUrl(uri);
  
  // Fallback for missing title
  if (!title || !title.trim()) {
     const isVideo = cleanUri.includes('youtube') || cleanUri.includes('youtu.be') || cleanUri.includes('vimeo');
     return isVideo ? `${topicTitle} (Video)` : `${topicTitle} Guide`;
  }
  
  let clean = title.trim();
  
  // Remove common suffixes
  clean = clean.replace(/ - YouTube$/, '').replace(/ \| Coursera$/, '').replace(/ - GeeksforGeeks$/, '').replace(/ - Wikipedia$/, '');
  
  // Check for generic or URL-like titles
  const lower = clean.toLowerCase();
  if (
    lower === 'youtube' || 
    lower === 'youtube.com' || 
    lower.startsWith('http') || 
    lower === 'video' || 
    lower === 'article' || 
    lower === 'home' ||
    lower === 'index'
  ) {
     const isVideo = cleanUri.includes('youtube') || cleanUri.includes('youtu.be');
     return isVideo ? `${topicTitle} (Video)` : `${topicTitle} Guide`;
  }
  
  return clean;
};

// Robust Retry Logic for Rate Limits
const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Check for Rate Limit (429) or Quota Exceeded errors
    if (retries > 0 && (
        error?.status === 429 || 
        error?.code === 429 || 
        error?.message?.includes('429') || 
        error?.status === 'RESOURCE_EXHAUSTED'
    )) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

// --- Planner Agent ---

const plannerSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy title for the curriculum" },
    description: { type: Type.STRING, description: "A brief overview of the learning path" },
    modules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Name of the module" },
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Specific topic name" },
                description: { type: Type.STRING, description: "What will be learned" },
                actionableStep: { type: Type.STRING, description: "A concrete task or project to complete" }
              },
              required: ["title", "description", "actionableStep"]
            }
          }
        },
        required: ["title", "topics"]
      }
    }
  },
  required: ["title", "description", "modules"]
};

export const runPlannerAgent = async (prefs: UserPreferences): Promise<Curriculum> => {
  const prompt = `
    You are an expert Educational Curriculum Planner.
    Create a detailed, step-by-step learning curriculum for a user with the following profile:
    - Goal: ${prefs.goal}
    - Current Skill Level: ${prefs.skillLevel}
    - Time Commitment: ${prefs.timeCommitment}

    Structure the curriculum into logical sequential Modules.
    Each Module should have specific Topics.
    Each Topic MUST have a clear Description and a concrete Actionable Step (e.g., "Build a Hello World app", "Write a 500-word essay", "Configure a router").
    
    Keep the number of modules reasonable (3-5) for a focused start.
  `;

  try {
    // Using gemini-2.5-flash for better quota management
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: plannerSchema,
        systemInstruction: "You are a precise, structured educational planner."
      }
    }));

    const text = response.text;
    if (!text) throw new Error("No response from Planner Agent");
    
    // Clean potential Markdown formatting before parsing
    const cleanText = text.replace(/```json|```/g, '').trim();

    // Explicitly define structure to avoid assuming missing properties exist on the parsed object
    const data = JSON.parse(cleanText) as { title: string; description: string; modules: any[] };

    // Post-process to add IDs for React keys
    const processedModules = data.modules.map((mod, mIdx) => ({
      ...mod,
      topics: mod.topics.map((top: any, tIdx: number) => ({
        ...top,
        id: `m${mIdx}-t${tIdx}` // Generate ID for state management
      }))
    }));

    // Add unique ID and timestamp for the curriculum
    return {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      modules: processedModules
    };

  } catch (error) {
    console.error("Planner Agent Error:", error);
    throw error;
  }
};

// --- Curator Agent ---

export const runCuratorAgent = async (topicTitle: string, context: string): Promise<CuratedContent> => {
  // We strictly instruct the model to use the tool and only return valid URLs.
  const prompt = `
    You are an expert Educational Research Assistant (Curator Agent).
    Task: Find 3-5 high-quality, free, and up-to-date learning resources for the specific topic: "${topicTitle}".
    Context: This is part of a curriculum for: ${context}.

    Requirements:
    1. PRIORITIZE Video tutorials (YouTube) and official documentation.
    2. Ensure resources are relevant to the skill level.
    3. Return a JSON array of resources.
    
    For each resource, provide:
    - Title: A clear, descriptive title.
    - URI: The direct link.
    - Description: A 1-sentence explanation of why this resource is good.
    - Type: "Video" or "Article".
  `;

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
      }
    }));

    const candidates = response.candidates;
    const groundingChunks = candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    let resources: ResourceLink[] = [];

    // 1. Map Grounding Chunks to ResourceLinks (Source of Truth)
    resources = groundingChunks
      .filter(chunk => chunk.web?.uri && chunk.web?.title)
      .map(chunk => {
        const uri = chunk.web!.uri;
        const rawTitle = chunk.web!.title;
        const cleanT = cleanTitle(rawTitle, uri, topicTitle);
        
        return {
          title: cleanT,
          uri: uri,
          source: new URL(uri).hostname.replace('www.', ''),
          thumbnail: getYouTubeThumbnail(uri),
          description: `Recommended resource found via Google Search.`
        };
      });

    // 2. Enhance with LLM descriptions
    // The model typically returns a JSON string in response.text. We can parse it to find better descriptions.
    try {
        const text = response.text;
        if (text) {
            const cleanJson = text.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed)) {
                parsed.forEach((item: any) => {
                    if (item.uri && item.description) {
                         const match = resources.find(r => normalizeUrl(r.uri) === normalizeUrl(item.uri));
                         if (match) {
                             match.description = item.description;
                             if (item.title && item.title.length < 100) {
                                 match.title = cleanTitle(item.title, item.uri, topicTitle);
                             }
                         }
                    }
                });
            }
        }
    } catch (e) {
        // Ignore JSON parse errors, fallback to grounding data
    }

    // 3. Fallback Generation if no resources found
    if (resources.length === 0) {
         const q = encodeURIComponent(`${topicTitle} ${context} tutorial`);
         resources.push({
             title: `Search Google for "${topicTitle}"`,
             uri: `https://www.google.com/search?q=${q}`,
             source: "google.com",
             description: "No specific verified links found. Click to search manually.",
             thumbnail: undefined
         });
         const qYt = encodeURIComponent(`${topicTitle} tutorial`);
         resources.push({
             title: `Search YouTube for "${topicTitle}"`,
             uri: `https://www.youtube.com/results?search_query=${qYt}`,
             source: "youtube.com",
             description: "Find video tutorials on YouTube.",
             thumbnail: undefined
         });
    }

    // 4. Clean up generic root domains (like youtube.com homepage)
    if (resources.length > 2) {
        resources = resources.filter(r => {
             const lower = r.uri.toLowerCase();
             const isRoot = lower === 'https://www.youtube.com/' || lower === 'https://www.google.com/' || lower === 'https://youtube.com/';
             return !isRoot;
        });
    }
    
    return {
      summary: `Here are ${resources.length} curated resources for ${topicTitle}.`,
      resources: resources.slice(0, 5)
    };

  } catch (error) {
    console.error("Curator Agent Error:", error);
    // Safe Fallback on API Error
    const q = encodeURIComponent(topicTitle);
    return {
        summary: "Could not curate specific resources due to an error.",
        resources: [
            {
                title: `Search "${topicTitle}" on Google`,
                uri: `https://www.google.com/search?q=${q}`,
                description: "Manual search fallback.",
                source: "google.com"
            }
        ]
    };
  }
};