import type { DayKey, JournalEntry, JournalKind, JournalPrompt } from '../db/types';
import { weekRange, type DayRange } from './endurance';
import { inRange } from './periods';
import { normalizeSearchText } from './search';

/** Feste Fragen der Wochenreflexion (Schlüssel = Antwort in `JournalEntry.answers`) */
export const WEEKLY_QUESTIONS = [
  { key: 'wentWell', text: 'Was lief diese Woche gut?' },
  { key: 'change', text: 'Was möchte ich ändern?' },
  { key: 'focus', text: 'Worauf konzentriere ich mich nächste Woche?' },
] as const;

export const GRATITUDE_SLOTS = 3;

type JournalContent = Pick<JournalEntry, 'text' | 'gratitude' | 'answers' | 'rating'>;

const filled = (value: string) => value.trim() !== '';

/** Nichts eingetragen (Leerzeichen zählen nicht) */
export function isJournalEmpty(values: JournalContent): boolean {
  return (
    !filled(values.text) &&
    !values.gratitude.some(filled) &&
    !Object.values(values.answers).some(filled) &&
    values.rating === null
  );
}

/** Tag bzw. Montag der Woche, unter dem ein Eintrag gespeichert wird */
export function journalDate(kind: JournalKind, day: DayKey): DayKey {
  return kind === 'week' ? weekRange(day).from : day;
}

/** Immer drei Felder (für das Formular) */
export function gratitudeSlots(gratitude: readonly string[]): string[] {
  return Array.from({ length: GRATITUDE_SLOTS }, (_, index) => gratitude[index] ?? '');
}

/** Leere Antworten weglassen, Dankbarkeit ohne leere Felder am Ende */
export function compactJournal<T extends JournalContent>(values: T): T {
  const gratitude = [...values.gratitude];
  while (gratitude.length > 0 && !filled(gratitude.at(-1)!)) gratitude.pop();
  const answers = Object.fromEntries(
    Object.entries(values.answers).filter(([, answer]) => filled(answer)),
  );
  return { ...values, gratitude, answers };
}

/** Eigene Fragen in Reihenfolge, ohne entfernte */
export function activePrompts(prompts: readonly JournalPrompt[], kind: JournalKind) {
  return prompts
    .filter((prompt) => prompt.kind === kind && prompt.archivedAt === null)
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

/**
 * Fragen eines Eintrags: aktive in Reihenfolge, dahinter entfernte, die an diesem Tag beantwortet
 * wurden (damit alte Antworten nicht verschwinden)
 */
export function promptsForEntry(
  prompts: readonly JournalPrompt[],
  kind: JournalKind,
  entry: Pick<JournalEntry, 'answers'> | null,
): JournalPrompt[] {
  const answered = (prompt: JournalPrompt) => filled(entry?.answers[prompt.id] ?? '');
  const removed = prompts
    .filter((prompt) => prompt.kind === kind && prompt.archivedAt !== null && answered(prompt))
    .sort((a, b) => a.order - b.order);
  return [...activePrompts(prompts, kind), ...removed];
}

/** Text einer Frage: feste Wochenfrage oder eigene Frage */
export function questionText(
  key: string,
  prompts: ReadonlyMap<string, Pick<JournalPrompt, 'text'>>,
): string | null {
  const fixed = WEEKLY_QUESTIONS.find((question) => question.key === key);
  return fixed?.text ?? prompts.get(key)?.text ?? null;
}

/** Alle Texte eines Eintrags in Lesereihenfolge (für Vorschau und Suche) */
export function journalTexts(
  entry: JournalContent & Pick<JournalEntry, 'kind'>,
  prompts: ReadonlyMap<string, Pick<JournalPrompt, 'text'>>,
): string[] {
  const fixed =
    entry.kind === 'week'
      ? WEEKLY_QUESTIONS.map((question) => entry.answers[question.key] ?? '')
      : [];
  const own = Object.entries(entry.answers)
    .filter(([key]) => !WEEKLY_QUESTIONS.some((question) => question.key === key))
    .filter(([key]) => prompts.has(key))
    .map(([, answer]) => answer);
  return [entry.text, ...entry.gratitude, ...fixed, ...own]
    .filter(filled)
    .map((text) => text.trim());
}

/** Einträge, die alle Suchwörter enthalten (Umlaute/ß egal); neueste zuerst */
export function searchJournal<T extends JournalEntry>(
  entries: readonly T[],
  query: string,
  prompts: ReadonlyMap<string, Pick<JournalPrompt, 'text'>>,
): T[] {
  const words = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  const sorted = [...entries].sort(
    (a, b) => b.date.localeCompare(a.date) || (a.kind === 'week' ? -1 : 1),
  );
  if (words.length === 0) return sorted;
  return sorted.filter((entry) => {
    const text = normalizeSearchText(journalTexts(entry, prompts).join(' '));
    return words.every((word) => text.includes(word));
  });
}

/** Stand eines Tages für die Übersicht */
export function journalDayStatus(entry: JournalContent | null): {
  written: boolean;
  gratitude: number;
} {
  if (!entry) return { written: false, gratitude: 0 };
  return { written: !isJournalEmpty(entry), gratitude: entry.gratitude.filter(filled).length };
}

/** Wochenreflexion: beantwortete Fragen von allen (feste + eigene aktive) */
export function reflectionProgress(
  entry: Pick<JournalEntry, 'answers'> | null,
  prompts: readonly JournalPrompt[],
): { answered: number; total: number } {
  const keys = [
    ...WEEKLY_QUESTIONS.map((question) => question.key),
    ...activePrompts(prompts, 'week').map((prompt) => prompt.id),
  ];
  const answered = keys.filter((key) => filled(entry?.answers[key] ?? '')).length;
  return { answered, total: keys.length };
}

/** Tage mit Journal-Eintrag bzw. Wochen mit Reflexion im Zeitraum */
export function countJournal(
  entries: readonly Pick<JournalEntry, 'kind' | 'date'>[],
  kind: JournalKind,
  range: DayRange,
): number {
  const dates = new Set(
    entries
      .filter((entry) => entry.kind === kind && inRange(entry.date, range))
      .map((entry) => entry.date),
  );
  return dates.size;
}

/** Ø Bewertung der Wochen im Zeitraum; `null` = keine */
export function averageWeekRating(
  entries: readonly Pick<JournalEntry, 'kind' | 'date' | 'rating'>[],
  range: DayRange,
): number | null {
  const ratings = entries
    .filter((entry) => entry.kind === 'week' && inRange(entry.date, range))
    .flatMap((entry) => (entry.rating === null ? [] : [entry.rating]));
  return ratings.length === 0 ? null : ratings.reduce((a, b) => a + b, 0) / ratings.length;
}
