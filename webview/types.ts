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

export interface SymbolInfo {
  name: string;
  kind: number; // vscode.SymbolKind is a number
  // location is complex, so we might simplify or omit it for the webview
}

export interface FileContext {
  filePath: string;
  fileName: string; // Add fileName for easier display
  content?: string; // Content might be large, so make it optional
  symbols?: SymbolInfo[];
  languageId: string;
}

export interface GitContext {
  branch: string;
  status: string;
  remoteUrl?: string;
  lastCommit?: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
}

export interface DependencyInfo {
  name: string;
  version: string;
  source: string;
}

export interface WorkspaceContext {
  projectType: string;
  technologies: string[]; // Renamed from languages/frameworks for simplicity
  activeFiles?: FileContext[];
  gitInfo?: GitContext;
  dependencies?: DependencyInfo[];
  // codeSymbols might be too large for the webview, omitting for now
}