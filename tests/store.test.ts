import { describe, it, expect, vi } from 'vitest';
import { useStore } from '@/lib/store';

// Setup fetch mock globally
const originalFetch = global.fetch;

describe('Store Stream Parser', () => {
  it('correctly handles a chunk that splits a line in the middle', async () => {
    const encoder = new TextEncoder();

    // Create a mock stream with split chunks
    let controller = null as unknown as ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        controller = c;
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      body: stream,
    });

    // Reset store
    useStore.getState().reset();
    useStore
      .getState()
      .setTranscript('This is a test transcript that meets the 40 char minimum limit.');

    const generatePromise = useStore.getState().generateSpec();

    // Push chunks
    const chunk1 = '{"type":"stage","stage":"First ';
    const chunk2 =
      'Stage"}\n{"type":"result","data":{"spec":{"title":"Test"},"sentences":["sentence 1"],"mode":"demo","warnings":[]}}\n';

    controller.enqueue(encoder.encode(chunk1));
    // Yield to allow processing
    await new Promise((r) => setTimeout(r, 10));

    // We shouldn't crash and the state shouldn't have partial JSON applied
    expect(useStore.getState().currentStage).toBe('Starting generation...');

    // Now push the rest
    controller.enqueue(encoder.encode(chunk2));
    controller.close();

    await generatePromise;

    expect(useStore.getState().currentStage).toBe(null); // Finally sets to null
    expect(useStore.getState().spec).toEqual({ title: 'Test' });
    expect(useStore.getState().sentences).toEqual(['sentence 1']);

    global.fetch = originalFetch;
  });
});
