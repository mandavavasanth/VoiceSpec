import { getEnv, resetEnv } from '../lib/env';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Environment module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetEnv();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('reads GEMINI_FALLBACK_MODEL from process.env when set', () => {
    process.env.GEMINI_FALLBACK_MODEL = 'fallback-test-model';
    const env = getEnv();
    expect(env.GEMINI_FALLBACK_MODEL).toBe('fallback-test-model');
  });
});
