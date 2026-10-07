import { describe, it, expect } from 'vitest';
import { normalize } from '@/lib/normalize';

describe('normalize', () => {
  it('strips common filler words', () => {
    const raw = 'Um, we need a button, you know, like to save the file. I mean, right?';
    const cleaned = normalize(raw);
    expect(cleaned).not.toMatch(/\b(um|you know|like|I mean)\b/i);
    expect(cleaned).toBe(', we need a button, , to save the file. , right?');
  });

  it('removes immediate repetitions', () => {
    const raw = 'we need the the user to to log in';
    expect(normalize(raw)).toBe('we need the user to log in');
  });

  it('preserves meaning without changing other text', () => {
    const raw = 'Important requirement: system must be fast.';
    expect(normalize(raw)).toBe(raw);
  });

  it('preserves non-English text and removes repetitions using Unicode boundaries', () => {
    const raw = 'यह यह एक परीक्षण परीक्षण है';
    expect(normalize(raw)).toBe('यह एक परीक्षण है');
  });
});
