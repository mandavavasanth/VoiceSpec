import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiClient, GeminiError } from '@/lib/gemini';
import { getEnv, isGeminiAvailable } from '@/lib/env';

vi.mock('@/lib/env', () => ({
  getEnv: vi.fn(),
  isGeminiAvailable: vi.fn(),
}));

const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

describe('GeminiClient', () => {
  beforeEach(() => {
    vi.mocked(getEnv).mockReturnValue({
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-test',
      FORCE_DEMO_MODE: false,
    });
    vi.mocked(isGeminiAvailable).mockReturnValue(true);
    mockGenerateContent.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses valid JSON response successfully', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        title: 'Test',
        summary: 'Test',
        problem: 'Test',
        userStories: [],
        requirements: [],
        acceptanceCriteria: [],
        risks: [],
        openQuestions: [],
        tasks: [],
      }),
    });

    const client = new GeminiClient();
    const result = await client.generateSpec('prompt');
    expect(result.title).toBe('Test');
  });

  it('attempts repair call if zod validation fails', async () => {
    // 1st attempt: bad data (missing required fields)
    mockGenerateContent.mockResolvedValueOnce({ text: '{"title": "Missing fields"}' });

    // 2nd attempt (repair): good data
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        title: 'Repaired',
        summary: 'Test',
        problem: 'Test',
        userStories: [],
        requirements: [],
        acceptanceCriteria: [],
        risks: [],
        openQuestions: [],
        tasks: [],
      }),
    });

    const client = new GeminiClient();
    const promise = client.generateSpec('prompt');

    // Advance timers if backoff is used, though repair doesn't use backoff, it just loops
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.title).toBe('Repaired');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('retries on 429 and throws rate-limit if max retries exceeded', async () => {
    const error429 = new Error('Rate limit');
    (error429 as Error & { status?: number }).status = 429;

    mockGenerateContent.mockRejectedValue(error429);

    const client = new GeminiClient();
    const promise = client.generateSpec('prompt').catch((e: unknown) => e);

    await vi.runAllTimersAsync();

    const err = await promise;
    expect(err).toBeInstanceOf(GeminiError);
    expect((err as GeminiError).reason).toBe('rate-limit');
    // 1 initial + 2 retries = 3 calls
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  it('throws timeout error on abort', async () => {
    mockGenerateContent.mockImplementation(
      () =>
        new Promise((_, reject) => {
          const err = new Error('Abort');
          err.name = 'AbortError';
          // Simulate taking too long
          setTimeout(() => {
            reject(err);
          }, 11000);
        }),
    );

    const client = new GeminiClient();
    const promise = client.generateSpec('prompt').catch((e: unknown) => e);

    await vi.runAllTimersAsync();

    const err = await promise;
    expect(err).toBeInstanceOf(GeminiError);
    expect((err as GeminiError).reason).toBe('timeout');
  });
});
