export enum View {
  Chat = 'chat',
  Tools = 'tools',
  Settings = 'settings',
}

export enum Role {
  User = 'user',
  Assistant = 'assistant',
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string | SearchResult;
  timestamp: Date;
}

export const PerplexityModels = [
  "sonar",
  "sonar-pro",
  "sonar-reasoning",
  "sonar-reasoning-pro",
  "sonar-deep-research"
] as const;
export type Theme = 'auto' | 'light' | 'dark';

export interface ExtensionConfig {
  apiKey: string;
  model: typeof PerplexityModels[number];
  temperature: number;
  maxTokens: number;
  apiKeyStatus: 'valid' | 'invalid' | 'unconfigured';
  enableMCP: boolean;
  enableWorkspaceAnalysis: boolean;
  theme: Theme;
  defaultModel: typeof PerplexityModels[number];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface Source {
  url: string;
  title: string;
  snippet: string;
}

export interface SearchResult {
  answer: string;
  sources: Source[];
  followUpQuestions: string[];
}