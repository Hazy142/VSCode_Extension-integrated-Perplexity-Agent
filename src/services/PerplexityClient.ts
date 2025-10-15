import OpenAI from 'openai';
import { APIError as OpenAIAPIError } from 'openai/error';
import { SearchResult } from '../../types/shared';
import * as vscode from 'vscode';
import { PerplexityModel } from '../util/models';
import { APIError, NetworkError, PerplexityError, RateLimitError } from './errors';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai';

export class PerplexityClient {
    private openai: OpenAI;

    constructor(private context: vscode.ExtensionContext) {
        this.openai = new OpenAI({
            apiKey: '', // Will be set per-request
            baseURL: PERPLEXITY_API_URL,
        });
    }

    private async getApiKey(): Promise<string> {
        // Retrieve the API key securely from the extension's secrets
        return (await this.context.secrets.get('perplexity.apiKey')) || '';
    }

    public async search(query: string, model: PerplexityModel, stream: boolean = false): Promise<SearchResult> {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            const errorMsg = 'Perplexity API key is not configured. Please set it in the extension settings.';
            vscode.window.showErrorMessage(errorMsg);
            throw new Error(errorMsg);
        }

        this.openai.apiKey = apiKey;

        let retries = 3;
        while (retries > 0) {
            try {
                const response = await this.openai.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: 'Be precise and concise.' },
                    { role: 'user', content: query },
                ],
                stream: stream, // Basic streaming support
            });

            if (stream) {
                // For now, we don't handle the stream chunks, just return an empty answer
                // This will be fully implemented in REFACT-011
                return {
                    answer: '',
                    sources: [],
                    followUpQuestions: [],
                };
            }

            const choice = response.choices[0];
            if (choice && choice.message) {
                const answer = choice.message.content ?? '';
                return {
                    answer,
                    sources: [],
                    followUpQuestions: [],
                };
            } else {
                throw new APIError('Invalid response structure from Perplexity API');
            }
        } catch (error: any) {
                const mappedError = this.mapOpenAIError(error);
                if (mappedError instanceof PerplexityError && mappedError.isRetryable && retries > 1) {
                    retries--;
                    const delay = 1000 * (4 - retries); // 1s, 2s, 3s
                    await new Promise(res => setTimeout(res, delay));
                } else {
                    throw mappedError;
                }
            }
        }
        throw new APIError('Failed to get a response from Perplexity after multiple retries.');
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
        return new PerplexityError(error.message || 'An unknown error occurred.');
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