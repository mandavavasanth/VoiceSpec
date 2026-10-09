'use client';

import { useStore } from '@/lib/store';
import { CheckCircle2, Circle } from 'lucide-react';
import { ThinkingOrb } from 'thinking-orbs';
import { useState, useEffect } from 'react';

export function ProgressStages() {
  const { isGenerating, currentStage } = useStore();
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

  if (!isGenerating) return null;

  // Map backend stages to timeline steps
  const getStepIndex = () => {
    if (!currentStage) return 0;
    if (
      currentStage.includes('Verifying') ||
      currentStage.includes('Checking') ||
      currentStage.includes('integrity')
    )
      return 2;
    if (
      currentStage.includes('Calling') ||
      currentStage.includes('Generating') ||
      currentStage.includes('Fallback')
    )
      return 1;
    return 0; // Default to Cleaning for Starting and Normalizing
  };

  const activeIndex = getStepIndex();

  const steps = [{ label: 'Cleaning' }, { label: 'Analyzing' }, { label: 'Checking sources' }];

  return (
    <div
      className="flex items-center gap-4 mt-6 w-full max-w-sm mx-auto sm:mx-0 animate-in fade-in"
      aria-live="polite"
      role="status"
    >
      <span className="sr-only">{currentStage || 'Processing...'}</span>
      {steps.map((step, idx) => {
        const isActive = idx === activeIndex;
        const isPast = idx < activeIndex;
        return (
          <div
            key={step.label}
            className={`flex items-center gap-2 text-sm ${isActive ? 'text-ink font-medium' : isPast ? 'text-signal' : 'text-slate/50'}`}
          >
            {isPast ? (
              <CheckCircle2 className="w-4 h-4 text-signal shrink-0" />
            ) : isActive ? (
              <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                <ThinkingOrb state="working" size={20} aria-hidden paused={prefersReducedMotion} />
              </div>
            ) : (
              <Circle className="w-4 h-4 shrink-0" />
            )}
            <span className="hidden sm:inline">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
