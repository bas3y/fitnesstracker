const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u;
/** Bausteine zusammengesetzter Emojis (Hauttöne, Verbinder, Varianten, Flaggen-Tags, Tastenkappen) */
const EMOJI_PARTS =
  /\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|‍|️|⃣|[\u{E0020}-\u{E007F}]|[#*0-9]/gu;

/** Sichtbare Zeichen (Graphem-Cluster); ohne `Intl.Segmenter` grob nach Codepunkten */
export function graphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('de', { granularity: 'grapheme' });
    return [...segmenter.segment(text)].map((part) => part.segment);
  }
  return Array.from(text);
}

/** Genau ein Emoji, auch zusammengesetzt (z. B. 👩‍💻, 🇩🇪, 👍🏽) */
export function isSingleEmoji(text: string): boolean {
  const value = text.trim();
  if (!value || !EMOJI.test(value)) return false;
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) return graphemes(value).length === 1;
  // Ältere Browser: nur Emoji-Bausteine und kurz genug für ein Zeichen
  return value.replace(EMOJI_PARTS, '') === '' && Array.from(value).length <= 10;
}

/** Eingabe im Feld „Eigenes Emoji“; `null` = kein einzelnes Emoji */
export function parseEmoji(text: string): string | null {
  const value = text.trim();
  return isSingleEmoji(value) ? value : null;
}
