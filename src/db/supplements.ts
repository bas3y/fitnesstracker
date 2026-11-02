import { dayKey } from '../domain/daily';
import {
  isSupplementHabitCandidate,
  supplementsFromHabit,
  type SupplementWithIntakes,
  type TrainingDay,
} from '../domain/supplements';
import { db } from './database';
import { create, listActive, nowIso, softDelete, update } from './repository';
import {
  dayKeySchema,
  MAX_SUPPLEMENT_AMOUNT,
  supplementInputSchema,
  type SupplementInput,
} from './schemas';
import type { DayKey, Habit, Supplement, SupplementIntake } from './types';

const SUPPLEMENT_TABLES = [db.supplements, db.supplementIntakes];

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;

export type LoadedSupplement = SupplementWithIntakes<SupplementIntake>;

export interface SupplementOverview {
  /** Auch archivierte, in Listenreihenfolge */
  items: LoadedSupplement[];
  trainingDays: Map<DayKey, TrainingDay>;
}

function byOrder(a: Supplement, b: Supplement): number {
  return a.order - b.order || a.createdAt.localeCompare(b.createdAt);
}

/** Alle nicht gelöschten Supplements, auch archivierte */
export async function listSupplements(): Promise<Supplement[]> {
  return (await listActive(db.supplements)).sort(byOrder);
}

export async function loadSupplements(): Promise<LoadedSupplement[]> {
  const [supplements, intakes] = await Promise.all([
    listSupplements(),
    listActive(db.supplementIntakes),
  ]);
  return supplements.map((supplement) => ({
    supplement,
    intakes: intakes.filter((intake) => intake.supplementId === supplement.id),
  }));
}

/** `null` = gibt es nicht (mehr) */
export async function loadSupplement(id: string): Promise<LoadedSupplement | null> {
  const supplement = await db.supplements.get(id);
  if (!supplement || !isActive(supplement)) return null;
  const intakes = await db.supplementIntakes
    .where('supplementId')
    .equals(id)
    .filter(isActive)
    .toArray();
  return { supplement, intakes };
}

/**
 * Tage mit Training (laufende und beendete Workouts). Ausdauer = Workout mit Ausdauerübung,
 * Kraft = Workout mit Kraftübung oder noch ohne Übung. Schritt 13 ergänzt Ausdauer-Einheiten.
 */
export async function loadTrainingDays(): Promise<Map<DayKey, TrainingDay>> {
  const workouts = (await listActive(db.workouts)).sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt),
  );
  const items = await db.workoutExercises
    .where('workoutId')
    .anyOf(workouts.map((workout) => workout.id))
    .filter(isActive)
    .toArray();
  const exercises = await db.exercises.bulkGet([...new Set(items.map((i) => i.exerciseId))]);
  const categories = new Map(exercises.filter((e) => !!e).map((e) => [e.id, e.category]));
  const days = new Map<DayKey, TrainingDay>();
  for (const workout of workouts) {
    const kinds = items
      .filter((item) => item.workoutId === workout.id)
      .map((item) => categories.get(item.exerciseId));
    const date = dayKey(new Date(workout.startedAt));
    const day = days.get(date);
    days.set(date, {
      strength: !!day?.strength || kinds.length === 0 || kinds.includes('strength'),
      endurance: !!day?.endurance || kinds.includes('cardio'),
      startedAt: day?.startedAt ?? workout.startedAt,
      endedAt: workout.endedAt ?? day?.endedAt ?? null,
    });
  }
  return days;
}

export async function loadSupplementOverview(): Promise<SupplementOverview> {
  const [items, trainingDays] = await Promise.all([loadSupplements(), loadTrainingDays()]);
  return { items, trainingDays };
}

export async function createSupplement(input: SupplementInput): Promise<Supplement> {
  const values = supplementInputSchema.parse(input);
  return db.transaction('rw', db.supplements, async () => {
    const orders = (await listActive(db.supplements)).map((supplement) => supplement.order);
    return create<Supplement>(db.supplements, {
      ...values,
      order: Math.max(-1, ...orders) + 1,
      archivedAt: null,
    });
  });
}

/** Einnahmen gelöschter Dosen bleiben gespeichert, zählen aber nicht mehr */
export async function updateSupplement(id: string, input: SupplementInput): Promise<void> {
  await update(db.supplements, id, supplementInputSchema.parse(input));
}

export function reorderSupplements(ids: string[]): Promise<void> {
  return db.transaction('rw', db.supplements, async () => {
    for (const [order, id] of ids.entries()) await update(db.supplements, id, { order });
  });
}

export function deleteSupplement(id: string): Promise<void> {
  return db.transaction('rw', SUPPLEMENT_TABLES, async () => {
    const intakes = await db.supplementIntakes
      .where('supplementId')
      .equals(id)
      .filter(isActive)
      .toArray();
    for (const intake of intakes) await softDelete(db.supplementIntakes, intake.id);
    await softDelete(db.supplements, id);
  });
}

