import { PLAN_TEMPLATES } from '../data/planTemplates';
import { suggestPlanDay, type PlanDaySuggestion } from '../domain/plans';
import { toDateInput } from '../domain/workout';
import { db } from './database';
import { create, listActive, nowIso, softDelete, update } from './repository';
import { planExerciseValuesSchema, weekdaysSchema, type PlanExerciseValues } from './schemas';
import { getSettings, updateSettings } from './settings';
import type {
  Exercise,
  Plan,
  PlanDay,
  PlanExercise,
  PlanSchedule,
  Workout,
  WorkoutExercise,
} from './types';
import { addPlannedSets, getActiveWorkout } from './workouts';

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;
const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

const PLAN_TABLES = [db.settings, db.plans, db.planDays, db.planExercises];

export const DEFAULT_PLAN_EXERCISE: Omit<PlanExerciseValues, 'targetDurationSeconds'> = {
  targetSets: 3,
  repMin: 8,
  repMax: 12,
  restSeconds: null,
};
export const DEFAULT_TARGET_DURATION_SECONDS = 30;

export interface PlanDayItem {
  planExercise: PlanExercise;
  /** `null`, falls die Übung nicht (mehr) existiert */
  exercise: Exercise | null;
}

export interface PlanDayDetail {
  day: PlanDay;
  items: PlanDayItem[];
}

export interface PlanDetail {
  plan: Plan;
  days: PlanDayDetail[];
}

export interface PlanSummary {
  plan: Plan;
  dayNames: string[];
}

async function getPlan(id: string): Promise<Plan> {
  const plan = await db.plans.get(id);
  if (!plan || !isActive(plan)) throw new Error('Plan nicht gefunden');
  return plan;
}

async function getPlanDay(id: string): Promise<PlanDay> {
  const day = await db.planDays.get(id);
  if (!day || !isActive(day)) throw new Error('Training nicht gefunden');
  return day;
}

async function activeDays(planId: string): Promise<PlanDay[]> {
  const days = await db.planDays.where('planId').equals(planId).filter(isActive).toArray();
  return days.sort(byOrder);
}

async function activeDayExercises(planDayId: string): Promise<PlanExercise[]> {
  const items = await db.planExercises
    .where('planDayId')
    .equals(planDayId)
    .filter(isActive)
    .toArray();
  return items.sort(byOrder);
}

export async function listPlans(): Promise<PlanSummary[]> {
  const plans = await listActive(db.plans);
  const summaries = await Promise.all(
    plans.map(async (plan) => ({
      plan,
      dayNames: (await activeDays(plan.id)).map((day) => day.name),
    })),
  );
  return summaries.sort((a, b) => a.plan.createdAt.localeCompare(b.plan.createdAt));
}

async function loadDayDetail(day: PlanDay): Promise<PlanDayDetail> {
  const planExercises = await activeDayExercises(day.id);
  // Auch gelöschte Übungen laden, damit der Plan lesbar bleibt
  const exercises = await db.exercises.bulkGet(planExercises.map((item) => item.exerciseId));
  return {
    day,
    items: planExercises.map((planExercise, index) => ({
      planExercise,
      exercise: exercises[index] ?? null,
    })),
  };
}

export async function loadPlanDetail(id: string): Promise<PlanDetail | null> {
  const plan = await db.plans.get(id);
  if (!plan || !isActive(plan)) return null;
  const days = await activeDays(id);
  return { plan, days: await Promise.all(days.map(loadDayDetail)) };
}

export async function loadPlanDayDetail(id: string): Promise<PlanDayDetail | null> {
  const day = await db.planDays.get(id);
  return day && isActive(day) ? loadDayDetail(day) : null;
}

/** Der erste Plan wird automatisch aktiv */
async function activateIfNone(planId: string): Promise<void> {
  const settings = await getSettings();
  if (!settings?.activePlanId) await updateSettings({ activePlanId: planId });
}

/** Neuer Plan mit einem leeren „Training 1“ */
export function createPlan(name = 'Neuer Plan'): Promise<Plan> {
  return db.transaction('rw', PLAN_TABLES, async () => {
    const plan = await create<Plan>(db.plans, { name, schedule: 'rotation' });
    await create<PlanDay>(db.planDays, {
      planId: plan.id,
      name: 'Training 1',
      order: 0,
      weekdays: [],
    });
    await activateIfNone(plan.id);
    return plan;
  });
}

