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
