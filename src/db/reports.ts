import { goalName, goalsAchievedIn, goalSubject } from '../domain/goals';
import type { PeriodReportData } from '../domain/pdf/periodReport';
import type { ExerciseReportData } from '../domain/pdf/statsReports';
import { comparisonRange, periodRange, type CalendarPeriod } from '../domain/periods';
import type { ReviewUnits } from '../domain/reviewRows';
import { db } from './database';
import { loadGoalData, listGoals } from './goals';
import { getBodyWeightKg, loadFinishedExerciseSessions } from './records';
import { loadReviewInput } from './review';
import { getSettings } from './settings';
import type { DayKey, Exercise } from './types';

async function loadUnits(): Promise<ReviewUnits> {
  const settings = await getSettings();
  return {
    weightUnit: settings?.weightUnit ?? 'kg',
    distanceUnit: settings?.distanceUnit ?? 'km',
    proteinOnly: settings?.proteinOnly ?? false,
  };
}

/** Alles für den Bericht über den Zeitraum, in dem `day` liegt */
export async function loadPeriodReport(
  period: CalendarPeriod,
  day: DayKey,
  today: DayKey,
): Promise<Omit<PeriodReportData, 'createdAt' | 'theme'>> {
  const range = periodRange(period, day);
  const compare = comparisonRange(period, range, today);
  const [input, units, goals, goalData] = await Promise.all([
    loadReviewInput(compare.from, range.to),
    loadUnits(),
    listGoals(),
    loadGoalData(),
  ]);
  const exerciseIds = [
    ...new Set(goals.flatMap((goal) => (goal.exerciseId ? [goal.exerciseId] : []))),
  ];
  const exercises = new Map(
    (await db.exercises.bulkGet(exerciseIds)).flatMap((exercise): [string, Exercise][] =>
      exercise ? [[exercise.id, exercise]] : [],
    ),
  );
  return {
    period,
    range,
    compare,
    today,
    input,
    units,
    goals:
      goals.length === 0
        ? null
        : goalsAchievedIn(goals, goalData, range, today).map(({ goal, on }) => ({
            name: goalName(goal, goalSubject(goal, exercises, goalData), units),
            on,
          })),
  };
}

/** Einheiten einer Übung für die Übungsstatistik */
export async function loadExerciseReport(
  exercise: ExerciseReportData['exercise'] & Pick<Exercise, 'id'>,
): Promise<Pick<ExerciseReportData, 'exercise' | 'sessions' | 'weightUnit' | 'bodyWeightKg'>> {
  const [sessions, units, bodyWeightKg] = await Promise.all([
    loadFinishedExerciseSessions(exercise.id),
    loadUnits(),
    getBodyWeightKg(),
  ]);
  return {
    exercise,
    sessions: sessions.map(({ workout, sets }) => ({ startedAt: workout.startedAt, sets })),
    weightUnit: units.weightUnit,
    bodyWeightKg,
  };
}