/** Legt aus einer Vorlage einen eigenen Plan an; nicht (mehr) vorhandene Übungen entfallen */
export function createPlanFromTemplate(key: string): Promise<Plan> {
  const template = PLAN_TEMPLATES.find((item) => item.key === key);
  if (!template) throw new Error('Vorlage nicht gefunden');
  return db.transaction('rw', [...PLAN_TABLES, db.exercises], async () => {
    const builtins = await db.exercises
      .where('source')
      .equals('builtin')
      .filter(isActive)
      .toArray();
    const byKey = new Map(builtins.map((exercise) => [exercise.builtinKey, exercise]));
    const plan = await create<Plan>(db.plans, {
      name: template.name,
      schedule: template.schedule,
    });
    for (const [dayOrder, templateDay] of template.days.entries()) {
      const day = await create<PlanDay>(db.planDays, {
        planId: plan.id,
        name: templateDay.name,
        order: dayOrder,
        weekdays: templateDay.weekdays,
      });
      let order = 0;
      for (const item of templateDay.exercises) {
        const exercise = byKey.get(item.key);
        if (!exercise) continue;
        await create<PlanExercise>(db.planExercises, {
          planId: plan.id,
          planDayId: day.id,
          exerciseId: exercise.id,
          order: order++,
          targetSets: item.sets,
          repMin: item.reps[0],
          repMax: item.reps[1],
          targetDurationSeconds: exercise.isTimed ? (item.durationSeconds ?? null) : null,
          restSeconds: item.restSeconds ?? null,
        });
      }
    }
    await activateIfNone(plan.id);
    return plan;
  });
}

export function duplicatePlan(id: string): Promise<Plan> {
  return db.transaction('rw', PLAN_TABLES, async () => {
    const source = await getPlan(id);
    const plan = await create<Plan>(db.plans, {
      name: `${source.name} (Kopie)`,
      schedule: source.schedule,
    });
    for (const sourceDay of await activeDays(id)) {
      const { name, order, weekdays } = sourceDay;
      const day = await create<PlanDay>(db.planDays, { planId: plan.id, name, order, weekdays });
      for (const item of await activeDayExercises(sourceDay.id)) {
        const { exerciseId, targetSets, repMin, repMax, targetDurationSeconds, restSeconds } = item;
        await create<PlanExercise>(db.planExercises, {
          planId: plan.id,
          planDayId: day.id,
          exerciseId,
          order: item.order,
          targetSets,
          repMin,
          repMax,
          targetDurationSeconds,
          restSeconds,
        });
      }
    }
    return plan;
  });
}

export async function updatePlan(
  id: string,
  changes: { name?: string; schedule?: PlanSchedule },
): Promise<void> {
  const name = changes.name?.trim();
  if (changes.name !== undefined && !name) throw new Error('Bitte einen Namen eingeben');
  await update(db.plans, id, name === undefined ? changes : { ...changes, name });
}

/** Löscht den Plan samt Trainings; bisherige Workouts bleiben unverändert */
export function deletePlan(id: string): Promise<void> {
  return db.transaction('rw', PLAN_TABLES, async () => {
    const days = await activeDays(id);
    for (const day of days) await softDeleteDay(day.id);
    await softDelete(db.plans, id);
    const settings = await getSettings();
    if (settings?.activePlanId === id) await updateSettings({ activePlanId: null });
  });
}

export function setActivePlan(id: string | null): Promise<void> {
  return updateSettings({ activePlanId: id });
}

export function addPlanDay(planId: string): Promise<PlanDay> {
  return db.transaction('rw', [db.plans, db.planDays], async () => {
    await getPlan(planId);
    const days = await activeDays(planId);
    return create<PlanDay>(db.planDays, {
      planId,
      name: `Training ${days.length + 1}`,
      order: (days.at(-1)?.order ?? -1) + 1,
      weekdays: [],
    });
  });
}

export async function updatePlanDay(
  id: string,
  changes: { name?: string; weekdays?: number[] },
): Promise<void> {
  const name = changes.name?.trim();
  if (changes.name !== undefined && !name) throw new Error('Bitte einen Namen eingeben');
  const weekdays = changes.weekdays && weekdaysSchema.parse(changes.weekdays);
  await update(db.planDays, id, {
    ...(name !== undefined && { name }),
    ...(weekdays !== undefined && { weekdays }),
  });
}

async function softDeleteDay(id: string): Promise<void> {
  for (const item of await activeDayExercises(id)) await softDelete(db.planExercises, item.id);
  await softDelete(db.planDays, id);
}

export function removePlanDay(id: string): Promise<void> {
  return db.transaction('rw', [db.planDays, db.planExercises], () => softDeleteDay(id));
}

export function reorderPlanDays(planId: string, ids: string[]): Promise<void> {
  return db.transaction('rw', db.planDays, async () => {
    const days = await activeDays(planId);
    assertSameIds(days, ids);
    for (const [order, id] of ids.entries()) await update(db.planDays, id, { order });
  });
}

