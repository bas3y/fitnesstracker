import { db } from './database';
import {
  createHabit,
  deleteHabit,
  listHabits,
  loadHabit,
  loadHabits,
  reorderHabits,
  setHabitChecked,
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
