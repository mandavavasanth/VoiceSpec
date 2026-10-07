import { describe, it, expect } from 'vitest';
import { SpecSchema } from '@/lib/schema';
import mockSpec from '@/fixtures/mock-spec.json';

describe('Schema validation', () => {
  it('should successfully parse a valid spec', () => {
    const result = SpecSchema.safeParse(mockSpec);
    expect(result.success).toBe(true);
  });

  it('should reject invalid data', () => {
    const invalidData = { ...mockSpec, title: 123 };
    const result = SpecSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
