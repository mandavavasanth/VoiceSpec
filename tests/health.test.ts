import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns ok status and local commit when VERCEL_GIT_COMMIT_SHA is missing', async () => {
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    const response = GET();
    const data = (await response.json()) as { status: string; commit: string };

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.commit).toBe('local');
  });

  it('returns 7-char commit when VERCEL_GIT_COMMIT_SHA is present', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = '1234567890abcdef';
    const response = GET();
    const data = (await response.json()) as { status: string; commit: string };

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.commit).toBe('1234567');
  });
});
