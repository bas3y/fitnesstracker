import { dayKey } from '../domain/daily';
import { doneDates, endPause, startPause, type HabitEntry } from '../domain/habits';
import { db } from './database';
import { create, listActive, nowIso, softDelete, update } from './repository';
import { dayKeySchema, habitInputSchema, MAX_HABIT_AMOUNT, type HabitInput } from './schemas';
import type { DayKey, Habit, HabitCheck } from './types';

const HABIT_TABLES = [db.habits, db.habitChecks];

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;

export interface HabitWithChecks {
  habit: Habit;
  /** Mengen je Tag (und Unterpunkt) */
  entries: HabitEntry[];
  /** Erledigte Tage (bei `quit` leer) */
  dates: DayKey[];
}

function byOrder(a: Habit, b: Habit): number {
  return a.order - b.order || a.createdAt.localeCompare(b.createdAt);
}

function withChecks(habit: Habit, checks: HabitCheck[]): HabitWithChecks {
  const entries = checks.map(({ date, itemId, amount }) => ({ date, itemId, amount }));
  return { habit, entries, dates: doneDates(habit, entries) };
}

/** Alle nicht gelöschten Gewohnheiten, auch archivierte */
export async function listHabits(): Promise<Habit[]> {
  return (await listActive(db.habits)).sort(byOrder);
}

/** Alle Gewohnheiten (auch archivierte) in Anzeigereihenfolge mit ihren Mengen */
export async function loadHabits(): Promise<HabitWithChecks[]> {
  const [habits, checks] = await Promise.all([listHabits(), listActive(db.habitChecks)]);
  return habits.map((habit) =>
    withChecks(
      habit,
      checks.filter((check) => check.habitId === habit.id),
    ),
  );
}

/** `null` = gibt es nicht (mehr) */
export async function loadHabit(id: string): Promise<HabitWithChecks | null> {
  const habit = await db.habits.get(id);
  if (!habit || habit.deletedAt !== null) return null;
  const checks = await db.habitChecks.where('habitId').equals(id).filter(isActive).toArray();
  return withChecks(habit, checks);
}

export async function createHabit(input: HabitInput): Promise<Habit> {
  const values = habitInputSchema.parse(input);
  return db.transaction('rw', db.habits, async () => {
    const orders = (await listActive(db.habits)).map((habit) => habit.order);
    return create<Habit>(db.habits, {
      ...values,
      order: Math.max(-1, ...orders) + 1,
      pauses: [],
      archivedAt: null,
    });
  });
}

/** Mengen gelöschter Unterpunkte bleiben gespeichert, zählen aber nicht mehr */
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

async function changeHabit(id: string, change: (habit: Habit) => Partial<Habit>): Promise<void> {
  await db.transaction('rw', db.habits, async () => {
    const habit = await db.habits.get(id);
    if (!habit || habit.deletedAt !== null) throw new Error(`Gewohnheit ${id} nicht gefunden`);
    await update(db.habits, id, change(habit));
  });
}

/** Ab `date` (Standard heute) pausiert */
export function pauseHabit(id: string, date: DayKey = dayKey(new Date())): Promise<void> {
  return changeHabit(id, (habit) => ({
    pauses: startPause(habit.pauses, dayKeySchema.parse(date)),
  }));
}

/** Ab `date` (Standard heute) läuft die Gewohnheit wieder */
export function resumeHabit(id: string, date: DayKey = dayKey(new Date())): Promise<void> {
  return changeHabit(id, (habit) => ({ pauses: endPause(habit.pauses, dayKeySchema.parse(date)) }));
}

export function setHabitArchived(id: string, archived: boolean): Promise<void> {
  return changeHabit(id, () => ({ archivedAt: archived ? nowIso() : null }));
}

function activeCheck(
  habitId: string,
  itemId: string | null,
  date: DayKey,
): Promise<HabitCheck | undefined> {
  return db.habitChecks
    .where('habitId')
    .equals(habitId)
    .filter((check) => check.date === date && check.itemId === itemId && isActive(check))
    .first();
}

function clampAmount(amount: number): number {
  return Math.min(MAX_HABIT_AMOUNT, Math.max(0, Math.round(amount * 100) / 100));
}

/** Liest und schreibt die Menge im selben Schreibvorgang */
async function writeAmount(
  habitId: string,
  itemId: string | null,
  date: DayKey,
  next: (current: number) => number,
): Promise<void> {
  const key = dayKeySchema.parse(date);
  await db.transaction('rw', db.habitChecks, async () => {
    const existing = await activeCheck(habitId, itemId, key);
    const amount = clampAmount(next(existing?.amount ?? 0));
    if (existing && amount === 0) await softDelete(db.habitChecks, existing.id);
    else if (existing) await update(db.habitChecks, existing.id, { amount });
    else if (amount > 0) {
      await create<HabitCheck>(db.habitChecks, { habitId, itemId, date: key, amount });
    }
  });
}

/** Setzt die Menge (0 = kein Eintrag) */
export function setHabitAmount(
  habitId: string,
  date: DayKey,
  amount: number,
  itemId: string | null = null,
): Promise<void> {
  return writeAmount(habitId, itemId, date, () => amount);
}

/** Addiert (negativ = abziehen, nie unter 0); sicher bei schnellem Tippen */
export function addHabitAmount(
  habitId: string,
  date: DayKey,
  delta: number,
  itemId: string | null = null,
): Promise<void> {
  return writeAmount(habitId, itemId, date, (current) => current + delta);
}

/** Abhaken: Setzt den Zielzustand statt umzuschalten, doppeltes Tippen bleibt so ohne Wirkung */
export function setHabitChecked(habitId: string, date: DayKey, checked: boolean): Promise<void> {
  return setHabitAmount(habitId, date, checked ? 1 : 0);
}

/**
 * Ganzen Tag als erledigt oder offen setzen (Kalender): Ziel bzw. alle Unterpunkte voll oder leer.
 * Nicht für `quit`, dort werden nur Mengen eingetragen.
 */
export async function setHabitDone(habit: Habit, date: DayKey, done: boolean): Promise<void> {
  if (habit.kind === 'items') {
    await db.transaction('rw', db.habitChecks, async () => {
      for (const item of habit.items) {
        await setHabitAmount(habit.id, date, done ? item.target : 0, item.id);
      }
    });
  } else if (habit.kind !== 'quit') {
    await setHabitAmount(habit.id, date, done ? habit.target : 0);
  }
}
