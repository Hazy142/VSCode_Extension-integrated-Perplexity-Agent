import OpenAI from 'openai';
import { APIError as OpenAIAPIError } from 'openai/error';
import * as vscode from 'vscode';
import { PerplexityModel } from '../util/models';
import { APIError, NetworkError, RateLimitError } from './errors';
import { Agent, fetch } from 'undici';
import { MCPServerWrapper } from './MCPServer';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai';

const undiciAgent = new Agent({ keepAliveTimeout: 10 * 1000, keepAliveMaxTimeout: 60 * 1000 });
const customFetch: typeof fetch = (url, init) => fetch(url, { ...init, dispatcher: undiciAgent });

export class PerplexityClient {
    private openai: OpenAI;
    private _abortController: AbortController | null = null;
    private mcpServer: MCPServerWrapper;

    constructor(private context: vscode.ExtensionContext, mcpServer: MCPServerWrapper) {
        this.mcpServer = mcpServer;
        this.openai = new OpenAI({
            apiKey: '', // Set per-request
            baseURL: PERPLEXITY_API_URL,
            fetch: customFetch as any,
        });
    }

    private async getApiKey(): Promise<string> {
        return (await this.context.secrets.get('perplexity.apiKey')) || '';
    }

    public cancel() {
        this._abortController?.abort();
    }

    private async generateToolPrompt(): Promise<string> {
        const tools = await this.mcpServer.getToolDefinitions();
        const toolDescriptions = tools
            .map((t: any) => `- ${t.function.name}: ${t.function.description}`)
            .join('\n');

        return `CRITICAL INSTRUCTIONS: YOU ARE A TOOL-ROUTING AI AGENT. FOLLOW THESE RULES WITHOUT DEVIATION.

Your ONLY task is to determine if the user's query can or should be answered using one of the available tools.

If the user's query matches a tool's purpose, you MUST respond with ONLY the XML tag to call the tool. Your entire response must be just the tag.

The format to call a tool is: <tool_call name="TOOL_NAME" args='{}' />. Replace TOOL_NAME with the exact name of the tool.

Do NOT answer the user's question directly. Do NOT provide any explanation, summary, or conversational text.

AVAILABLE TOOLS:
${toolDescriptions}

FEW-SHOT EXAMPLE:

User Query: "/workspaceAnalysis"
Your Response (MUST be only this): <tool_call name="workspaceAnalysis" args='{}' />

If the query does NOT match any tool, and ONLY in that case, you can answer it from your general knowledge.`;
    }

    public async searchStream(
        query: string,
        model: PerplexityModel,
        callbacks: { onData: (chunk: string) => void; onEnd: () => void; onError: (error: Error) => void; }
    ): Promise<void> {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            return callbacks.onError(new Error('Perplexity API key is not configured.'));
        }
        this.openai.apiKey = apiKey;
        this._abortController = new AbortController();

        try {
            const systemPrompt = await this.generateToolPrompt();
            const messages: ChatCompletionMessageParam[] = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query },
            ];

            // --- First Call: Check for Tool Use ---
            const initialResponse = await this.openai.chat.completions.create({
                model: model,
                messages: messages,
                stream: false, // We need the full response to check for a tool call
            });

            const responseText = initialResponse.choices[0]?.message?.content || '';
            const toolCallMatch = responseText.match(/<tool_call\s+name="([^"]+)"(?:\s+args='([^']*)')?\s*\/>/);

            if (toolCallMatch) {
                const toolName = toolCallMatch[1];
                const toolArgs = toolCallMatch[2] ? JSON.parse(toolCallMatch[2]) : {};

                // Corrected syntax for onData call
                callbacks.onData(`\n\`\`\`json\nTool call: ${toolName}(${JSON.stringify(toolArgs, null, 2)})\n\`\`\`\n`);

                // --- Execute Tool ---
                const toolResult = await this.mcpServer.executeTool(toolName, toolArgs);
                const resultString = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2);
                
                // Corrected syntax for onData call
                callbacks.onData(`\n\`\`\`json\nTool response: ${resultString}\n\`\`\`\n`);

                // Add the tool interaction to the message history
                messages.push({ role: 'assistant', content: responseText }); // The model's tool request
                // Simplified user message for the tool result
                messages.push({ role: 'user', content: `TOOL_RESULT for ${toolName}: ${resultString}` }); 

                // --- Second Call: Generate Final Answer ---
                const finalStream = await this.openai.chat.completions.create({
                    model: model,
                    messages: messages,
                    stream: true,
                });

                for await (const chunk of finalStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        callbacks.onData(content);
                    }
                }
            } else {
                // --- No Tool Call: Stream Direct Answer ---
                if (responseText) {
                    callbacks.onData(responseText);
                }
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('[ERROR-ID: PC-01] API call failed:', error.stack);
                callbacks.onError(this.mapOpenAIError(error));
            }
        } finally {
            callbacks.onEnd();
            this._abortController = null;
        }
    }

    private mapOpenAIError(error: any): Error {
        if (error instanceof OpenAIAPIError) {
            if (error.status === 429) return new RateLimitError();
            if (error.status === 400) return new APIError(`Model or parameters not supported by Perplexity. (Original error: ${error.message})`);
            if (error.status >= 500) return new APIError(`Perplexity API Error: ${error.message}`, true);
            if (error.status >= 400) return new APIError(`Perplexity API Error: ${error.message}`);
        }
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
            return new NetworkError();
        }
        return new APIError(error.message || 'An unknown error occurred.');
    }
    
    public async testConnection(model: PerplexityModel): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
        const startTime = Date.now();
        try {
            const response = await this.openai.chat.completions.create({
                model: model,
                messages: [{ role: 'user', content: 'Hello!' }],
                max_tokens: 5,
            });
            if (response.choices[0]) {
                return { ok: true, latencyMs: Date.now() - startTime };
            }
            return { ok: false, error: 'Empty response from API.', latencyMs: Date.now() - startTime };
        } catch (error: any) {
            return { ok: false, error: this.mapOpenAIError(error).message, latencyMs: Date.now() - startTime };
        }
    }
}
