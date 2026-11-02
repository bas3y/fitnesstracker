import { db } from './database';
import {
  addHabitAmount,
  createHabit,
  deleteHabit,
  listHabits,
  loadHabit,
  loadHabits,
  pauseHabit,
  reorderHabits,
  resumeHabit,
  setHabitAmount,
  setHabitArchived,
  setHabitChecked,
  setHabitDone,
  updateHabit,
} from './habits';
import { EMPTY_HABIT_INPUT } from './schemas';
import { resetDatabase } from './testUtils';

beforeEach(resetDatabase);

const INPUT = { ...EMPTY_HABIT_INPUT, name: 'Lesen' };
const DAY = '2026-10-30';

describe('Gewohnheiten', () => {
  it('legt an und hängt neue ans Ende', async () => {
    const first = await createHabit(INPUT);
    const second = await createHabit({ ...INPUT, name: ' Meditieren ', group: 'morning' });
    expect(first).toMatchObject({ name: 'Lesen', order: 0, deletedAt: null });
    expect(second).toMatchObject({ name: 'Meditieren', order: 1, group: 'morning' });
  });

  it('prüft die Eingaben', async () => {
    await expect(createHabit({ ...INPUT, name: '  ' })).rejects.toThrow();
    await expect(createHabit({ ...INPUT, frequency: 'weekdays', weekdays: [] })).rejects.toThrow();
    await expect(createHabit({ ...INPUT, timesPerWeek: 7 })).rejects.toThrow();
    expect(await db.habits.count()).toBe(0);
  });

  it('ändert Felder, erledigte Tage bleiben', async () => {
    const habit = await createHabit(INPUT);
    await setHabitChecked(habit.id, DAY, true);
    await updateHabit(habit.id, { ...INPUT, name: 'Buch lesen', frequency: 'weekly' });
    expect(await loadHabit(habit.id)).toMatchObject({
      habit: { name: 'Buch lesen', frequency: 'weekly' },
      dates: [DAY],
    });
  });

  it('sortiert in der gewählten Reihenfolge', async () => {
    const a = await createHabit({ ...INPUT, name: 'A' });
    const b = await createHabit({ ...INPUT, name: 'B' });
    await reorderHabits([b.id, a.id]);
    expect((await listHabits()).map((habit) => habit.name)).toEqual(['B', 'A']);
  });

  it('löscht weich samt erledigten Tagen, andere bleiben', async () => {
    const gone = await createHabit(INPUT);
    const kept = await createHabit({ ...INPUT, name: 'Bleibt' });
    await setHabitChecked(gone.id, DAY, true);
    await setHabitChecked(kept.id, DAY, true);

    await deleteHabit(gone.id);

    expect(await loadHabit(gone.id)).toBeNull();
    expect(await db.habits.get(gone.id)).toBeDefined();
    expect(await loadHabits()).toMatchObject([{ habit: { name: 'Bleibt' }, dates: [DAY] }]);
    expect((await db.habitChecks.toArray()).filter((c) => c.deletedAt === null)).toHaveLength(1);
  });

  it('ordnet erledigte Tage der richtigen Gewohnheit zu', async () => {
    const a = await createHabit({ ...INPUT, name: 'A' });
    const b = await createHabit({ ...INPUT, name: 'B' });
    await setHabitChecked(a.id, '2026-10-29', true);
    await setHabitChecked(a.id, DAY, true);
    await setHabitChecked(b.id, DAY, true);
    const [first, second] = await loadHabits();
    expect(first?.dates.sort()).toEqual(['2026-10-29', DAY]);
    expect(second?.dates).toEqual([DAY]);
  });
});

describe('setHabitChecked', () => {
  it('hakt ab und nimmt zurück', async () => {
    const habit = await createHabit(INPUT);
    await setHabitChecked(habit.id, DAY, true);
    expect((await loadHabit(habit.id))?.dates).toEqual([DAY]);
    await setHabitChecked(habit.id, DAY, false);
    expect((await loadHabit(habit.id))?.dates).toEqual([]);
  });

  it('legt je Tag höchstens einen Eintrag an, auch bei schnellem Tippen', async () => {
    const habit = await createHabit(INPUT);
    await Promise.all([
      setHabitChecked(habit.id, DAY, true),
      setHabitChecked(habit.id, DAY, true),
      setHabitChecked(habit.id, DAY, true),
    ]);
    expect(await db.habitChecks.count()).toBe(1);
  });

  it('kann nach dem Zurücknehmen wieder abgehakt werden', async () => {
    const habit = await createHabit(INPUT);
    await setHabitChecked(habit.id, DAY, true);
    await setHabitChecked(habit.id, DAY, false);
    await setHabitChecked(habit.id, DAY, true);
    expect((await loadHabit(habit.id))?.dates).toEqual([DAY]);
  });

  it('lehnt ungültige Tage ab', async () => {
    const habit = await createHabit(INPUT);
    await expect(setHabitChecked(habit.id, '30.10.2026', true)).rejects.toThrow();
  });
});

