import * as vscode from 'vscode';
import { startMCPServer } from './services/MCPServer';
import { ChildProcess } from 'child_process';
import { ChatViewProvider } from './ChatViewProvider';
import { ContextManager } from './services/ContextManager';

export let mcpServerProcess: ChildProcess | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('[Perplexity] Extension is activating...');
    
    try {
        // SCHRITT 1: ContextManager Test
        console.log('[Perplexity] Step 1: Initializing ContextManager...');
        const contextManager = ContextManager.getInstance();
        contextManager.buildContext();
        console.log('[Perplexity] Step 1: ✅ ContextManager initialized');

        // SCHRITT 2: Event Listeners 
        console.log('[Perplexity] Step 2: Setting up event listeners...');
        setInterval(() => {
            contextManager.buildContext();
        }, 5 * 60 * 1000);

        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            contextManager.buildContext();
        });
        vscode.workspace.onDidSaveTextDocument(() => {
            contextManager.buildContext();
        });
        console.log('[Perplexity] Step 2: ✅ Event listeners configured');

        // SCHRITT 3: MCP Server (wahrscheinlicher Crashpoint)
        console.log('[Perplexity] Step 3: Starting MCP Server...');
        mcpServerProcess = startMCPServer(context);
        console.log('[Perplexity] Step 3: ✅ MCP Server started:', !!mcpServerProcess);

        // SCHRITT 4: ChatViewProvider
        console.log('[Perplexity] Step 4: Creating ChatViewProvider...');
        const chatProvider = new ChatViewProvider(context);
        console.log('[Perplexity] Step 4: ✅ ChatViewProvider created');

        // SCHRITT 5: WebView Registration
        console.log('[Perplexity] Step 5: Registering WebView...');
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatProvider)
        );
        console.log('[Perplexity] Step 5: ✅ WebView registered');

        // SCHRITT 6: Commands
        console.log('[Perplexity] Step 6: Registering commands...');
        context.subscriptions.push(
            vscode.commands.registerCommand('perplexity-vscode.showChat', () => {
                vscode.commands.executeCommand('perplexity.chat.focus');
            })
        );
        console.log('[Perplexity] Step 6: ✅ Commands registered');

        console.log('[Perplexity] 🎉 Extension fully activated successfully!');
        
    } 
    
    catch (error) {
    // ✅ TypeScript-safe error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Perplexity] ❌ Activation failed at step:', error);
    vscode.window.showErrorMessage(`Perplexity Extension failed: ${errorMessage}`);
    
    // Graceful fallback - register minimal command
    try {
        context.subscriptions.push(
            vscode.commands.registerCommand('perplexity-vscode.showChat', () => {
                vscode.window.showErrorMessage('Perplexity Extension failed to initialize');
            })
        );
    } catch (fallbackError) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.error('[Perplexity] ❌ Even fallback failed:', fallbackError);
    }
    
    }



}
export function deactivate() {
    console.log('[Perplexity] Deactivating extension...');
    if (mcpServerProcess) {
        mcpServerProcess.kill();
        mcpServerProcess = undefined;
    }
    console.log('[Perplexity] Extension deactivated.');
}