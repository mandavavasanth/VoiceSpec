'use client';

import { ThinkingOrb } from 'thinking-orbs';
import { useState, useEffect } from 'react';

export function EmptyState({ isGenerating }: { isGenerating?: boolean }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mql.addEventListener('change', handler);
    return () => {
      mql.removeEventListener('change', handler);
    };
  }, []);
  return (
    <div
      className={`flex flex-col h-full space-y-8 px-4 sm:px-8 py-8 ${isGenerating ? 'animate-pulse opacity-60' : 'opacity-100'}`}
    >
      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-medium text-ink font-instrument">Your spec appears here</h2>
        <p className="text-sm text-slate font-instrument leading-relaxed">
          Requirements, tasks and acceptance criteria, each linked to the sentence it came from.
        </p>
      </div>

      {isGenerating && (
        <div className="flex justify-center mb-8">
          <ThinkingOrb state="working" size={64} aria-hidden paused={prefersReducedMotion} />
        </div>
      )}

      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex gap-4 items-start border-b border-border/50 pb-4">
            <div className="w-16 shrink-0 h-4 rounded bg-slate/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded bg-slate/10 w-full" />
              <div className="h-4 rounded bg-slate/10 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