describe('Arten', () => {
  const ITEMS = [
    { id: 'kreatin', name: 'Kreatin', target: 5, unit: 'g', step: 5 },
    { id: 'omega', name: 'Omega-3', target: 2, unit: 'Kapseln', step: 1 },
  ];

  it('setzt unpassende Felder je Art zurück', async () => {
    const check = await createHabit({ ...INPUT, target: 7, unit: 'x', items: ITEMS });
    expect(check).toMatchObject({ kind: 'check', target: 1, unit: '', items: [], startDate: null });
    const quit = await createHabit({
      ...INPUT,
      kind: 'quit',
      target: 0,
      unit: 'Zigaretten',
      startDate: DAY,
      frequency: 'weekdays',
      weekdays: [],
    });
    expect(quit).toMatchObject({ frequency: 'daily', unit: 'Zigaretten', startDate: DAY });
  });

  it('prüft Ziel, Unterpunkte und Startdatum', async () => {
    await expect(createHabit({ ...INPUT, kind: 'count', target: 0 })).rejects.toThrow();
    await expect(createHabit({ ...INPUT, kind: 'items', items: [] })).rejects.toThrow();
    await expect(
      createHabit({ ...INPUT, kind: 'items', items: [{ ...ITEMS[0]!, name: ' ' }] }),
    ).rejects.toThrow();
    await expect(createHabit({ ...INPUT, kind: 'quit', startDate: null })).rejects.toThrow();
  });

  it('zählt hoch und runter, nie unter 0, auch bei schnellem Tippen', async () => {
    const habit = await createHabit({ ...INPUT, kind: 'count', target: 10, unit: 'Seiten' });
    await Promise.all([1, 2, 3].map(() => addHabitAmount(habit.id, DAY, 2)));
    expect((await loadHabit(habit.id))?.entries).toEqual([{ date: DAY, itemId: null, amount: 6 }]);
    await addHabitAmount(habit.id, DAY, 4);
    expect((await loadHabit(habit.id))?.dates).toEqual([DAY]);
    await addHabitAmount(habit.id, DAY, -20);
    expect((await loadHabit(habit.id))?.entries).toEqual([]);
    expect(await db.habitChecks.count()).toBe(1);
  });

  it('Unterpunkte: erledigt, wenn alle ihr Ziel erreichen', async () => {
    const habit = await createHabit({ ...INPUT, kind: 'items', items: ITEMS });
    await setHabitAmount(habit.id, DAY, 5, 'kreatin');
    await addHabitAmount(habit.id, DAY, 1, 'omega');
    expect((await loadHabit(habit.id))?.dates).toEqual([]);
    await addHabitAmount(habit.id, DAY, 1, 'omega');
    expect((await loadHabit(habit.id))?.dates).toEqual([DAY]);
  });

  it('setHabitDone füllt bzw. leert alle Unterpunkte', async () => {
    const habit = await createHabit({ ...INPUT, kind: 'items', items: ITEMS });
    await setHabitDone(habit, DAY, true);
    expect((await loadHabit(habit.id))?.entries).toHaveLength(2);
    await setHabitDone(habit, DAY, false);
    expect((await loadHabit(habit.id))?.entries).toEqual([]);
  });
});

describe('Pausieren und Archivieren', () => {
  it('pausiert ab einem Tag und setzt fort', async () => {
    const habit = await createHabit(INPUT);
    await pauseHabit(habit.id, DAY);
    expect((await loadHabit(habit.id))?.habit.pauses).toEqual([{ from: DAY, to: null }]);
    await resumeHabit(habit.id, '2026-11-02');
    expect((await loadHabit(habit.id))?.habit.pauses).toEqual([{ from: DAY, to: '2026-11-02' }]);
  });

  it('archiviert und stellt wieder her, Einträge bleiben', async () => {
    const habit = await createHabit(INPUT);
    await setHabitChecked(habit.id, DAY, true);
    await setHabitArchived(habit.id, true);
    expect((await loadHabit(habit.id))?.habit.archivedAt).not.toBeNull();
    await setHabitArchived(habit.id, false);
    expect(await loadHabit(habit.id)).toMatchObject({ habit: { archivedAt: null }, dates: [DAY] });
  });
});
