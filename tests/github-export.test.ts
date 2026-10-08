import { describe, it, expect } from 'vitest';
import { toIssues, toGhScript, toIssueBody } from '@/lib/github-export';
import { Spec } from '@/lib/schema';
import { execSync } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';

describe('GitHub Export', () => {
  it('generates deterministic script with correct heredoc delimiters and quotes', () => {
    const spec: Spec = {
      title: 'T',
      summary: 'S',
      problem: 'P',
      userStories: [],
      risks: [],
      openQuestions: [],
      requirements: [
        {
          id: 'FR-001',
          text: 'Req 1',
          priority: 'P0',
          evidence: [{ sentenceIndex: 0, quote: 'test' }],
        },
      ],
      acceptanceCriteria: [
        { id: 'AC-001', requirementId: 'FR-001', given: 'g', when: 'w', then: 't' },
      ],
      tasks: [
        {
          id: 'T-001',
          title: "Task's Title",
          description: "Desc with 'quotes'\nand EOF_BODY_0",
          priority: 'P1',
          size: 'L',
          dependsOn: ['T-002'],
          requirementIds: ['FR-001'],
          evidence: [],
        },
      ],
    };

    const issues = toIssues(spec);
    expect(issues).toHaveLength(1);
    const firstTask = spec.tasks[0];
    expect(firstTask).toBeDefined();
    if (!firstTask) return;

    const body = toIssueBody(firstTask, spec);
    expect(body).toContain('**Depends on**: T-002');
    expect(body).toContain('- **FR-001**: Req 1');
    expect(body).toContain('- *AC (AC-001)*: Given g, when w, then t');
    expect(body).toContain('- *Source*: "test"');

    const script = toGhScript(issues);

    // Check title escaping
    expect(script).toContain("gh issue create --title 'Task'\\''s Title'");

    // Check label escaping
    expect(script).toContain("gh label create 'whispflow-generated' --force");

    // Check heredoc delimiter (should be EOF_BODY_1 since EOF_BODY_0 is in description)
    expect(script).toContain("<<'EOF_BODY_1'");
    expect(script).toContain('EOF_BODY_1\n');
  });

  it('generates a valid bash script (bash -n)', () => {
    const isWindows = os.platform() === 'win32';
    const spec: Spec = {
      title: 'T',
      summary: 'S',
      problem: 'P',
      userStories: [],
      risks: [],
      openQuestions: [],
      requirements: [],
      acceptanceCriteria: [],
      tasks: [
        {
          id: 'T-001',
          title: "It's a valid title",
          description: 'Body with $(echo unsafe)',
          priority: 'P1',
          size: 'S',
          dependsOn: [],
          requirementIds: [],
          evidence: [],
        },
      ],
    };

    const script = toGhScript(toIssues(spec));

    if (isWindows) {
      console.warn('Skipping bash syntax check on Windows. Please run on CI/Linux.');
      expect(script).toContain('set -euo pipefail');
    } else {
      const tmpFile = path.join(os.tmpdir(), 'test-script.sh');
      fs.writeFileSync(tmpFile, script);
      try {
        execSync(`bash -n ${tmpFile}`);
        // If it doesn't throw, it passed syntax check
        expect(true).toBe(true);
      } finally {
        fs.unlinkSync(tmpFile);
      }
    }
  });
});
