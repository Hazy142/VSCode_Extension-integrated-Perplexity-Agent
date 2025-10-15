// test/perplexityClient.test.ts
import { PerplexityClient } from '../src/services/PerplexityClient';
import { ExtensionContext, __resetMocks as resetVscodeMocks } from './mocks/vscode';
import OpenAI from 'openai';
import { APIError as OpenAIAPIError } from 'openai/error';
import { RateLimitError, APIError, NetworkError } from '../src/services/errors';

// Mock the OpenAI SDK
jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => {
        return {
            chat: {
                completions: {
                    create: jest.fn(),
                },
            },
        };
    });
});

const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('PerplexityClient', () => {
    let client: PerplexityClient;
    let mockCreate: jest.Mock;

    beforeEach(() => {
        resetVscodeMocks();
        mockOpenAI.mockClear();
        const mockOpenAIInstance = new mockOpenAI({ apiKey: 'test', baseURL: 'test' });
        client = new PerplexityClient(ExtensionContext as any);
        (client as any).openai = mockOpenAIInstance;
        mockCreate = mockOpenAIInstance.chat.completions.create as jest.Mock;
    });

    it('should perform a successful search', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        mockCreate.mockResolvedValue({
            choices: [{ message: { content: 'Test answer' } }],
        });

        const result = await client.search('test query', 'sonar-medium-chat');
        expect(result.answer).toBe('Test answer');
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            model: 'sonar-medium-chat'
        }));
    });

    it('should throw an error if API key is not configured', async () => {
        await expect(client.search('test query', 'sonar-medium-chat')).rejects.toThrow('Perplexity API key is not configured.');
    });

    it('should handle rate limit errors and retry', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        const rateLimitError = { status: 429 };
        mockCreate
            .mockRejectedValueOnce(rateLimitError)
            .mockResolvedValue({
                choices: [{ message: { content: 'Success after retry' } }],
            });

        const result = await client.search('test query', 'sonar-medium-chat');
        expect(result.answer).toBe('Success after retry');
        expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should throw RateLimitError after max retries', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        const rateLimitError = { status: 429 };
        mockCreate.mockRejectedValue(rateLimitError);

        await expect(client.search('test query', 'sonar-medium-chat')).rejects.toThrow(RateLimitError);
        expect(mockCreate).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should handle network errors and retry', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        const networkError = { code: 'ENOTFOUND' };
        mockCreate
            .mockRejectedValueOnce(networkError)
            .mockResolvedValue({
                choices: [{ message: { content: 'Success after network error' } }],
            });

        const result = await client.search('test query', 'sonar-medium-chat');
        expect(result.answer).toBe('Success after network error');
        expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should throw APIError for non-retryable status codes', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        const apiError = { status: 400, message: 'Bad Request' };
        mockCreate.mockRejectedValue(apiError);

        await expect(client.search('test query', 'sonar-medium-chat')).rejects.toThrow(APIError);
        expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('testConnection should return ok for successful connection', async () => {
         ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
         mockCreate.mockResolvedValue({
            choices: [{ message: { content: 'pong' } }],
        });
        const result = await client.testConnection('sonar-medium-chat');
        expect(result.ok).toBe(true);
        expect(result.latencyMs).toBeDefined();
    });

    it('testConnection should return error for failed connection', async () => {
         ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
         const authError = { status: 401 };
         mockCreate.mockRejectedValue(authError);
         const result = await client.testConnection('sonar-medium-chat');
         expect(result.ok).toBe(false);
         expect(result.error).toContain('Authentication failed');
    });

    it('should handle streaming search', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        // The create method for streaming would return a stream object, not a promise.
        // For this basic test, we'll just check if the call is made correctly.
        mockCreate.mockResolvedValue({}); // Mocking a non-response for stream

        const result = await client.search('test query', 'sonar-medium-chat', true);

        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            stream: true,
        }));
        expect(result.answer).toBe('');
    });

    it('should handle 500 series errors and retry', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        const serverError = { status: 500 };
        mockCreate
            .mockRejectedValueOnce(serverError)
            .mockResolvedValue({ choices: [{ message: { content: 'Success after server error' } }] });

        const result = await client.search('test query', 'sonar-medium-chat');
        expect(result.answer).toBe('Success after server error');
        expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should handle ECONNRESET network error', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        const connResetError = { code: 'ECONNRESET' };
        mockCreate.mockRejectedValue(connResetError);
        await expect(client.search('test query', 'sonar-medium-chat')).rejects.toThrow(NetworkError);
    }, 10000);

    it('should handle unknown errors', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        const unknownError = new Error('Some random error');
        mockCreate.mockRejectedValue(unknownError);
        await expect(client.search('test query', 'sonar-medium-chat')).rejects.toThrow(Error);
    });

    it('testConnection should handle RateLimitError', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        mockCreate.mockRejectedValue({ status: 429 });
        const result = await client.testConnection('sonar-medium-chat');
        expect(result.ok).toBe(false);
        expect(result.error).toBe('API rate limit exceeded.');
    }, 10000);

    it('testConnection should handle NetworkError', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        mockCreate.mockRejectedValue({ code: 'ENOTFOUND' });
        const result = await client.testConnection('sonar-medium-chat');
        expect(result.ok).toBe(false);
        expect(result.error).toBe('Network error. Please check your connection.');
    }, 10000);
});

describe('Custom Errors', () => {
    it('should be possible to create RateLimitError with a custom message', () => {
        const error = new RateLimitError('Custom message');
        expect(error.message).toBe('Custom message');
    });

    it('should be possible to create NetworkError with a custom message', () => {
        const error = new NetworkError('Custom network message');
        expect(error.message).toBe('Custom network message');
    });
});
