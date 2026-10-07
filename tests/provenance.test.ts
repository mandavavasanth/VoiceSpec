import { describe, it, expect } from 'vitest';
import { verifyProvenance } from '@/lib/provenance';
import mockSpec from '@/fixtures/mock-spec.json';
import { Spec } from '@/lib/schema';

describe('verifyProvenance', () => {
  const sentences = [
    'Placeholder zero.', // 0
    'As a product manager I want to click a button so that it makes issues.', // 1
    'We must ensure the API is rate limited.', // 2
    "Also I'm a bit concerned about the prompt injection risk", // 3
    'This is an unused sentence.', // 4
    'Wait, is the auth token passed correctly?', // 5
    'Figure out how to handle missing keys.', // 6
    'The data should export in markdown format.', // 7
    'We might break the layout on mobile though.', // 8
  ];

  it('verifies exact matches and calculates counts', () => {
    const spec = JSON.parse(JSON.stringify(mockSpec)) as unknown as Spec;
    const { verified, dropped } = verifyProvenance(spec, sentences);

    expect(verified).toBe(7); // 1 US, 2 Req, 2 Risk, 2 OQ
    expect(dropped).toBe(0);
    // Spec should be intact
    expect(spec.requirements).toHaveLength(2);
  });

  it('drops forged evidence and items with no valid evidence', () => {
    const spec = JSON.parse(JSON.stringify(mockSpec)) as unknown as Spec;
    const req0 = spec.requirements[0];
    if (req0?.evidence[0])
      req0.evidence[0].quote = 'This is completely hallucinated and not in the transcript';

    // Provide a short invalid quote (less than 3 tokens)
    const req1 = spec.requirements[1];
    if (req1?.evidence[0]) req1.evidence[0].quote = 'The data';

    const { dropped } = verifyProvenance(spec, sentences);

    expect(dropped).toBe(2);
    // Both requirements lost all valid evidence, so they should be dropped
    expect(spec.requirements).toHaveLength(0);
  });

  it('accepts >0.6 token overlap for fuzzy matches', () => {
    const spec = JSON.parse(JSON.stringify(mockSpec)) as unknown as Spec;
    const req0 = spec.requirements[0];
    if (req0?.evidence[0]) req0.evidence[0].quote = 'must ensure the API is rate limited';

    const { verified, dropped } = verifyProvenance(spec, sentences);
    expect(verified).toBe(7);
    expect(dropped).toBe(0);
    expect(spec.requirements).toHaveLength(2);
  });
});
