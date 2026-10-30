import { PLAN_TEMPLATES } from '../data/planTemplates';
import { db } from './database';
import {
  addPlanDay,
  addPlanExercise,
  createPlan,
  createPlanFromTemplate,
  deletePlan,
  duplicatePlan,
  listPlans,
  loadActivePlanSuggestion,
  loadPlanDetail,
  removePlanDay,
  reorderPlanDays,
  reorderPlanExercises,
  setActivePlan,
  startPlanWorkout,
  updatePlan,
  updatePlanDay,
  updatePlanExercise,
} from './plans';
import type { BuiltinExercise } from './schemas';
import { applySeed } from './seed';
import { getSettings, updateSettings } from './settings';
import { resetDatabase } from './testUtils';
import type { Exercise } from './types';
import {
  completeSet,
  finishWorkout,
  loadWorkoutDetail,
  replaceWorkoutExercise,
  skipWorkoutExercise,
  startWorkout,
  updateSet,
} from './workouts';

const base: Omit<BuiltinExercise, 'key' | 'name'> = {
  aliases: [],
  category: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: 'barbell',
  isUnilateral: false,
  isTimed: false,
};

let bench: Exercise;
let press: Exercise;
let plank: Exercise;
let pullUp: Exercise;

beforeEach(async () => {
  await resetDatabase();
  await applySeed(
    {
      exercises: [
        { ...base, key: 'barbell-bench-press', name: 'Bankdrücken' },
        { ...base, key: 'dumbbell-bench-press', name: 'Kurzhanteldrücken', equipment: 'dumbbell' },
        { ...base, key: 'plank', name: 'Plank', equipment: 'bodyweight', isTimed: true },
        { ...base, key: 'pull-up', name: 'Klimmzüge', equipment: 'bodyweight' },
      ],
      foods: [],
    },
    1,
  );
  const find = async (key: string) =>
    (await db.exercises.where('builtinKey').equals(key).first()) as Exercise;
  bench = await find('barbell-bench-press');
  press = await find('dumbbell-bench-press');
  plank = await find('plank');
  pullUp = await find('pull-up');
});

async function planWithDay() {
  const plan = await createPlan('Mein Plan');
  const detail = await loadPlanDetail(plan.id);
  return { plan, day: detail!.days[0]!.day };
}

/** Beendetes Workout mit einem Satz pro Übung */
async function trainDay(dayId: string, values: { weight: number; reps: number }) {
  const workout = await startPlanWorkout(dayId);
  const detail = await loadWorkoutDetail(workout.id);
  for (const item of detail!.items) {
    const set = item.sets[0]!;
    await updateSet(set.id, values);
    await completeSet(set.id, 0);
  }
  await finishWorkout(workout.id, '');
  return workout;
}

