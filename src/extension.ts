import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PerplexityClient } from './services/PerplexityClient.js';
import { startMCPServer } from './services/MCPServer.js';

let perplexityClient: PerplexityClient | undefined;
let mcpServerStarted = false;

export function activate(context: vscode.ExtensionContext) {
    console.log('[Perplexity] Extension is activating...');

    const showChatCommand = vscode.commands.registerCommand('perplexity-vscode.showChat', async () => {
        // 1. Initialisieren Sie die Dienste erst, wenn sie benötigt werden (Lazy Loading)
        if (!perplexityClient) {
            perplexityClient = new PerplexityClient();
        }
        if (!mcpServerStarted) {
            startMCPServer().catch(error => {
                console.error("Failed to start MCP Server:", error);
                vscode.window.showErrorMessage("Perplexity Pro: Failed to start MCP Server.");
            });
            mcpServerStarted = true;
        }

        const panel = vscode.window.createWebviewPanel(
            'perplexityChat',
            'Perplexity Chat',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist')],
                retainContextWhenHidden: true,
            }
        );

        panel.webview.html = getWebviewContent(context, panel.webview);

        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'search') {
                    try {
                        const results = await perplexityClient?.search(message.text);
                        panel.webview.postMessage({ command: 'searchResult', data: results });
                    } catch (error: any) {
                        panel.webview.postMessage({ command: 'error', message: error.message });
                    }
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(showChatCommand);
    console.log('[Perplexity] Extension activated and command registered.');
}

function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
    const webviewDistPath = vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist');
    const htmlPath = vscode.Uri.joinPath(webviewDistPath, 'index.html');

    if (!fs.existsSync(htmlPath.fsPath)) {
        return `<html><body><h1>Error: index.html not found!</h1></body></html>`;
    }

    let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');
    html = html.replace(/(href|src)="\/assets\/(.+?)"/g, (match, p1, p2) => {
        const resourceUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDistPath, 'assets', p2));
        return `${p1}="${resourceUri}"`;
    });

    return html;
}

export function deactivate() { }