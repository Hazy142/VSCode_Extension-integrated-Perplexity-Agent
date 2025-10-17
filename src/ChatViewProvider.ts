import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PerplexityClient } from './services/PerplexityClient';
import { PerplexityModel, PerplexityModels } from './util/models';
import { ContextManager } from './services/ContextManager';
import { ContextMessage, ExtensionSettings, SettingsMessage } from './types/messages';
import { MCPServerWrapper } from './services/MCPServer';

const DEFAULT_SETTINGS: ExtensionSettings = {
    defaultModel: 'sonar',
    enrichWorkspaceContext: true,
    enrichActiveFileContext: true,
};

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'perplexity.chat';

    private _view?: vscode.WebviewView;
    private _perplexityClient: PerplexityClient;
    private _contextManager: ContextManager;
    private _settings: ExtensionSettings;

    constructor(
        private readonly _context: vscode.ExtensionContext,
        private readonly mcpServer: MCPServerWrapper
    ) {
        this._perplexityClient = new PerplexityClient(this._context, this.mcpServer);
        this._contextManager = ContextManager.getInstance();
        // Load settings from global state, using defaults if not present
        this._settings = this._context.globalState.get('perplexity.settings', DEFAULT_SETTINGS);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'dist'),
                vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'dist', 'assets')
            ],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message: { command: ContextMessage | SettingsMessage | 'search' | 'search:cancel', text?: string, data?: any }) => {
            switch (message.command) {
                case 'search':
                    const searchText = message.data?.text || message.text;
                    if (searchText) {
                        this.handleSearch(searchText);
                    }
                    break;
                case 'search:cancel':
                    this._perplexityClient.cancel();
                    this._view?.webview.postMessage({ command: 'stream:end' });
                    break;
                
                // Settings Handlers
                case 'settings:get':
                    this.handleGetSettings();
                    break;
                case 'settings:save':
                    this.handleSaveSettings(message.data);
                    break;
                case 'settings:key:set':
                    this.handleSetKey(message.data.key);
                    break;
                case 'settings:key:delete':
                    this.handleDeleteKey();
                    break;
                case 'settings:key:test':
                    this.handleTestKey();
                    break;

                // Context Handlers
                case 'getWorkspaceContext':
                    const workspaceContextData = await this._contextManager.getWorkspaceContext();
                    this._view?.webview.postMessage({ command: 'workspaceContext', data: workspaceContextData });
                    break;
                case 'getActiveFileContext':
                    const activeFileContextData = await this._contextManager.getActiveFileContext();
                    this._view?.webview.postMessage({ command: 'activeFileContext', data: activeFileContextData });
                    break;
            }
        });
        
        // Push initial data to the webview
        this.pushInitialData();
    }

    private pushInitialData() {
        this._view?.webview.postMessage({
            command: 'updateModels',
            data: PerplexityModels
        });
        this.handleGetSettings();
    }

    private async handleSearch(text: string) {
        if (!this._view) return;
        
        try {
            console.log('[ChatViewProvider] Starting tool-enabled search for:', text);
            
            // The new client handles the entire tool-calling loop.
            // We no longer stuff context into the prompt manually.
            this._perplexityClient.searchStream(text, this._settings.defaultModel, {
                onData: (chunk) => {
                    this._view?.webview.postMessage({ command: 'stream:chunk', data: chunk });
                },
                onEnd: () => {
                    this._view?.webview.postMessage({ command: 'stream:end' });
                },
                onError: (error) => {
                    this._view?.webview.postMessage({ command: 'stream:error', message: error.message });
                }
            });
        } catch (error: any) {
            this._view?.webview.postMessage({ command: 'stream:error', message: error.message });
        }
    }

    private async handleGetSettings() {
        if (!this._view) return;
        const apiKey = await this._context.secrets.get('perplexity.apiKey');
        const apiKeyStatus = apiKey ? 'saved' : 'missing';
        this._view.webview.postMessage({
            command: 'settings:update',
            data: {
                settings: this._settings,
                apiKeyStatus,
            }
        });
    }

    private async handleSaveSettings(settings: ExtensionSettings) {
       if (!PerplexityModels.includes(settings.defaultModel)) {
            settings.defaultModel = 'sonar'
        }
        this._settings = settings;
        await this._context.globalState.update('perplexity.settings', settings);
        this._view?.webview.postMessage({ command: 'settings:saved', data: { ok: true } });
        vscode.window.showInformationMessage('Perplexity settings saved.');
    }

    private async handleSetKey(key: string) {
        if (!this._view) return;
        try {
            await this._context.secrets.store('perplexity.apiKey', key);
            this._view.webview.postMessage({ command: 'settings:key:update', data: { ok: true, status: 'saved' } });
            vscode.window.showInformationMessage('Perplexity API Key saved successfully.');
        } catch (error: any) {
            this._view.webview.postMessage({ command: 'settings:key:update', data: { ok: false, error: error.message } });
            vscode.window.showErrorMessage(`Failed to save API Key: ${error.message}`);
        }
    }

    private async handleDeleteKey() {
        if (!this._view) return;
        try {
            await this._context.secrets.delete('perplexity.apiKey');
            this._view.webview.postMessage({ command: 'settings:key:update', data: { ok: true, status: 'missing' } });
            vscode.window.showInformationMessage('Perplexity API Key deleted.');
        } catch (error: any) {
            this._view.webview.postMessage({ command: 'settings:key:update', data: { ok: false, error: error.message } });
            vscode.window.showErrorMessage(`Failed to delete API Key: ${error.message}`);
        }
    }

    private async handleTestKey() {
        if (!this._view) return;
        const result = await this._perplexityClient.testConnection(this._settings.defaultModel);
        this._view.webview.postMessage({ command: 'settings:key:testResult', data: result });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const webviewDistPath = vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'dist');
        const htmlPath = vscode.Uri.joinPath(webviewDistPath, 'index.html');

        if (!fs.existsSync(htmlPath.fsPath)) {
            return `<html><body><h1>Error: index.html not found!</h1><p>Expected at: ${htmlPath.fsPath}</p></body></html>`;
        }

        let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');

        html = html.replace(/(href|src)="\/(assets\/.+?)"/g, (match, p1, p2) => {
            const resourceUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDistPath, p2));
            return `${p1}="${resourceUri}"`;
        });

        return html;
    }
}