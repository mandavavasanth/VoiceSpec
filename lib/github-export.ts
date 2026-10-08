import { Spec, Task } from './schema';

export interface GitHubIssue {
  title: string;
  labels: string[];
  body: string;
}

function escapeSingleQuotes(text: string): string {
  return text.replace(/'/g, "'\\''");
}

function generateDelimiter(body: string, prefix: string): string {
  let counter = 0;
  let delimiter = `${prefix}_${String(counter)}`;
  while (body.includes(delimiter)) {
    counter++;
    delimiter = `${prefix}_${String(counter)}`;
  }
  return delimiter;
}

export function toIssueBody(task: Task, spec: Spec): string {
  let body = `**Priority**: ${task.priority}\n**Size**: ${task.size}\n\n`;
  if (task.dependsOn.length > 0) {
    body += `**Depends on**: ${task.dependsOn.join(', ')}\n\n`;
  }
  body += `### Description\n${task.description}\n\n`;

  const relatedReqs = spec.requirements.filter((r) => task.requirementIds.includes(r.id));
  if (relatedReqs.length > 0) {
    body += `### Related Requirements\n\n`;
    for (const req of relatedReqs) {
      body += `- **${req.id}**: ${req.text}\n`;
      const acs = spec.acceptanceCriteria.filter((ac) => ac.requirementId === req.id);
      if (acs.length > 0) {
        for (const ac of acs) {
          body += `  - *AC (${ac.id})*: Given ${ac.given}, when ${ac.when}, then ${ac.then}\n`;
        }
      }
      const firstEv = req.evidence[0];
      if (firstEv) {
        body += `  - *Source*: "${firstEv.quote}"\n`;
      }
    }
  }

  // Ensure LF endings and no trailing spaces on empty lines, standard trailing newline
  return body.replace(/\r\n/g, '\n').trim() + '\n';
}

export function toIssues(spec: Spec): GitHubIssue[] {
  return spec.tasks.map((task) => ({
    title: task.title,
    labels: ['whispflow-generated', task.size, task.priority],
    body: toIssueBody(task, spec),
  }));
}

export function toGhScript(issues: GitHubIssue[]): string {
  let script = `#!/usr/bin/env bash\nset -euo pipefail\n\n`;
  script += `if ! command -v gh &> /dev/null; then\n  echo "gh cli not found"\n  exit 1\nfi\n\n`;

  // Collect unique labels
  const allLabels = new Set<string>();
  issues.forEach((i) => {
    i.labels.forEach((l) => {
      allLabels.add(l);
    });
  });

  if (allLabels.size > 0) {
    script += `# Create labels if they don't exist\n`;
    for (const label of Array.from(allLabels).sort()) {
      script += `gh label create '${escapeSingleQuotes(label)}' --force || true\n`;
    }
    script += `\n`;
  }

  script += `# Create issues\n`;
  issues.forEach((issue) => {
    const titleEscaped = escapeSingleQuotes(issue.title);
    const labelsEscaped = issue.labels.map((l) => `'${escapeSingleQuotes(l)}'`).join(',');
    const labelsArg = labelsEscaped ? `--label ${labelsEscaped}` : '';
    const delimiter = generateDelimiter(issue.body, 'EOF_BODY');

    // Strip control characters except newline and tab
    const cleanBody = issue.body.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    script += `gh issue create --title '${titleEscaped}' ${labelsArg} --body-file - <<'${delimiter}'\n`;
    script += `${cleanBody}${delimiter}\n\n`;
  });

  return script;
}
