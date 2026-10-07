import { Spec, Evidence } from './schema';

function calculateOverlap(quote: string, originalSentence: string): number {
  const quoteTokens = quote
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 0);
  const originalTokens = originalSentence
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 0);

  if (quoteTokens.length < 3) return 0; // Minimum 3 tokens required

  let matchCount = 0;
  // A simple greedy token match for demonstration
  for (const token of quoteTokens) {
    if (originalTokens.includes(token)) {
      matchCount++;
    }
  }

  return matchCount / quoteTokens.length;
}

/**
 * Validates evidence against the ground-truth sentences.
 * Mutates the spec to remove invalid evidence and items with no evidence.
 * Returns the counts of verified and dropped evidence.
 */
export function verifyProvenance(
  spec: Spec,
  sentences: string[],
): { verified: number; dropped: number } {
  let verified = 0;
  let dropped = 0;

  const verifyEvidenceList = (evidenceList: Evidence[]) => {
    return evidenceList.filter((e) => {
      const original = sentences[e.sentenceIndex];
      if (!original) {
        dropped++;
        return false;
      }

      const quoteTokens = e.quote
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 0);
      if (quoteTokens.length < 3) {
        dropped++;
        return false;
      }

      // Exact substring match
      if (original.includes(e.quote)) {
        verified++;
        return true;
      }

      // Token overlap fallback
      const overlap = calculateOverlap(e.quote, original);
      if (overlap >= 0.6) {
        verified++;
        return true;
      }

      dropped++;
      return false;
    });
  };

  // Helper to process arrays of items with evidence
  const processItems = <T extends { evidence: Evidence[] }>(items: T[]) => {
    return items.filter((item) => {
      item.evidence = verifyEvidenceList(item.evidence);
      return item.evidence.length > 0;
    });
  };

  spec.userStories = processItems(spec.userStories);
  spec.requirements = processItems(spec.requirements);
  spec.risks = processItems(spec.risks);
  spec.openQuestions = processItems(spec.openQuestions);
  spec.tasks = processItems(spec.tasks);

  return { verified, dropped };
}
