import { NextRequest } from 'next/server';
import { runPipeline } from '@/lib/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const reader = (req.body as ReadableStream<Uint8Array>).getReader();

    let bytes = 0;
    let rawJson = '';
    const decoder = new TextDecoder();

    // Read body manually to enforce strict byte limit before JSON parse
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 100 * 1024) {
        // ~100KB
        return new Response('Payload too large', { status: 413 });
      }
      rawJson += decoder.decode(value, { stream: true });
    }
    rawJson += decoder.decode();

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawJson) as Record<string, unknown>;
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    if (!payload['transcript'] || typeof payload['transcript'] !== 'string') {
      return new Response('Missing transcript', { status: 400 });
    }
    const transcript = payload['transcript'];

    // IP extraction for rate limiting
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // We can stream the response using a ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: unknown) => {
          controller.enqueue(new TextEncoder().encode(JSON.stringify(data) + '\n'));
        };

        try {
          sendEvent({ type: 'status', message: 'Pipeline started...' });

          const result = await runPipeline(transcript, ip);

          sendEvent({ type: 'result', data: result });
          controller.close();
        } catch (err: unknown) {
          if (err instanceof Error) {
            if (err.message === 'Rate limit exceeded') {
              sendEvent({ type: 'error', message: 'Rate limit exceeded' });
            } else if (err.message === 'Transcript too short') {
              sendEvent({ type: 'error', message: 'Transcript too short' });
            } else {
              sendEvent({ type: 'error', message: 'Pipeline failed' });
            }
          } else {
            sendEvent({ type: 'error', message: 'Pipeline failed' });
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('Internal error', { status: 500 });
  }
}
