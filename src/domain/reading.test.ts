import { describe, expect, it } from 'vitest';
import type { Book } from '../db/types';
import {
  bookLabel,
  bookProgress,
  booksFinishedInRange,
  formatBookProgress,
  formatPages,
  groupBooks,
  pagesFromInput,
  pagesInRange,
  pagesOn,
  reachesEnd,
  statusChange,
} from './reading';

const book = (id: string, values: Partial<Book> = {}): Book => ({
  id,
  createdAt: `2026-11-0${id.length}T08:00:00.000Z`,
  updatedAt: '',
  deletedAt: null,
  title: `Buch ${id}`,
  author: '',
  totalPages: 300,
  status: 'reading',
  startPage: 0,
  startedOn: '2026-11-01',
  finishedOn: null,
  rating: null,
  ...values,
});

describe('Lesen', () => {
  it('berechnet den Fortschritt aus schon gelesenen Seiten und Einträgen', () => {
    const progress = bookProgress(book('a', { startPage: 50 }), [{ pages: 20 }, { pages: 30 }]);
    expect(progress).toEqual({
      currentPage: 100,
      pagesLogged: 50,
      fraction: 1 / 3,
      pagesLeft: 200,
    });
    expect(formatBookProgress(book('a'), progress)).toBe('Seite 100 von 300 (33 %)');

    const unknown = book('b', { totalPages: null });
    const open = bookProgress(unknown, [{ pages: 12 }]);
    expect(open).toMatchObject({ currentPage: 12, fraction: null, pagesLeft: null });
    expect(formatBookProgress(unknown, open)).toBe('Seite 12');

    // Nie über das Ende hinaus
    expect(bookProgress(book('c'), [{ pages: 400 }])).toMatchObject({
      currentPage: 300,
      fraction: 1,
      pagesLeft: 0,
    });
  });

  it('rechnet „Bis Seite“ und „Seiten gelesen“ in gelesene Seiten um', () => {
    expect(pagesFromInput('untilPage', 140, 100)).toBe(40);
    expect(pagesFromInput('untilPage', 100, 100)).toBeNull();
    expect(pagesFromInput('untilPage', 80, 100)).toBeNull();
    expect(pagesFromInput('pages', 25, 100)).toBe(25);
    expect(pagesFromInput('pages', 0, 100)).toBeNull();
  });

  it('erkennt das Ende nur mit Seitenzahl', () => {
    expect(reachesEnd(book('a'), 300)).toBe(true);
    expect(reachesEnd(book('a'), 299)).toBe(false);
    expect(reachesEnd(book('a', { totalPages: null }), 5000)).toBe(false);
  });

  it('summiert Seiten und beendete Bücher im Zeitraum', () => {
    const logs = [
      { bookId: 'a', date: '2026-10-31', pages: 10 },
      { bookId: 'a', date: '2026-11-01', pages: 20 },
      { bookId: 'b', date: '2026-11-01', pages: 5 },
    ];
    expect(pagesInRange(logs, { from: '2026-11-01', to: '2026-11-30' })).toBe(25);
    expect(pagesOn(logs, '2026-10-31')).toBe(10);
    const books = [
      book('a', { status: 'finished', finishedOn: '2026-11-03' }),
      book('b', { status: 'abandoned', finishedOn: '2026-11-04' }),
      book('c', { status: 'finished', finishedOn: '2026-10-03' }),
    ];
    expect(booksFinishedInRange(books, { from: '2026-11-01', to: '2026-11-30' })).toBe(1);
  });

  it('gruppiert und sortiert Bücher je Status', () => {
    const groups = groupBooks([
      book('a', { startedOn: '2026-10-01' }),
      book('bb', { startedOn: '2026-11-01' }),
      book('w2', { status: 'want', createdAt: '2026-11-05T00:00:00.000Z' }),
      book('w1', { status: 'want', createdAt: '2026-11-01T00:00:00.000Z' }),
      book('f1', { status: 'finished', finishedOn: '2026-09-01' }),
      book('f2', { status: 'finished', finishedOn: '2026-10-01' }),
    ]);
    expect(groups.reading.map((item) => item.id)).toEqual(['bb', 'a']);
    expect(groups.want.map((item) => item.id)).toEqual(['w1', 'w2']);
    expect(groups.finished.map((item) => item.id)).toEqual(['f2', 'f1']);
    expect(groups.abandoned).toEqual([]);
  });

  it('setzt die Daten beim Statuswechsel', () => {
    const want = book('a', { status: 'want', startedOn: null });
    expect(statusChange(want, 'reading', '2026-11-05')).toEqual({
      status: 'reading',
      startedOn: '2026-11-05',
      finishedOn: null,
    });
    expect(statusChange(want, 'finished', '2026-11-05')).toEqual({
      status: 'finished',
      startedOn: '2026-11-05',
      finishedOn: '2026-11-05',
    });
    expect(statusChange(book('b'), 'finished', '2026-11-06')).toMatchObject({
      startedOn: '2026-11-01',
      finishedOn: '2026-11-06',
    });
    expect(statusChange(book('b', { finishedOn: '2026-11-06' }), 'want', '2026-11-07')).toEqual({
      status: 'want',
      startedOn: null,
      finishedOn: null,
    });
  });

  it('formatiert Seiten und Titel', () => {
    expect(formatPages(1)).toBe('1 Seite');
    expect(formatPages(1200)).toBe('1200 Seiten');
    expect(bookLabel({ title: 'Atomic Habits', author: 'James Clear' })).toBe(
      'Atomic Habits – James Clear',
    );
    expect(bookLabel({ title: 'Notizen', author: '' })).toBe('Notizen');
  });
});
