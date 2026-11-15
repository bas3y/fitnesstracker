/**
 * Reine Hilfen für Animationen (seit 22d): Zahlen weich zählen, wegrutschende Listenzeilen,
 * Länge einer Satzpause. Ob überhaupt animiert wird, entscheidet `motionAllowed()`
 * (`src/components/motion.ts`).
 */

/** Dauer des Hochzählens */
export const COUNT_UP_MS = 400;
/** So lange gleitet eine abgehakte Zeile aus der offenen Liste */
export const LEAVE_MS = 340;

export function easeOutCubic(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return 1 - (1 - p) ** 3;
}

// Deutsche Zahlen: 1.234,5 (Tausenderpunkt nur in 3er-Gruppen) oder 12,5 / 12
const NUMBER = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;

interface NumberToken {
  value: number;
  decimals: number;
  grouped: boolean;
}

function splitNumbers(text: string): { literals: string[]; numbers: NumberToken[] } {
  const numbers = (text.match(NUMBER) ?? []).map((token) => {
    const [whole = '', fraction = ''] = token.split(',');
    return {
      value: Number(`${whole.replaceAll('.', '')}.${fraction || '0'}`),
      decimals: fraction.length,
      grouped: whole.includes('.'),
    };
  });
  return { literals: text.split(NUMBER), numbers };
}

/**
 * Zwischenstand beim Hochzählen eines angezeigten Werts, z. B. „1,25 l“ → „1,50 l“. Nur Texte
 * gleicher Form (gleicher Text um die Zahlen) werden gezählt, sonst gilt sofort der neue Text.
 */
function sameShape(a: ReturnType<typeof splitNumbers>, b: ReturnType<typeof splitNumbers>) {
  return (
    a.numbers.length > 0 &&
    a.numbers.length === b.numbers.length &&
    a.literals.join('\u0000') === b.literals.join('\u0000')
  );
}

export function tweenNumberText(from: string, to: string, progress: number): string {
  if (progress >= 1 || from === to) return to;
  const a = splitNumbers(from);
  const b = splitNumbers(to);
  if (!sameShape(a, b)) return to;
  const p = Math.max(0, progress);
  return b.literals
    .map((literal, index) => {
      const target = b.numbers[index];
      if (!target) return literal;
      const start = a.numbers[index]!;
      const value = start.value + (target.value - start.value) * p;
      return (
        literal +
        value.toLocaleString('de-DE', {
          minimumFractionDigits: target.decimals,
          maximumFractionDigits: target.decimals,
          useGrouping: start.grouped || target.grouped,
        })
      );
    })
    .join('');
}

/** Ob sich der Text hochzählen lässt (sonst springt er sofort) */
export function canTweenNumberText(from: string, to: string): boolean {
  return from !== to && sameShape(splitNumbers(from), splitNumbers(to));
}

/**
 * Zeilen, die gerade aus der offenen Liste gleiten: was eben noch offen war und es nicht mehr ist,
 * dazu die schon gleitenden – außer sie sind wieder offen
 */
export function nextLeavingIds(
  previousOpen: readonly string[],
  open: readonly string[],
  leaving: ReadonlySet<string>,
): Set<string> {
  const stillOpen = new Set(open);
  const next = new Set([...leaving].filter((id) => !stillOpen.has(id)));
  for (const id of previousOpen) if (!stillOpen.has(id)) next.add(id);
  return next;
}

/** Laufende Satzpause: Ende und Gesamtlänge in Sekunden (für die ablaufende Linie) */
export interface RestSpan {
  endsAt: string;
  totalSeconds: number;
}

/**
 * Gesamtlänge der Pause, wenn sich ihr Ende ändert: neue Pause (vorige vorbei oder keine) = Rest
 * ab jetzt; ±15 s an einer laufenden Pause verlängern bzw. verkürzen die bisherige Länge
 */
export function nextRestSpan(
  previous: RestSpan | null,
  endsAt: string | null,
  nowMs: number,
): RestSpan | null {
  if (endsAt === null) return null;
  if (previous?.endsAt === endsAt) return previous;
  const end = Date.parse(endsAt);
  if (previous === null || Date.parse(previous.endsAt) <= nowMs) {
    return { endsAt, totalSeconds: Math.max(1, (end - nowMs) / 1000) };
  }
  const shift = (end - Date.parse(previous.endsAt)) / 1000;
  return { endsAt, totalSeconds: Math.max(1, previous.totalSeconds + shift) };
}

/** Anteil der Pause, der noch bleibt (1 = gerade begonnen, 0 = vorbei) */
export function restShare(span: RestSpan | null, remainingSeconds: number): number {
  if (!span) return 0;
  return Math.min(1, Math.max(0, remainingSeconds / span.totalSeconds));
}
