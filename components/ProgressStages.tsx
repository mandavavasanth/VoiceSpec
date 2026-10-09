'use client';

import { useStore } from '@/lib/store';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

export function ProgressStages() {
  const { isGenerating, currentStage } = useStore();

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
              <Loader2 className="w-4 h-4 animate-spin text-ink shrink-0" />
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
