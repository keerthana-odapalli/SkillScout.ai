export enum SkillLevel {
  Beginner = "Beginner",
  Intermediate = "Intermediate",
  Advanced = "Advanced"
}

export enum TimeCommitment {
  Low = "1-2 hours/week",
  Medium = "3-5 hours/week",
  High = "6+ hours/week"
}

export interface UserPreferences {
  goal: string;
  skillLevel: SkillLevel;
  timeCommitment: TimeCommitment;
}

export interface ResourceLink {
  title: string;
  uri: string;
  source?: string;
  thumbnail?: string; // URL for video thumbnail if available
  description?: string; // Brief explanation of why this resource is valuable
}

export interface CuratedContent {
  summary: string;
  resources: ResourceLink[];
}

export interface Topic {
  id: string; // Unique ID for state tracking
  title: string;
  description: string;
  actionableStep: string;
  curatedContent?: CuratedContent; // Added by Curator Agent
}

export interface Module {
  title: string;
  topics: Topic[];
}

export interface Curriculum {
  id: string;
  createdAt: number;
  title: string;
  description: string;
  modules: Module[];
}

export interface AgentStatus {
  stage: 'idle' | 'planning' | 'curating' | 'complete' | 'error';
  message: string;
  progress: number; // 0 to 100
  currentTask?: string;
}