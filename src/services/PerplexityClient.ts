import OpenAI from 'openai';
import { APIError as OpenAIAPIError } from 'openai/error';
import { SearchResult } from '../../types/shared';
import * as vscode from 'vscode';
import { PerplexityModel } from '../util/models';
import { APIError, NetworkError, PerplexityError, RateLimitError } from './errors';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai';

export class PerplexityClient {
    private openai: OpenAI;
    private _abortController: AbortController | null = null;

    constructor(private context: vscode.ExtensionContext) {
        this.openai = new OpenAI({
            apiKey: '', // Will be set per-request
            baseURL: PERPLEXITY_API_URL,
        });
    }

    private async getApiKey(): Promise<string> {
        return (await this.context.secrets.get('perplexity.apiKey')) || '';
    }

    public cancel() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
    }

    // Preserving the original promise-based public API for backward compatibility
    public async search(query: string, model: PerplexityModel): Promise<SearchResult> {
        let fullAnswer = '';
        return new Promise((resolve, reject) => {
            this.searchStream(query, model, {
                onData: (chunk) => {
                    fullAnswer += chunk;
                },
                onEnd: () => {
                    resolve({
                        answer: fullAnswer,
                        sources: [],
                        followUpQuestions: [],
                    });
                },
                onError: (error) => {
                    reject(error);
                },
            });
        });
    }

    // New streaming method for the webview
    public async searchStream(
        query: string,
        model: PerplexityModel,
        callbacks: {
            onData: (chunk: string) => void;
            onEnd: () => void;
            onError: (error: Error) => void;
        }
    ): Promise<void> {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            const errorMsg = 'Perplexity API key is not configured. Please set it in the extension settings.';
            vscode.window.showErrorMessage(errorMsg);
            callbacks.onError(new Error(errorMsg));
            return;
        }

        this.openai.apiKey = apiKey;
        this._abortController = new AbortController();
        const signal = this._abortController.signal;

        try {
            const stream = await this.openai.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: 'Be precise and concise.' },
                    { role: 'user', content: query },
                ],
                stream: true,
            });

            for await (const chunk of stream) {
                if (signal.aborted) {
                    if (stream.controller) {
                        stream.controller.abort();
                    }
                    break;
                }
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    callbacks.onData(content);
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError' || (error instanceof OpenAIAPIError && error.code === 'ECONNABORTED')) {
                // Ignore abort errors
            } else {
                const mappedError = this.mapOpenAIError(error);
                callbacks.onError(mappedError);
            }
        } finally {
            if (!signal.aborted) {
                callbacks.onEnd();
            }
            this._abortController = null;
        }
    }

    private mapOpenAIError(error: any): Error {
        // Check for OpenAI API error structure duck-typing style
        if (error && typeof error.status === 'number') {
            if (error.status === 429) {
                return new RateLimitError();
            } else if (error.status >= 500) {
                return new APIError(`Perplexity API Error: ${error.message}`, true);
            } else if (error.status >= 400) {
                 return new APIError(`Perplexity API Error: ${error.message}`);
            }
        }
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
             return new NetworkError();
        }

        console.error('Unhandled error calling Perplexity API:', error);
        return new APIError(error.message || 'An unknown error occurred.');
    }

    public async testConnection(model: PerplexityModel): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
        const startTime = Date.now();
        try {
            const response = await this.search("ping", model);
            const latencyMs = Date.now() - startTime;

            if (response && response.answer) {
                return { ok: true, latencyMs };
            } else {
                return { ok: false, error: 'API returned an empty or invalid response.', latencyMs };
            }
        } catch (error: any) {
            const latencyMs = Date.now() - startTime;
            if (error instanceof RateLimitError) {
                return { ok: false, error: 'API rate limit exceeded.', latencyMs };
            }
            if (error instanceof APIError) {
                 return { ok: false, error: 'Authentication failed. Please check your API key.', latencyMs };
            }
             if (error instanceof NetworkError) {
                return { ok: false, error: 'Network error. Please check your connection.', latencyMs };
            }
            return { ok: false, error: error.message || 'An unknown error occurred.', latencyMs };
        }
    }
}