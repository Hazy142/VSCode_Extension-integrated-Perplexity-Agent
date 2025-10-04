import * as vscode from 'vscode';
import { startMCPServer } from './services/MCPServer';
import { ChatViewProvider } from './ChatViewProvider'; // Corrected import path
export let mcpServerProcess;
export function activate(context) {
    console.log('[Perplexity] Extension is activating...');
    // Start the MCP server.
    console.log('[Perplexity] Initializing services...');
    mcpServerProcess = startMCPServer(context);
    // Create a new instance of the ChatViewProvider.
    const chatProvider = new ChatViewProvider(context);
    // Register the provider for the 'perplexity.chat' view.
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatProvider));
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
//# sourceMappingURL=extension.js.map