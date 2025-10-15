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

// Helper to mock the OpenAI stream
async function* createMockStream(chunks: { content: string }[], error?: any) {
    if (error) {
        throw error;
    }
    for (const chunk of chunks) {
        yield { choices: [{ delta: chunk }] };
    }
}

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

    it('should stream a successful search', (done) => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        const chunks = [{ content: 'Test' }, { content: ' answer' }];
        mockCreate.mockReturnValue(createMockStream(chunks));

        let fullResponse = '';
        client.searchStream('test query', 'sonar-medium-chat', {
            onData: (chunk) => {
                fullResponse += chunk;
            },
            onEnd: () => {
                expect(fullResponse).toBe('Test answer');
                expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: 'sonar-medium-chat' }));
                done();
            },
            onError: (error) => done(error),
        });
    });

    it('should call onError if API key is not configured', (done) => {
        client.searchStream('test query', 'sonar-medium-chat', {
            onData: () => {},
            onEnd: () => {},
            onError: (error) => {
                expect(error.message).toContain('Perplexity API key is not configured');
                done();
            },
        });
    });

    it('should call onError for API errors', (done) => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        const apiError = { status: 400, message: 'Bad Request' };
        mockCreate.mockReturnValue(createMockStream([], apiError));

        client.searchStream('test query', 'sonar-medium-chat', {
            onData: () => {},
            onEnd: () => {},
            onError: (error) => {
                expect(error).toBeInstanceOf(APIError);
                expect(error.message).toContain('Bad Request');
                done();
            },
        });
    });

    it('testConnection should return ok for successful connection', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        mockCreate.mockReturnValue(createMockStream([{ content: 'pong' }]));
        const result = await client.testConnection('sonar-medium-chat');
        expect(result.ok).toBe(true);
        expect(result.latencyMs).toBeDefined();
    });

    it('testConnection should return error for failed connection', async () => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        const authError = { status: 401 };
        mockCreate.mockReturnValue(createMockStream([], authError));
        const result = await client.testConnection('sonar-medium-chat');
        expect(result.ok).toBe(false);
        expect(result.error).toContain('Authentication failed');
    });

    it('should handle cancellation correctly', (done) => {
        ExtensionContext.secrets.store('perplexity.apiKey', 'test-key');
        const chunks = [{ content: 'Test' }, { content: ' answer' }];
        mockCreate.mockReturnValue(createMockStream(chunks));

        let onDataCalled = false;
        let onEndCalled = false;

        client.searchStream('test query', 'sonar-medium-chat', {
            onData: (chunk) => {
                onDataCalled = true;
                client.cancel(); // Cancel immediately after first chunk
            },
            onEnd: () => {
                onEndCalled = true;
            },
            onError: (error) => done(error),
        });

        // After a short delay, verify that onData was called but onEnd was not.
        setTimeout(() => {
            try {
                expect(onDataCalled).toBe(true);
                expect(onEndCalled).toBe(false);
                done();
            } catch (e) {
                done(e);
            }
        }, 50);
    });

    it('should not leak API key in error messages', (done) => {
        const apiKey = 'super-secret-key';
        ExtensionContext.secrets.store('perplexity.apiKey', apiKey);
        const authError = { status: 401, message: 'Authentication failed' };
        mockCreate.mockReturnValue(createMockStream([], authError));

        client.searchStream('test query', 'sonar-medium-chat', {
            onData: () => {},
            onEnd: () => {},
            onError: (error) => {
                try {
                    expect(error.message).not.toContain(apiKey);
                    done();
                } catch (e) {
                    done(e);
                }
            },
        });
    });
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