export function addPlanExercise(planDayId: string, exercise: Exercise): Promise<PlanExercise> {
  return db.transaction('rw', [db.planDays, db.planExercises], async () => {
    const day = await getPlanDay(planDayId);
    const items = await activeDayExercises(planDayId);
    return create<PlanExercise>(db.planExercises, {
      ...DEFAULT_PLAN_EXERCISE,
      planId: day.planId,
      planDayId,
      exerciseId: exercise.id,
      order: (items.at(-1)?.order ?? -1) + 1,
      targetDurationSeconds: exercise.isTimed ? DEFAULT_TARGET_DURATION_SECONDS : null,
    });
  });
}

export function updatePlanExercise(
  id: string,
  changes: Partial<PlanExerciseValues>,
): Promise<void> {
  return db.transaction('rw', db.planExercises, async () => {
    const current = await db.planExercises.get(id);
    if (!current || !isActive(current)) throw new Error('Übung im Plan nicht gefunden');
    const { targetSets, repMin, repMax, targetDurationSeconds, restSeconds } = current;
    const values = planExerciseValuesSchema.parse({
      targetSets,
      repMin,
      repMax,
      targetDurationSeconds,
      restSeconds,
      ...changes,
    });
    await update(db.planExercises, id, values);
  });
}

export function removePlanExercise(id: string): Promise<void> {
  return softDelete(db.planExercises, id);
}

export function reorderPlanExercises(planDayId: string, ids: string[]): Promise<void> {
  return db.transaction('rw', db.planExercises, async () => {
    const items = await activeDayExercises(planDayId);
    assertSameIds(items, ids);
    for (const [order, id] of ids.entries()) await update(db.planExercises, id, { order });
  });
}

function assertSameIds(items: Array<{ id: string }>, ids: string[]) {
  const known = new Set(items.map((item) => item.id));
  if (ids.length !== items.length || !ids.every((id) => known.has(id))) {
    throw new Error('Reihenfolge passt nicht');
  }
}

export interface ActivePlanSuggestion {
  plan: Plan;
  days: PlanDayDetail[];
  /** `null`, solange kein Training des Plans Übungen hat */
  suggestion: PlanDaySuggestion<PlanDayDetail> | null;
}

/** Aktiver Plan mit dem Vorschlag fürs heutige Training; `null` ohne aktiven Plan */
export async function loadActivePlanSuggestion(
  now = new Date(),
): Promise<ActivePlanSuggestion | null> {
  const settings = await getSettings();
  const detail = settings?.activePlanId ? await loadPlanDetail(settings.activePlanId) : null;
  if (!detail) return null;

  const done = await db.workouts
    .filter((w) => isActive(w) && w.endedAt !== null && w.planId === detail.plan.id)
    .toArray();
  const newest = done.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const today = toDateInput(now.toISOString());
  const trainedTodayIds = newest
    .filter((w) => toDateInput(w.startedAt) === today)
    .flatMap((w) => w.planDayId ?? []);

  const days = detail.days.filter((day) => day.items.length > 0);
  // Ein gelöschtes letztes Training zählt nicht – dann das letzte noch vorhandene
  const lastDayId = newest.find((w) => days.some(({ day }) => day.id === w.planDayId))?.planDayId;
  const suggestion = suggestPlanDay({
    days: days.map((item) => ({ ...item, id: item.day.id, weekdays: item.day.weekdays })),
    schedule: detail.plan.schedule,
    lastDayId: lastDayId ?? null,
    weekday: now.getDay(),
    trainedTodayIds,
  });
  return { plan: detail.plan, days: detail.days, suggestion };
}

/**
 * Startet ein Workout aus einem Training des Plans: Übungen und Sätze werden vorbefüllt
 * (Overload-Vorschlag, beim ersten Mal das Planziel). Läuft schon ein Workout, bleibt es das aktive.
 */
export function startPlanWorkout(planDayId: string): Promise<Workout> {
  return db.transaction(
    'rw',
    [
      db.settings,
      db.planDays,
      db.planExercises,
      db.workouts,
      db.workoutExercises,
      db.sets,
      db.exercises,
    ],
    async () => {
      const running = await getActiveWorkout();
      if (running) return running;
      const day = await getPlanDay(planDayId);
      const workout = await create<Workout>(db.workouts, {
        startedAt: nowIso(),
        endedAt: null,
        notes: '',
        restEndsAt: null,
        planId: day.planId,
        planDayId,
      });
      let order = 0;
      for (const planExercise of await activeDayExercises(planDayId)) {
        const exercise = await db.exercises.get(planExercise.exerciseId);
        if (!exercise || !isActive(exercise)) continue;
        const { exerciseId, repMin, repMax, targetDurationSeconds, restSeconds } = planExercise;
        const item = await create<WorkoutExercise>(db.workoutExercises, {
          workoutId: workout.id,
          exerciseId,
          order: order++,
          repMin,
          repMax,
          targetDurationSeconds,
          restSeconds,
        });
        await addPlannedSets(item, planExercise.targetSets);
      }
      return workout;
    },
  );
}
