// test/mocks/vscode.ts

/**
 * Mock für das 'vscode'-Modul, um Abhängigkeiten in Unit-Tests zu isolieren.
 */
export const window = {
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn(),
};

export const workspace = {
    getConfiguration: jest.fn(() => ({
        get: jest.fn(),
    })),
};

const secretStorage = new Map<string, string>();

export const ExtensionContext = {
    secrets: {
        get: jest.fn((key: string) => Promise.resolve(secretStorage.get(key))),
        store: jest.fn((key: string, value: string) => {
            secretStorage.set(key, value);
            return Promise.resolve();
        }),
        delete: jest.fn((key: string) => {
            secretStorage.delete(key);
            return Promise.resolve();
        }),
    },
};

// Hilfsfunktion zum Zurücksetzen der Mocks vor jedem Test
export function __resetMocks() {
    window.showErrorMessage.mockClear();
    window.showInformationMessage.mockClear();
    workspace.getConfiguration.mockClear();
    (workspace.getConfiguration() as any).get.mockClear();
    secretStorage.clear();
}
