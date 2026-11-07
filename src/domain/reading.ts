import type { Book, BookStatus, DayKey, ReadingLog } from '../db/types';
import type { DayRange } from './endurance';
import { formatDecimal } from './format';
import { inRange } from './periods';

type ProgressBook = Pick<Book, 'totalPages' | 'startPage'>;
type PageLog = Pick<ReadingLog, 'bookId' | 'date' | 'pages'>;

export interface BookProgress {
  /** Seite, bis zu der gelesen wurde */
  currentPage: number;
  /** In der App eingetragene Seiten */
  pagesLogged: number;
  /** 0–1; `null` ohne Seitenzahl */
  fraction: number | null;
  /** Nur mit Seitenzahl */
  pagesLeft: number | null;
}

/** Fortschritt aus den schon gelesenen Seiten und den Einträgen */
export function bookProgress(
  book: ProgressBook,
  logs: readonly Pick<PageLog, 'pages'>[],
): BookProgress {
  const pagesLogged = logs.reduce((sum, log) => sum + log.pages, 0);
  const currentPage = book.startPage + pagesLogged;
  const total = book.totalPages;
  return {
    currentPage: total === null ? currentPage : Math.min(currentPage, total),
    pagesLogged,
    fraction: total === null ? null : Math.min(1, currentPage / total),
    pagesLeft: total === null ? null : Math.max(0, total - currentPage),
  };
}

export const READING_INPUT_MODES = ['untilPage', 'pages'] as const;
/** `untilPage` = „Bis Seite“, `pages` = „Seiten gelesen“ */
export type ReadingInputMode = (typeof READING_INPUT_MODES)[number];

/** Gelesene Seiten aus der Eingabe; `null` = nichts Neues (Seite nicht weiter als bisher) */
export function pagesFromInput(
  mode: ReadingInputMode,
  value: number,
  currentPage: number,
): number | null {
  const pages = mode === 'pages' ? value : value - currentPage;
  return pages >= 1 ? Math.round(pages) : null;
}

/** Hat das Buch mit dieser Seite das Ende erreicht? */
export function reachesEnd(book: ProgressBook, currentPage: number): boolean {
  return book.totalPages !== null && currentPage >= book.totalPages;
}

/** Gelesene Seiten im Zeitraum (alle Bücher) */
export function pagesInRange(logs: readonly PageLog[], range: DayRange): number {
  return logs.reduce((sum, log) => (inRange(log.date, range) ? sum + log.pages : sum), 0);
}

export function pagesOn(logs: readonly PageLog[], day: DayKey): number {
  return pagesInRange(logs, { from: day, to: day });
}

/** Beendete Bücher im Zeitraum */
export function booksFinishedInRange(
  books: readonly Pick<Book, 'status' | 'finishedOn'>[],
  range: DayRange,
): number {
  return books.filter(
    (book) =>
      book.status === 'finished' && book.finishedOn !== null && inRange(book.finishedOn, range),
  ).length;
}

/** Reihenfolge auf der Lese-Seite */
export const BOOK_STATUS_ORDER: readonly BookStatus[] = [
  'reading',
  'want',
  'finished',
  'abandoned',
];

type SortableBook = Pick<Book, 'status' | 'startedOn' | 'finishedOn' | 'createdAt'>;

/**
 * Bücher je Status: „Lese ich“ zuletzt begonnene zuerst, „Will ich lesen“ in Anlagereihenfolge,
 * Gelesene/Abgebrochene zuletzt beendete zuerst
 */
export function groupBooks<T extends SortableBook>(books: readonly T[]): Record<BookStatus, T[]> {
  const groups: Record<BookStatus, T[]> = { reading: [], want: [], finished: [], abandoned: [] };
  for (const book of books) groups[book.status].push(book);
  const desc = (a: string | null, b: string | null) => (b ?? '').localeCompare(a ?? '');
  groups.reading.sort((a, b) => desc(a.startedOn, b.startedOn) || desc(a.createdAt, b.createdAt));
  groups.want.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const status of ['finished', 'abandoned'] as const) {
    groups[status].sort(
      (a, b) => desc(a.finishedOn, b.finishedOn) || desc(a.createdAt, b.createdAt),
    );
  }
  return groups;
}

/** Änderungen beim Wechsel des Status (Daten setzen bzw. leeren) */
export function statusChange(
  book: Pick<Book, 'startedOn' | 'finishedOn'>,
  status: BookStatus,
  day: DayKey,
): Pick<Book, 'status' | 'startedOn' | 'finishedOn'> {
  switch (status) {
    case 'want':
      return { status, startedOn: null, finishedOn: null };
    case 'reading':
      return { status, startedOn: book.startedOn ?? day, finishedOn: null };
    default:
      return {
        status,
        startedOn: book.startedOn === null || book.startedOn > day ? day : book.startedOn,
        finishedOn: day,
      };
  }
}

/** „1 Seite“, „1200 Seiten“ */
export function formatPages(pages: number): string {
  return `${formatDecimal(pages, 0)} ${pages === 1 ? 'Seite' : 'Seiten'}`;
}

/** „Seite 120 von 300 (40 %)“ bzw. „Seite 120“ */
export function formatBookProgress(book: ProgressBook, progress: BookProgress): string {
  if (book.totalPages === null) return `Seite ${formatDecimal(progress.currentPage, 0)}`;
  const percent = Math.round((progress.fraction ?? 0) * 100);
  return `Seite ${formatDecimal(progress.currentPage, 0)} von ${formatDecimal(book.totalPages, 0)} (${percent} %)`;
}

/** Titel mit Autor, z. B. „Atomic Habits – James Clear“ */
export function bookLabel(book: Pick<Book, 'title' | 'author'>): string {
  return book.author ? `${book.title} – ${book.author}` : book.title;
}
