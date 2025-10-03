import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PerplexityClient } from './services/PerplexityClient';
import { startMCPServer } from './services/MCPServer';

import { ChildProcess } from 'child_process';

let perplexityClient: PerplexityClient | undefined;
export let mcpServerProcess: ChildProcess | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('[Perplexity] Extension is activating...');

    // Start the MCP server in a separate process immediately on activation.
    // This ensures the server is ready when any command needs it.
    console.log('[Perplexity] Initializing services...');
    mcpServerProcess = startMCPServer(context);

    const showChatCommand = vscode.commands.registerCommand('perplexity-vscode.showChat', async () => {
        // Lazy load the PerplexityClient only when the chat command is executed.
        if (!perplexityClient) {
            perplexityClient = new PerplexityClient();
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
                    if (!perplexityClient) {
                        // This should not happen if the command is executed correctly, but it's a good safeguard.
                        vscode.window.showErrorMessage("Perplexity client not initialized.");
                        return;
                    }
                    try {
                        const results = await perplexityClient.search(message.text);
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