import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PerplexityClient } from './services/PerplexityClient';
import { PerplexityModel, PerplexityModels } from './util/models';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'perplexity.chat';

    private _view?: vscode.WebviewView;
    private _perplexityClient: PerplexityClient;
    private _model: PerplexityModel = 'sonar'; // Default model

    constructor(private readonly _context: vscode.ExtensionContext) {
        this._perplexityClient = new PerplexityClient(this._context);
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

        // Send the list of models to the webview when it's ready
        webviewView.webview.postMessage({
            command: 'updateModels',
            data: PerplexityModels
        });

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'search':
                    try {
                        const results = await this._perplexityClient.search(message.text, this._model);
                        webviewView.webview.postMessage({ command: 'searchResult', data: results });
                    } catch (error: any) {
                        webviewView.webview.postMessage({ command: 'error', message: error.message });
                    }
                    break;
                case 'selectModel':
                    const selectedModel = message.content as PerplexityModel;
                    if (PerplexityModels.includes(selectedModel)) {
                        this._model = selectedModel;
                    }
                    break;
            }
        });
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