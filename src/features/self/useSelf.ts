import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { getJournalEntry, listJournalEntries, listJournalPrompts } from '../../db/journal';
import { listProgressPhotos, loadPhotoFile, loadProgressPhoto } from '../../db/photos';
import { listTimerSessions } from '../../db/timer';
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

export function useTimerSessions() {
  return useLiveQuery(listTimerSessions, []);
}

/** Nur Metadaten, ohne Bilddaten */
export function useProgressPhotos() {
  return useLiveQuery(listProgressPhotos, []);
}

/** `undefined` = lädt, `null` = nicht gefunden */
export function useProgressPhoto(id: string | null) {
  return useLiveQuery(() => (id ? loadProgressPhoto(id) : null), [id]);
}

/**
 * Objekt-URL für Bild bzw. Vorschau; `undefined` = lädt, `null` = keine Bilddaten.
 * Die URL wird beim Wechsel/Verlassen wieder freigegeben.
 */
export function usePhotoUrl(
  id: string | null,
  variant: 'full' | 'thumb',
): string | null | undefined {
  const [result, setResult] = useState<{ key: string; url: string | null }>();
  const key = `${id}:${variant}`;
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let url: string | null = null;
    void loadPhotoFile(id, variant).then((file) => {
      if (cancelled) return;
      url = file ? URL.createObjectURL(new Blob([file.data], { type: file.mimeType })) : null;
      setResult({ key, url });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, variant, key]);
  if (!id) return null;
  return result?.key === key ? result.url : undefined;
}
