/**
 * Segments a transcript into a stable string array of sentences.
 * This indexed list is the ground truth for evidence provenance.
 */
export function segment(text: string): string[] {
  if (!text.trim()) return [];

  // Match sentences based on punctuation (. ! ?) followed by whitespace or end of string.
  // Uses positive lookbehind for punctuation to keep it attached to the sentence.
  // Note: JavaScript regex doesn't support arbitrary length lookbehinds, so we use a simpler split strategy.

  // Split on punctuation followed by space and capital letter, or end of string.
  // We use a capture group to keep the punctuation.
  const regex = /([^.?!]+[.?!]+(?=\s|$))/g;
  const matches = text.match(regex);

  if (!matches) {
    // If no punctuation found, treat the whole text as one sentence.
    return [text.trim()];
  }

  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
}