describe('Pläne verwalten', () => {
  it('legt einen Plan mit erstem Training an und macht den ersten Plan aktiv', async () => {
    const first = await createPlan('Erster');
    const second = await createPlan('Zweiter');
    expect((await getSettings())?.activePlanId).toBe(first.id);
    expect((await loadPlanDetail(first.id))?.days.map((d) => d.day.name)).toEqual(['Training 1']);
    expect((await listPlans()).map((p) => p.plan.id)).toEqual([first.id, second.id]);
  });

  it('nummeriert neue Trainings und merkt Reihenfolge und Wochentage', async () => {
    const { plan, day } = await planWithDay();
    const second = await addPlanDay(plan.id);
    expect(second.name).toBe('Training 2');
    await updatePlanDay(second.id, { name: ' Beine ', weekdays: [1, 4] });
    await reorderPlanDays(plan.id, [second.id, day.id]);
    const detail = await loadPlanDetail(plan.id);
    expect(detail?.days.map((d) => d.day.name)).toEqual(['Beine', 'Training 1']);
    expect(detail?.days[0]?.day.weekdays).toEqual([1, 4]);
  });

  it('prüft Name, Wochentage und Wdh.-Bereich', async () => {
    const { plan, day } = await planWithDay();
    await expect(updatePlan(plan.id, { name: '  ' })).rejects.toThrow('Namen');
    await expect(updatePlanDay(day.id, { weekdays: [7] })).rejects.toThrow();
    const item = await addPlanExercise(day.id, bench);
    await expect(updatePlanExercise(item.id, { repMin: 13 })).rejects.toThrow();
  });

  it('gibt Halteübungen eine Zieldauer und hält die Übungsreihenfolge', async () => {
    const { plan, day } = await planWithDay();
    const first = await addPlanExercise(day.id, bench);
    const second = await addPlanExercise(day.id, plank);
    expect(first).toMatchObject({ targetSets: 3, repMin: 8, repMax: 12, restSeconds: null });
    expect(first.targetDurationSeconds).toBeNull();
    expect(second.targetDurationSeconds).toBe(30);
    await reorderPlanExercises(day.id, [second.id, first.id]);
    const detail = await loadPlanDetail(plan.id);
    expect(detail?.days[0]?.items.map((i) => i.exercise?.name)).toEqual(['Plank', 'Bankdrücken']);
  });

  it('kopiert beim Duplizieren alles mit neuen IDs und ändert den aktiven Plan nicht', async () => {
    const { plan, day } = await planWithDay();
    await updatePlan(plan.id, { schedule: 'weekdays' });
    await updatePlanDay(day.id, { weekdays: [2] });
    const item = await addPlanExercise(day.id, bench);
    await updatePlanExercise(item.id, { targetSets: 5, restSeconds: 120 });

    const copy = await duplicatePlan(plan.id);
    const detail = await loadPlanDetail(copy.id);
    expect(detail?.plan).toMatchObject({ name: 'Mein Plan (Kopie)', schedule: 'weekdays' });
    expect(detail?.days[0]?.day.id).not.toBe(day.id);
    expect(detail?.days[0]?.day.weekdays).toEqual([2]);
    expect(detail?.days[0]?.items[0]?.planExercise).toMatchObject({
      exerciseId: bench.id,
      targetSets: 5,
      restSeconds: 120,
    });
    expect((await getSettings())?.activePlanId).toBe(plan.id);
  });

  it('löscht Plan und Trainings weich und gibt den aktiven Plan frei', async () => {
    const { plan, day } = await planWithDay();
    await addPlanExercise(day.id, bench);
    await deletePlan(plan.id);
    expect(await loadPlanDetail(plan.id)).toBeNull();
    expect(await listPlans()).toEqual([]);
    expect((await db.planDays.get(day.id))?.deletedAt).not.toBeNull();
    expect((await db.planExercises.where('planId').equals(plan.id).first())?.deletedAt).not.toBe(
      null,
    );
    expect((await getSettings())?.activePlanId).toBeNull();
    expect(await loadActivePlanSuggestion()).toBeNull();
  });
});

describe('Vorlagen', () => {
  it('kopiert eine Vorlage als eigenen Plan und überspringt fehlende Übungen', async () => {
    const plan = await createPlanFromTemplate('five-by-five');
    const detail = await loadPlanDetail(plan.id);
    expect(detail?.plan).toMatchObject({ name: '5×5', schedule: 'rotation' });
    expect(detail?.days.map((d) => d.day.name)).toEqual(['Training A', 'Training B']);
    // Im Test-Seed gibt es nur das Bankdrücken dieser Vorlage
    expect(detail?.days[0]?.items).toHaveLength(1);
    expect(detail?.days[0]?.items[0]?.planExercise).toMatchObject({
      exerciseId: bench.id,
      targetSets: 5,
      repMin: 5,
      repMax: 5,
      restSeconds: 180,
    });
  });

  it('bietet alle geforderten Vorlagen an', () => {
    expect(PLAN_TEMPLATES.map((t) => t.key)).toEqual([
      'push-pull-legs',
      'five-by-five',
      'full-body-3x',
      'upper-lower',
    ]);
  });
});

