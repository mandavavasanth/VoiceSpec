import { describe, it, expect } from 'vitest';
import { SpecSchema } from '@/lib/schema';
import { GeminiClient } from '@/lib/gemini';

describe('Schema Consistency', () => {
  it('GeminiClient response schema matches Zod SpecSchema fields', () => {
    const geminiProps = GeminiClient.geminiResponseSchema.properties;

    // Check top level keys
    const requiredKeys = [
      'title',
      'summary',
      'problem',
      'userStories',
      'requirements',
      'acceptanceCriteria',
      'risks',
      'openQuestions',
      'tasks',
    ];
    for (const key of requiredKeys) {
      expect(geminiProps).toHaveProperty(key);
    }
  });

  it('realistic mock Gemini response validates against Zod schema', () => {
    const mockResponse = {
      title: 'Test Spec',
      summary: 'Summary here',
      problem: 'Problem here',
      userStories: [
        {
          id: 'US-001',
          persona: 'user',
          want: 'to test',
          soThat: 'it works',
          evidence: [{ sentenceIndex: 0, quote: 'I want to test.' }],
        },
      ],
      requirements: [
        {
          id: 'FR-001',
          text: 'System must work',
          priority: 'P0',
          evidence: [{ sentenceIndex: 1, quote: 'It must work.' }],
        },
      ],
      acceptanceCriteria: [
        {
          id: 'AC-001',
          requirementId: 'FR-001',
          given: 'working system',
          when: 'tested',
          then: 'works',
        },
      ],
      risks: [
        {
          id: 'RK-001',
          text: 'Could fail',
          severity: 'high',
          evidence: [{ sentenceIndex: 2, quote: 'It might fail.' }],
        },
      ],
      openQuestions: [
        {
          id: 'OQ-001',
          question: 'Why?',
          reason: 'Unclear',
          evidence: [{ sentenceIndex: 3, quote: 'I do not know why.' }],
        },
      ],
      tasks: [
        {
          id: 'T-001',
          title: 'Fix it',
          description: 'Fix the code',
          priority: 'P1',
          size: 'S',
          requirementIds: ['FR-001'],
          dependsOn: [],
          evidence: [{ sentenceIndex: 4, quote: 'We should fix it.' }],
        },
      ],
    };

    const parsed = SpecSchema.safeParse(mockResponse);
    if (!parsed.success) {
      console.error(JSON.stringify(parsed.error.issues, null, 2));
    }
    expect(parsed.success).toBe(true);
  });
});
