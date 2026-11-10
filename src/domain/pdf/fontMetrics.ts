/**
 * Zeichenbreiten der PDF-Standardschriften Helvetica und Helvetica-Bold (1/1000 em, aus den
 * Adobe-AFM-Dateien) und Umwandlung in WinAnsi. Jeder PDF-Betrachter bringt diese Schriften mit,
 * deshalb muss keine Schrift eingebettet werden.
 */

// Zeichen 32–126
const REGULAR_ASCII = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667,
  611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

const BOLD_ASCII = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667,
  611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556,
  278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

/** Unicode → WinAnsi-Byte für Zeichen außerhalb von Latin-1 */
const WIN_ANSI_EXTRA: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  '„': 0x84,
  '…': 0x85,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
};

/** Häufige Zeichen ohne WinAnsi-Gegenstück */
const REPLACEMENTS: Record<string, string> = {
  '−': '-',
  ' ': ' ',
  ' ': ' ',
  ' ': ' ',
  '→': '->',
  '←': '<-',
  '≥': '>=',
  '≤': '<=',
  '≈': '~',
};

/** Breiten (regular, bold) für Sonderzeichen ab 0x80 */
const HIGH_WIDTHS: Record<number, [number, number]> = {
  0x80: [556, 556],
  0x82: [222, 278],
  0x84: [333, 500],
  0x85: [1000, 1000],
  0x91: [222, 278],
  0x92: [222, 278],
  0x93: [333, 500],
  0x94: [333, 500],
  0x95: [350, 350],
  0x96: [556, 556],
  0x97: [1000, 1000],
  0xa0: [278, 278],
  0xa9: [737, 737],
  0xab: [556, 556],
  0xb0: [400, 400],
  0xb1: [584, 584],
  0xb2: [333, 333],
  0xb3: [333, 333],
  0xb7: [278, 278],
  0xbb: [556, 556],
  0xbd: [834, 834],
  0xc6: [1000, 1000],
  0xd7: [584, 584],
  0xd8: [778, 778],
  0xdf: [611, 611],
  0xe6: [889, 889],
  0xf7: [584, 584],
  0xf8: [611, 611],
};

const FALLBACK_WIDTH = 556;

const WIN_ANSI_BYTES = new Set(Object.values(WIN_ANSI_EXTRA));

/**
 * Text als WinAnsi-Zeichenkette (jedes Zeichen < 256 = ein Byte im PDF).
 * Nicht darstellbare Zeichen werden zu „?“, Steuerzeichen zu Leerzeichen.
 * Schon umgewandelter Text bleibt gleich.
 */
export function toWinAnsi(text: string): string {
  let result = '';
  for (const char of text) {
    const replaced = REPLACEMENTS[char] ?? char;
    if (replaced !== char) {
      result += replaced;
      continue;
    }
    const code = char.codePointAt(0)!;
    if (WIN_ANSI_BYTES.has(code)) result += char;
    else if (code < 32 || (code >= 0x7f && code < 0xa0)) result += ' ';
    else if (code < 256) result += char;
    else if (WIN_ANSI_EXTRA[char] !== undefined)
      result += String.fromCharCode(WIN_ANSI_EXTRA[char]);
    else result += '?';
  }
  return result;
}

function charWidth(code: number, bold: boolean): number {
  if (code >= 32 && code <= 126) return (bold ? BOLD_ASCII : REGULAR_ASCII)[code - 32]!;
  const high = HIGH_WIDTHS[code];
  if (high) return high[bold ? 1 : 0];
  if (code >= 0xc0) {
    // Buchstaben mit Akzent sind so breit wie ihr Grundbuchstabe
    const base = String.fromCharCode(code).normalize('NFD').charCodeAt(0);
    if (base >= 32 && base <= 126) return (bold ? BOLD_ASCII : REGULAR_ASCII)[base - 32]!;
  }
  return FALLBACK_WIDTH;
}

/** Breite in Punkt; `text` muss schon WinAnsi sein (`toWinAnsi`) */
export function winAnsiWidth(text: string, size: number, bold = false): number {
  let total = 0;
  for (let index = 0; index < text.length; index++) {
    total += charWidth(text.charCodeAt(index), bold);
  }
  return (total * size) / 1000;
}

/** Breite eines beliebigen Textes in Punkt */
export function textWidth(text: string, size: number, bold = false): number {
  return winAnsiWidth(toWinAnsi(text), size, bold);
}
