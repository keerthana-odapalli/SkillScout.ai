## SkillScout.ai 🎓

A dual-agent curriculum generator that creates a personalized roadmap and curates verified resources tailored to users' specific goals.

📖 Introduction
This project contains the core logic for SkillScout.ai, a dual-agent system designed to assist users in generating personalized, resource-rich learning curriculums. The system is built using Google Gemini 1.5 Flash and the Google Search Grounding tool, following a modular orchestration architecture that separates structural planning from content curation.

i. Problem Statement & Motivation

In the modern digital landscape, the barrier to learning is no longer access to information, but the curation of it. A simple query like "Learn Python" yields millions of results, ranging from outdated articles to excellent but buried tutorials. Learners often suffer from decision paralysis spending more time searching for the perfect resource than actually learning. This phenomenon, often called tutorial hell leads to fragmented learning and abandonment of goals.
Furthermore, while standard Large Language Models (LLMs) can generate course plans, they frequently fail in two critical ways:

- Hallucination: They invent course titles or reference non-existent URLs.
- Lack of Structure: They provide linear text responses rather than actionable, tracked roadmaps.
The motivation behind SkillScout.ai was to build a system that combines the structural logic of a university syllabus with the agility of real-time web search, eliminating the noise for the self-taught learner.

ii. Solution Statement

SkillScout.ai is an autonomous, dual-agent orchestration engine that functions sequentially as a personal learning concierge. Instead of relying on a single prompt to do everything, the solution decouples the cognitive tasks of "planning" and "researching" into specialized agents:

- The Planner Agent: A logic-focused agent that designs the pedagogical skeleton (Modules & Topics) based on the user's specific goals, skill level, and time commitment.
- The Curator Agent: A research-focused agent that autonomously traverses the web using Google Search Grounding to verify and retrieve high-quality, real-time resources for each topic in the skeleton.
By managing the interaction between these two agents via a central controller, the solution delivers a fully personalized, verified, and interactive curriculum in under a minute.

iii. Architecture

The application is built on a Client-Side Agentic Architecture designed around these core concepts:

- Sequential Agent Architecture: The system utilizes a linear dependency flow. The Planner Agent must first successfully generate the "Syllabus Skeleton" (JSON structure) before the Curator Agent is activated. The Controller (App.tsx) manages this hand-off, taking the output of the Planner and feeding it iteratively into the Curator, ensuring that research is only conducted on approved, structured topics.

- Agents Powered by an LLM: Both agents utilize Google Gemini 2.5 Flash as their cognitive engine. The model is prompted differently depending on its active role—first as an "Instructional Designer" (Planner) to organize logic, and second as a "Research Assistant" (Curator) to parse search results.

- Built-in Tools (Google Search Grounding): The Curator Agent leverages the native Google Search Tool provided by the Gemini API. This allows the LLM to "break out" of its training data and access the live web. The agent uses this tool to validate that every recommended video or article actually exists, eliminating hallucinations.

## To run locally
Prerequisites :
1. Node.js (v18+)
2. A Google Cloud Project with the Gemini API enabled.

Installation :
1. Clone the repository
2. Install dependencies:
   `npm install`
3. Configure Environment: Create a .env file in the root directory and add your API key. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key.
4. Run the app:
   `npm run dev`
