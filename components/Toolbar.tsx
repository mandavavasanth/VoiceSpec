'use client';

import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Wand2, Download, Copy, Terminal, FileText, Bot } from 'lucide-react';
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
  const { generateSpec, isGenerating, transcript, mode, warnings, error, spec } = useStore();

  const charCount = transcript.length;
  const isValid = charCount >= 40 && charCount <= 20000;

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4 font-semibold">
        <Wand2 className="w-5 h-5 text-primary" />
        <h1 className="text-lg">VoiceSpec</h1>
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

      {spec && (
        <div className="flex items-center gap-2 border-l pl-4 ml-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(toMarkdown(spec));
                toast.success('Markdown copied to clipboard');
              } catch {
                toast.error('Failed to copy');
              }
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy MD
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const blob = new Blob([toMarkdown(spec)], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${spec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('Markdown downloaded');
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download MD
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(toAgentPrompt(spec));
                toast.success('Agent prompt copied to clipboard');
              } catch {
                toast.error('Failed to copy prompt');
              }
            }}
          >
            <Bot className="w-4 h-4 mr-2" />
            Copy Agent Prompt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(toGhScript(toIssues(spec)));
                toast.success('GitHub script copied to clipboard');
              } catch {
                toast.error('Failed to copy script');
              }
            }}
          >
            <Terminal className="w-4 h-4 mr-2" />
            Copy GH Script
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
              <FileText className="w-4 h-4 mr-2" />
              Copy Issue Body
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
              {spec.tasks.length === 0 ? (
                <DropdownMenuItem disabled>No tasks available</DropdownMenuItem>
              ) : (
                spec.tasks.map((task) => (
                  <DropdownMenuItem
                    key={task.id}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(toIssueBody(task, spec));
                        toast.success(`Copied body for ${task.id}`);
                      } catch {
                        toast.error('Failed to copy issue body');
                      }
                    }}
                  >
                    <span className="font-medium mr-2">{task.id}</span>
                    <span className="truncate text-muted-foreground">{task.title}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
