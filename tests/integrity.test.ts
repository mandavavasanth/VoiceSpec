import { describe, it, expect } from 'vitest';
import { checkIntegrity } from '@/lib/integrity';
import { Spec } from '@/lib/schema';
import mockSpec from '@/fixtures/mock-spec.json';

describe('checkIntegrity', () => {
  it('remaps references when IDs are renumbered', () => {
    // Create a spec with non-sequential IDs and references
    const spec = JSON.parse(JSON.stringify(mockSpec)) as unknown as Spec;

    spec.requirements = [
      { id: 'FR-999', text: 'Req 1', priority: 'P0', evidence: [] },
      { id: 'FR-998', text: 'Req 2', priority: 'P1', evidence: [] },
    ];

    spec.acceptanceCriteria = [
      { id: 'AC-111', requirementId: 'FR-999', given: 'g', when: 'w', then: 't' },
    ];

    spec.tasks = [
      {
        id: 'T-001',
        title: 'Task 1',
        description: 'desc',
        priority: 'P0',
        size: 'M',
        requirementIds: ['FR-998'],
        dependsOn: [],
        evidence: [],
      },
      {
        id: 'T-002',
        title: 'Task 2',
        description: 'desc',
        priority: 'P0',
        size: 'M',
        requirementIds: [],
        dependsOn: ['T-001'],
        evidence: [],
      },
    ];

    const warnings: string[] = [];
    const result = checkIntegrity(spec, warnings);

    // FR-999 -> FR-001, FR-998 -> FR-002
    expect(result.requirements[0]?.id).toBe('FR-001');
    expect(result.requirements[1]?.id).toBe('FR-002');

    // Check if AC requirementId remapped
    expect(result.acceptanceCriteria[0]?.requirementId).toBe('FR-001');

    // Check if Task requirementIds remapped
    expect(result.tasks[0]?.requirementIds).toContain('FR-002');

    // Warnings should indicate renumbering
    expect(warnings.some((w) => w.includes('Renumbered'))).toBe(true);
  });

  it('removes dangling references', () => {
    const spec = JSON.parse(JSON.stringify(mockSpec)) as unknown as Spec;
    spec.tasks = [
      {
        id: 'T-001',
        title: 'Task 1',
        description: 'desc',
        priority: 'P0',
        size: 'M',
        requirementIds: ['FR-nonexistent'],
        dependsOn: ['T-nonexistent'],
        evidence: [],
      },
    ];

    const warnings: string[] = [];
    const result = checkIntegrity(spec, warnings);

    expect(result.tasks[0]?.requirementIds).toHaveLength(0);
    expect(result.tasks[0]?.dependsOn).toHaveLength(0);
    expect(warnings.some((w) => w.includes('Removed dangling'))).toBe(true);
  });

  it('detects and removes cyclic dependencies', () => {
    const spec = JSON.parse(JSON.stringify(mockSpec)) as unknown as Spec;
    spec.tasks = [
      {
        id: 'T-001',
        title: '1',
        description: '',
        priority: 'P0',
        size: 'S',
        requirementIds: [],
        dependsOn: ['T-002'],
        evidence: [],
      },
      {
        id: 'T-002',
        title: '2',
        description: '',
        priority: 'P0',
        size: 'S',
        requirementIds: [],
        dependsOn: ['T-001'],
        evidence: [],
      },
    ];

    const warnings: string[] = [];
    const result = checkIntegrity(spec, warnings);

    // One of the dependencies should be removed to break cycle
    const cycleBroken =
      result.tasks[0]?.dependsOn.length === 0 || result.tasks[1]?.dependsOn.length === 0;
    expect(cycleBroken).toBe(true);
    expect(warnings.some((w) => w.includes('Removed cyclic dependency'))).toBe(true);
  });
});
