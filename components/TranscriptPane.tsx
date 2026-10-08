'use client';

import { useStore } from '@/lib/store';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useMemo, useRef, useEffect, KeyboardEvent } from 'react';
import { buildEvidenceIndex, getHighlightPriority } from '@/lib/evidence-index';

export function TranscriptPane() {
  const {
    transcript,
    setTranscript,
    generateSpec,
    isGenerating,
    spec,
    sentences,
    reset,
    activeItemId,
    activeSentenceIndex,
    pinnedItemId,
    setActiveSentence,
    setPinnedItem,
  } = useStore();
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const charCount = transcript.length;
  const isValid = charCount >= 40 && charCount <= 20000;
  const showWarning = charCount > 0 && !isValid;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isGenerating && isValid) {
        void generateSpec();
      }
    }
  };

  const evidenceIndex = useMemo(() => {
    if (!spec) return null;
    return buildEvidenceIndex(spec);
  }, [spec]);

  const highlightedSentences = useMemo(() => {
    const set = new Set<number>();
    const priority = getHighlightPriority(activeItemId, null, pinnedItemId);
    if (priority && evidenceIndex) {
      const sents = evidenceIndex.itemToSentences.get(priority);
      if (sents) {
        sents.forEach((s) => set.add(s));
      }
    } else if (activeSentenceIndex !== null) {
      set.add(activeSentenceIndex);
    }
    return set;
  }, [activeItemId, pinnedItemId, activeSentenceIndex, evidenceIndex]);

  // refs for scrolling sentences
  const sentenceRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  useEffect(() => {
    const priorityId = getHighlightPriority(activeItemId, null, pinnedItemId);
    if (highlightedSentences.size > 0 && priorityId && !pinnedItemId) {
      // scroll first highlighted sentence into view
      const firstIndex = Math.min(...Array.from(highlightedSentences));
      const el = sentenceRefs.current.get(firstIndex);
      const container = document.getElementById('transcript-scroll-container');

      if (el && container) {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const isVisible = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;

        if (!isVisible) {
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          container.scrollTo({
            top: el.offsetTop - 20,
            behavior: prefersReduced ? 'auto' : 'smooth',
          });
        }
      }
    }
  }, [highlightedSentences, pinnedItemId, activeItemId]);

  const handleSentenceHover = (index: number | null) => {
    setActiveSentence(index);
  };

  const handleGlobalKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setPinnedItem(null);
    }
  };

  const loadExample = async () => {
    try {
      const res = await fetch('/sample-transcript.txt');
      const text = await res.text();
      setTranscript(text);
    } catch (err) {
      console.error('Failed to load example', err);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 border-r bg-muted/20">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Dictation</h2>
        {!spec ? (
          <Button variant="outline" size="sm" onClick={loadExample} disabled={isGenerating}>
            Try an example
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={reset}>
            Edit transcript
          </Button>
        )}
      </div>

      <div
        id="transcript-scroll-container"
        className="relative flex-grow flex flex-col overflow-y-auto"
        onKeyDown={handleGlobalKeyDown}
      >
        {!spec ? (
          <>
            <Textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Paste or type your product dictation here..."
              className="flex-grow resize-none min-h-[300px] text-base p-4 focus-visible:ring-1"
              disabled={isGenerating}
            />
            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded shadow-sm backdrop-blur">
              {wordCount} words • {charCount} chars
            </div>
          </>
        ) : (
          <div
            className="flex-grow p-4 bg-background border rounded-md text-base leading-relaxed whitespace-pre-wrap outline-none"
            tabIndex={0}
          >
            {sentences.map((sentence, idx) => {
              const isHighlighted = highlightedSentences.has(idx);
              return (
                <span
                  key={idx}
                  ref={(el) => {
                    if (el) sentenceRefs.current.set(idx, el);
                    else sentenceRefs.current.delete(idx);
                  }}
                  tabIndex={0}
                  onMouseEnter={() => {
                    handleSentenceHover(idx);
                  }}
                  onMouseLeave={() => {
                    handleSentenceHover(null);
                  }}
                  onFocus={() => {
                    handleSentenceHover(idx);
                  }}
                  onBlur={() => {
                    handleSentenceHover(null);
                  }}
                  className={`transition-colors duration-200 cursor-default rounded px-1 
                    ${isHighlighted ? 'bg-primary/20 ring-1 ring-primary/50' : 'hover:bg-muted'}`}
                >
                  {sentence}{' '}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {!spec && showWarning && (
        <div className="text-sm text-destructive">
          Transcript must be between 40 and 20,000 characters.
        </div>
      )}

      {!spec && (
        <div className="text-xs text-muted-foreground text-center">
          Press <kbd className="font-mono bg-muted px-1 rounded">⌘ Enter</kbd> to generate
        </div>
      )}
    </div>
  );
}
