import { describe, it, expect } from 'vitest';
import { buildEvidenceIndex, getHighlightPriority } from '@/lib/evidence-index';
import { Spec } from '@/lib/schema';

describe('buildEvidenceIndex', () => {
  it('builds bidirectional maps and maps AC to FR evidence', () => {
    const spec = {
      title: 'T',
      summary: 'S',
      problem: 'P',
      userStories: [],
      requirements: [
        {
          id: 'FR-001',
          text: 'R1',
          priority: 'P0',
          evidence: [
            { sentenceIndex: 0, quote: 'q' },
            { sentenceIndex: 1, quote: 'q2' },
          ],
        },
      ],
      acceptanceCriteria: [
        {
          id: 'AC-001',
          requirementId: 'FR-001',
          given: 'g',
          when: 'w',
          then: 't',
        },
      ],
      risks: [],
      openQuestions: [],
      tasks: [
        {
          id: 'T-001',
          title: 'Task',
          description: 'D',
          priority: 'P1',
          size: 'M',
          requirementIds: ['FR-001'],
          dependsOn: [],
          evidence: [{ sentenceIndex: 1, quote: 'q2' }],
        },
      ],
    } as Spec;

    const { itemToSentences, sentenceToItems } = buildEvidenceIndex(spec);

    expect(itemToSentences.get('FR-001')).toEqual(new Set([0, 1]));
    expect(itemToSentences.get('T-001')).toEqual(new Set([1]));

    // AC should inherit FR's sentences
    expect(itemToSentences.get('AC-001')).toEqual(new Set([0, 1]));

    expect(sentenceToItems.get(0)).toEqual(new Set(['FR-001', 'AC-001']));
    expect(sentenceToItems.get(1)).toEqual(new Set(['FR-001', 'AC-001', 'T-001']));
  });
});

describe('getHighlightPriority', () => {
  it('prioritizes hover over focus over pinned', () => {
    expect(getHighlightPriority('A', 'B', 'C')).toBe('A');
    expect(getHighlightPriority(null, 'B', 'C')).toBe('B');
    expect(getHighlightPriority(null, null, 'C')).toBe('C');
    expect(getHighlightPriority(null, null, null)).toBe(null);
  });
});
