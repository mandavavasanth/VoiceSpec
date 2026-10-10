import { describe, it, expect, vi } from 'vitest';
import { runPipeline } from '@/lib/pipeline';

// Mock dependencies
import { checkRateLimit } from '@/lib/ratelimit';
import { getEnv } from '@/lib/env';

vi.mock('@/lib/ratelimit');
vi.mock('@/lib/gemini');
vi.mock('@/lib/env', async () => {
  const actual = await vi.importActual<typeof import('@/lib/env')>('@/lib/env');
  return {
    ...actual,
    getEnv: vi.fn(),
    getMode: vi.fn(),
  };
});

describe('Pipeline Integration', () => {
  it('includes sentences in the pipeline result for evidence indexing', async () => {
    vi.mocked(checkRateLimit).mockReturnValue(true);
    // Force demo mode for this test
    vi.mocked(getEnv).mockReturnValue({
      GEMINI_API_KEY: '',
      OPENROUTER_API_KEY: undefined,
      GEMINI_MODEL: 'gemini-3.6-flash',
      OPENROUTER_MODEL: 'openrouter/free',
      FORCE_DEMO_MODE: false,
    });
    const { getMode } = await import('@/lib/env');
    vi.mocked(getMode).mockReturnValue('demo');

    const transcript = 'This is the first sentence. Here is another one.';
    const result = await runPipeline(transcript, '127.0.0.1');

    expect(result.sentences).toBeDefined();
    expect(result.sentences.length).toBeGreaterThan(0);
    expect(result.sentences).toContain('This is the first sentence.');
    expect(result.sentences).toContain('Here is another one.');
  });
});
