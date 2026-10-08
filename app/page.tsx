'use client';

import { TranscriptPane } from '@/components/TranscriptPane';
import { Toolbar } from '@/components/Toolbar';
import { EmptyState } from '@/components/EmptyState';
import { ProgressStages } from '@/components/ProgressStages';
import { SpecPane } from '@/components/SpecPane';
import { useStore } from '@/lib/store';

export default function Page() {
  const { spec, isGenerating } = useStore();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Toolbar />
      <main className="flex-1 grid md:grid-cols-2 overflow-hidden">
        <TranscriptPane />
        <div className="relative flex-1 overflow-auto bg-card">
          <div className="absolute inset-0 p-6 flex flex-col">
            {isGenerating && (
              <div className="absolute top-4 inset-x-4 z-10 flex justify-center">
                <ProgressStages />
              </div>
            )}

            {spec ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 flex-1 overflow-hidden flex flex-col -mx-6 -my-6">
                <SpecPane />
              </div>
            ) : (
              !isGenerating && <EmptyState />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
