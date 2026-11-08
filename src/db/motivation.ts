import { evaluateBadges } from '../domain/badges';
import { celebrate, type CelebrationResult } from '../domain/celebrations';
import { dayKey } from '../domain/daily';
import { goalName, goalProgress, goalSubject } from '../domain/goals';
import type { MotivationData } from '../domain/streaks';
import { db } from './database';
import { listGoals, loadGoalData } from './goals';
import { listJournalEntries } from './journal';
import { listActive, update } from './repository';
import {
  NUTRITION_GOAL_DEFAULTS,
  TRAINING_WEEK_TARGET_DEFAULT,
  trainingWeekTargetSchema,
} from './schemas';
import { ensureSettings, getSettings, SETTINGS_ID, updateSettings } from './settings';
import { loadSupplements, loadTrainingDays } from './supplements';
import type { DayKey, Exercise, Goal } from './types';

export interface Motivation {
  data: MotivationData;
  goals: Goal[];
}

/** Alles für Serien, Abzeichen und die Erfolgs-Hinweise */
export async function loadMotivation(): Promise<Motivation> {
  const [
    goalData,
    goals,
    journal,
    quickProtein,
    meals,
    supplements,
    trainingDays,
    settings,
    photos,
  ] = await Promise.all([
    loadGoalData(),
    listGoals(),
    listJournalEntries(),
    db.dailyLogs.filter((log) => log.deletedAt === null && log.proteinGrams !== null).toArray(),
    listActive(db.mealEntries),
    loadSupplements(),
    loadTrainingDays(),
    getSettings(),
    listActive(db.progressPhotos),
  ]);
  return {
    goals,
    data: {
      ...goalData,
      journalDays: journal.filter((entry) => entry.kind === 'day').map((entry) => entry.date),
      quickProtein: quickProtein.map(({ date, proteinGrams }) => ({ date, proteinGrams })),
      meals,
      supplements,
      trainingDays,
      nutritionGoals: settings?.nutritionGoals ?? NUTRITION_GOAL_DEFAULTS,
      trainingWeekTarget: settings?.trainingWeekTarget ?? TRAINING_WEEK_TARGET_DEFAULT,
      bodyWeightKg: settings?.bodyWeightKg ?? null,
      photoDays: photos.map((photo) => photo.date),
    },
  };
}

export async function setTrainingWeekTarget(target: number): Promise<void> {
  await updateSettings({ trainingWeekTarget: trainingWeekTargetSchema.parse(target) });
}

/** Übungen der Kraftziele (auch ausgeblendete) für die Namen */
async function goalExercises(goals: readonly Goal[]): Promise<Map<string, Exercise>> {
  const ids = [...new Set(goals.flatMap((goal) => (goal.exerciseId ? [goal.exerciseId] : [])))];
  const exercises = await db.exercises.bulkGet(ids);
  return new Map(exercises.flatMap((e): [string, Exercise][] => (e ? [[e.id, e]] : [])));
}

/**
 * Gleicht neu erreichte Abzeichen und Ziele mit den schon gemeldeten ab und merkt sie sich.
 * Liefert den Hinweis, falls es etwas Neues gibt (der erste Abgleich meldet nichts).
 */
export async function checkCelebrations(
  today: DayKey = dayKey(new Date()),
): Promise<CelebrationResult['toast']> {
  const [{ data, goals }, settings] = await Promise.all([loadMotivation(), ensureSettings()]);
  const exercises = await goalExercises(goals);
  const items = goals.map((goal) => {
    const subject = goalSubject(goal, exercises, data);
    return {
      goal,
      progress: goalProgress(goal, data, today),
      name: goalName(goal, subject, settings),
    };
  });
  const result = celebrate(
    settings.celebrations,
    evaluateBadges(data, goals, today),
    items,
    settings,
  );
  if (!result.changed) return null;
  // Erneut lesen: Zwei gleichzeitige Abgleiche melden denselben Erfolg nur einmal
  return db.transaction('rw', db.settings, async () => {
    const current = await ensureSettings();
    if (JSON.stringify(current.celebrations) !== JSON.stringify(settings.celebrations)) {
      return null;
    }
    await update(db.settings, SETTINGS_ID, { celebrations: result.next });
    return result.toast;
  });
}
