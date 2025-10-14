import * as vscode from 'vscode';
import { startMCPServer } from './services/MCPServer';
import { ChildProcess } from 'child_process';
import { ChatViewProvider } from './ChatViewProvider';
import { ContextManager } from './services/ContextManager';

export let mcpServerProcess: ChildProcess | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('[Perplexity] Extension is activating...');

    // Initialize ContextManager
    const contextManager = ContextManager.getInstance();
    contextManager.buildContext();

    // Background context updates (every 5 minutes)
    setInterval(() => {
        contextManager.buildContext();
    }, 5 * 60 * 1000);

    // Workspace change listener
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
        contextManager.buildContext();
    });
    vscode.workspace.onDidSaveTextDocument(() => {
        contextManager.buildContext();
    });


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