import { loadBodyWeights } from './daily';
import { db } from './database';
import { listEnduranceSessions } from './endurance';
import { create, listActive, softDelete, update } from './repository';
import { goalInputSchema, type GoalInput } from './schemas';
import { loadStatsSessions } from './stats';
import type { Goal } from './types';
import type { GoalData } from '../domain/goals';

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

export function deleteGoal(id: string): Promise<void> {
  return softDelete(db.goals, id);
}

/** Alles, woraus der Fortschritt der Ziele berechnet wird */
export async function loadGoalData(): Promise<GoalData> {
  const [strength, endurance, weights] = await Promise.all([
    loadStatsSessions(),
    listEnduranceSessions(),
    loadBodyWeights(),
  ]);
  return { strength, endurance, weights };
}
