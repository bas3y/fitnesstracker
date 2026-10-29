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
  /** Standard-Pausenzeit nach einem abgehakten Satz */
  restTimerSeconds: number;
  restTimerSound: boolean;
  restTimerVibrate: boolean;
}

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
}

export interface WorkoutExercise extends BaseEntity {
  workoutId: string;
  exerciseId: string;
  order: number;
}

export interface WorkoutSet extends BaseEntity {
  workoutId: string;
  workoutExerciseId: string;
  order: number;
  /** kg; bei Körpergewichtsübungen Zusatzgewicht (negativ = Unterstützung) */
  weight: number | null;
  /** Stufe an der Maschine statt Gewicht (dann `weight = null`) */
  level: number | null;
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
