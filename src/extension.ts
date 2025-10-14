import * as vscode from 'vscode';
import { startMCPServer } from './services/MCPServer';
import { ChildProcess } from 'child_process';
import { ChatViewProvider } from './ChatViewProvider';

export let mcpServerProcess: ChildProcess | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('[Perplexity] Extension is activating...');

    mcpServerProcess = startMCPServer(context);

    const chatProvider = new ChatViewProvider(context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatProvider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('perplexity-vscode.showChat', () => {
            vscode.commands.executeCommand('perplexity.chat.focus');
        })
    );

    console.log('[Perplexity] Extension activated and view provider registered.');
}

export function deactivate() {
    console.log('[Perplexity] Deactivating extension...');
    if (mcpServerProcess) {
        mcpServerProcess.kill();
        mcpServerProcess = undefined;
    }
    console.log('[Perplexity] Extension deactivated.');
}