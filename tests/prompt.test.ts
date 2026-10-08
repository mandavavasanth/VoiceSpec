import { describe, it, expect } from 'vitest';
import { toAgentPrompt } from '../lib/prompt';
import { Spec } from '../lib/schema';

describe('toAgentPrompt', () => {
  const baseSpec: Spec = {
    title: 'Test App',
    summary: 'A test app.',
    problem: 'Testing is hard.',
    userStories: [],
    requirements: [],
    acceptanceCriteria: [],
    risks: [],
    openQuestions: [],
    tasks: [],
  };

  it('generates a deterministic prompt in stable order', () => {
    const spec: Spec = {
      ...baseSpec,
      openQuestions: [
        { id: 'Q2', question: 'Q2?', reason: 'R2', evidence: [] },
        { id: 'Q1', question: 'Q1?', reason: 'R1', evidence: [{ sentenceIndex: 0, quote: 'q1' }] },
      ],
      requirements: [
        { id: 'R2', text: 'Req 2', priority: 'P1', evidence: [] },
        { id: 'R1', text: 'Req 1', priority: 'P0', evidence: [] },
      ],
      acceptanceCriteria: [
        { id: 'AC2', requirementId: 'R1', given: 'g', when: 'w', then: 't' },
        { id: 'AC1', requirementId: 'R1', given: 'g', when: 'w', then: 't' },
      ],
    };

    const prompt1 = toAgentPrompt(spec);

    // reverse the arrays to test determinism
    const specReversed = {
      ...spec,
      openQuestions: [...spec.openQuestions].reverse(),
      requirements: [...spec.requirements].reverse(),
      acceptanceCriteria: [...spec.acceptanceCriteria].reverse(),
    };

    const prompt2 = toAgentPrompt(specReversed);
    expect(prompt1).toEqual(prompt2);

    expect(prompt1).toContain('**R1**');
    expect(prompt1).toContain('**AC1**');
    expect(prompt1).toContain('**Q1**');
    expect(prompt1.indexOf('**R1**')).toBeLessThan(prompt1.indexOf('**R2**'));
    expect(prompt1.indexOf('**AC1**')).toBeLessThan(prompt1.indexOf('**AC2**'));
  });

  it('orders tasks topologically and breaks ties by priority and ID', () => {
    const spec: Spec = {
      ...baseSpec,
      tasks: [
        {
          id: 'T3',
          title: 'T3',
          description: 'd',
          priority: 'P1',
          size: 'S',
          requirementIds: [],
          dependsOn: ['T1'],
          evidence: [],
        },
        {
          id: 'T2',
          title: 'T2',
          description: 'd',
          priority: 'P0',
          size: 'S',
          requirementIds: [],
          dependsOn: [],
          evidence: [],
        },
        {
          id: 'T4',
          title: 'T4',
          description: 'd',
          priority: 'P1',
          size: 'S',
          requirementIds: [],
          dependsOn: [],
          evidence: [],
        },
        {
          id: 'T1',
          title: 'T1',
          description: 'd',
          priority: 'P2',
          size: 'S',
          requirementIds: [],
          dependsOn: [],
          evidence: [],
        },
      ],
    };
    const prompt = toAgentPrompt(spec);
    // T2 (in=0, P0), T4 (in=0, P1), T1 (in=0, P2), T3 (in=1, depends on T1)
    const t1Idx = prompt.indexOf('**T1**');
    const t2Idx = prompt.indexOf('**T2**');
    const t3Idx = prompt.indexOf('**T3**');
    const t4Idx = prompt.indexOf('**T4**');

    expect(t2Idx).toBeLessThan(t4Idx);
    expect(t4Idx).toBeLessThan(t1Idx);
    expect(t1Idx).toBeLessThan(t3Idx);
  });

  it('handles dependency cycles gracefully by falling back to priority and ID', () => {
    const spec: Spec = {
      ...baseSpec,
      tasks: [
        {
          id: 'T1',
          title: 'T1',
          description: 'd',
          priority: 'P1',
          size: 'S',
          requirementIds: [],
          dependsOn: ['T2'],
          evidence: [],
        },
        {
          id: 'T2',
          title: 'T2',
          description: 'd',
          priority: 'P0',
          size: 'S',
          requirementIds: [],
          dependsOn: ['T1'],
          evidence: [],
        },
        {
          id: 'T3',
          title: 'T3',
          description: 'd',
          priority: 'P0',
          size: 'S',
          requirementIds: [],
          dependsOn: [],
          evidence: [],
        },
      ],
    };
    const prompt = toAgentPrompt(spec);
    // T3 has 0 in-degree. T1 and T2 form a cycle.
    // Fallback sorts T1 and T2 by priority: T2 (P0) then T1 (P1).
    const t1Idx = prompt.indexOf('**T1**');
    const t2Idx = prompt.indexOf('**T2**');
    const t3Idx = prompt.indexOf('**T3**');

    expect(t3Idx).toBeLessThan(t2Idx);
    expect(t2Idx).toBeLessThan(t1Idx);
  });

  it('escapes triple backticks to make Markdown safe', () => {
    const spec: Spec = {
      ...baseSpec,
      summary: 'A ```code``` block.',
    };
    const prompt = toAgentPrompt(spec);
    expect(prompt).not.toContain('```');
    expect(prompt).toContain('\\`\\`\\`');
  });

  it('reflects an edited requirement in the output', () => {
    const spec: Spec = {
      ...baseSpec,
      requirements: [{ id: 'R1', text: 'Original text', priority: 'P0', evidence: [] }],
    };
    // Pretend the store was edited
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    spec.requirements[0]!.text = 'Edited text';
    const prompt = toAgentPrompt(spec);
    expect(prompt).toContain('Edited text');
    expect(prompt).not.toContain('Original text');
  });
});
