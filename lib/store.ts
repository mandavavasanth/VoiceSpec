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

  sentences: string[];
  activeItemId: string | null;
  activeSentenceIndex: number | null;
  pinnedItemId: string | null;

  setActiveItem: (id: string | null) => void;
  setActiveSentence: (index: number | null) => void;
  setPinnedItem: (id: string | null) => void;
  updateItemText: (id: string, text: string) => void;

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

  sentences: [],
  activeItemId: null,
  activeSentenceIndex: null,
  pinnedItemId: null,

  setActiveItem: (id) => set({ activeItemId: id }),
  setActiveSentence: (index) => set({ activeSentenceIndex: index }),
  setPinnedItem: (id) => set({ pinnedItemId: id }),
  updateItemText: (id, text) => {
    set((state) => {
      if (!state.spec) return state;
      const spec = { ...state.spec };

      // Allow-list of fields that can be edited per ID prefix
      const tryUpdate = (
        arr: Array<Record<string, unknown> & { id: string }>,
        editableField: string,
      ) => {
        const idx = arr.findIndex((i) => i.id === id);
        if (idx !== -1) {
          arr[idx] = { ...arr[idx], [editableField]: text } as Record<string, unknown> & {
            id: string;
          };
          return true;
        }
        return false;
      };

      if (id.startsWith('US-') && tryUpdate(spec.userStories, 'want')) return { spec };
      if (id.startsWith('FR-') && tryUpdate(spec.requirements, 'text')) return { spec };
      if (id.startsWith('RK-') && tryUpdate(spec.risks, 'text')) return { spec };
      if (id.startsWith('OQ-') && tryUpdate(spec.openQuestions, 'question')) return { spec };
      if (id.startsWith('AC-') && tryUpdate(spec.acceptanceCriteria, 'given')) return { spec };
      if (id.startsWith('T-') && tryUpdate(spec.tasks, 'description')) return { spec }; // Only description is editable

      return { spec };
    });
  },

  generateSpec: async () => {
    const { transcript } = get();
    if (transcript.length < 40 || transcript.length > 20000) return;

    set({
      isGenerating: true,
      currentStage: 'Starting generation...',
      spec: null,
      sentences: [],
      error: null,
      mode: null,
      modelUsed: undefined,
      warnings: [],
      activeItemId: null,
      activeSentenceIndex: null,
      pinnedItemId: null,
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
            } else if (event.type === 'result' && event.data) {
              set({
                spec: event.data.spec,
                sentences: event.data.sentences || [],
                mode: event.data.mode,
                modelUsed: event.data.metrics?.modelUsed,
                warnings: event.data.warnings || [],
              });
            } else if (event.type === 'error') {
              set({ error: event.message });
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
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
      sentences: [],
      activeItemId: null,
      activeSentenceIndex: null,
      pinnedItemId: null,
    });
  },
}));
