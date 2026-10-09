import { describe, it, expect } from 'vitest';
import { fallbackSpec } from '@/lib/fallback';

describe('fallbackSpec', () => {
  it('creates a spec with fallback content and adds reason code to warnings', () => {
    const sentences = [
      'We must implement rate limiting.',
      'As a user I want to log in so that I can see data.',
      'This might break the production server.',
    ];

    const { spec, warnings } = fallbackSpec(sentences, 'timeout');

    // Check that warning includes reason code but NO transcript text
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('timeout');
    expect(warnings[0]).not.toContain('implement');
    expect(warnings[0]).not.toContain('log in');

    // Requirements
    expect(spec.requirements).toHaveLength(1);
    expect(spec.requirements[0]?.text).toBe('We must implement rate limiting.');
    expect(spec.requirements[0]?.priority).toBe('P0');

    // User stories
    expect(spec.userStories).toHaveLength(1);
    expect(spec.userStories[0]?.persona).toBe('user');

    // Risks
    expect(spec.risks).toHaveLength(1);
    expect(spec.risks[0]?.severity).toBe('medium');

    // Evidence attached
    expect(spec.requirements[0]?.evidence[0]?.sentenceIndex).toBe(0);
    expect(spec.requirements[0]?.evidence[0]?.quote).toBe(sentences[0]);

    // Test cue-word classifications
    expect(spec.userStories[0]?.evidence[0]?.sentenceIndex).toBe(1);
    expect(spec.userStories[0]?.evidence[0]?.quote).toBe(sentences[1]);
    expect(spec.risks[0]?.evidence[0]?.sentenceIndex).toBe(2);
    expect(spec.risks[0]?.evidence[0]?.quote).toBe(sentences[2]);

    // Reason code is the only warning entry (no verbose message)
    expect(warnings[0]).toBe('timeout');
  });

  it('builds spec title from the first meaningful sentence and shortens it', () => {
    const longSentence =
      'This is a very long sentence that goes on and on and on and definitely exceeds the seventy character limit that we want to enforce on the title.';
    const sentences = [
      '   ', // empty
      longSentence,
    ];
    const { spec } = fallbackSpec(sentences, 'timeout');
    expect(spec.title).toBe(longSentence.substring(0, 67) + '...');
    expect(spec.title.length).toBeLessThanOrEqual(70);
  });
});
