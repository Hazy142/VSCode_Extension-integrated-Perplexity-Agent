import * as vscode from 'vscode';
import { startMCPServer } from './services/MCPServer.js';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "perplexity-vscode-extension" is now active!');

	// Start the MCP Server
	console.log('Initializing Perplexity Pro Extension...');
	startMCPServer().catch(error => {
		console.error("Failed to start MCP Server:", error);
		vscode.window.showErrorMessage("Perplexity Pro: Failed to start MCP Server. See console for details.");
	});


	let disposable = vscode.commands.registerCommand('perplexity.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Perplexity VSCode Extension!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}