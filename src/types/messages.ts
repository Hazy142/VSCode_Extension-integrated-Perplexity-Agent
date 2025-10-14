export type ContextMessage = 'getWorkspaceContext' | 'getActiveFileContext';

export type SettingsMessage =
  | 'settings:get'
  | 'settings:save'
  | 'settings:key:set'
  | 'settings:key:delete'
  | 'settings:key:test';

export interface ExtensionSettings {
  defaultModel: import('../../src/util/models').PerplexityModel;
  enrichWorkspaceContext: boolean;
  enrichActiveFileContext: boolean;
  timeoutMs?: number;
  retries?: number;
}
