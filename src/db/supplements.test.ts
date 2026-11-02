import { db } from './database';
import { createUserExercise } from './exercises';
import { addHabitAmount, createHabit, loadHabit } from './habits';
import { EMPTY_EXERCISE_INPUT, EMPTY_HABIT_INPUT, EMPTY_SUPPLEMENT_INPUT } from './schemas';
import {
  createSupplement,
  deleteSupplement,
  importSupplementsFromHabit,
  listSupplementHabitCandidates,
  listSupplements,
  loadSupplement,
  loadSupplements,
  loadTrainingDays,
  refillSupplement,
  reorderSupplements,
  setSupplementArchived,
  setSupplementStock,
  setSupplementTaken,
  updateSupplement,
} from './supplements';
import { resetDatabase } from './testUtils';
import type { SupplementInput } from './schemas';
import { addWorkoutExercise, completeSet, finishWorkout, startWorkout } from './workouts';
import { dayKey } from '../domain/daily';

beforeEach(resetDatabase);

const DAY = '2026-10-30';
const DOSE = { id: 'd1', amount: 5, timing: 'time' as const, time: '08:00', period: null };
const INPUT: SupplementInput = {
  ...EMPTY_SUPPLEMENT_INPUT,
  name: 'Kreatin',
  unit: 'g',
  doses: [DOSE],
};

async function stockOf(id: string) {
  return (await db.supplements.get(id))?.stock;
}

describe('Supplements', () => {
  it('legt an, hängt ans Ende und prüft die Eingaben', async () => {
    const first = await createSupplement(INPUT);
    const second = await createSupplement({ ...INPUT, name: ' Omega-3 ' });
    expect(first).toMatchObject({ name: 'Kreatin', order: 0, archivedAt: null, deletedAt: null });
    expect(second).toMatchObject({ name: 'Omega-3', order: 1 });
    await expect(createSupplement({ ...INPUT, doses: [] })).rejects.toThrow();
    await expect(createSupplement({ ...INPUT, schedule: 'weekdays' })).rejects.toThrow();
    await expect(
      createSupplement({ ...INPUT, doses: [{ ...DOSE, time: '25:00' }] }),
    ).rejects.toThrow();
    expect(await db.supplements.count()).toBe(2);
  });

  it('räumt unpassende Zeitfelder auf', async () => {
    const supplement = await createSupplement({
      ...INPUT,
      doses: [{ ...DOSE, timing: 'period', period: 'evening' }],
    });
    expect(supplement.doses[0]).toMatchObject({ timing: 'period', time: null, period: 'evening' });
  });

  it('ändert, sortiert, archiviert und löscht samt Einnahmen', async () => {
    const a = await createSupplement(INPUT);
    const b = await createSupplement({ ...INPUT, name: 'Zink' });
    await updateSupplement(a.id, { ...INPUT, name: 'Kreatin Monohydrat' });
    await reorderSupplements([b.id, a.id]);
    expect((await listSupplements()).map((s) => s.name)).toEqual(['Zink', 'Kreatin Monohydrat']);

    await setSupplementArchived(b.id, true);
    expect((await loadSupplement(b.id))?.supplement.archivedAt).not.toBeNull();
    await setSupplementArchived(b.id, false);
    expect((await loadSupplement(b.id))?.supplement.archivedAt).toBeNull();

    await setSupplementTaken(a.id, 'd1', DAY, true);
    await deleteSupplement(a.id);
    expect(await loadSupplement(a.id)).toBeNull();
    expect(await db.supplementIntakes.filter((i) => i.deletedAt === null).count()).toBe(0);
    expect((await loadSupplements()).map(({ supplement }) => supplement.id)).toEqual([b.id]);
  });
});

