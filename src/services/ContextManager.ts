// src/services/ContextManager.ts
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LRUCache } from 'lru-cache';
import {
    WorkspaceContext,
    FileContext,
    GitContext,
    DependencyInfo,
    SymbolInfo,
    CodeSnippet
} from '../interfaces/Context';

// --- Error Types ---
export class ContextError extends Error {
    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'ContextError';
    }
}

// --- Constants ---
const CACHE_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const ANALYSIS_RATE_LIMIT = 10;
const ANALYSIS_RATE_LIMIT_PERIOD = 60 * 1000; // 1 minute

// --- Singleton ContextManager ---
export class ContextManager {
    private static instance: ContextManager;
    private cache: LRUCache<string, any>;
    private analysisTimestamps: number[] = [];

    private constructor() {
        this.cache = new LRUCache({
            max: CACHE_MAX_SIZE,
            ttl: CACHE_TTL,
            maxSize: CACHE_MAX_SIZE,
            sizeCalculation: (value) => JSON.stringify(value).length,
        });
    }

    public static getInstance(): ContextManager {
        if (!ContextManager.instance) {
            ContextManager.instance = new ContextManager();
        }
        return ContextManager.instance;
    }

    private checkRateLimit(): boolean {
        const now = Date.now();
        this.analysisTimestamps = this.analysisTimestamps.filter(
            (ts) => now - ts < ANALYSIS_RATE_LIMIT_PERIOD
        );
        if (this.analysisTimestamps.length >= ANALYSIS_RATE_LIMIT) {
            console.warn('ContextManager: Analysis rate limit exceeded.');
            return false;
        }
        this.analysisTimestamps.push(now);
        return true;
    }

    public async analyzeWorkspace(): Promise<WorkspaceContext | null> {
        if (!this.checkRateLimit()) {
            return this.cache.get('workspaceContext') as WorkspaceContext || null;
        }

        const cachedContext = this.cache.get('workspaceContext');
        if (cachedContext) {
            return cachedContext as WorkspaceContext;
        }

        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new ContextError('No workspace folder found.');
            }

            const rootPath = workspaceFolders[0].uri.fsPath;

            const [gitInfo, dependencies, languages, frameworks, codeSymbols] = await Promise.all([
                this.getGitContext(rootPath),
                this.getDependencies(rootPath),
                this.detectLanguages(rootPath),
                this.detectFrameworks(rootPath),
                this.getWorkspaceSymbols(),
            ]);

            const context: WorkspaceContext = {
                projectType: this.determineProjectType(dependencies),
                languages,
                frameworks,
                activeFiles: [], // Populated by getActiveFileContext
                gitInfo,
                dependencies,
                codeSymbols,
            };

