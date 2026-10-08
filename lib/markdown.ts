import { Spec } from './schema';

function escapeTableData(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, '<br/>');
}

export function toMarkdown(spec: Spec): string {
  let md = `# ${spec.title}\n\n`;
  if (spec.summary) md += `## Summary\n\n${spec.summary}\n\n`;
  if (spec.problem) md += `## Problem\n\n${spec.problem}\n\n`;

  const footnotes: string[] = [];
  const processEvidence = (
    itemId: string,
    evidence: { sentenceIndex: number; quote: string }[],
  ) => {
    let refs = '';
    evidence.forEach((ev, index) => {
      const footnoteLabel = `${itemId}-${String(index + 1)}`;
      refs += `[^${footnoteLabel}]`;
      footnotes.push(`[^${footnoteLabel}]: "${ev.quote}" (sentence ${String(ev.sentenceIndex)})`);
    });
    return refs;
  };

  if (spec.userStories.length > 0) {
    md += `## User Stories\n\n`;
    spec.userStories.forEach((us) => {
      md += `- **${us.id}**: As a ${us.persona}, I want ${us.want} so that ${us.soThat}${processEvidence(us.id, us.evidence)}\n`;
    });
    md += `\n`;
  }

  if (spec.requirements.length > 0) {
    md += `## Requirements\n\n`;
    spec.requirements.forEach((req) => {
      md += `- **${req.id}** [${req.priority}]: ${req.text}${processEvidence(req.id, req.evidence)}\n`;
    });
    md += `\n`;
  }

  if (spec.acceptanceCriteria.length > 0) {
    md += `## Acceptance Criteria\n\n`;
    spec.acceptanceCriteria.forEach((ac) => {
      md += `- **${ac.id}** (for ${ac.requirementId}): Given ${ac.given}, when ${ac.when}, then ${ac.then}\n`;
    });
    md += `\n`;
  }

  if (spec.risks.length > 0) {
    md += `## Risks\n\n`;
    spec.risks.forEach((risk) => {
      md += `- **${risk.id}** [Severity: ${risk.severity}]: ${risk.text}${processEvidence(risk.id, risk.evidence)}\n`;
    });
    md += `\n`;
  }

  if (spec.openQuestions.length > 0) {
    md += `## Open Questions\n\n`;
    spec.openQuestions.forEach((oq) => {
      md += `- **${oq.id}**: ${oq.question} (Reason: ${oq.reason})${processEvidence(oq.id, oq.evidence)}\n`;
    });
    md += `\n`;
  }

  if (spec.tasks.length > 0) {
    md += `## Tasks\n\n`;
    md += `| ID | Title | Priority | Size | Depends On | Requirements |\n`;
    md += `|---|---|---|---|---|---|\n`;
    spec.tasks.forEach((task) => {
      md += `| ${task.id}${processEvidence(task.id, task.evidence)} | ${escapeTableData(task.title)} | ${task.priority} | ${task.size} | ${task.dependsOn.join(', ')} | ${task.requirementIds.join(', ')} |\n`;
    });
    md += `\n`;
  }

  if (footnotes.length > 0) {
    md += `## References\n\n`;
    md += footnotes.join('\n') + '\n';
  }

  return md;
}
