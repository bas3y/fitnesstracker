import { bookProgress, reachesEnd, statusChange } from '../domain/reading';
import { db } from './database';
import { addHabitAmount } from './habits';
import { create, listActive, softDelete, update } from './repository';
import {
  bookInputSchema,
  bookNoteInputSchema,
  dayKeySchema,
  readingPagesSchema,
  type BookInput,
  type BookNoteInput,
} from './schemas';
import { getSettings, updateSettings } from './settings';
import type { Book, BookNote, BookStatus, DayKey, ReadingLog } from './types';

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;

const READING_TABLES = [db.books, db.readingLogs, db.habits, db.habitChecks, db.settings];

export function listBooks(): Promise<Book[]> {
  return listActive(db.books);
}

export async function loadBook(id: string): Promise<Book | null> {
  const book = await db.books.get(id);
  return book && isActive(book) ? book : null;
}

export function listReadingLogs(): Promise<ReadingLog[]> {
  return listActive(db.readingLogs);
}

/** Älteste zuerst */
export async function listBookLogs(bookId: string): Promise<ReadingLog[]> {
  const logs = await db.readingLogs.where('bookId').equals(bookId).filter(isActive).toArray();
  return logs.sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  );
}

export async function createBook(input: BookInput): Promise<Book> {
  return create<Book>(db.books, bookInputSchema.parse(input));
}

export async function updateBook(id: string, input: BookInput): Promise<void> {
  await update(db.books, id, bookInputSchema.parse(input));
}

export async function setBookStatus(id: string, status: BookStatus, day: DayKey): Promise<void> {
  const date = dayKeySchema.parse(day);
  await db.transaction('rw', db.books, async () => {
    const book = await loadBook(id);
    if (!book) throw new Error(`Buch ${id} nicht gefunden`);
    await update(db.books, id, statusChange(book, status, date));
  });
}

export async function setBookRating(id: string, rating: number | null): Promise<void> {
  await update(db.books, id, { rating });
}

/** Zähl-Gewohnheit, bei der Seiten mitgezählt werden; `null` = keine (oder nicht mehr nutzbar) */
async function readingHabitId(): Promise<string | null> {
  const id = (await getSettings())?.readingHabitId ?? null;
  if (!id) return null;
  const habit = await db.habits.get(id);
  return habit && isActive(habit) && habit.kind === 'count' && habit.archivedAt === null
    ? id
    : null;
}

export function setReadingHabit(habitId: string | null): Promise<void> {
  return updateSettings({ readingHabitId: habitId });
}

export interface ReadingLogResult {
  log: ReadingLog;
  /** Das Buch wurde dadurch beendet */
  finished: boolean;
}

/**
 * Gelesene Seiten eintragen: zählt bei der verknüpften Gewohnheit mit, beginnt ein Buch aus
 * „Will ich lesen“ und beendet es, sobald die letzte Seite erreicht ist
 */
export async function addReadingLog(
  bookId: string,
  day: DayKey,
  pages: number,
): Promise<ReadingLogResult> {
  const date = dayKeySchema.parse(day);
  const amount = readingPagesSchema.parse(pages);
  return db.transaction('rw', READING_TABLES, async () => {
    const book = await loadBook(bookId);
    if (!book) throw new Error(`Buch ${bookId} nicht gefunden`);
    const habitId = await readingHabitId();
    const log = await create<ReadingLog>(db.readingLogs, { bookId, date, pages: amount, habitId });
    if (habitId) await addHabitAmount(habitId, date, amount);

    const progress = bookProgress(book, await listBookLogs(bookId));
    let changes: Partial<Book> = {};
    if (book.status === 'want' || book.status === 'abandoned') {
      changes = statusChange(book, 'reading', date);
    }
    if (book.startedOn !== null && date < book.startedOn) changes.startedOn = date;
    const finished = book.status !== 'finished' && reachesEnd(book, progress.currentPage);
    if (finished)
      changes = { ...changes, ...statusChange({ ...book, ...changes }, 'finished', date) };
    if (Object.keys(changes).length > 0) await update(db.books, bookId, changes);
    return { log, finished };
  });
}

/** Löscht den Eintrag und zieht die Seiten bei der Gewohnheit wieder ab */
export function deleteReadingLog(id: string): Promise<void> {
  return db.transaction('rw', READING_TABLES, async () => {
    const log = await db.readingLogs.get(id);
    if (!log || !isActive(log)) return;
    await softDelete(db.readingLogs, id);
    if (log.habitId) await addHabitAmount(log.habitId, log.date, -log.pages);
  });
}

/** Weich gelöscht samt Einträgen (Seiten werden bei der Gewohnheit abgezogen) und Notizen */
export function deleteBook(id: string): Promise<void> {
  return db.transaction('rw', [...READING_TABLES, db.bookNotes], async () => {
    for (const log of await listBookLogs(id)) await deleteReadingLog(log.id);
    const notes = await db.bookNotes.where('bookId').equals(id).filter(isActive).toArray();
    for (const note of notes) await softDelete(db.bookNotes, note.id);
    await softDelete(db.books, id);
  });
}

// ---------- Notizen ----------

/** Neueste zuerst */
export async function listBookNotes(bookId: string): Promise<BookNote[]> {
  const notes = await db.bookNotes.where('bookId').equals(bookId).filter(isActive).toArray();
  return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addBookNote(bookId: string, input: BookNoteInput): Promise<BookNote> {
  return create<BookNote>(db.bookNotes, { bookId, ...bookNoteInputSchema.parse(input) });
}

export function deleteBookNote(id: string): Promise<void> {
  return softDelete(db.bookNotes, id);
}
