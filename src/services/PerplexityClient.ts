import axios from 'axios';
import { SearchResult } from '../../types.js';
import * as vscode from 'vscode';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export class PerplexityClient {
    private apiKey: string;

    constructor() {
        // In a real extension, the API key should be fetched securely from vscode.workspace.getConfiguration
        // For this task, we use an environment variable.
        this.apiKey = process.env.PERPLEXITY_API_KEY || '';
        if (!this.apiKey) {
            vscode.window.showErrorMessage('Perplexity API key not found. Please set the PERPLEXITY_API_KEY environment variable.');
            console.error('Perplexity API key not found. Please set the PERPLEXITY_API_KEY environment variable.');
        }
    }

    public async search(query: string): Promise<SearchResult> {
        if (!this.apiKey) {
            throw new Error('Perplexity API key is not configured.');
        }

        try {
            const response = await axios.post(
                PERPLEXITY_API_URL,
                {
                    model: 'sonar-medium-online',
                    messages: [
                        { role: 'system', content: 'Be precise and concise.' },
                        { role: 'user', content: query },
                    ],
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = response.data;
            if (data.choices && data.choices.length > 0) {
                const answer = data.choices[0].message.content;
                // As discussed, sources and followUpQuestions are not provided by this endpoint.
                return {
                    answer,
                    sources: [],
                    followUpQuestions: [],
                };
            } else {
                throw new Error('Invalid response structure from Perplexity API');
            }
        } catch (error: any) {
            console.error('Error calling Perplexity API:', error.response ? error.response.data : error.message);
            throw new Error(`Failed to get search results from Perplexity: ${error.message}`);
        }
    }
}