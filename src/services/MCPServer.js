import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';
/**
 * Starts the MCP server in a separate Node.js process to avoid freezing the extension host.
 * @param context The extension context, used for finding the script path and managing disposal.
 */
export function startMCPServer(context) {
    console.log("[Extension] Attempting to start MCP Server child process...");
    // Path to the compiled server runner script
    const serverRunnerPath = path.join(context.extensionPath, 'out', 'src', 'mcp-server-runner.js');
    // Use the same Node.js executable that is running the extension host.
    const serverProcess = spawn(process.execPath, [serverRunnerPath], {
        stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
        shell: false,
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
    });
    // Log stdout from the server process for debugging
    serverProcess.stdout.on('data', (data) => {
        console.log(`[MCP Server stdout]: ${data.toString().trim()}`);
    });
    // Log stderr and show an error message
    serverProcess.stderr.on('data', (data) => {
        const errorMessage = `[MCP Server stderr]: ${data.toString().trim()}`;
        console.error(errorMessage);
        vscode.window.showErrorMessage(errorMessage);
    });
    // Handle process exit
    serverProcess.on('close', (code) => {
        console.log(`[MCP Server] Child process exited with code ${code}`);
        if (code !== 0) {
            vscode.window.showWarningMessage(`The Perplexity MCP Server process exited unexpectedly (code: ${code}).`);
        }
    });
    // Handle spawn errors
    serverProcess.on('error', (err) => {
        console.error('[Extension] Failed to start MCP Server child process.', err);
        vscode.window.showErrorMessage('Failed to start the Perplexity MCP Server process.');
    });
    console.log(`[Extension] Started MCP Server process with PID: ${serverProcess.pid}`);
    // Ensure the child process is terminated when the extension is deactivated
    context.subscriptions.push({
        dispose: () => {
            console.log('[Extension] DISPOSE called. Terminating MCP Server process.');
            if (serverProcess && !serverProcess.killed) {
                const result = serverProcess.kill('SIGTERM');
                console.log(`[Extension] KILL signal sent to process ${serverProcess.pid}. Success: ${result}`);
            }
            else {
                console.log('[Extension] MCP Server process already killed or does not exist.');
            }
        }
    });
    return serverProcess;
}
//# sourceMappingURL=MCPServer.js.map