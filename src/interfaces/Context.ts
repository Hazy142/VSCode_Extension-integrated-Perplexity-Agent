// src/interfaces/Context.ts
import * as vscode from 'vscode';

/**
 * Represents a symbol in the code (e.g., function, class, interface).
 */
export interface SymbolInfo {
  name: string;
  kind: vscode.SymbolKind;
  location: vscode.Location;
}

/**
 * Represents the context of an active file.
 */
export interface FileContext {
  filePath: string;
  content: string;
  symbols: SymbolInfo[];
  languageId: string;
}

/**
 * Represents the Git context of the workspace.
 */
export interface GitContext {
  branch: string;
  status: string; // e.g., output of git status --porcelain
  remoteUrl?: string;
  lastCommit?: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
}

/**
 * Represents a dependency from a package manager file.
 */
export interface DependencyInfo {
  name: string;
  version: string;
  source: 'package.json' | 'requirements.txt' | 'pom.xml' | 'build.gradle' | string;
}

/**
 * Represents a relevant snippet of code.
 */
export interface CodeSnippet {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  relevanceScore: number; // A score indicating how relevant the snippet is to a query
}

/**
 * The main context object for the workspace.
 */
export interface WorkspaceContext {
  projectType: string; // e.g., 'Node.js', 'Python', 'Java'
  languages: string[]; // e.g., ['typescript', 'javascript']
  frameworks: string[]; // e.g., ['React', 'Express']
  activeFiles: FileContext[];
  gitInfo?: GitContext;
  dependencies: DependencyInfo[];
  codeSymbols: SymbolInfo[];
}
