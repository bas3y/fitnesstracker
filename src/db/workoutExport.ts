import { workoutsToCsv } from '../domain/csv';
import { toDateInput } from '../domain/workout';
import { loadStatsSessions } from './stats';
import type { WeightUnit } from './types';
import { listWorkoutHistory } from './workouts';

/** Alle beendeten Workouts als CSV-Datei; `null`, solange es keine abgehakten Sätze gibt */
export async function createWorkoutsCsvFile(
  unit: WeightUnit,
  date = new Date(),
): Promise<File | null> {
  const [workouts, sessions] = await Promise.all([listWorkoutHistory(), loadStatsSessions()]);
  if (sessions.length === 0) return null;
  const name = `basey-workouts-${toDateInput(date.toISOString())}.csv`;
  return new File([workoutsToCsv(workouts, sessions, unit)], name, { type: 'text/csv' });
}
