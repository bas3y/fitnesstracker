import { db } from './database';
import { create, listActive, softDelete, update } from './repository';
import { dayKeySchema, habitInputSchema, type HabitInput } from './schemas';
import type { DayKey, Habit, HabitCheck } from './types';

const HABIT_TABLES = [db.habits, db.habitChecks];

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;

export interface HabitWithChecks {
  habit: Habit;
  /** Erledigte Tage */
  dates: DayKey[];
}

function byOrder(a: Habit, b: Habit): number {
  return a.order - b.order || a.createdAt.localeCompare(b.createdAt);
}

export async function listHabits(): Promise<Habit[]> {
  return (await listActive(db.habits)).sort(byOrder);
}

/** Alle Gewohnheiten in Anzeigereihenfolge mit ihren erledigten Tagen */
export async function loadHabits(): Promise<HabitWithChecks[]> {
  const [habits, checks] = await Promise.all([listHabits(), listActive(db.habitChecks)]);
  return habits.map((habit) => ({
    habit,
    dates: checks.filter((check) => check.habitId === habit.id).map((check) => check.date),
  }));
}

/** `null` = gibt es nicht (mehr) */
export async function loadHabit(id: string): Promise<HabitWithChecks | null> {
  const habit = await db.habits.get(id);
  if (!habit || habit.deletedAt !== null) return null;
  const checks = await db.habitChecks.where('habitId').equals(id).filter(isActive).toArray();
  return { habit, dates: checks.map((check) => check.date) };
}

export async function createHabit(input: HabitInput): Promise<Habit> {
  const values = habitInputSchema.parse(input);
  return db.transaction('rw', db.habits, async () => {
    const orders = (await listActive(db.habits)).map((habit) => habit.order);
    return create<Habit>(db.habits, { ...values, order: Math.max(-1, ...orders) + 1 });
  });
}

export async function updateHabit(id: string, input: HabitInput): Promise<void> {
  await update(db.habits, id, habitInputSchema.parse(input));
}

export function reorderHabits(ids: string[]): Promise<void> {
  return db.transaction('rw', db.habits, async () => {
    for (const [order, id] of ids.entries()) await update(db.habits, id, { order });
  });
}

export function deleteHabit(id: string): Promise<void> {
  return db.transaction('rw', HABIT_TABLES, async () => {
    const checks = await db.habitChecks.where('habitId').equals(id).filter(isActive).toArray();
    for (const check of checks) await softDelete(db.habitChecks, check.id);
    await softDelete(db.habits, id);
  });
}

function activeCheck(habitId: string, date: DayKey): Promise<HabitCheck | undefined> {
  return db.habitChecks
    .where('habitId')
    .equals(habitId)
    .filter((check) => check.date === date && isActive(check))
    .first();
}

/** Setzt den Zielzustand statt umzuschalten: Doppeltes Tippen bleibt so ohne Wirkung */
export async function setHabitChecked(
  habitId: string,
  date: DayKey,
  checked: boolean,
): Promise<void> {
  const key = dayKeySchema.parse(date);
  await db.transaction('rw', db.habitChecks, async () => {
    const existing = await activeCheck(habitId, key);
    if (checked && !existing) await create<HabitCheck>(db.habitChecks, { habitId, date: key });
    if (!checked && existing) await softDelete(db.habitChecks, existing.id);
  });
}