async function getSupplement(id: string): Promise<Supplement> {
  const supplement = await db.supplements.get(id);
  if (!supplement || !isActive(supplement)) throw new Error(`Supplement ${id} nicht gefunden`);
  return supplement;
}

export async function setSupplementArchived(id: string, archived: boolean): Promise<void> {
  await db.transaction('rw', db.supplements, async () => {
    await getSupplement(id);
    await update(db.supplements, id, { archivedAt: archived ? nowIso() : null });
  });
}

function clampStock(stock: number): number {
  return Math.min(MAX_SUPPLEMENT_AMOUNT, Math.max(0, Math.round(stock * 100) / 100));
}

/** `null` = Bestand nicht mehr erfassen */
export async function setSupplementStock(id: string, stock: number | null): Promise<void> {
  await db.transaction('rw', db.supplements, async () => {
    await getSupplement(id);
    await update(db.supplements, id, { stock: stock === null ? null : clampStock(stock) });
  });
}

/** Neue Packung: addiert `amount` (Standard Packungsgröße) zum Bestand */
export async function refillSupplement(id: string, amount?: number): Promise<void> {
  await db.transaction('rw', db.supplements, async () => {
    const supplement = await getSupplement(id);
    const added = amount ?? supplement.packageSize;
    if (!added || added <= 0) throw new Error('Keine Packungsgröße angegeben');
    await update(db.supplements, id, { stock: clampStock((supplement.stock ?? 0) + added) });
  });
}

/**
 * Setzt den Zielzustand einer Dosis an einem Tag (doppeltes Tippen bleibt ohne Wirkung).
 * Genommen zieht die Dosis vom Bestand ab (nie unter 0), Zurücknehmen bucht genau das zurück.
 */
export async function setSupplementTaken(
  supplementId: string,
  doseId: string,
  date: DayKey,
  taken: boolean,
): Promise<void> {
  const key = dayKeySchema.parse(date);
  await db.transaction('rw', SUPPLEMENT_TABLES, async () => {
    const supplement = await getSupplement(supplementId);
    const existing = await db.supplementIntakes
      .where('supplementId')
      .equals(supplementId)
      .filter((intake) => intake.doseId === doseId && intake.date === key && isActive(intake))
      .first();
    if (taken === !!existing) return;
    if (existing) {
      await softDelete(db.supplementIntakes, existing.id);
      if (supplement.stock !== null && existing.stockDeducted > 0) {
        await update(db.supplements, supplementId, {
          stock: clampStock(supplement.stock + existing.stockDeducted),
        });
      }
      return;
    }
    const dose = supplement.doses.find((item) => item.id === doseId);
    if (!dose) throw new Error(`Einnahme ${doseId} nicht gefunden`);
    const deducted = supplement.stock === null ? 0 : Math.min(supplement.stock, dose.amount);
    await create<SupplementIntake>(db.supplementIntakes, {
      supplementId,
      doseId,
      date: key,
      amount: dose.amount,
      takenAt: nowIso(),
      stockDeducted: deducted,
    });
    if (deducted > 0) {
      await update(db.supplements, supplementId, {
        stock: clampStock((supplement.stock ?? 0) - deducted),
      });
    }
  });
}

/** Gewohnheiten (Unterpunkte oder Zählen), die sich übernehmen lassen */
export async function listSupplementHabitCandidates(): Promise<Habit[]> {
  const habits = await listActive(db.habits);
  return habits
    .filter(isSupplementHabitCandidate)
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

/**
 * Übernimmt eine Gewohnheit als Supplements: Unterpunkte werden zu Supplements, bisherige Mengen zu
 * Einnahmen (ohne Bestand). Die Gewohnheit wird archiviert, ihr Verlauf bleibt.
 */
export function importSupplementsFromHabit(habitId: string): Promise<Supplement[]> {
  return db.transaction(
    'rw',
    [db.habits, db.habitChecks, db.supplements, db.supplementIntakes],
    async () => {
      const habit = await db.habits.get(habitId);
      if (!habit || !isActive(habit) || !isSupplementHabitCandidate(habit)) {
        throw new Error('Gewohnheit lässt sich nicht übernehmen');
      }
      const checks = await db.habitChecks
        .where('habitId')
        .equals(habitId)
        .filter(isActive)
        .toArray();
      const created: Supplement[] = [];
      for (const conversion of supplementsFromHabit(habit)) {
        const supplement = await createSupplement({
          name: conversion.name,
          unit: conversion.unit,
          doses: [conversion.dose],
          schedule: conversion.schedule,
          weekdays: conversion.weekdays,
          trainingKind: 'any',
          stock: null,
          packageSize: null,
          notes: '',
        });
        for (const check of checks.filter((c) => c.itemId === conversion.itemId)) {
          await create<SupplementIntake>(db.supplementIntakes, {
            supplementId: supplement.id,
            doseId: conversion.dose.id,
            date: check.date,
            amount: check.amount,
            takenAt: check.updatedAt,
            stockDeducted: 0,
          });
        }
        created.push(supplement);
      }
      await update(db.habits, habitId, { archivedAt: nowIso() });
      return created;
    },
  );
}
