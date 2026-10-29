import { z } from 'zod';
import { EQUIPMENT, EXERCISE_CATEGORIES, FOOD_CATEGORIES, MUSCLE_GROUPS } from './types';

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

const builtinKey = z.string().regex(/^[a-z0-9-]+$/, 'Schlüssel nur aus a-z, 0-9 und -');

export const builtinExerciseSchema = exerciseFieldsSchema.extend({ key: builtinKey });
export const builtinFoodSchema = foodFieldsSchema.extend({ key: builtinKey });

export type BuiltinExercise = z.infer<typeof builtinExerciseSchema>;
export type BuiltinFood = z.infer<typeof builtinFoodSchema>;
