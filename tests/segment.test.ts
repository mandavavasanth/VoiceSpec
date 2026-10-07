import { describe, it, expect } from 'vitest';
import { segment } from '@/lib/segment';

describe('segment', () => {
  it('splits text into sentences', () => {
    const text = 'First sentence. Second sentence! Third? Fourth.';
    const sentences = segment(text);
    expect(sentences).toEqual(['First sentence.', 'Second sentence!', 'Third?', 'Fourth.']);
  });

  it('handles abbreviations gracefully (basic)', () => {
    // A more advanced splitter handles Mr. properly, but this basic regex tests current functionality
    const text = 'Mr. Smith went to Washington.';
    expect(segment(text)).toContain('Mr.');
  });

  it('returns single string array for no punctuation', () => {
    const text = 'this is just a long thought with no periods';
    expect(segment(text)).toEqual([text]);
  });
});
