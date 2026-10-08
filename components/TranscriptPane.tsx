'use client';

import { useStore } from '@/lib/store';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useMemo, useRef, useEffect, KeyboardEvent, useState } from 'react';
import { buildEvidenceIndex, getHighlightPriority } from '@/lib/evidence-index';
import { ProgressStages } from '@/components/ProgressStages';
import { isDictationBurst } from '@/lib/ui-utils';

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

  const previousTranscriptRef = useRef(transcript);
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    if (isDictationBurst(previousTranscriptRef.current, transcript)) {
      setBurstKey((prev) => prev + 1);
    }
    previousTranscriptRef.current = transcript;
  }, [transcript]);

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

  const handleSentenceKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setPinnedItem(null);
      return;
    }
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      if (activeSentenceIndex === null) {
        setActiveSentence(0);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setActiveSentence(Math.min(sentences.length - 1, activeSentenceIndex + 1));
      } else {
        setActiveSentence(Math.max(0, activeSentenceIndex - 1));
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-paper p-4 sm:p-6 lg:p-8 border-r border-border overflow-y-auto">
      {!spec && (
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
          <h1 className="font-newsreader text-[2.5rem] md:text-[3.5rem] leading-[1.05] tracking-tight text-ink mb-3">
            Say it messy.
            <br />
            Get a spec you can trace.
          </h1>
          <p className="text-slate text-base md:text-lg">
            Convert voice dictation into structured product specs.
          </p>
        </div>
      )}

      {spec && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate uppercase tracking-wider">Transcript</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="rounded-controls shadow-sm"
          >
            Edit transcript
          </Button>
        </div>
      )}

      <div
        id="transcript-scroll-container"
        className="relative flex-grow flex flex-col focus-visible:outline-none"
        onKeyDown={handleGlobalKeyDown}
      >
        {!spec ? (
          <div className="flex flex-col flex-grow relative overflow-hidden rounded-sheet">
            <div className="absolute inset-0 bg-sheet rounded-sheet shadow-sheet pointer-events-none" />
            {burstKey > 0 && (
              <div
                key={burstKey}
                className="absolute left-0 top-0 w-[3px] bg-marker animate-pulse-down pointer-events-none z-20"
              />
            )}
            <Textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Press the Wispr Flow key and talk..."
              className="relative z-10 flex-grow resize-none font-newsreader text-[18px] leading-[1.7] max-w-[68ch] mx-auto p-6 md:p-8 bg-transparent border-none focus-visible:ring-0 shadow-none"
              disabled={isGenerating}
            />
            {charCount > 0 && (
              <div className="absolute bottom-4 right-4 z-10 text-xs text-slate bg-sheet/80 px-2 py-1 rounded backdrop-blur">
                {wordCount} words • {charCount} chars
              </div>
            )}
          </div>
        ) : (
          <div className="flex-grow relative bg-sheet rounded-sheet shadow-sheet overflow-y-auto">
            <div
              className="font-newsreader text-[18px] leading-[1.7] max-w-[68ch] mx-auto p-6 md:p-8 outline-none"
              tabIndex={0}
              role="group"
              aria-label="Transcript Sentences"
              aria-activedescendant={
                activeSentenceIndex !== null ? `sentence-${String(activeSentenceIndex)}` : undefined
              }
              onKeyDown={handleSentenceKeyDown}
            >
              {sentences.map((sentence, idx) => {
                const isHighlighted = highlightedSentences.has(idx);
                return (
                  <span
                    key={idx}
                    id={`sentence-${String(idx)}`}
                    ref={(el) => {
                      if (el) sentenceRefs.current.set(idx, el);
                      else sentenceRefs.current.delete(idx);
                    }}
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
                    className={`transition-colors duration-150 cursor-default rounded px-1 animate-in fade-in fill-mode-both motion-reduce:animate-none motion-reduce:transition-none
                      ${isHighlighted ? 'bg-marker text-ink' : 'hover:bg-slate/10'}
                      ${activeSentenceIndex === idx ? 'ring-2 ring-signal ring-offset-2' : ''}`}
                    style={{
                      animationDuration: '400ms',
                      animationDelay: `${(idx * Math.min(30, 900 / Math.max(1, sentences.length))).toFixed(0)}ms`,
                    }}
                  >
                    {sentence}{' '}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!spec && showWarning && (
        <div className="mt-4 text-sm text-destructive">
          Transcript must be between 40 and 20,000 characters.
        </div>
      )}

      {!spec && (
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <Button
              onClick={() => void generateSpec()}
              disabled={!isValid || isGenerating}
              className="relative overflow-hidden w-full sm:w-auto bg-signal text-sheet hover:bg-signal/90 rounded-controls shadow-sm flex items-center justify-center gap-2 h-11 px-6"
            >
              {isGenerating ? (
                <>
                  <span className="relative z-10">{currentStage || 'Generating...'}</span>
                  <div
                    className="absolute bottom-0 left-0 h-[2px] bg-sheet/40 transition-all duration-300 ease-out"
                    style={{
                      width:
                        String(currentStage).includes('Verifying') ||
                        String(currentStage).includes('Checking')
                          ? '90%'
                          : String(currentStage).includes('Generating')
                            ? '60%'
                            : '30%',
                    }}
                  />
                </>
              ) : (
                <>
                  Generate spec
                  <span className="text-sheet/70 text-xs border border-sheet/20 rounded px-1 font-mono">
                    ⌘ Enter
                  </span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={loadExample}
              disabled={isGenerating}
              className="w-full sm:w-auto text-slate hover:text-ink rounded-controls h-11 px-6"
            >
              Use an example
            </Button>
          </div>
          <ProgressStages />
        </div>
      )}
    </div>
  );
}
