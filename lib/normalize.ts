/**
 * Normalizes a raw transcript by stripping filler words, false starts, and immediate repetitions.
 * Keeps meaning intact.
 */
export function normalize(raw: string): string {
  let cleaned = raw.trim();

  // Remove common filler words
  const fillers = /\b(um|uh|you know|like|I mean)\b/gi;
  cleaned = cleaned.replace(fillers, '');

  // Remove immediate repetitions (e.g., "the the", "we we")
  const repetitions = /\b(\w+)\s+\1\b/gi;
  cleaned = cleaned.replace(repetitions, '$1');

  // Clean up extra whitespace left behind
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // Basic false start cleanup (e.g., sentences that start then restart)
  // This is a naive regex approach for demo purposes; a real LLM handles this better.
  cleaned = cleaned.replace(/([A-Z][^.?!]*?)\s-\s([A-Z])/g, '$2');

  return cleaned.trim();
}
