import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPipeline } from '@/lib/pipeline';
import { resetRateLimit } from '@/lib/ratelimit';
import { getMode } from '@/lib/env';

vi.mock('@/lib/env', () => ({
  getEnv: vi.fn(),
  getMode: vi.fn(),
  isGeminiAvailable: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
  GeminiClient: class {
    generateSpec = vi.fn().mockResolvedValue({
      title: 'Mocked Spec',
      summary: '',
      problem: '',
      userStories: [],
      requirements: [{ id: 'FR-001', text: 'Test', priority: 'P0', evidence: [] }],
      acceptanceCriteria: [],
      risks: [],
      openQuestions: [],
      tasks: [],
    });
  },
  GeminiError: class extends Error {
    constructor(
      public reason: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

describe('runPipeline', () => {
  beforeEach(() => {
    resetRateLimit();
    vi.mocked(getMode).mockReturnValue('gemini');
  });

  it('runs the full pipeline successfully in gemini mode', async () => {
    const transcript = 'This is a test transcript. It needs to be at least ten characters.';
    const result = await runPipeline(transcript, '127.0.0.1');
    expect(result.mode).toBe('gemini');
    expect(result.spec.title).toBe('Mocked Spec');
    // Evidence is empty in mock, so provenance will drop the requirement
    expect(result.metrics.droppedEvidence).toBe(0);
    expect(result.spec.requirements.length).toBe(0); // Dropped by provenance!
  });

  it('runs demo mode successfully', async () => {
    vi.mocked(getMode).mockReturnValue('demo');

    const transcript = 'As a user I want to test so that it works.';
    const result = await runPipeline(transcript, '127.0.0.1');

    expect(result.mode).toBe('demo');
    expect(result.spec.title).toContain('Fallback Spec');
    expect(result.spec.userStories.length).toBe(1);
    expect(result.metrics.verifiedEvidence).toBe(1); // Demo mode assigns valid evidence
  });

  it('rejects based on rate limit', async () => {
    const ip = '127.0.0.2';
    for (let i = 0; i < 10; i++) {
      await runPipeline('Long enough transcript', ip);
    }

    await expect(runPipeline('Long enough transcript', ip)).rejects.toThrow('Rate limit exceeded');
  });
});
