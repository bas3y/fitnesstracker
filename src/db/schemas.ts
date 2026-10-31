import { z } from 'zod';
import {
  EQUIPMENT,
  EXERCISE_CATEGORIES,
  FOOD_CATEGORIES,
  HABIT_FREQUENCIES,
  HABIT_GROUPS,
  MUSCLE_GROUPS,
} from './types';

const nutrient = z.number().nonnegative();

/** Inhaltliche Felder einer Übung (ohne Metadaten) – für Backup und mitgelieferte Daten */
export const exerciseFieldsSchema = z.object({
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  category: z.enum(EXERCISE_CATEGORIES),
  primaryMuscles: z.array(z.enum(MUSCLE_GROUPS)),
  secondaryMuscles: z.array(z.enum(MUSCLE_GROUPS)),
  equipment: z.enum(EQUIPMENT),
  isUnilateral: z.boolean(),
  isTimed: z.boolean(),
});

export const foodFieldsSchema = z.object({
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  category: z.enum(FOOD_CATEGORIES),
  kcal: nutrient,
  protein: nutrient,
  carbs: nutrient,
  fat: nutrient,
  fiber: nutrient,
  sugar: nutrient,
  alcohol: nutrient,
  portions: z.array(z.object({ label: z.string().min(1), grams: z.number().positive() })),
  sourceRef: z.string().nullable(),
});

/** Formular „Eigene Übung“: Kraftübungen brauchen mind. eine Hauptmuskelgruppe (für Statistiken) */
export const exerciseInputSchema = exerciseFieldsSchema
  .extend({
    name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(80, 'Höchstens 80 Zeichen'),
    aliases: z.array(z.string().trim()).transform((list) => list.filter(Boolean)),
  })
  .refine((input) => input.category !== 'strength' || input.primaryMuscles.length > 0, {
    path: ['primaryMuscles'],
    message: 'Mindestens eine Hauptmuskelgruppe wählen',
  })
  .refine(
    (input) => input.primaryMuscles.every((muscle) => !input.secondaryMuscles.includes(muscle)),
    { path: ['secondaryMuscles'], message: 'Muskel ist bereits Hauptmuskel' },
  );

export type ExerciseInput = z.input<typeof exerciseInputSchema>;

export const EMPTY_EXERCISE_INPUT: ExerciseInput = {
  name: '',
  aliases: [],
  category: 'strength',
  primaryMuscles: [],
  secondaryMuscles: [],
  equipment: 'other',
  isUnilateral: false,
  isTimed: false,
};

/** Werte eines Satzes (intern kg/Sekunden); `null` = nicht angegeben */
export const setValuesSchema = z.object({
  weight: z.number().min(-500).max(1000).nullable(),
  level: z.number().min(0).max(100).nullable(),
  eccentricWeight: z.number().min(0).max(1000).nullable(),
  eccentricLevel: z.number().min(0).max(100).nullable(),
  reps: z.number().int().min(0).max(1000).nullable(),
  durationSeconds: z
    .number()
    .int()
    .min(0)
    .max(24 * 3600)
    .nullable(),
  rpe: z.number().min(1).max(10).multipleOf(0.5).nullable(),
  rir: z.number().int().min(0).max(10).nullable(),
  isWarmup: z.boolean(),
});

export type SetValues = z.infer<typeof setValuesSchema>;

/** Zielwerte einer Plan-Übung (intern Sekunden) */
export const planExerciseValuesSchema = z
  .object({
    targetSets: z.number().int().min(1).max(20),
    warmupSets: z.number().int().min(0).max(10),
    repMin: z.number().int().min(1).max(1000),
    repMax: z.number().int().min(1).max(1000),
    targetDurationSeconds: z
      .number()
      .int()
      .min(0)
      .max(24 * 3600)
      .nullable(),
    restSeconds: z.number().int().min(0).max(3600).nullable(),
  })
  .refine((values) => values.repMin <= values.repMax, {
    path: ['repMax'],
    message: 'Obergrenze muss mindestens so hoch wie die Untergrenze sein',
  });

export type PlanExerciseValues = z.infer<typeof planExerciseValuesSchema>;

export const MAX_STEPS = 200_000;
export const MAX_WATER_ML = 20_000;
export const MAX_SLEEP_SECONDS = 24 * 3600;
export const MIN_BODY_WEIGHT_KG = 20;
export const MAX_BODY_WEIGHT_KG = 400;
export const MIN_BODY_MEASURE_M = 0.05;
export const MAX_BODY_MEASURE_M = 3;

export const DAILY_GOAL_DEFAULTS = {
  stepsGoal: 10_000,
  waterGoalMl: 2500,
  sleepGoalSeconds: 8 * 3600,
};

const rating = z.number().int().min(1).max(5);

/** Tageswerte (intern kg/Sekunden/ml); `null` = nicht erfasst */
export const dailyLogValuesSchema = z.object({
  steps: z.number().int().min(0).max(MAX_STEPS).nullable(),
  waterMl: z.number().int().min(0).max(MAX_WATER_ML).nullable(),
  sleepSeconds: z.number().int().min(0).max(MAX_SLEEP_SECONDS).nullable(),
  sleepQuality: rating.nullable(),
  weightKg: z.number().min(MIN_BODY_WEIGHT_KG).max(MAX_BODY_WEIGHT_KG).nullable(),
  mood: rating.nullable(),
  energy: rating.nullable(),
});

export type DailyLogValues = z.infer<typeof dailyLogValuesSchema>;

export const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum');
export const bodyMeasureSchema = z.number().min(MIN_BODY_MEASURE_M).max(MAX_BODY_MEASURE_M);

/** Wochentage wie `Date.getDay()` */
export const weekdaysSchema = z.array(z.number().int().min(0).max(6));

export const MAX_HABIT_TIMES_PER_WEEK = 6;

export const habitInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(80, 'Höchstens 80 Zeichen'),
    icon: z.string().min(1),
    frequency: z.enum(HABIT_FREQUENCIES),
    timesPerWeek: z.number().int().min(1).max(MAX_HABIT_TIMES_PER_WEEK),
    weekdays: weekdaysSchema,
    group: z.enum(HABIT_GROUPS),
  })
  .refine((input) => input.frequency !== 'weekdays' || input.weekdays.length > 0, {
    path: ['weekdays'],
    message: 'Mindestens einen Wochentag wählen',
  });

export type HabitInput = z.input<typeof habitInputSchema>;

export const EMPTY_HABIT_INPUT: HabitInput = {
  name: '',
  icon: '⭐',
  frequency: 'daily',
  timesPerWeek: 3,
  weekdays: [],
  group: 'other',
};

const builtinKey = z.string().regex(/^[a-z0-9-]+$/, 'Schlüssel nur aus a-z, 0-9 und -');

export const builtinExerciseSchema = exerciseFieldsSchema.extend({ key: builtinKey });
export const builtinFoodSchema = foodFieldsSchema.extend({ key: builtinKey });

export type BuiltinExercise = z.infer<typeof builtinExerciseSchema>;
export type BuiltinFood = z.infer<typeof builtinFoodSchema>;
