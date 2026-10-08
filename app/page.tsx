'use client';

import { TranscriptPane } from '@/components/TranscriptPane';
import { Toolbar } from '@/components/Toolbar';
import { EmptyState } from '@/components/EmptyState';
import { ProgressStages } from '@/components/ProgressStages';
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
              <div className="animate-in fade-in slide-in-from-bottom-4 flex-1 overflow-auto">
                <h3 className="font-semibold mb-4 text-lg border-b pb-2">
                  Generated Specification
                </h3>
                <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs whitespace-pre-wrap font-mono">
                  {JSON.stringify(spec, null, 2)}
                </pre>
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
