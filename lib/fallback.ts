import { Spec, Evidence } from './schema';

export type FallbackReason =
  'timeout' | 'schema' | 'auth' | 'rate-limit' | 'quota' | 'unknown' | 'no-key';

/**
 * Deterministic fallback to classify sentences by cue words if generation fails.
 * Reason code is appended to warnings without any transcript text.
 */
export function fallbackSpec(
  sentences: string[],
  reason: FallbackReason,
): { spec: Spec; warnings: string[] } {
  const firstMeaningful = sentences.find((s) => s.trim().length > 0);
  let title = firstMeaningful ? firstMeaningful.trim() : 'Demo Spec';
  if (title.length >= 70) {
    title = title.substring(0, 67) + '...';
  }

  const spec: Spec = {
    title,
    summary:
      'Auto-generated product specification extracted directly from the dictated transcript.',
    problem: 'A structured requirement definition is needed based on the stakeholder discussion.',
    userStories: [],
    requirements: [],
    acceptanceCriteria: [],
    risks: [],
    openQuestions: [],
    tasks: [],
  };

  const warnings = [reason];

  sentences.forEach((sentence, index) => {
    const s = sentence.toLowerCase();
    const evidence: Evidence[] = [{ sentenceIndex: index, quote: sentence.slice(0, 240) }];

    // Determine priority
    const priority =
      s.includes('critical') || s.includes('must')
        ? 'P0'
        : s.includes('nice to have') || s.includes('later')
          ? 'P2'
          : 'P1';

    if (s.includes('as a') && s.includes('i want') && s.includes('so that')) {
      const match = sentence.match(/as a (.*?) i want (.*?) so that (.*)/i);
      spec.userStories.push({
        id: `US-${String(spec.userStories.length + 1).padStart(3, '0')}`,
        persona: match?.[1] || 'User',
        want: match?.[2] || sentence,
        soThat: match?.[3] || 'goal is achieved',
        evidence,
      });
    } else if (s.match(/\b(should|must|need|want)\b/)) {
      spec.requirements.push({
        id: `FR-${String(spec.requirements.length + 1).padStart(3, '0')}`,
        text: sentence,
        priority,
        evidence,
      });
    } else if (s.match(/\b(risk|worry|concern|might break)\b/)) {
      const severity = s.includes('critical') ? 'high' : s.includes('minor') ? 'low' : 'medium';
      spec.risks.push({
        id: `RK-${String(spec.risks.length + 1).padStart(3, '0')}`,
        text: sentence,
        severity,
        evidence,
      });
    } else if (s.includes('?') || s.match(/\b(not sure|maybe|figure out)\b/)) {
      spec.openQuestions.push({
        id: `OQ-${String(spec.openQuestions.length + 1).padStart(3, '0')}`,
        question: sentence,
        reason: 'Flagged as uncertain in dictation',
        evidence,
      });
    }
  });

  return { spec, warnings };
}
