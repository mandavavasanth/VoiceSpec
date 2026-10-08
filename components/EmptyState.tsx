'use client';

import { FileText } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8 text-muted-foreground animate-in fade-in">
      <div className="p-4 bg-muted rounded-full">
        <FileText className="w-12 h-12 text-muted-foreground/50" />
      </div>
      <h3 className="text-xl font-semibold text-foreground">No Specification Yet</h3>
      <p className="max-w-sm">
        Paste a raw dictation transcript or try the example to generate a structured product
        specification.
      </p>
    </div>
  );
}
