import { enduranceSessionsToCsv, workoutsToCsv } from '../domain/csv';
import { sessionDay } from '../domain/endurance';
import { ENDURANCE_SPORT_LABELS } from '../domain/labels';
import { fileSlug } from '../domain/report';
import { toDateInput } from '../domain/workout';
import { listEnduranceSessions } from './endurance';
import { loadStatsSessions } from './stats';
import type { DayKey, DistanceUnit, EnduranceSport, Exercise, WeightUnit } from './types';
import { listWorkoutHistory } from './workouts';

/**
 * Alle beendeten Workouts (oder nur die Sätze einer Übung) als CSV-Datei;
 * `null`, solange es keine abgehakten Sätze gibt
 */
export async function createWorkoutsCsvFile(
  unit: WeightUnit,
  date = new Date(),
  exercise?: Pick<Exercise, 'id' | 'name'>,
): Promise<File | null> {
  const [workouts, all] = await Promise.all([listWorkoutHistory(), loadStatsSessions()]);
  const sessions = exercise ? all.filter((session) => session.exercise.id === exercise.id) : all;
  if (sessions.length === 0) return null;
  const name = `basey-${exercise ? fileSlug(exercise.name) : 'workouts'}-${toDateInput(date.toISOString())}.csv`;
  return new File([workoutsToCsv(workouts, sessions, unit)], name, { type: 'text/csv' });
}

/** z. B. `basey-ausdauer-laufen-2026-11-10` (ohne Endung) */
export function enduranceFileName(sport: EnduranceSport | null, date: Date): string {
  const name = sport ? fileSlug(ENDURANCE_SPORT_LABELS[sport].name) : 'alle';
  return `basey-ausdauer-${name}-${toDateInput(date.toISOString())}`;
}

/** Ausdauer-Einheiten (optional einer Sportart, ab `from`) als CSV; `null` ohne Einheiten */
export async function createEnduranceCsvFile(
  unit: DistanceUnit,
  { sport, from }: { sport: EnduranceSport | null; from: DayKey | null },
  date = new Date(),
): Promise<File | null> {
  const sessions = (await listEnduranceSessions()).filter(
    (session) => (!sport || session.sport === sport) && (!from || sessionDay(session) >= from),
  );
  if (sessions.length === 0) return null;
  const name = `${enduranceFileName(sport, date)}.csv`;
  return new File([enduranceSessionsToCsv(sessions, unit)], name, { type: 'text/csv' });
}
