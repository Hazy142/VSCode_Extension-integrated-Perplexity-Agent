
export enum Role {
    User = 'user',
    Assistant = 'assistant',
    System = 'system'
}

export interface Source {
    url: string;
    title: string;
    snippet: string;
}

export interface SearchResult {
    answer: string;
    sources: Source[];
    followUpQuestions?: string[];
}

export interface ChatMessage {
    id: string;
    role: Role;
    content: string | SearchResult;
    timestamp: Date;
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

export enum View {
    Chat = 'chat',
    Tools = 'tools',
    Settings = 'settings'
}

export type PerplexityModel = 'sonar-pro' | 'sonar-medium-online' | 'sonar-medium-chat';
export type Theme = 'auto' | 'light' | 'dark';

export interface ExtensionConfig {
    apiKeyStatus: 'valid' | 'invalid' | 'unconfigured';
    defaultModel: PerplexityModel;
    maxTokens: number;
    theme: Theme;
    enableMCP: boolean;
    enableWorkspaceAnalysis: boolean;
}
