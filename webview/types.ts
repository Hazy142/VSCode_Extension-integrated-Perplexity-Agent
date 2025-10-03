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

export type PerplexityModel = 'sonar-pro' | 'sonar-medium-online' | 'sonar-medium-chat';
export type Theme = 'auto' | 'light' | 'dark';

export interface ExtensionConfig {
  apiKey: string;
  model: PerplexityModel;
  temperature: number;
  maxTokens: number;
  apiKeyStatus: 'valid' | 'invalid' | 'unconfigured';
  enableMCP: boolean;
  enableWorkspaceAnalysis: boolean;
  theme: Theme;
  defaultModel: PerplexityModel;
}

export interface SearchResult {
  answer: string;
  sources: Source[];
  followUpQuestions: string[];
}

export interface Source {
  url: string;
  title: string;
  snippet: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}