describe('Einnahmen und Bestand', () => {
  it('Abhaken zieht ab, doppelt bleibt ohne Wirkung, Zurücknehmen bucht zurück', async () => {
    const supplement = await createSupplement({ ...INPUT, stock: 12 });
    await setSupplementTaken(supplement.id, 'd1', DAY, true);
    await setSupplementTaken(supplement.id, 'd1', DAY, true);
    expect(await stockOf(supplement.id)).toBe(7);
    const { intakes } = (await loadSupplement(supplement.id))!;
    expect(intakes).toEqual([
      expect.objectContaining({ doseId: 'd1', date: DAY, amount: 5, stockDeducted: 5 }),
    ]);

    // Restbestand 2 → nur 2 abgezogen, beim Zurücknehmen genau diese 2 zurück
    await setSupplementTaken(supplement.id, 'd1', '2026-10-31', true);
    await setSupplementStock(supplement.id, 2);
    await setSupplementTaken(supplement.id, 'd1', '2026-11-01', true);
    expect(await stockOf(supplement.id)).toBe(0);
    await setSupplementTaken(supplement.id, 'd1', '2026-11-01', false);
    expect(await stockOf(supplement.id)).toBe(2);
    await setSupplementTaken(supplement.id, 'd1', '2026-11-01', false);
    expect(await stockOf(supplement.id)).toBe(2);
  });

  it('ohne Bestand wird nichts abgezogen', async () => {
    const supplement = await createSupplement(INPUT);
    await setSupplementTaken(supplement.id, 'd1', DAY, true);
    expect(await stockOf(supplement.id)).toBeNull();
    expect((await loadSupplement(supplement.id))!.intakes[0]?.stockDeducted).toBe(0);
  });

  it('Bestand später erfasst: Zurücknehmen alter Einnahmen ändert ihn nicht', async () => {
    const supplement = await createSupplement(INPUT);
    await setSupplementTaken(supplement.id, 'd1', DAY, true);
    await setSupplementStock(supplement.id, 50);
    await setSupplementTaken(supplement.id, 'd1', DAY, false);
    expect(await stockOf(supplement.id)).toBe(50);
  });

  it('unbekannte Dosis wird abgelehnt', async () => {
    const supplement = await createSupplement(INPUT);
    await expect(setSupplementTaken(supplement.id, 'gibt-es-nicht', DAY, true)).rejects.toThrow();
  });

  it('neue Packung addiert die Packungsgröße', async () => {
    const supplement = await createSupplement({ ...INPUT, stock: 3, packageSize: 500 });
    await refillSupplement(supplement.id);
    expect(await stockOf(supplement.id)).toBe(503);
    await refillSupplement(supplement.id, 100);
    expect(await stockOf(supplement.id)).toBe(603);
    const noPackage = await createSupplement({ ...INPUT, name: 'Zink' });
    await expect(refillSupplement(noPackage.id)).rejects.toThrow();
    await setSupplementStock(supplement.id, null);
    expect(await stockOf(supplement.id)).toBeNull();
  });
});

describe('Trainingstage', () => {
  it('Kraft, Ausdauer und leere Workouts', async () => {
    const bench = await createUserExercise({
      ...EMPTY_EXERCISE_INPUT,
      name: 'Bankdrücken X',
      primaryMuscles: ['chest'],
    });
    const run = await createUserExercise({
      ...EMPTY_EXERCISE_INPUT,
      name: 'Laufband X',
      category: 'cardio',
      isTimed: true,
    });

    const first = await startWorkout();
    const item = await addWorkoutExercise(first.id, run.id);
    const set = await db.sets.where('workoutExerciseId').equals(item.id).first();
    await completeSet(set!.id, 0);
    await finishWorkout(first.id, '');
    const key = dayKey(new Date(first.startedAt));
    expect((await loadTrainingDays()).get(key)).toMatchObject({
      strength: false,
      endurance: true,
      startedAt: first.startedAt,
    });

    // Zweites Workout am selben Tag, noch ohne Übung → zählt als Kraft, Ende bleibt das des ersten
    const second = await startWorkout();
    let day = (await loadTrainingDays()).get(key);
    expect(day).toMatchObject({ strength: true, endurance: true, startedAt: first.startedAt });
    expect(day?.endedAt).toBe((await db.workouts.get(first.id))?.endedAt);
    await addWorkoutExercise(second.id, bench.id);
    day = (await loadTrainingDays()).get(key);
    expect(day).toMatchObject({ strength: true, endurance: true });
  });
});

describe('Übernahme aus Gewohnheiten', () => {
  it('Unterpunkte werden Supplements mit Einnahmen, die Gewohnheit wird archiviert', async () => {
    const habit = await createHabit({
      ...EMPTY_HABIT_INPUT,
      name: 'Supplements',
      kind: 'items',
      group: 'morning',
      items: [
        { id: 'k', name: 'Kreatin', target: 5, unit: 'g', step: 5 },
        { id: 'o', name: 'Omega-3', target: 2, unit: 'Kapseln', step: 1 },
      ],
    });
    const lesen = await createHabit({ ...EMPTY_HABIT_INPUT, name: 'Lesen' });
    await addHabitAmount(habit.id, DAY, 5, 'k');
    await addHabitAmount(habit.id, '2026-10-31', 5, 'k');
    await addHabitAmount(habit.id, DAY, 1, 'o');
    expect((await listSupplementHabitCandidates()).map((h) => h.id)).toEqual([habit.id]);

    const created = await importSupplementsFromHabit(habit.id);
    expect(created.map((s) => [s.name, s.unit])).toEqual([
      ['Kreatin', 'g'],
      ['Omega-3', 'Kapseln'],
    ]);
    const [kreatin, omega] = await loadSupplements();
    expect(kreatin?.supplement.doses).toEqual([
      expect.objectContaining({ amount: 5, timing: 'period', period: 'morning' }),
    ]);
    expect(kreatin?.intakes.map((i) => i.date).sort()).toEqual([DAY, '2026-10-31']);
    expect(omega?.intakes).toEqual([
      expect.objectContaining({ date: DAY, amount: 1, doseId: omega!.supplement.doses[0]!.id }),
    ]);

    expect((await loadHabit(habit.id))?.habit.archivedAt).not.toBeNull();
    expect((await loadHabit(habit.id))?.entries).toHaveLength(3);
    expect(await listSupplementHabitCandidates()).toEqual([]);
    await expect(importSupplementsFromHabit(habit.id)).rejects.toThrow();
    await expect(importSupplementsFromHabit(lesen.id)).rejects.toThrow();
  });
});
