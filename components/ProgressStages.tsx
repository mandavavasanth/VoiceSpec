'use client';

import { useStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';

export function ProgressStages() {
  const { isGenerating, currentStage } = useStore();

  if (!isGenerating) return null;

  return (
    <div
      className="flex items-center gap-3 p-4 bg-primary/10 text-primary rounded-lg animate-in fade-in zoom-in-95"
      aria-live="polite"
      role="status"
    >
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="font-medium">{currentStage || 'Processing...'}</span>
    </div>
  );
}
