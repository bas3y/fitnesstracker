import { compactJournal, isJournalEmpty, journalDate } from '../domain/journal';
import { db } from './database';
import { create, listActive, nowIso, softDelete, update } from './repository';
import {
  dayKeySchema,
  journalPromptTextSchema,
  journalValuesSchema,
  MAX_JOURNAL_PROMPTS,
  type JournalValues,
} from './schemas';
import type { DayKey, JournalEntry, JournalKind, JournalPrompt } from './types';

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;

/** Eintrag des Tages bzw. der Woche, in der `day` liegt */
export function getJournalEntry(kind: JournalKind, day: DayKey): Promise<JournalEntry | undefined> {
  return db.journalEntries
    .where('[kind+date]')
    .equals([kind, journalDate(kind, day)])
    .filter(isActive)
    .first();
}

export function listJournalEntries(): Promise<JournalEntry[]> {
  return listActive(db.journalEntries);
}

/**
 * Speichert den ganzen Inhalt eines Tages bzw. einer Woche; ein leerer Eintrag wird gelöscht.
 * Leere Antworten fallen weg.
 */
export async function saveJournalEntry(
  kind: JournalKind,
  day: DayKey,
  values: JournalValues,
): Promise<void> {
  const date = journalDate(kind, dayKeySchema.parse(day));
  const parsed = compactJournal(journalValuesSchema.parse(values));
  const content: JournalValues = {
    ...parsed,
    gratitude: kind === 'day' ? parsed.gratitude : [],
    rating: kind === 'week' ? parsed.rating : null,
  };
  await db.transaction('rw', db.journalEntries, async () => {
    const existing = await getJournalEntry(kind, date);
    if (isJournalEmpty(content)) {
      if (existing) await softDelete(db.journalEntries, existing.id);
    } else if (existing) {
      await update(db.journalEntries, existing.id, content);
    } else {
      await create<JournalEntry>(db.journalEntries, { ...content, kind, date });
    }
  });
}

// ---------- Eigene Fragen ----------

/** Alle, auch entfernte (für alte Antworten) */
export function listJournalPrompts(): Promise<JournalPrompt[]> {
  return listActive(db.journalPrompts);
}

export async function addJournalPrompt(kind: JournalKind, text: string): Promise<JournalPrompt> {
  const value = journalPromptTextSchema.parse(text);
  return db.transaction('rw', db.journalPrompts, async () => {
    const prompts = (await listActive(db.journalPrompts)).filter(
      (prompt) => prompt.kind === kind && prompt.archivedAt === null,
    );
    if (prompts.length >= MAX_JOURNAL_PROMPTS) {
      throw new Error(`Höchstens ${MAX_JOURNAL_PROMPTS} eigene Fragen`);
    }
    const order = Math.max(-1, ...prompts.map((prompt) => prompt.order)) + 1;
    return create<JournalPrompt>(db.journalPrompts, {
      kind,
      text: value,
      order,
      archivedAt: null,
    });
  });
}

export async function renameJournalPrompt(id: string, text: string): Promise<void> {
  await update(db.journalPrompts, id, { text: journalPromptTextSchema.parse(text) });
}

/** Wird nicht mehr gefragt; bisherige Antworten bleiben bei ihren Einträgen sichtbar */
export async function removeJournalPrompt(id: string): Promise<void> {
  await update(db.journalPrompts, id, { archivedAt: nowIso() });
}

export function reorderJournalPrompts(ids: string[]): Promise<void> {
  return db.transaction('rw', db.journalPrompts, async () => {
    for (const [order, id] of ids.entries()) await update(db.journalPrompts, id, { order });
  });
}