            this.cache.set('workspaceContext', context);
            return context;
        } catch (error: any) {
            throw new ContextError(`Failed to analyze workspace: ${error.message}`, error);
        }
    }

    public async getActiveFileContext(): Promise<FileContext | null> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }

        const document = editor.document;
        const filePath = document.uri.fsPath;
        const cacheKey = `fileContext_${filePath}`;

        const cachedFileContext = this.cache.get(cacheKey);
        if (cachedFileContext) {
            return cachedFileContext as FileContext;
        }

        try {
            const content = document.getText();
            const symbols = await this.getDocumentSymbols(document.uri);

            const fileContext: FileContext = {
                filePath,
                content: content.substring(0, 2000),
                symbols,
                languageId: document.languageId,
            };

            this.cache.set(cacheKey, fileContext);
            return fileContext;
        } catch (error: any) {
            throw new ContextError(`Failed to get active file context: ${error.message}`, error);
        }
    }

    public async getRelevantCode(query: string): Promise<CodeSnippet[]> {
        // Placeholder implementation. In a real scenario, this would involve
        // using an embedding model or advanced search algorithm to find relevant code.
        console.log(`Searching for code relevant to query: "${query}"`);
        return [];
    }

    public async updateContext(): Promise<void> {
        console.log('Updating workspace context in the background...');
        await this.analyzeWorkspace();
    }

    private async getDocumentSymbols(documentUri: vscode.Uri): Promise<SymbolInfo[]> {
        try {
            const symbols: vscode.DocumentSymbol[] = await vscode.commands.executeCommand(
                'vscode.executeDocumentSymbolProvider',
                documentUri
            );
            if (!symbols) return [];

            const flattenSymbols = (symbol: vscode.DocumentSymbol): SymbolInfo[] => {
                const info: SymbolInfo = {
                    name: symbol.name,
                    kind: symbol.kind,
                    location: new vscode.Location(documentUri, symbol.selectionRange),
                };
                if (symbol.children && symbol.children.length > 0) {
                    return [info, ...symbol.children.flatMap(flattenSymbols)];
                }
                return [info];
            };

            return symbols.flatMap(flattenSymbols);
        } catch (error: any) {
            console.warn(`Could not get symbols for ${documentUri.fsPath}: ${error.message}`);
            return [];
        }
    }

    private async getWorkspaceSymbols(): Promise<SymbolInfo[]> {
        // This is a simplified implementation. A real implementation would need to
        // iterate through files and collect symbols.
        return [];
    }

    private async getGitContext(rootPath: string): Promise<GitContext | undefined> {
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            if (!gitExtension) {
                console.warn('Git extension not found.');
                return undefined;
            }
            if (!gitExtension.isActive) {
                await gitExtension.activate();
            }
            const api = gitExtension.exports.getAPI(1);

            if (api && api.repositories.length > 0) {
                const repo = api.repositories[0];
                const head = repo.state.HEAD;

                const lastCommit = head ? {
                    hash: head.commit || 'unknown',
                    message: head.message || 'No commit message',
                    author: head.authorName || 'unknown',
                    date: head.commitDate?.toISOString() || 'unknown',
                } : undefined;

                return {
                    branch: head?.name || 'unknown',
                    status: `Changes: ${repo.state.workingTreeChanges.length}`,
                    remoteUrl: head?.upstream?.remote,
                    lastCommit: lastCommit,
                };
            }
        } catch (error: any) {
            console.warn(`Could not get Git context: ${error.message}`);
            return undefined; // Graceful fallback
        }
        return undefined;
    }

    private async getDependencies(rootPath: string): Promise<DependencyInfo[]> {
        const packageJsonPath = path.join(rootPath, 'package.json');
        try {
            const content = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(content);
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            return Object.entries(dependencies).map(([name, version]) => ({
                name,
                version: version as string,
                source: 'package.json',
            }));
        } catch (error) {
            // Ignore if package.json doesn't exist
            return [];
        }
    }

    private async detectLanguages(rootPath: string): Promise<string[]> {
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 1000);
        const languages = new Set<string>();
        for (const file of files) {
            try {
                const doc = await vscode.workspace.openTextDocument(file);
                languages.add(doc.languageId);
            } catch (e) {
                // Ignore files that can't be opened as text
            }
        }
        return Array.from(languages);
    }

    private async detectFrameworks(rootPath: string): Promise<string[]> {
        const packageJsonPath = path.join(rootPath, 'package.json');
        const frameworks = new Set<string>();
        try {
            const content = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(content);
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            if (dependencies['react']) frameworks.add('React');
            if (dependencies['express']) frameworks.add('Express');
            if (dependencies['vue']) frameworks.add('Vue');
            if (dependencies['angular']) frameworks.add('Angular');
        } catch (error) {
            // Ignore
        }
        return Array.from(frameworks);
    }

    private determineProjectType(dependencies: DependencyInfo[]): string {
        if (dependencies.some(d => d.name === 'react')) return 'React';
        if (dependencies.some(d => d.name === 'express')) return 'Node.js';
        if (dependencies.some(d => d.name === 'vue')) return 'Vue';
        if (dependencies.some(d => d.name === 'angular')) return 'Angular';
        return 'Unknown';
    }

    // Liefert den aktuellen Workspace-Kontext aus dem Cache oder analysiert neu
public async getWorkspaceContext(): Promise<WorkspaceContext | null> {
    const cached = this.cache.get('workspaceContext') as WorkspaceContext | undefined;
    if (cached) return cached;
    return await this.analyzeWorkspace();
}

// Wrapper für geplante/ereignisbasierte Aktualisierung
public async buildContext(): Promise<void> {
    try {
        await this.analyzeWorkspace();
    } catch (e) {
        console.warn('[ContextManager] buildContext failed:', e instanceof Error ? e.message : String(e));
    }
}

}