describe('Workout aus Plan starten', () => {
  it('legt Übungen und Zielsätze an und befüllt beim ersten Mal das Planziel', async () => {
    const { plan, day } = await planWithDay();
    const item = await addPlanExercise(day.id, bench);
    await updatePlanExercise(item.id, { targetSets: 4, repMin: 6, repMax: 10, restSeconds: 90 });
    await addPlanExercise(day.id, plank);
    await addPlanExercise(day.id, pullUp);

    const workout = await startPlanWorkout(day.id);
    expect(workout).toMatchObject({ planId: plan.id, planDayId: day.id });
    const detail = await loadWorkoutDetail(workout.id);
    expect(detail?.planDayName).toBe('Training 1');
    const [benchItem, plankItem, pullUpItem] = detail!.items;
    expect(benchItem?.workoutExercise).toMatchObject({ repMin: 6, repMax: 10, restSeconds: 90 });
    expect(benchItem?.sets).toHaveLength(4);
    expect(benchItem?.sets[0]).toMatchObject({ weight: null, reps: 6, completedAt: null });
    expect(plankItem?.sets[0]).toMatchObject({ reps: null, durationSeconds: 30, weight: 0 });
    expect(pullUpItem?.sets[0]).toMatchObject({ weight: 0, reps: 8 });
  });

  it('befüllt mit dem Overload-Vorschlag im Zielbereich des Plans', async () => {
    const { day } = await planWithDay();
    const item = await addPlanExercise(day.id, bench);
    await updatePlanExercise(item.id, { repMin: 6, repMax: 10 });
    await trainDay(day.id, { weight: 60, reps: 10 });

    const next = await loadWorkoutDetail((await startPlanWorkout(day.id)).id);
    expect(next?.items[0]?.sets).toHaveLength(3);
    expect(next?.items[0]?.sets[2]).toMatchObject({ weight: 62.5, reps: 6 });
  });

  it('nutzt bei Pfund den passenden Gewichtssprung', async () => {
    await updateSettings({ weightUnit: 'lb' });
    const { day } = await planWithDay();
    const item = await addPlanExercise(day.id, bench);
    await updatePlanExercise(item.id, { repMax: 10 });
    await trainDay(day.id, { weight: 60, reps: 10 });

    const next = await loadWorkoutDetail((await startPlanWorkout(day.id)).id);
    expect(next?.items[0]?.sets[0]?.weight).toBeCloseTo(62.27, 2);
  });

  it('übernimmt die Stufe, wenn die Übung zuletzt nach Stufe trainiert wurde', async () => {
    await db.exercises.update(bench.id, { loadType: 'level' });
    const { day } = await planWithDay();
    await addPlanExercise(day.id, bench);
    const first = await loadWorkoutDetail((await startPlanWorkout(day.id)).id);
    const set = first!.items[0]!.sets[0]!;
    await updateSet(set.id, { level: 7, reps: 12 });
    await completeSet(set.id, 0);
    await finishWorkout(first!.workout.id, '');

    const next = await loadWorkoutDetail((await startPlanWorkout(day.id)).id);
    expect(next?.items[0]?.sets[0]).toMatchObject({ weight: null, level: 8, reps: 8 });
  });

  it('gibt ein laufendes Workout zurück und überspringt gelöschte Übungen', async () => {
    const { day } = await planWithDay();
    await addPlanExercise(day.id, bench);
    const running = await startWorkout();
    expect((await startPlanWorkout(day.id)).id).toBe(running.id);
    expect((await loadWorkoutDetail(running.id))?.items).toEqual([]);
    await finishWorkout(running.id, '');

    await addPlanExercise(day.id, press);
    await db.exercises.update(press.id, { deletedAt: '2026-01-01T00:00:00.000Z' });
    const workout = await loadWorkoutDetail((await startPlanWorkout(day.id)).id);
    expect(workout?.items.map((i) => i.exercise?.name)).toEqual(['Bankdrücken']);
  });

  it('übernimmt die Last des abgehakten Satzes in leere Folgesätze', async () => {
    const { day } = await planWithDay();
    await addPlanExercise(day.id, bench);
    const detail = await loadWorkoutDetail((await startPlanWorkout(day.id)).id);
    const [first, second] = detail!.items[0]!.sets;
    await updateSet(first!.id, { weight: 50 });
    await updateSet(second!.id, { weight: 45 });
    await completeSet(first!.id, 0);

    const after = await loadWorkoutDetail(detail!.workout.id);
    expect(after?.items[0]?.sets.map((set) => set.weight)).toEqual([50, 45, 50]);
  });

  it('bleibt von späteren Planänderungen unberührt', async () => {
    const { day } = await planWithDay();
    const item = await addPlanExercise(day.id, bench);
    const workout = await startPlanWorkout(day.id);
    await updatePlanExercise(item.id, { repMin: 3, repMax: 5, restSeconds: 300 });
    const detail = await loadWorkoutDetail(workout.id);
    expect(detail?.items[0]?.workoutExercise).toMatchObject({
      repMin: 8,
      repMax: 12,
      restSeconds: null,
    });
  });
});

