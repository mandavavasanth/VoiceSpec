'use client';

import { useStore } from '@/lib/store';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function TranscriptPane() {
  const { transcript, setTranscript, generateSpec, isGenerating } = useStore();
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const charCount = transcript.length;
  const isValid = charCount >= 40 && charCount <= 20000;
  const showWarning = charCount > 0 && !isValid;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isGenerating && isValid) {
        void generateSpec();
      }
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
        <Button variant="outline" size="sm" onClick={loadExample} disabled={isGenerating}>
          Try an example
        </Button>
      </div>

      <div className="relative flex-grow flex flex-col">
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
      </div>

      {showWarning && (
        <div className="text-sm text-destructive">
          Transcript must be between 40 and 20,000 characters.
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Press <kbd className="font-mono bg-muted px-1 rounded">⌘ Enter</kbd> to generate
      </div>
    </div>
  );
}
