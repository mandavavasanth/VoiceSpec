'use client';

import { TranscriptPane } from '@/components/TranscriptPane';
import { Toolbar } from '@/components/Toolbar';
import { EmptyState } from '@/components/EmptyState';
import { ProgressStages } from '@/components/ProgressStages';
import { SpecPane } from '@/components/SpecPane';
import { useStore } from '@/lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/lib/use-mobile';
import { useEffect, useState } from 'react';

export default function Page() {
  const { spec, isGenerating, currentStage } = useStore();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('transcript');

  // Generate should switch to the spec tab when a result arrives
  useEffect(() => {
    if (spec) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('spec');
    }
  }, [spec]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <Toolbar />
      <main id="main-content" className="flex-1 overflow-hidden" aria-label="Main Workspace">
        {/* Live region for stage progress announcement */}
        <div aria-live="polite" className="sr-only">
          {currentStage}
        </div>

        {isMobile ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden h-full"
          >
            <div className="p-2 border-b bg-muted/20">
              <TabsList className="grid w-full grid-cols-2 h-10">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="spec" disabled={!spec && !isGenerating}>
                  Specification
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="transcript"
              className="flex-1 overflow-hidden m-0 p-0 h-full data-[state=inactive]:hidden data-[state=active]:flex flex-col"
            >
              <section aria-label="Transcript Pane" className="flex-1 overflow-hidden">
                <TranscriptPane />
              </section>
            </TabsContent>
            <TabsContent
              value="spec"
              className="flex-1 overflow-hidden m-0 p-0 h-full bg-card data-[state=inactive]:hidden data-[state=active]:flex flex-col relative"
            >
              <section
                aria-label="Specification Pane"
                className="flex-1 overflow-auto bg-card relative"
              >
                <div className="absolute inset-0 p-4 sm:p-6 flex flex-col">
                  {isGenerating && (
                    <div className="absolute top-4 inset-x-4 z-10 flex justify-center">
                      <ProgressStages />
                    </div>
                  )}

                  {spec ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 flex-1 overflow-hidden flex flex-col -mx-4 sm:-mx-6 -my-4 sm:-my-6 motion-reduce:animate-none motion-reduce:transition-none">
                      <SpecPane />
                    </div>
                  ) : (
                    !isGenerating && <EmptyState />
                  )}
                </div>
              </section>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid md:grid-cols-2 h-full overflow-hidden">
            <section aria-label="Transcript Pane" className="flex-1 overflow-hidden border-r">
              <TranscriptPane />
            </section>
            <section
              aria-label="Specification Pane"
              className="relative flex-1 overflow-auto bg-card"
            >
              <div className="absolute inset-0 p-6 flex flex-col">
                {isGenerating && (
                  <div className="absolute top-4 inset-x-4 z-10 flex justify-center">
                    <ProgressStages />
                  </div>
                )}

                {spec ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 flex-1 overflow-hidden flex flex-col -mx-6 -my-6 motion-reduce:animate-none motion-reduce:transition-none">
                    <SpecPane />
                  </div>
                ) : (
                  !isGenerating && <EmptyState />
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
