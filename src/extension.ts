import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "perplexity-vscode-extension" is now active!');

	let disposable = vscode.commands.registerCommand('perplexity.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Perplexity VSCode Extension!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}