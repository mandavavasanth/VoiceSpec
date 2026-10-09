import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPipeline } from '@/lib/pipeline';
import { resetRateLimit } from '@/lib/ratelimit';
import { getMode, getEnv, isGeminiAvailable } from '@/lib/env';

vi.mock('@/lib/env', () => ({
  getEnv: vi.fn(),
  getMode: vi.fn(),
  isGeminiAvailable: vi.fn(),
}));

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
    Type: {
      STRING: 'string',
      INTEGER: 'integer',
      ARRAY: 'array',
      OBJECT: 'object',
    },
    Schema: {},
  };
});

describe('runPipeline', () => {
  beforeEach(() => {
    resetRateLimit();
    vi.resetAllMocks();
    vi.mocked(getMode).mockReturnValue('gemini');
    vi.mocked(isGeminiAvailable).mockReturnValue(true);
    vi.mocked(getEnv).mockReturnValue({
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-3.6-flash',
      GEMINI_FALLBACK_MODEL: 'gemini-3.8-flash',
      FORCE_DEMO_MODE: false,
    });
  });

  it('runs the full pipeline successfully in gemini mode', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        title: 'Mocked Spec',
        summary: '',
        problem: '',
        userStories: [],
        requirements: [
          {
            id: 'FR-001',
            text: 'Test',
            priority: 'P0',
            evidence: [{ sentenceIndex: 0, quote: 'This is a test transcript.' }],
          },
        ],
        acceptanceCriteria: [],
        risks: [],
        openQuestions: [],
        tasks: [],
      }),
    });

    const transcript = 'This is a test transcript. It needs to be at least ten characters.';
    const result = await runPipeline(transcript, '127.0.0.1');
    expect(result.mode).toBe('gemini');
    expect(result.spec.title).toBe('Mocked Spec');
    expect(result.metrics.modelUsed).toBe('gemini-3.6-flash');
    expect(result.metrics.droppedEvidence).toBe(0);
  });

  it('uses fallback model when main model fails twice with rate limit', async () => {
    // 1st attempt fails with 503
    mockGenerateContent.mockRejectedValueOnce({ status: 503 });
    // 2nd attempt fails with 503
    mockGenerateContent.mockRejectedValueOnce({ status: 503 });
    // 3rd attempt fails with 503
    mockGenerateContent.mockRejectedValueOnce({ status: 503 });
    // 4th attempt (fallback model) succeeds
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        title: 'Mocked Spec',
        summary: '',
        problem: '',
        userStories: [],
        requirements: [
          {
            id: 'FR-001',
            text: 'Test',
            priority: 'P0',
            evidence: [{ sentenceIndex: 0, quote: 'This is a test transcript.' }],
          },
        ],
        acceptanceCriteria: [],
        risks: [],
        openQuestions: [],
        tasks: [],
      }),
    });

    const transcript = 'This is a test transcript. It needs to be at least ten characters.';
    const result = await runPipeline(transcript, '127.0.0.1');

    expect(result.mode).toBe('gemini');
    expect(result.metrics.modelUsed).toBe('gemini-3.8-flash');
    expect(result.warnings.includes('rate-limit')).toBe(true);
  });

  it(
    'falls back to demo mode with rate-limit if both models fail',
    { timeout: 15000 },
    async () => {
      mockGenerateContent.mockRejectedValue({ status: 503 }); // Always fail

      const transcript = 'This is a test transcript. It needs to be at least ten characters.';
      const result = await runPipeline(transcript, '127.0.0.1');

      expect(result.mode).toBe('fallback');
      expect(result.warnings.some((w) => w.includes('rate-limit'))).toBe(true);
    },
  );

  it('skips fallback model if variable is unset', { timeout: 15000 }, async () => {
    vi.mocked(getEnv).mockReturnValue({
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-3.6-flash',
      GEMINI_FALLBACK_MODEL: undefined,
      FORCE_DEMO_MODE: false,
    });
    mockGenerateContent.mockRejectedValue({ status: 503 }); // Always fail

    const transcript = 'This is a test transcript. It needs to be at least ten characters.';
    const result = await runPipeline(transcript, '127.0.0.1');

    expect(result.mode).toBe('fallback');
    expect(mockGenerateContent).toHaveBeenCalledTimes(3); // 3 attempts on main model only
  });

  it('global deadline wins over everything', { timeout: 35000 }, async () => {
    // Make the mock delay for 30s
    mockGenerateContent.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 30000)),
    );

    const transcript = 'This is a test transcript. It needs to be at least ten characters.';
    const result = await runPipeline(transcript, '127.0.0.1');

    expect(result.mode).toBe('fallback');
    expect(result.warnings.includes('timeout')).toBe(true);
  });

  it('runs demo mode successfully with no-key reason when key is missing', async () => {
    vi.mocked(getMode).mockReturnValue('demo');
    vi.mocked(getEnv).mockReturnValue({
      GEMINI_API_KEY: '',
      GEMINI_MODEL: 'gemini-3.6-flash',
      FORCE_DEMO_MODE: false,
    });

    const transcript = 'As a user I want to test so that it works.';
    const result = await runPipeline(transcript, '127.0.0.1');

    expect(result.mode).toBe('demo');
    expect(result.spec.title).toContain('As a user I want to test so that it works.');
    expect(result.spec.userStories.length).toBe(1);
    expect(result.metrics.verifiedEvidence).toBe(1); // Demo mode assigns valid evidence
    expect(result.warnings.includes('no-key')).toBe(true);
  });

  it('runs demo mode successfully when FORCE_DEMO_MODE is true', async () => {
    vi.mocked(getMode).mockReturnValue('demo');
    vi.mocked(getEnv).mockReturnValue({
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-3.6-flash',
      FORCE_DEMO_MODE: true, // This flag skips the network call
    });

    const transcript = 'As a user I want to test so that it works.';
    const result = await runPipeline(transcript, '127.0.0.1');

    expect(result.mode).toBe('demo');
    expect(result.warnings.includes('unknown')).toBe(true); // fallbackSpec uses 'unknown' if key exists
    expect(mockGenerateContent).not.toHaveBeenCalled(); // PROVE no network call is made
  });

  it('goes straight to demo mode with quota reason when quota is exhausted', async () => {
    mockGenerateContent.mockRejectedValue({
      status: 429,
      message: 'Quota exceeded for metric',
    });

    const transcript = 'This is a test transcript. It needs to be at least ten characters.';
    const result = await runPipeline(transcript, '127.0.0.1');

    expect(result.mode).toBe('fallback');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(result.warnings.includes('quota')).toBe(true);
  });

  it('rejects based on rate limit', { timeout: 10000 }, async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        title: 'Mocked Spec',
        summary: '',
        problem: '',
        userStories: [],
        requirements: [
          {
            id: 'FR-001',
            text: 'Test',
            priority: 'P0',
            evidence: [{ sentenceIndex: 0, quote: 'Long enough transcript' }],
          },
        ],
        acceptanceCriteria: [],
        risks: [],
        openQuestions: [],
        tasks: [],
      }),
    });
    const ip = '127.0.0.2';
    for (let i = 0; i < 10; i++) {
      await runPipeline('Long enough transcript', ip);
    }

    await expect(runPipeline('Long enough transcript', ip)).rejects.toThrow('Rate limit exceeded');
  });
});
