import { dayKey } from '../domain/daily';
import type { GoalData } from '../domain/goals';
import { listDailyLogs, loadBodyWeights } from './daily';
import { db } from './database';
import { listEnduranceSessions } from './endurance';
import { loadHabits } from './habits';
import { listBooks, listReadingLogs } from './reading';
import { create, listActive, nowIso, softDelete, update } from './repository';
import {
  DAILY_GOAL_DEFAULTS,
  goalInputSchema,
  MAX_GOAL_ENTRY_AMOUNT,
  type GoalInput,
} from './schemas';
import { getSettings } from './settings';
import { loadStatsSessions } from './stats';
import type { DayKey, Goal, GoalEntry } from './types';

/** Älteste zuerst */
export async function listGoals(): Promise<Goal[]> {
  return (await listActive(db.goals)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function loadGoal(id: string): Promise<Goal | null> {
  const goal = await db.goals.get(id);
  return goal && goal.deletedAt === null ? goal : null;
}

export async function createGoal(input: GoalInput): Promise<Goal> {
  return create<Goal>(db.goals, goalInputSchema.parse(input));
}

export async function updateGoal(id: string, input: GoalInput): Promise<void> {
  await update(db.goals, id, goalInputSchema.parse(input));
}

/** Weich gelöscht, samt eingetragenem Fortschritt */
export function deleteGoal(id: string): Promise<void> {
  return db.transaction('rw', db.goals, db.goalEntries, async () => {
    await softDelete(db.goals, id);
    const now = nowIso();
    await db.goalEntries
      .where('goalId')
      .equals(id)
      .filter((entry) => entry.deletedAt === null)
      .modify({ deletedAt: now, updatedAt: now });
  });
}

// ---------- Eigene Ziele: Fortschritt eintragen ----------

function activeEntries(goalId: string): Promise<GoalEntry[]> {
  return db.goalEntries
    .where('goalId')
    .equals(goalId)
    .filter((entry) => entry.deletedAt === null)
    .toArray();
}

export async function addGoalEntry(
  goalId: string,
  amount: number,
  date: DayKey = dayKey(new Date()),
): Promise<GoalEntry> {
  if (!(amount > 0) || amount > MAX_GOAL_ENTRY_AMOUNT) throw new Error('Ungültige Menge');
  return create<GoalEntry>(db.goalEntries, { goalId, date, amount });
}

/** Nimmt den zuletzt eingetragenen Fortschritt zurück; `false` = es gab keinen */
export function undoGoalEntry(goalId: string): Promise<boolean> {
  return db.transaction('rw', db.goalEntries, async () => {
    const entries = await activeEntries(goalId);
    const last = entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1);
    if (!last) return false;
    await softDelete(db.goalEntries, last.id);
    return true;
  });
}

/** Ja/Nein-Ziel abhaken bzw. zurücknehmen */
export function setGoalChecked(
  goalId: string,
  checked: boolean,
  date: DayKey = dayKey(new Date()),
): Promise<void> {
  return db.transaction('rw', db.goalEntries, async () => {
    const entries = await activeEntries(goalId);
    if (checked) {
      if (entries.length === 0) await addGoalEntry(goalId, 1, date);
      return;
    }
    for (const entry of entries) await softDelete(db.goalEntries, entry.id);
  });
}

// ---------- Laden ----------

/** Alles außer dem Training (das lädt die Startseite ohnehin) */
export async function loadGoalExtras(): Promise<Omit<GoalData, 'strength' | 'endurance'>> {
  const [weights, logs, settings, habits, entries, readingLogs, books, timerSessions] =
    await Promise.all([
      loadBodyWeights(),
      listDailyLogs(),
      getSettings(),
      loadHabits(),
      listActive(db.goalEntries),
      listReadingLogs(),
      listBooks(),
      listActive(db.timerSessions),
    ]);
  return {
    timerSessions,
    reading: readingLogs
      .map(({ date, pages }) => ({ date, value: pages }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    finishedBooks: books.flatMap((book) =>
      book.status === 'finished' && book.finishedOn ? [book.finishedOn] : [],
    ),
    weights,
    logs,
    dailyGoals: {
      stepsGoal: settings?.stepsGoal ?? DAILY_GOAL_DEFAULTS.stepsGoal,
      waterGoalMl: settings?.waterGoalMl ?? DAILY_GOAL_DEFAULTS.waterGoalMl,
      sleepGoalSeconds: settings?.sleepGoalSeconds ?? DAILY_GOAL_DEFAULTS.sleepGoalSeconds,
    },
    habits: habits.map(({ habit, entries: habitEntries }) => ({ habit, entries: habitEntries })),
    entries: entries
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
      .map(({ goalId, date, amount }) => ({ goalId, date, amount })),
  };
}

/** Alles, woraus der Fortschritt der Ziele berechnet wird */
export async function loadGoalData(): Promise<GoalData> {
  const [strength, endurance, extras] = await Promise.all([
    loadStatsSessions(),
    listEnduranceSessions(),
    loadGoalExtras(),
  ]);
  return { strength, endurance, ...extras };
}
