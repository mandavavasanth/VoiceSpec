export function isDictationBurst(previousText: string, nextText: string): boolean {
  if (typeof previousText !== 'string' || typeof nextText !== 'string') return false;
  return nextText.length - previousText.length > 40;
}
