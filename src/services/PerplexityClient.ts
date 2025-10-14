import axios from 'axios';
import { SearchResult } from '../../types/shared';
import * as vscode from 'vscode';
import { PerplexityModel } from '../util/models';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export class PerplexityClient {
    constructor(private context: vscode.ExtensionContext) {}

    private async getApiKey(): Promise<string> {
        // Retrieve the API key securely from the extension's secrets
        return (await this.context.secrets.get('perplexity-ext.apiKey')) || '';
    }

    public async search(query: string, model: PerplexityModel): Promise<SearchResult> {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            // Use a more specific error message and show it to the user
            const errorMsg = 'Perplexity API key is not configured. Please set it in the extension settings.';
            vscode.window.showErrorMessage(errorMsg);
            throw new Error(errorMsg);
        }

        try {
            const response = await axios.post(
                PERPLEXITY_API_URL,
                {
                    model: model,
                    messages: [
                        { role: 'system', content: 'Be precise and concise.' },
                        { role: 'user', content: query },
                    ],
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = response.data;
            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                const answer = data.choices[0].message.content;
                // The /chat/completions endpoint does not return sources or follow-up questions.
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