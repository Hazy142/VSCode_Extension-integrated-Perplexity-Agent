
import { ChatMessage, Role, Tool, ExtensionConfig } from './types';
import { Icon } from './src/components/Icon';

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: Role.Assistant,
    content: "Hello! I'm your AI assistant. How can I help you with your code today?",
    timestamp: new Date(),
  },
];

export const TOOLS: Tool[] = [
    {
        id: 'perplexity-search',
        name: 'Perplexity Search',
        description: 'Performs an advanced search using Perplexity models.',
        icon: Icon.Search,
    },
    {
        id: 'workspace-analysis',
        name: 'Workspace Analysis',
        description: 'Analyzes the current workspace, including files and dependencies.',
        icon: Icon.Code,
    },
    {
        id: 'code-explanation',
        name: 'Code Explanation',
        description: 'Generates a detailed explanation for a selected code snippet.',
        icon: Icon.Info,
    }
];

export const INITIAL_CONFIG: ExtensionConfig = {
    apiKey: 'xxx',
    model: 'sonar-pro',
    temperature: 0.7,
    apiKeyStatus: 'false',
    defaultModel: 'sonar-pro',
    maxTokens: 2048,
    theme: 'dark',
    enableMCP: true,
    enableWorkspaceAnalysis: true,
};
