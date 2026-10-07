import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/generate/route';
import { NextRequest } from 'next/server';
import { resetRateLimit } from '@/lib/ratelimit';

vi.mock('@/lib/pipeline', () => ({
  runPipeline: vi.fn().mockResolvedValue({
    spec: { title: 'Mock' },
    mode: 'gemini',
    warnings: [],
    metrics: {},
  }),
}));

describe('POST /api/generate', () => {
  beforeEach(() => {
    resetRateLimit();
  });

  const createMockRequest = (body: unknown, headers = new Map()) => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        if (body) {
          controller.enqueue(
            encoder.encode(typeof body === 'string' ? body : JSON.stringify(body)),
          );
        }
        controller.close();
      },
    });

    return {
      body: stream,
      headers: {
        get: (key: string) => (headers.get(key) as string) || null,
      },
    } as unknown as NextRequest;
  };

  it('rejects bodies larger than 100KB', async () => {
    const largeBody = 'x'.repeat(101 * 1024);
    const req = createMockRequest(largeBody);
    const response = await POST(req);
    expect(response.status).toBe(413);
  });

  it('rejects missing or empty transcript', async () => {
    const req = createMockRequest({ transcript: '' });
    const response = await POST(req);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Missing transcript');
  });

  it('streams NDJSON events on success', async () => {
    const req = createMockRequest({ transcript: 'This is a long enough transcript.' });
    const response = await POST(req);

    expect(response.headers.get('Content-Type')).toBe('application/x-ndjson');

    // Consume stream

    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    let text = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }

    const lines = text.trim().split('\n').filter(Boolean);
    expect(lines.length).toBe(2);
    expect(JSON.parse(lines[0] || '{}')).toEqual({
      type: 'status',
      message: 'Pipeline started...',
    });
    expect((JSON.parse(lines[1] || '{}') as Record<string, unknown>).type).toBe('result');
  });
});
