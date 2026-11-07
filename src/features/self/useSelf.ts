import { useLiveQuery } from 'dexie-react-hooks';
import { getJournalEntry, listJournalEntries, listJournalPrompts } from '../../db/journal';
import {
  listBookLogs,
  listBookNotes,
  listBooks,
  listReadingLogs,
  loadBook,
} from '../../db/reading';
import type { DayKey, JournalKind } from '../../db/types';
import { journalDate } from '../../domain/journal';

/**
 * `undefined` = lädt, `null` = noch kein Eintrag. Nach einem Wechsel des Tages liefert
 * `useLiveQuery` kurz noch das alte Ergebnis – das gilt hier als „lädt“, damit der Editor nicht
 * mit dem Text des vorigen Tages startet.
 */
export function useJournalEntry(kind: JournalKind, day: DayKey) {
  const key = journalDate(kind, day);
  const result = useLiveQuery(
    async () => ({ key, entry: (await getJournalEntry(kind, key)) ?? null }),
    [kind, key],
  );
  return result?.key === key ? result.entry : undefined;
}

export function useJournalEntries() {
  return useLiveQuery(listJournalEntries, []);
}

/** Auch entfernte (für alte Antworten) */
export function useJournalPrompts() {
  return useLiveQuery(listJournalPrompts, []);
}

export function useBooks() {
  return useLiveQuery(listBooks, []);
}

export function useReadingLogs() {
  return useLiveQuery(listReadingLogs, []);
}

/** `undefined` = lädt, `null` = nicht gefunden */
export function useBook(id: string) {
  return useLiveQuery(() => loadBook(id), [id]);
}

export function useBookLogs(id: string) {
  return useLiveQuery(() => listBookLogs(id), [id]);
}

export function useBookNotes(id: string) {
  return useLiveQuery(() => listBookNotes(id), [id]);
}
