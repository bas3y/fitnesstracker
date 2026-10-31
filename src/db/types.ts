/** ISO-8601-Zeitstempel, z. B. `2026-10-28T09:15:00.000Z` */
export type Timestamp = string;

export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Soft-Delete: `null` = aktiv */
  deletedAt: Timestamp | null;
}

export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'km' | 'mi';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings extends BaseEntity {
  name: string;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  bodyWeightKg: number | null;
  theme: ThemePreference;
  lastBackupAt: Timestamp | null;
  /** Stand der mitgelieferten Daten (`0` = noch nicht eingespielt) */
  seedVersion: number;
  /** Aus = nach dem Abhaken startet kein Timer, auch nicht mit der Pausenzeit eines Plans */
  restTimerEnabled: boolean;
  /** Standard-Pausenzeit nach einem abgehakten Satz */
  restTimerSeconds: number;
  restTimerSound: boolean;
  restTimerVibrate: boolean;
  /** Erweiterter Modus: Auswirkung der Satzpausen in der Statistik anzeigen */
  restAnalysisEnabled: boolean;
  /** Plan, aus dem das heutige Training vorgeschlagen wird */
  activePlanId: string | null;
  /** Sichtbare Widgets auf dem Dashboard, in Anzeigereihenfolge */
  dashboardWidgets: DashboardWidget[];
  // Tagesziele
  stepsGoal: number;
  waterGoalMl: number;
  sleepGoalSeconds: number;
}

export const DASHBOARD_WIDGETS = [
  'week',
  'lastWorkout',
  'records',
  'activity',
  'nextTraining',
  'daily',
] as const;
export type DashboardWidget = (typeof DASHBOARD_WIDGETS)[number];
export const DEFAULT_DASHBOARD_WIDGETS: readonly DashboardWidget[] = [
  'week',
  'lastWorkout',
  'records',
  'activity',
];

/** `builtin` = aus `src/data/`, wird per Seed aktualisiert; `user` = selbst angelegt, nie überschrieben */
export type DataSource = 'builtin' | 'user';