describe('Vorschlag fürs heutige Training', () => {
  const MONDAY = new Date(2026, 9, 26, 18);

  it('rotiert über beendete Plan-Workouts, freie Workouts zählen nicht', async () => {
    const { plan, day } = await planWithDay();
    const second = await addPlanDay(plan.id);
    await addPlanExercise(day.id, bench);
    await addPlanExercise(second.id, press);

    expect((await loadActivePlanSuggestion())?.suggestion).toMatchObject({ reason: 'start' });

    await trainDay(day.id, { weight: 60, reps: 8 });
    const free = await startWorkout();
    await finishWorkout(free.id, '');
    const next = await loadActivePlanSuggestion();
    expect(next?.suggestion?.day.day.id).toBe(second.id);
    expect(next?.suggestion?.lastDay?.day.id).toBe(day.id);
    expect(next?.suggestion?.reason).toBe('rotation');

    await trainDay(second.id, { weight: 20, reps: 10 });
    expect((await loadActivePlanSuggestion())?.suggestion?.day.day.id).toBe(day.id);
  });

  it('zählt ein verworfenes Training nicht', async () => {
    const { plan, day } = await planWithDay();
    const second = await addPlanDay(plan.id);
    await addPlanExercise(day.id, bench);
    await addPlanExercise(second.id, press);
    const workout = await trainDay(day.id, { weight: 60, reps: 8 });
    await db.workouts.update(workout.id, { deletedAt: '2026-01-01T00:00:00.000Z' });
    expect((await loadActivePlanSuggestion())?.suggestion?.day.day.id).toBe(day.id);
  });

  it('überspringt Trainings ohne Übungen und meldet einen leeren Plan', async () => {
    const { plan, day } = await planWithDay();
    expect((await loadActivePlanSuggestion())?.suggestion).toBeNull();
    const second = await addPlanDay(plan.id);
    await addPlanExercise(second.id, bench);
    const result = await loadActivePlanSuggestion();
    expect(result?.suggestion?.day.day.id).toBe(second.id);
    expect(result?.days.map((d) => d.day.id)).toEqual([day.id, second.id]);
  });

  it('richtet sich beim Wochenplan nach dem Wochentag', async () => {
    const { plan, day } = await planWithDay();
    const second = await addPlanDay(plan.id);
    await updatePlan(plan.id, { schedule: 'weekdays' });
    await updatePlanDay(day.id, { weekdays: [1] });
    await updatePlanDay(second.id, { weekdays: [4] });
    await addPlanExercise(day.id, bench);
    await addPlanExercise(second.id, press);

    const result = await loadActivePlanSuggestion(MONDAY);
    expect(result?.suggestion).toMatchObject({ reason: 'today' });
    expect(result?.suggestion?.day.day.id).toBe(day.id);
  });

  it('nutzt immer den aktiven Plan', async () => {
    const { plan } = await planWithDay();
    const other = await createPlan('Anderer');
    expect((await loadActivePlanSuggestion())?.plan.id).toBe(plan.id);
    await setActivePlan(other.id);
    expect((await loadActivePlanSuggestion())?.plan.id).toBe(other.id);
  });

  it('wird nach dem Löschen eines Trainings nicht fehlerhaft', async () => {
    const { plan, day } = await planWithDay();
    const second = await addPlanDay(plan.id);
    await addPlanExercise(day.id, bench);
    await addPlanExercise(second.id, press);
    await trainDay(second.id, { weight: 20, reps: 10 });
    await removePlanDay(second.id);
    expect((await loadActivePlanSuggestion())?.suggestion?.day.day.id).toBe(day.id);
  });
});

