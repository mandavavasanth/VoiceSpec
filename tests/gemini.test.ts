import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiClient, GeminiError } from '@/lib/gemini';
import { getEnv, isGeminiAvailable } from '@/lib/env';

vi.mock('@/lib/env', () => ({
  getEnv: vi.fn(),
  isGeminiAvailable: vi.fn(),
}));

const mockGenerateContent = vi.fn();
vi.mock('@google/genai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@google/genai')>();
  return {
    ...actual,
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

describe('GeminiClient', () => {
  beforeEach(() => {
    vi.mocked(getEnv).mockReturnValue({
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-test',
      GEMINI_FALLBACK_MODEL: 'gemini-3.1-flash-lite',
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
    expect(result.spec.title).toBe('Test');
    expect(result.modelUsed).toBe('gemini-test');
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
    expect(result.spec.title).toBe('Repaired');
    expect(result.modelUsed).toBe('gemini-test');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('throws rate-limit immediately without fallback on 429', async () => {
    vi.mocked(getEnv).mockReturnValue({
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-test',
      GEMINI_FALLBACK_MODEL: '',
      FORCE_DEMO_MODE: false,
    });
    const error429 = new Error('Rate limit');
    (error429 as Error & { status?: number }).status = 429;

    mockGenerateContent.mockRejectedValue(error429);

    const client = new GeminiClient();
    const promise = client.generateSpec('prompt').catch((e: unknown) => e);

    await vi.runAllTimersAsync();

    const err = await promise;
    expect(err).toBeInstanceOf(GeminiError);
    expect((err as GeminiError).reason).toBe('rate-limit');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('makes at most 2 attempts (main then fallback) on rate limit', async () => {
    vi.mocked(getEnv).mockReturnValue({
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-test',
      GEMINI_FALLBACK_MODEL: 'gemini-fallback',
      FORCE_DEMO_MODE: false,
    });

    const error429 = new Error('Rate limit');
    (error429 as Error & { status?: number }).status = 429;

    mockGenerateContent.mockRejectedValue(error429);

    const client = new GeminiClient();
    const promise = client.generateSpec('prompt').catch((e: unknown) => e);

    await vi.runAllTimersAsync();

    const err = await promise;
    expect(err).toBeInstanceOf(GeminiError);
    expect((err as GeminiError).message).toBe('Max retries exceeded');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('throws quota error immediately without retrying on quota exhausted', async () => {
    const errorQuota = new Error('Quota exceeded for metric');
    (errorQuota as Error & { status?: number }).status = 429;
    mockGenerateContent.mockRejectedValue(errorQuota);

    const client = new GeminiClient();
    const promise = client.generateSpec('prompt').catch((e: unknown) => e);

    const err = await promise;
    expect(err).toBeInstanceOf(GeminiError);
    expect((err as GeminiError).reason).toBe('quota');
    // It should not retry, so it's only called once
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('throws timeout error on abort', async () => {
    mockGenerateContent.mockImplementation(
      () =>
        new Promise(() => {
          // Simulate taking forever so the timeout wins
        }),
    );

    const client = new GeminiClient();
    const promise = client.generateSpec('prompt').catch((e: unknown) => e);

    await vi.runAllTimersAsync();

    const err = await promise;
    expect(err).toBeInstanceOf(GeminiError);
    expect((err as GeminiError).reason).toBe('timeout');

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.anything(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
