import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiError } from '@/lib/gemini';
import { checkRateLimit, resetRateLimit } from '@/lib/ratelimit';

describe('ratelimit', () => {
  beforeEach(() => {
    resetRateLimit();
    vi.useFakeTimers();
  });

  it('allows 10 requests and blocks the 11th', () => {
    const ip = '127.0.0.1';
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(ip)).toBe(true);
    }
    // 11th should be blocked
    expect(checkRateLimit(ip)).toBe(false);

    // Fast forward 1 minute
    vi.advanceTimersByTime(61000);
    // Should be allowed again
    expect(checkRateLimit(ip)).toBe(true);
  });
});

describe('GeminiError', () => {
  it('instantiates correctly with reason codes', () => {
    const err = new GeminiError('schema', 'Validation failed');
    expect(err.reason).toBe('schema');
    expect(err.message).toBe('Validation failed');
  });
});
