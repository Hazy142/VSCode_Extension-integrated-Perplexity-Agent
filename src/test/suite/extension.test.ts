import * as assert from 'assert';
import * as vscode from 'vscode';
import { before, after } from 'mocha';
import { mcpServerProcess } from '../../extension'; // Import the handle

suite('Extension Test Suite', () => {
	before(() => {
		vscode.window.showInformationMessage('Start all tests.');
	});

	after(() => {
		console.log('All tests finished. Forcefully terminating MCP server process for clean shutdown.');
		if (mcpServerProcess && !mcpServerProcess.killed) {
			const result = mcpServerProcess.kill('SIGKILL');
			console.log(`[Test Suite] Sent SIGKILL to process ${mcpServerProcess.pid}. Success: ${result}`);
		} else {
			console.log('[Test Suite] MCP Server process already killed or does not exist.');
		}
	});

	test('Should register perplexity.showChat command', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes("perplexity-vscode.showChat"), 'Command "perplexity-vscode.showChat" is not registered.');
	});

	// test('Should create a webview panel when perplexity.showChat is executed', async () => {
	// 	// Ensure there are no active panels before the test
	// 	assert.strictEqual(vscode.window.visibleTextEditors.length, 0, "There should be no visible text editors.");

	// 	// Execute the command
	// 	await vscode.commands.executeCommand('perplexity.showChat');

	// 	// Wait a bit for the panel to be created and become visible
	// 	await new Promise(resolve => setTimeout(resolve, 500));

	// 	// Check if a webview panel is now active/visible
	// 	// Note: A more robust test would inspect the panel's content, but this confirms creation.
	// 	const panelIsVisible = vscode.window.visibleTextEditors.some(editor => editor.viewColumn !== undefined);
	// 	assert.ok(panelIsVisible, "Webview panel was not created or is not visible after executing the command.");
	// }).timeout(5000); // Increase timeout for this async test
});