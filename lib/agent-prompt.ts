/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Spec, Task, AcceptanceCriteria } from './schema';

function safe(text: string): string {
  return text.replace(/```/g, '\\`\\`\\`');
}

function getRef(item: { evidence?: { quote: string }[] }): string {
  const ev = item.evidence;
  if (ev && ev.length > 0) {
    const first = ev[0];
    if (first) {
      return ` (Ref: "${safe(first.quote)}")`;
    }
  }
  return '';
}

function sortTasks(tasks: Task[]): Task[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  const taskMap = new Map<string, Task>();

  for (const t of tasks) {
    inDegree.set(t.id, 0);
    adj.set(t.id, []);
    taskMap.set(t.id, t);
  }

  for (const t of tasks) {
    for (const dep of t.dependsOn) {
      if (inDegree.has(dep)) {
        adj.get(dep)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      }
    }
  }

  const compareTasks = (a: string, b: string) => {
    const ta = taskMap.get(a)!;
    const tb = taskMap.get(b)!;
    if (ta.priority !== tb.priority) return ta.priority.localeCompare(tb.priority);
    return ta.id.localeCompare(tb.id);
  };

  const zeroIn = Array.from(inDegree.keys()).filter((id) => inDegree.get(id) === 0);
  zeroIn.sort(compareTasks);

  const sorted: Task[] = [];
  while (zeroIn.length > 0) {
    const curr = zeroIn.shift()!;
    sorted.push(taskMap.get(curr)!);
    for (const next of adj.get(curr)!) {
      const val = inDegree.get(next)! - 1;
      inDegree.set(next, val);
      if (val === 0) {
        zeroIn.push(next);
        zeroIn.sort(compareTasks);
      }
    }
  }

  if (sorted.length < tasks.length) {
    const remaining = tasks.filter((t) => !sorted.find((s) => s.id === t.id));
    remaining.sort((ta, tb) => {
      if (ta.priority !== tb.priority) return ta.priority.localeCompare(tb.priority);
      return ta.id.localeCompare(tb.id);
    });
    sorted.push(...remaining);
  }

  return sorted;
}

export function toAgentPrompt(spec: Spec): string {
  let prompt = 'You are a senior engineer.\n\n';

  prompt += '## Goal\n';
  prompt += `**${safe(spec.title)}**\n`;
  prompt += `${safe(spec.summary)}\n`;
  if (spec.problem) {
    prompt += `${safe(spec.problem)}\n`;
  }
  prompt += '\n';

  if (spec.requirements.length > 0) {
    prompt += '## Requirements\n';

    // Group ACs by requirement ID
    const acsByReq = new Map<string, AcceptanceCriteria[]>();
    for (const ac of spec.acceptanceCriteria) {
      if (!acsByReq.has(ac.requirementId)) {
        acsByReq.set(ac.requirementId, []);
      }
      acsByReq.get(ac.requirementId)!.push(ac);
    }

    const sortedReqs = [...spec.requirements].sort((a, b) => a.id.localeCompare(b.id));
    for (const req of sortedReqs) {
      prompt += `* **${safe(req.id)}** (${safe(req.priority)}): ${safe(req.text)}${getRef(req)}\n`;
      const acs = acsByReq.get(req.id);
      if (acs && acs.length > 0) {
        prompt += '  * Acceptance Criteria:\n';
        const sortedAcs = [...acs].sort((a, b) => a.id.localeCompare(b.id));
        for (const ac of sortedAcs) {
          prompt += `    * **${safe(ac.id)}**: Given ${safe(ac.given)}, when ${safe(ac.when)}, then ${safe(ac.then)}.\n`;
        }
      }
    }
    prompt += '\n';
  }

  if (spec.userStories.length > 0) {
    prompt += '## User Stories\n';
    const sortedUs = [...spec.userStories].sort((a, b) => a.id.localeCompare(b.id));
    for (const us of sortedUs) {
      prompt += `* **${safe(us.id)}**: As a ${safe(us.persona)}, I want ${safe(us.want)} so that ${safe(us.soThat)}.${getRef(us)}\n`;
    }
    prompt += '\n';
  }

  if (spec.risks.length > 0) {
    prompt += '## Risks\n';
    const sortedRisks = [...spec.risks].sort((a, b) => a.id.localeCompare(b.id));
    for (const risk of sortedRisks) {
      prompt += `* **${safe(risk.id)}** (${safe(risk.severity)}): ${safe(risk.text)}${getRef(risk)}\n`;
    }
    prompt += '\n';
  }

  if (spec.openQuestions.length > 0) {
    prompt += '## Open Questions\n';
    const sortedQs = [...spec.openQuestions].sort((a, b) => a.id.localeCompare(b.id));
    for (const q of sortedQs) {
      prompt += `* **${safe(q.id)}**: ${safe(q.question)} (Reason: ${safe(q.reason)})${getRef(q)}\n`;
    }
    prompt += '**IMPORTANT**: You must ask me about these open questions before coding.\n\n';
  }

  if (spec.tasks.length > 0) {
    prompt += '## Tasks\n';
    const orderedTasks = sortTasks(spec.tasks);
    for (let i = 0; i < orderedTasks.length; i++) {
      const t = orderedTasks[i]!;
      prompt += `${String(i + 1)}. **${safe(t.id)}**: ${safe(t.title)}\n`;
      prompt += `   * Priority: ${safe(t.priority)}, Size: ${safe(t.size)}\n`;
      prompt += `   * Description: ${safe(t.description)}\n`;
      if (t.requirementIds.length > 0) {
        prompt += `   * Requirements: ${t.requirementIds.map(safe).join(', ')}\n`;
      }
      if (t.dependsOn.length > 0) {
        prompt += `   * Depends On: ${t.dependsOn.map(safe).join(', ')}\n`;
      }
      const ref = getRef(t);
      if (ref) {
        prompt += `   *${ref}\n`;
      }
    }
    prompt += '\n';
  }

  prompt += '## Instructions\n';
  prompt += '1. Plan first and wait for approval.\n';
  prompt += '2. Work one task at a time.\n';
  prompt += '3. Write tests.\n';
  prompt += '4. Commit after each task.\n';
  prompt += '5. Never log secrets.\n';
  prompt += '6. Stop to report after each task.\n';

  return prompt;
}
