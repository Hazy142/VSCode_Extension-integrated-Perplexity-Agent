import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { startMCPServer } from './services/MCPServer.js';
import { PerplexityClient } from './services/PerplexityClient.js';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "perplexity-vscode-extension" is now active!');

    const perplexityClient = new PerplexityClient();

    // Start the MCP Server if enabled
    console.log('Initializing Perplexity Pro Extension...');
    startMCPServer().catch(error => {
        console.error("Failed to start MCP Server:", error);
        vscode.window.showErrorMessage("Perplexity Pro: Failed to start MCP Server. See console for details.");
    });

    let panel: vscode.WebviewPanel | undefined;

    // Register the command to show the chat webview
    const showChatCommand = vscode.commands.registerCommand('perplexity.showChat', () => {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (panel) {
            panel.reveal(column);
            return;
        }

        panel = vscode.window.createWebviewPanel(
            'perplexityChat',
            'Perplexity Chat',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist')],
                retainContextWhenHidden: true,
            }
        );

        panel.webview.html = getWebviewContent(context, panel.webview);

        panel.onDidDispose(() => {
            panel = undefined;
        }, null, context.subscriptions);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'search':
                        try {
                            const results = await perplexityClient.search(message.text);
                            panel?.webview.postMessage({ command: 'searchResult', data: results });
                        } catch (error: any) {
                            console.error("Error during Perplexity search:", error);
                            panel?.webview.postMessage({ command: 'error', message: error.message });
                        }
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(showChatCommand);
}

function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
    const webviewDistPath = vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist');
    const htmlPath = vscode.Uri.joinPath(webviewDistPath, 'index.html');

    if (!fs.existsSync(htmlPath.fsPath)) {
        return `
            <html>
                <body>
                    <h1>Error</h1>
                    <p>Could not find the webview's HTML file. Please run the build process.</p>
                    <p>Expected at: ${htmlPath.fsPath}</p>
                </body>
            </html>
        `;
    }

    let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');
    // Replace script and stylesheet paths to use special vscode-resource URIs
    html = html.replace(/(href|src)="\/assets\/(.+?)"/g, (match, p1, p2) => {
        const resourceUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDistPath, 'assets', p2));
        return `${p1}="${resourceUri}"`;
    });

    return html;
}

export function deactivate() {}