import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ChatCompletionTool } from 'openai/resources/chat/completions';

// Helper to run shell commands
const execShell = (command: string, cwd: string) =>
    new Promise<string>((resolve, reject) => {
        exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            } else {
                resolve(stdout);
            }
        });
    });

// --- 1. Tool Definitions (Zod Schemas) --- 

const workspaceAnalysisParams = z.object({});
const codeExplanationParams = z.object({});
const gitIntegrationParams = z.object({
    command: z.enum(['status', 'branch', 'log', 'diff']).describe("The Git command to execute."),
});
const documentationParams = z.object({
    filePath: z.string().optional().describe("Optional path to a file to analyze. If omitted, the active editor is used."),
});
const fileSearchParams = z.object({
    globPattern: z.string().describe("A glob pattern to search for files in the workspace."),
});

// --- 2. Tool Implementations ---

async function getWorkspaceRoot(): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error("No workspace folder is open.");
    }
    return workspaceFolders[0].uri.fsPath;
}

async function workspaceAnalysis(): Promise<string> {
    try { // [ERROR-ID: MCP-WA-01] 
        const root = await getWorkspaceRoot();
        const packageJsonPath = path.join(root, 'package.json');
        let analysis = 'Workspace Analysis:\n';
        try {
            const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(packageJsonContent);
            analysis += `- Project Name: ${packageJson.name || 'N/A'}\n`;
            analysis += `- Version: ${packageJson.version || 'N/A'}\n`;
            analysis += `- Dependencies: ${Object.keys(packageJson.dependencies || {}).join(', ')}\n`;
            analysis += `- DevDependencies: ${Object.keys(packageJson.devDependencies || {}).join(', ')}\n`;
        } catch {
            analysis += '- package.json not found.\n';
        }
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 100);
        const extensions = new Set(files.map(file => path.extname(file.fsPath).replace('.', '')));
        analysis += `- Detected File Types: ${Array.from(extensions).join(', ')}\n`;
        return analysis;
    } catch (error: any) {
        console.error('[ERROR-ID: MCP-WA-01] Error in workspaceAnalysis:', error.stack);
        throw error; // Re-throw to be caught by the main handler
    }
}

async function codeExplanation(): Promise<string> {
    try { // [ERROR-ID: MCP-CE-01] 
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error("No active text editor found.");
        }
        const document = editor.document;
        const selection = editor.selection;
        const text = selection.isEmpty ? document.getText() : document.getText(selection);

        if (!text) {
            throw new Error("No text selected or the active file is empty.");
        }

        return JSON.stringify({
            language: document.languageId,
            code: text
        }, null, 2);
    } catch (error: any) {
        console.error('[ERROR-ID: MCP-CE-01] Error in codeExplanation:', error.stack);
        throw error;
    }
}

async function gitIntegration(params: z.infer<typeof gitIntegrationParams>): Promise<string> {
    try { // [ERROR-ID: MCP-GI-01] 
        const root = await getWorkspaceRoot();
        let command: string;
        switch (params.command) {
            case 'status':
                command = 'git status';
                break;
            case 'branch':
                command = 'git branch --show-current';
                break;
            case 'log':
                command = 'git log -n 10 --pretty=format:"%h - %an, %ar : %s"';
                break;
            case 'diff':
                command = 'git diff HEAD';
                break;
        }
        return await execShell(command, root);
    } catch (error: any) {
        console.error('[ERROR-ID: MCP-GI-01] Error in gitIntegration:', error.stack);
        throw error;
    }
}

async function documentation(params: z.infer<typeof documentationParams>): Promise<string> {
    try { // [ERROR-ID: MCP-DOC-01] 
        let content: string;
        if (params.filePath) {
            const root = await getWorkspaceRoot();
            const absolutePath = path.join(root, params.filePath);
            content = await fs.readFile(absolutePath, 'utf-8');
        } else {
            const editor = vscode.window.activeTextEditor;
            if (!editor) throw new Error("No active editor and no file path provided.");
            content = editor.document.getText();
        }
        const docComments = content.match(/\/\*\*[\s\S]*?\*\//g);
        return docComments ? docComments.join('\n\n') : "No JSDoc/TSDoc comments found.";
    } catch (error: any) {
        console.error('[ERROR-ID: MCP-DOC-01] Error in documentation:', error.stack);
        throw error;
    }
}

async function fileSearch(params: z.infer<typeof fileSearchParams>): Promise<string> {
    try { // [ERROR-ID: MCP-FS-01] 
        const files = await vscode.workspace.findFiles(params.globPattern, '**/node_modules/**', 100);
        if (files.length === 0) {
            return `No files found matching pattern: ${params.globPattern}`;
        }
        return JSON.stringify(files.map(file => file.fsPath), null, 2);
    } catch (error: any) {
        console.error('[ERROR-ID: MCP-FS-01] Error in fileSearch:', error.stack);
        throw error;
    }
}

const toolImplementations = {
    workspaceAnalysis: { schema: workspaceAnalysisParams, execute: workspaceAnalysis, definition: { name: 'workspaceAnalysis', description: 'Analyzes the current VSCode workspace to identify project metadata, dependencies, and file types.' } },
    codeExplanation: { schema: codeExplanationParams, execute: codeExplanation, definition: { name: 'codeExplanation', description: 'Gets the code from the active text editor (current selection or whole file) to be used for explanation.' } },
    gitIntegration: { schema: gitIntegrationParams, execute: gitIntegration, definition: { name: 'gitIntegration', description: 'Provides insights into the current Git repository, such as status, branch, log, and diffs.' } },
    documentation: { schema: documentationParams, execute: documentation, definition: { name: 'documentation', description: 'Extracts all JSDoc/TSDoc style comments from a file to generate documentation.' } },
    fileSearch: { schema: fileSearchParams, execute: fileSearch, definition: { name: 'fileSearch', description: 'Searches for files within the workspace using a glob pattern.' } },
};

export class MCPServerWrapper {
    public async getToolDefinitions(): Promise<ChatCompletionTool[]> {
        return Object.values(toolImplementations).map(impl => ({
            type: 'function',
            function: {
                name: impl.definition.name,
                description: impl.definition.description,
                parameters: zodToJsonSchema(impl.schema),
            },
        }));
    }

    public async executeTool(name: string, args: any): Promise<any> {
        const toolName = name as keyof typeof toolImplementations;
        const tool = toolImplementations[toolName];

        if (!tool) {
            const errorMsg = `Tool ${toolName} not found`;
            console.error(`[MCPServer] ${errorMsg}`);
            return { error: 'Tool not found', details: errorMsg };
        }

        try {
            const validatedParams = tool.schema.parse(args || {});
            const result = await tool.execute(validatedParams as any);
            return result;
        } catch (error: any) {
            // The individual tool handlers will log the specific error ID.
            // This is the generic fallback.
            console.error(`[MCPServer] Tool execution failed for '${name}':`, error.stack);
            if (error instanceof z.ZodError) {
                return { error: 'Invalid parameters', details: `Invalid parameters for tool ${toolName}: ${error.message}` };
            }
            return { error: 'Tool execution failed', details: error.message };
        }
    }
}

export function runMCPServer(context: vscode.ExtensionContext): MCPServerWrapper {
    console.log("[Extension] Starting MCP Server in-process...");
    // In-process server doesn't need the full Server setup, just the wrapper.
    return new MCPServerWrapper();
}