export const EXERCISE_CATEGORIES = ['strength', 'cardio', 'mobility'] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const MUSCLE_GROUPS = [
  'chest',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'lats',
  'upperBack',
  'traps',
  'lowerBack',
  'neck',
  'abs',
  'glutes',
  'quads',
  'hamstrings',
  'adductors',
  'abductors',
  'calves',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'kettlebell',
  'ezBar',
  'trapBar',
  'cable',
  'machine',
  'smith',
  'bodyweight',
  'bands',
  'medicineBall',
  'exerciseBall',
  'foamRoller',
  'other',
  'none',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export interface Exercise extends BaseEntity {
  source: DataSource;
  /** Stabiler Schlüssel aus `exercises.json`, `null` bei eigenen Übungen */
  builtinKey: string | null;
  name: string;
  aliases: string[];
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  isUnilateral: boolean;
  /** Dauer statt Wiederholungen erfassen (Halteübungen, Ausdauer, Dehnen) */
  isTimed: boolean;
  // Nutzerangaben – werden vom Seed nie überschrieben
  isFavorite: boolean;
  /** Vom Nutzer ausgeblendet (getrennt von `deletedAt`, das der Seed für entfernte Einträge setzt) */
  hiddenAt: Timestamp | null;
  notes: string;
  /** Belastung als Gewicht oder als Stufe (Maschinen ohne kg-Anzeige); zuletzt gewählte Variante */
  loadType: LoadType;
}

export const LOAD_TYPES = ['weight', 'level'] as const;
export type LoadType = (typeof LOAD_TYPES)[number];

/** Geräte, bei denen „Stufe“ statt Gewicht angeboten wird */
export const LEVEL_EQUIPMENT: readonly Equipment[] = [
  'machine',
  'cable',
  'smith',
  'bands',
  'other',
];

export interface Workout extends BaseEntity {
  startedAt: Timestamp;
  /** `null` = läuft noch (höchstens ein laufendes Workout) */
  endedAt: Timestamp | null;
  notes: string;
  /** Ende des laufenden Pausen-Timers; über den Zeitstempel läuft er auch nach Neustart weiter */
  restEndsAt: Timestamp | null;
  /** Herkunft aus einem Trainingsplan; `null` = freies Training */
  planId: string | null;
  planDayId: string | null;
}

export interface WorkoutExercise extends BaseEntity {
  workoutId: string;
  exerciseId: string;
  order: number;
  // Zielwerte aus dem Plan (Kopie, damit spätere Planänderungen das Workout nicht berühren)
  repMin: number | null;
  repMax: number | null;
  targetDurationSeconds: number | null;
  /** Pausenzeit dieser Übung; `null` = Standard aus den Einstellungen */
  restSeconds: number | null;
}

export interface WorkoutSet extends BaseEntity {
  workoutId: string;
  workoutExerciseId: string;
  order: number;
  /** kg; bei Körpergewichtsübungen Zusatzgewicht (negativ = Unterstützung) */
  weight: number | null;
  /** Stufe an der Maschine statt Gewicht (dann `weight = null`) */
  level: number | null;
  /** Gewicht (kg) bzw. Stufe in der negativen Phase, falls die Maschine dort mehr gibt */
  eccentricWeight: number | null;
  eccentricLevel: number | null;
  reps: number | null;
  /** Halteübungen statt Wiederholungen */
  durationSeconds: number | null;
  rpe: number | null;
  rir: number | null;
  isWarmup: boolean;
  /** Pausenzeit, mit der der Timer nach diesem Satz gestartet wurde */
  restSeconds: number | null;
  /** `null` = noch nicht abgehakt */
  completedAt: Timestamp | null;
}

export const PLAN_SCHEDULES = ['rotation', 'weekdays'] as const;
/** `rotation` = Trainings der Reihe nach, `weekdays` = feste Wochentage */
export type PlanSchedule = (typeof PLAN_SCHEDULES)[number];

export interface Plan extends BaseEntity {
  name: string;
  schedule: PlanSchedule;
  order: number;
}

export interface PlanDay extends BaseEntity {
  planId: string;
  name: string;
  order: number;
  /** Wochentage wie `Date.getDay()` (0 = Sonntag); nur bei `schedule: 'weekdays'` wirksam */
  weekdays: number[];
}

export interface PlanExercise extends BaseEntity {
  planId: string;
  planDayId: string;
  exerciseId: string;
  order: number;
  targetSets: number;
  /** Aufwärmsätze vor den Arbeitssätzen (zählen nicht zu `targetSets`) */
  warmupSets: number;
  repMin: number;
  repMax: number;
  /** Nur Halteübungen */
  targetDurationSeconds: number | null;
  /** `null` = Standard aus den Einstellungen */
  restSeconds: number | null;
}

/** Lokaler Tag als `YYYY-MM-DD` */
export type DayKey = string;

/** Ein aktiver Eintrag je Tag; `null` = nicht erfasst */
export interface DailyLog extends BaseEntity {
  date: DayKey;
  steps: number | null;
  waterMl: number | null;
  sleepSeconds: number | null;
  /** 1–5 */
  sleepQuality: number | null;
  weightKg: number | null;
  /** 1–5 */
  mood: number | null;
  /** 1–5 */
  energy: number | null;
}

export const BODY_MEASURES = ['neck', 'chest', 'waist', 'hips', 'arm', 'thigh', 'calf'] as const;
export type BodyMeasure = (typeof BODY_MEASURES)[number];

/** Ein aktiver Eintrag je Tag; nur gemessene Stellen, Werte in Metern */
export interface BodyMeasurement extends BaseEntity {
  date: DayKey;
  values: Partial<Record<BodyMeasure, number>>;
}

export const HABIT_FREQUENCIES = ['daily', 'weekly', 'weekdays'] as const;
/** `daily` = jeden Tag, `weekly` = x-mal pro Woche, `weekdays` = feste Wochentage */
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

export const HABIT_GROUPS = ['morning', 'evening', 'other'] as const;
export type HabitGroup = (typeof HABIT_GROUPS)[number];

export interface Habit extends BaseEntity {
  name: string;
  /** Emoji */
  icon: string;
  frequency: HabitFrequency;
  /** Nur bei `frequency: 'weekly'` wirksam */
  timesPerWeek: number;
  /** Wie `Date.getDay()`; nur bei `frequency: 'weekdays'` wirksam */
  weekdays: number[];
  group: HabitGroup;
  order: number;
}

/** Eine Gewohnheit an einem Tag erledigt; höchstens ein aktiver Eintrag je Gewohnheit und Tag */
export interface HabitCheck extends BaseEntity {
  habitId: string;
  date: DayKey;
}

export const FOOD_CATEGORIES = [
  'fruit',
  'vegetables',
  'legumes',
  'grains',
  'bread',
  'dairy',
  'eggs',
  'meat',
  'sausage',
  'fish',
  'nuts',
  'fats',
  'sweets',
  'beverages',
  'protein',
  'condiments',
  'dishes',
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export interface FoodPortion {
  label: string;
  grams: number;
}

/** Nährwerte pro 100 g; Kohlenhydrate wie in der EU ohne Ballaststoffe */
export interface Food extends BaseEntity {
  source: DataSource;
  builtinKey: string | null;
  name: string;
  aliases: string[];
  category: FoodCategory;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  alcohol: number;
  portions: FoodPortion[];
  /** Herkunft, z. B. `usda:171688`, `manual` oder `null` bei eigenen Lebensmitteln */
  sourceRef: string | null;
}
