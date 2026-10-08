import { Spec } from './schema';

export interface EvidenceIndex {
  itemToSentences: Map<string, Set<number>>;
  sentenceToItems: Map<number, Set<string>>;
}

export function buildEvidenceIndex(spec: Spec): EvidenceIndex {
  const itemToSentences = new Map<string, Set<number>>();
  const sentenceToItems = new Map<number, Set<string>>();

  const processItems = (items: { id: string; evidence: { sentenceIndex: number }[] }[]) => {
    for (const item of items) {
      if (!itemToSentences.has(item.id)) {
        itemToSentences.set(item.id, new Set());
      }
      const itemSet = itemToSentences.get(item.id);
      if (!itemSet) continue;

      for (const ev of item.evidence) {
        itemSet.add(ev.sentenceIndex);

        if (!sentenceToItems.has(ev.sentenceIndex)) {
          sentenceToItems.set(ev.sentenceIndex, new Set());
        }
        const sItems = sentenceToItems.get(ev.sentenceIndex);
        if (sItems) sItems.add(item.id);
      }
    }
  };

  processItems(spec.userStories);
  processItems(spec.requirements);
  processItems(spec.risks);
  processItems(spec.openQuestions);
  processItems(spec.tasks);

  // Acceptance criteria highlight through linked requirement
  for (const ac of spec.acceptanceCriteria) {
    if (itemToSentences.has(ac.requirementId)) {
      const reqSentences = itemToSentences.get(ac.requirementId);
      if (reqSentences) {
        itemToSentences.set(ac.id, reqSentences);
        for (const sIndex of reqSentences) {
          if (sentenceToItems.has(sIndex)) {
            const sItems = sentenceToItems.get(sIndex);
            if (sItems) sItems.add(ac.id);
          }
        }
      }
    } else {
      itemToSentences.set(ac.id, new Set());
    }
  }

  return { itemToSentences, sentenceToItems };
}

/**
 * Pure function to determine highlight priority.
 * Hover or focus wins temporarily, then the pinned item applies, otherwise nothing.
 */
export function getHighlightPriority(
  hoverItemId: string | null,
  focusItemId: string | null,
  pinnedItemId: string | null,
): string | null {
  if (hoverItemId) return hoverItemId;
  if (focusItemId) return focusItemId;
  if (pinnedItemId) return pinnedItemId;
  return null;
}
