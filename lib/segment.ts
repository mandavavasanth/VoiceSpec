/**
 * Segments a transcript into a stable string array of sentences.
 * This indexed list is the ground truth for evidence provenance.
 */
export function segment(text: string): string[] {
  if (!text.trim()) return [];

  // Match abbreviations we don't want to split on.
  const abbrRegex = /\b(Mr|Mrs|Ms|Dr|Prof|Rev|Capt|St|Inc|Ltd|Jr|Sr|vs|etc)\.\s*$/i;

  const sentences: string[] = [];
  let currentSentence = '';

  // Split on punctuation (. ! ? । ॥) followed by space or end of string.
  const regex = /([^.?!।॥]+[.?!।॥]+(?=\s|$))/g;
  const matches = text.match(regex);

  if (!matches) {
    return [text.trim()];
  }

  for (let i = 0; i < matches.length; i++) {
    const part = matches[i] || '';
    currentSentence += part;
    if (abbrRegex.test(currentSentence) && i < matches.length - 1) {
      // It's an abbreviation, keep accumulating
      currentSentence += ' ';
    } else {
      sentences.push(currentSentence.trim());
      currentSentence = '';
    }
  }

  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }

  return sentences.filter((s) => s.length > 0);
}
