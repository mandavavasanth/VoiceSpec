'use client';

import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Wand2 } from 'lucide-react';

export function Toolbar() {
  const { generateSpec, isGenerating, transcript, mode, warnings, error } = useStore();

  const charCount = transcript.length;
  const isValid = charCount >= 40 && charCount <= 20000;

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4 font-semibold">
        <Wand2 className="w-5 h-5 text-primary" />
        <span>VoiceSpec</span>
      </div>

      <div className="flex items-center gap-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive font-medium">
            <AlertCircle className="w-4 h-4" />
            <span className="max-w-xs truncate" title={error}>
              {error}
            </span>
          </div>
        )}

        {mode && !error && (
          <div className="flex items-center gap-2">
            <Badge variant={mode === 'demo' ? 'secondary' : 'default'} className="uppercase">
              {mode === 'demo' ? 'Demo' : 'Gemini'}
            </Badge>
            {mode === 'demo' && warnings.length > 0 && (
              <span
                className="text-sm text-muted-foreground truncate max-w-[200px]"
                title={warnings[0]}
              >
                Reason: {warnings[0]}
              </span>
            )}
          </div>
        )}

        <Button
          onClick={generateSpec}
          disabled={isGenerating || !isValid}
          className="min-w-[100px]"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </div>
    </header>
  );
}
