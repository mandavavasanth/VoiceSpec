import { describe, it, expect } from 'vitest';
import { isDictationBurst } from '../lib/ui-utils';

describe('isDictationBurst', () => {
  it('returns true when text grows by more than 40 chars', () => {
    expect(isDictationBurst('short text', 'short text' + 'a'.repeat(41))).toBe(true);
  });

  it('returns false when text grows by 40 chars or less', () => {
    expect(isDictationBurst('short text', 'short text' + 'a'.repeat(40))).toBe(false);
  });

  it('returns false when text shrinks', () => {
    expect(isDictationBurst('long text with many characters', 'short')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(isDictationBurst('', 'a'.repeat(41))).toBe(true);
    expect(isDictationBurst('', 'a'.repeat(40))).toBe(false);
  });
});
