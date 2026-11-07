import type { GoalHabit } from '../domain/goals';
import type { StatsSession, StatsSet } from '../domain/stats';
import type { MotivationData } from '../domain/streaks';

/** Leere Daten für Serien und Abzeichen; einzelne Felder per Spread überschreiben */
export const EMPTY_MOTIVATION: MotivationData = {
  strength: [],
  endurance: [],
  weights: [],
  logs: [],
  dailyGoals: { stepsGoal: 10_000, waterGoalMl: 2500, sleepGoalSeconds: 8 * 3600 },
  habits: [],
  entries: [],
  reading: [],
  finishedBooks: [],
  timerSessions: [],
  journalDays: [],
  quickProtein: [],
  meals: [],
  supplements: [],
  trainingDays: new Map(),
  nutritionGoals: {
    training: { kcal: 2500, protein: 150, carbs: null, fat: null },
    rest: { kcal: 2200, protein: 120, carbs: null, fat: null },
  },
  trainingWeekTarget: 2,
  bodyWeightKg: 80,
  photoDays: [],
};

export const statsSet = (values: Partial<StatsSet> = {}): StatsSet => ({
  weight: 100,
  level: null,
  eccentricWeight: null,
  eccentricLevel: null,
  reps: 5,
  durationSeconds: null,
  isWarmup: false,
  workoutExerciseId: 'item',
  completedAt: '2026-10-01T10:00:00.000Z',
  ...values,
});

/** Bankdrücken an einem Tag (ein Workout je Tag) */
export const benchSession = (day: string, sets: StatsSet[] = [statsSet()]): StatsSession => ({
  workoutId: `w-${day}`,
  startedAt: new Date(`${day}T18:00:00`).toISOString(),
  exercise: {
    id: 'bench',
    name: 'Bankdrücken',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    equipment: 'barbell',
    isTimed: false,
  },
  sets,
});

export const motivationHabit = (
  values: Partial<GoalHabit> & Pick<GoalHabit, 'id' | 'kind'>,
): GoalHabit => ({
  name: 'Gewohnheit',
  icon: '✅',
  target: 1,
  unit: '',
  step: 1,
  items: [],
  startDate: null,
  pauses: [],
  archivedAt: null,
  frequency: 'daily',
  timesPerWeek: 1,
  weekdays: [],
  ...values,
});
