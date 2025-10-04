import * as vscode from 'vscode';
import * as fs from 'fs';
import { PerplexityClient } from './services/PerplexityClient';
export class ChatViewProvider {
    _context;
    static viewType = 'perplexity.chat';
    _view;
    _perplexityClient;
    constructor(_context) {
        this._context = _context;
        this._perplexityClient = new PerplexityClient();
    }
    resolveWebviewView(webviewView, context, _token) {
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
                }
                catch (error) {
                    webviewView.webview.postMessage({ command: 'error', message: error.message });
                }
            }
        });
    }
    _getHtmlForWebview(webview) {
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
//# sourceMappingURL=ChatViewProvider.js.map