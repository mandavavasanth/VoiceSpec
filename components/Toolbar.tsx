'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wand2, Download, Copy, Terminal, Bot, Check } from 'lucide-react';
import { toast } from 'sonner';
import { toMarkdown } from '@/lib/markdown';
import { toAgentPrompt } from '@/lib/agent-prompt';
import { toIssues, toGhScript, toIssueBody } from '@/lib/github-export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Toolbar() {
  const { mode, warnings, error, spec } = useStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = async (
    id: string,
    text: string | Blob,
    toastMsg: string,
    isDownload = false,
  ) => {
    try {
      if (isDownload && text instanceof Blob) {
        const url = URL.createObjectURL(text);
        const a = document.createElement('a');
        a.href = url;
        a.download = toastMsg; // passing filename through toastMsg
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${toastMsg}`);
      } else if (typeof text === 'string') {
        await navigator.clipboard.writeText(text);
        toast.success(toastMsg);
      }
      setCopiedId(id);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => {
        setCopiedId(null);
      }, 1200);
    } catch {
      toast.error('Could not copy. Select the text and copy it manually.');
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-paper px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3 font-semibold text-ink font-newsreader">
        <Wand2 className="w-5 h-5 text-signal" />
        <h1 className="text-xl tracking-tight">VoiceSpec</h1>
      </div>

      <div className="flex items-center gap-3 font-instrument">
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
            <div
              className={`px-2 py-0.5 text-xs font-semibold rounded-controls uppercase tracking-wider ${mode === 'demo' ? 'bg-slate/10 text-slate' : 'bg-signal/10 text-signal'}`}
            >
              {mode === 'demo' ? 'Demo' : 'Gemini'}
            </div>
            {mode === 'demo' && warnings.length > 0 && (
              <span className="text-sm text-slate truncate max-w-[200px]" title={warnings[0]}>
                {warnings[0]}
              </span>
            )}
          </div>
        )}

        {spec && (
          <div className="flex items-center gap-2 border-l border-border pl-3 ml-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-controls text-slate hover:text-ink shadow-sm bg-sheet transition-colors"
              onClick={() =>
                void handleCopy('agent', toAgentPrompt(spec), 'Agent prompt copied to clipboard')
              }
            >
              {copiedId === 'agent' ? (
                <Check className="w-4 h-4 mr-2 text-signal" />
              ) : (
                <Bot className="w-4 h-4 mr-2" />
              )}
              Copy agent prompt
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-controls text-sm font-medium border border-border bg-sheet shadow-sm hover:bg-slate/5 text-ink h-8 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-1 transition-colors">
                <Download className="w-4 h-4 mr-2 text-slate" />
                Export
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 font-instrument bg-sheet border-border rounded-lg shadow-sheet p-1"
              >
                <DropdownMenuItem
                  className="rounded-md cursor-pointer hover:bg-slate/5 focus:bg-slate/5"
                  onClick={() =>
                    void handleCopy('md', toMarkdown(spec), 'Markdown copied to clipboard')
                  }
                >
                  {copiedId === 'md' ? (
                    <Check className="w-4 h-4 mr-2 text-signal" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2 text-slate" />
                  )}
                  Copy Markdown
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-md cursor-pointer hover:bg-slate/5 focus:bg-slate/5"
                  onClick={() => {
                    const blob = new Blob([toMarkdown(spec)], { type: 'text/markdown' });
                    void handleCopy(
                      'dl',
                      blob,
                      `${spec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`,
                      true,
                    );
                  }}
                >
                  {copiedId === 'dl' ? (
                    <Check className="w-4 h-4 mr-2 text-signal" />
                  ) : (
                    <Download className="w-4 h-4 mr-2 text-slate" />
                  )}
                  Download Markdown
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-md cursor-pointer hover:bg-slate/5 focus:bg-slate/5"
                  onClick={() =>
                    void handleCopy('gh', toGhScript(toIssues(spec)), 'Copied GitHub script')
                  }
                >
                  {copiedId === 'gh' ? (
                    <Check className="w-4 h-4 mr-2 text-signal" />
                  ) : (
                    <Terminal className="w-4 h-4 mr-2 text-slate" />
                  )}
                  Copy GitHub script
                </DropdownMenuItem>

                <div className="h-px bg-border my-1 mx-1" />
                <div className="px-2 py-1.5 text-xs font-semibold text-slate uppercase tracking-wider">
                  Copy issue body
                </div>

                {spec.tasks.length === 0 ? (
                  <DropdownMenuItem disabled className="text-slate">
                    No tasks available
                  </DropdownMenuItem>
                ) : (
                  spec.tasks.map((task) => (
                    <DropdownMenuItem
                      key={task.id}
                      className="rounded-md cursor-pointer hover:bg-slate/5 focus:bg-slate/5"
                      onClick={() =>
                        void handleCopy(
                          `task-${task.id}`,
                          toIssueBody(task, spec),
                          `Copied issue body for ${task.id}`,
                        )
                      }
                    >
                      {copiedId === `task-${task.id}` ? (
                        <Check className="w-4 h-4 mr-2 text-signal" />
                      ) : (
                        <span className="font-mono text-xs text-slate mr-2">{task.id}</span>
                      )}
                      <span className="truncate">{task.title}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
