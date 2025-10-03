import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PerplexityClient } from './services/PerplexityClient';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'perplexity.chat';

    private _view?: vscode.WebviewView;
    private _perplexityClient: PerplexityClient;

    constructor(private readonly _context: vscode.ExtensionContext) {
        this._perplexityClient = new PerplexityClient();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'dist')],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'search') {
                try {
                    const results = await this._perplexityClient.search(message.text);
                    webviewView.webview.postMessage({ command: 'searchResult', data: results });
                } catch (error: any) {
                    webviewView.webview.postMessage({ command: 'error', message: error.message });
                }
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