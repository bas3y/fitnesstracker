import { db } from './database';
import { loadGoalData } from './goals';
import { createHabit, loadHabit, setHabitArchived } from './habits';
import {
  addBookNote,
  addReadingLog,
  createBook,
  deleteBook,
  deleteBookNote,
  deleteReadingLog,
  listBookLogs,
  listBookNotes,
  listBooks,
  loadBook,
  setBookRating,
  setBookStatus,
  setReadingHabit,
  updateBook,
} from './reading';
import { EMPTY_HABIT_INPUT, emptyBookInput } from './schemas';
import { resetDatabase } from './testUtils';

beforeEach(resetDatabase);

const TODAY = '2026-11-07';

describe('Bücher', () => {
  it('legt an, ändert und prüft das Formular', async () => {
    const book = await createBook({
      ...emptyBookInput(TODAY),
      title: ' Atomic Habits ',
      totalPages: 320,
    });
    expect(book).toMatchObject({ title: 'Atomic Habits', status: 'reading', startedOn: TODAY });

    await updateBook(book.id, {
      ...emptyBookInput(TODAY),
      title: 'Atomic Habits',
      status: 'want',
      totalPages: 320,
      finishedOn: TODAY,
    });
    // „Will ich lesen“ hat weder Beginn noch Ende
    expect(await loadBook(book.id)).toMatchObject({
      status: 'want',
      startedOn: null,
      finishedOn: null,
    });

    await expect(createBook(emptyBookInput(TODAY))).rejects.toThrow();
    await expect(
      createBook({ ...emptyBookInput(TODAY), title: 'X', totalPages: 100, startPage: 150 }),
    ).rejects.toThrow();
  });

  it('wechselt den Status und bewertet', async () => {
    const book = await createBook({
      ...emptyBookInput(TODAY),
      title: 'Buch',
      status: 'want',
      startedOn: null,
    });
    await setBookStatus(book.id, 'reading', '2026-11-05');
    await setBookStatus(book.id, 'finished', TODAY);
    await setBookRating(book.id, 5);
    expect(await loadBook(book.id)).toMatchObject({
      status: 'finished',
      startedOn: '2026-11-05',
      finishedOn: TODAY,
      rating: 5,
    });
  });
});

describe('Gelesene Seiten', () => {
  it('beginnt ein Buch, verschiebt den Beginn nach vorn und beendet es auf der letzten Seite', async () => {
    const book = await createBook({
      ...emptyBookInput(TODAY),
      title: 'Kurz',
      status: 'want',
      startedOn: null,
      totalPages: 100,
      startPage: 0,
    });
    const first = await addReadingLog(book.id, '2026-11-05', 40);
    expect(first.finished).toBe(false);
    expect(await loadBook(book.id)).toMatchObject({ status: 'reading', startedOn: '2026-11-05' });

    await addReadingLog(book.id, '2026-11-03', 10);
    expect((await loadBook(book.id))?.startedOn).toBe('2026-11-03');

    const last = await addReadingLog(book.id, TODAY, 50);
    expect(last.finished).toBe(true);
    expect(await loadBook(book.id)).toMatchObject({ status: 'finished', finishedOn: TODAY });
    expect((await listBookLogs(book.id)).map((log) => log.date)).toEqual([
      '2026-11-03',
      '2026-11-05',
      TODAY,
    ]);
    await expect(addReadingLog(book.id, TODAY, 0)).rejects.toThrow();
  });

  it('zählt bei der verknüpften Zähl-Gewohnheit mit und zieht beim Löschen wieder ab', async () => {
    const habit = await createHabit({
      ...EMPTY_HABIT_INPUT,
      name: 'Lesen',
      kind: 'count',
      target: 20,
      unit: 'Seiten',
    });
    await setReadingHabit(habit.id);
    const book = await createBook({ ...emptyBookInput(TODAY), title: 'Buch' });

    const { log } = await addReadingLog(book.id, TODAY, 15);
    await addReadingLog(book.id, TODAY, 10);
    expect(log.habitId).toBe(habit.id);
    expect((await loadHabit(habit.id))?.entries).toMatchObject([{ date: TODAY, amount: 25 }]);

    await deleteReadingLog(log.id);
    expect((await loadHabit(habit.id))?.entries).toMatchObject([{ date: TODAY, amount: 10 }]);

    // Archivierte Gewohnheit zählt nicht mehr mit
    await setHabitArchived(habit.id, true);
    const later = await addReadingLog(book.id, TODAY, 5);
    expect(later.log.habitId).toBeNull();
    expect((await loadHabit(habit.id))?.entries).toMatchObject([{ amount: 10 }]);
  });

  it('löscht ein Buch samt Einträgen und Notizen und liefert Seiten/Bücher für Ziele', async () => {
    const book = await createBook({ ...emptyBookInput(TODAY), title: 'Buch', totalPages: 50 });
    await addReadingLog(book.id, '2026-11-06', 20);
    await addReadingLog(book.id, TODAY, 30);
    const data = await loadGoalData();
    expect(data.reading).toEqual([
      { date: '2026-11-06', value: 20 },
      { date: TODAY, value: 30 },
    ]);
    expect(data.finishedBooks).toEqual([TODAY]);

    const note = await addBookNote(book.id, { text: ' Gutes Zitat ', page: 12 });
    await addBookNote(book.id, { text: 'Zweite', page: null });
    expect((await listBookNotes(book.id)).map((item) => item.text)).toEqual([
      'Zweite',
      'Gutes Zitat',
    ]);
    await deleteBookNote(note.id);
    expect(await listBookNotes(book.id)).toHaveLength(1);

    await deleteBook(book.id);
    expect(await listBooks()).toEqual([]);
    expect(await listBookLogs(book.id)).toEqual([]);
    expect(await listBookNotes(book.id)).toEqual([]);
    expect(await db.readingLogs.count()).toBe(2);
    expect((await loadGoalData()).reading).toEqual([]);
  });
});
