import { describe, it, expect } from 'vitest';
import { toMarkdown } from '@/lib/markdown';
import { Spec } from '@/lib/schema';

describe('toMarkdown', () => {
  it('generates deterministic markdown with escaped table cells and footnotes', () => {
    const spec: Spec = {
      title: 'T',
      summary: 'S',
      problem: 'P',
      userStories: [
        {
          id: 'US-001',
          persona: 'u',
          want: 'w',
          soThat: 's',
          evidence: [{ sentenceIndex: 0, quote: 'q' }],
        },
      ],
      requirements: [],
      acceptanceCriteria: [],
      risks: [],
      openQuestions: [],
      tasks: [
        {
          id: 'T-001',
          title: 'Task | With Pipe\nAnd Newline',
          description: 'D',
          priority: 'P0',
          size: 'M',
          dependsOn: [],
          requirementIds: [],
          evidence: [
            { sentenceIndex: 1, quote: 'q2' },
            { sentenceIndex: 2, quote: 'q3' },
          ],
        },
      ],
    };

    const md = toMarkdown(spec);

    // Check table escaping
    expect(md).toContain(
      '| T-001[^T-001-1][^T-001-2] | Task \\| With Pipe<br/>And Newline | P0 | M |  |  |',
    );

    // Check footnotes
    expect(md).toContain('[^US-001-1]: "q" (sentence 0)');
    expect(md).toContain('[^T-001-1]: "q2" (sentence 1)');
    expect(md).toContain('[^T-001-2]: "q3" (sentence 2)');

    // Check determinism (string matching implies determinism given static input)
    expect(md).toMatch(/^# T\n\n## Summary\n\nS\n\n## Problem\n\nP\n\n## User Stories/);
  });
});
