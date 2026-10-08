/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-vars, @typescript-eslint/no-confusing-void-expression */
import { create } from 'zustand';
import { Spec } from './schema';

export interface AppState {
  transcript: string;
  setTranscript: (text: string) => void;

  isGenerating: boolean;
  currentStage: string | null;

  spec: Spec | null;
  mode: 'gemini' | 'demo' | 'fallback' | null;
  modelUsed?: string;
  warnings: string[];

  error: string | null;

  generateSpec: () => Promise<void>;
  reset: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  transcript: '',
  setTranscript: (text: string) => set({ transcript: text }),

  isGenerating: false,
  currentStage: null,

  spec: null,
  mode: null,
  modelUsed: undefined,
  warnings: [],

  error: null,

  generateSpec: async () => {
    const { transcript } = get();
    if (transcript.length < 40 || transcript.length > 20000) return;

    set({
      isGenerating: true,
      currentStage: 'Starting generation...',
      spec: null,
      error: null,
      mode: null,
      modelUsed: undefined,
      warnings: [],
    });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');

        // Keep the last partial part in the buffer
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;
          try {
            const event = JSON.parse(part);
            if (event.type === 'stage') {
              set({ currentStage: event.stage });
            } else if (event.type === 'result') {
              set({
                spec: event.spec,
                mode: event.mode,
                modelUsed: event.metrics?.modelUsed,
                warnings: event.warnings || [],
              });
            } else if (event.type === 'error') {
              set({ error: event.message });
            }
          } catch (e) {
            console.error('Failed to parse NDJSON part:', part);
          }
        }
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Unknown error occurred.' });
    } finally {
      set({ isGenerating: false, currentStage: null });
    }
  },

  reset: () => {
    set({
      transcript: '',
      spec: null,
      mode: null,
      modelUsed: undefined,
      warnings: [],
      error: null,
      currentStage: null,
    });
  },
}));