describe('Übung im laufenden Workout tauschen', () => {
  async function runningWorkout() {
    const { day } = await planWithDay();
    const item = await addPlanExercise(day.id, bench);
    await updatePlanExercise(item.id, { targetSets: 3, repMin: 5, repMax: 8, restSeconds: 120 });
    await addPlanExercise(day.id, pullUp);
    return (await loadWorkoutDetail((await startPlanWorkout(day.id)).id))!;
  }

  it('ersetzt eine unberührte Übung an gleicher Stelle und behält die Ziele', async () => {
    const detail = await runningWorkout();
    await replaceWorkoutExercise(detail.items[0]!.workoutExercise.id, press.id);

    const after = await loadWorkoutDetail(detail.workout.id);
    expect(after?.items.map((i) => i.exercise?.name)).toEqual(['Kurzhanteldrücken', 'Klimmzüge']);
    expect(after?.items[0]?.workoutExercise).toMatchObject({
      repMin: 5,
      repMax: 8,
      restSeconds: 120,
    });
    expect(after?.items[0]?.sets).toHaveLength(3);
    expect(after?.items[0]?.sets[0]).toMatchObject({ weight: null, reps: 5 });
  });

  it('behält abgehakte Sätze und setzt die neue Übung direkt dahinter', async () => {
    const detail = await runningWorkout();
    const item = detail.items[0]!;
    await updateSet(item.sets[0]!.id, { weight: 60 });
    await completeSet(item.sets[0]!.id, 0);
    await replaceWorkoutExercise(item.workoutExercise.id, press.id);

    const after = await loadWorkoutDetail(detail.workout.id);
    expect(after?.items.map((i) => i.exercise?.name)).toEqual([
      'Bankdrücken',
      'Kurzhanteldrücken',
      'Klimmzüge',
    ]);
    expect(after?.items[0]?.sets).toHaveLength(1);
    expect(after?.items[1]?.sets).toHaveLength(2);
  });

  it('nimmt für die neue Übung den Verlauf dieser Übung', async () => {
    const { day } = await planWithDay();
    await addPlanExercise(day.id, press);
    await trainDay(day.id, { weight: 20, reps: 9 });

    const detail = await runningWorkout();
    await replaceWorkoutExercise(detail.items[0]!.workoutExercise.id, press.id);
    const after = await loadWorkoutDetail(detail.workout.id);
    expect(after?.items[0]?.sets[0]).toMatchObject({ weight: 22.5, reps: 5 });
  });

  it('überspringt eine Übung: ohne abgehakte Sätze verschwindet sie', async () => {
    const detail = await runningWorkout();
    await skipWorkoutExercise(detail.items[0]!.workoutExercise.id);
    const after = await loadWorkoutDetail(detail.workout.id);
    expect(after?.items.map((i) => i.exercise?.name)).toEqual(['Klimmzüge']);
  });

  it('überspringt den Rest einer Übung: abgehakte Sätze bleiben', async () => {
    const detail = await runningWorkout();
    const item = detail.items[0]!;
    await completeSet(item.sets[0]!.id, 0);
    await skipWorkoutExercise(item.workoutExercise.id);
    const after = await loadWorkoutDetail(detail.workout.id);
    expect(after?.items[0]?.sets).toHaveLength(1);
    expect(after?.items[0]?.sets[0]?.completedAt).not.toBeNull();
  });
});
