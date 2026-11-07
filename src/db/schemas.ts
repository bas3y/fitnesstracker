import { z } from 'zod';
import { isValidBarcode, normalizeBarcode } from '../domain/barcode';
import { isSingleEmoji } from '../domain/emoji';
import { BEST_EFFORT_METERS } from '../domain/track';
import {
  BOOK_STATUSES,
  CUSTOM_GOAL_TYPES,
  HABIT_GOAL_METRICS,
  ENDURANCE_SPORTS,
  EQUIPMENT,
  EXERCISE_CATEGORIES,
  FOOD_CATEGORIES,
  GOAL_KINDS,
  GOAL_PERIODS,
  STRENGTH_GOAL_METRICS,
  TOTAL_GOAL_METRICS,
  HABIT_FREQUENCIES,
  HABIT_GROUPS,
  HABIT_KINDS,
  MUSCLE_GROUPS,
  SUPPLEMENT_PERIODS,
  SUPPLEMENT_SCHEDULES,
  SUPPLEMENT_TIMINGS,
  SWIM_STROKES,
  TODO_PRIORITIES,
  TRAINING_KINDS,
  type DayKey,
  type EnduranceSport,
  type NutritionGoals,
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
export const MIN_RESTING_HEART_RATE = 25;
export const MAX_RESTING_HEART_RATE = 150;
export const MAX_HRV_MS = 300;
export const MAX_QUICK_PROTEIN_G = 1000;

export const DAILY_GOAL_DEFAULTS = {
  stepsGoal: 10_000,
  waterGoalMl: 2500,
  sleepGoalSeconds: 8 * 3600,
};

const rating = z.number().int().min(1).max(5);

const phaseSeconds = z.number().int().min(0).max(MAX_SLEEP_SECONDS);
export const sleepPhasesSchema = z.object({
  deep: phaseSeconds,
  light: phaseSeconds,
  rem: phaseSeconds,
  awake: phaseSeconds,
});

/** Tageswerte (intern kg/Sekunden/ml); `null` = nicht erfasst */
export const dailyLogValuesSchema = z.object({
  steps: z.number().int().min(0).max(MAX_STEPS).nullable(),
  waterMl: z.number().int().min(0).max(MAX_WATER_ML).nullable(),
  sleepSeconds: z.number().int().min(0).max(MAX_SLEEP_SECONDS).nullable(),
  sleepQuality: rating.nullable(),
  weightKg: z.number().min(MIN_BODY_WEIGHT_KG).max(MAX_BODY_WEIGHT_KG).nullable(),
  mood: rating.nullable(),
  energy: rating.nullable(),
  restingHeartRate: z
    .number()
    .int()
    .min(MIN_RESTING_HEART_RATE)
    .max(MAX_RESTING_HEART_RATE)
    .nullable(),
  hrvMs: z.number().int().min(1).max(MAX_HRV_MS).nullable(),
  sleepPhases: sleepPhasesSchema.nullable(),
  proteinGrams: z.number().min(0).max(MAX_QUICK_PROTEIN_G).nullable(),
});

export type DailyLogValues = z.infer<typeof dailyLogValuesSchema>;

export const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum');
export const bodyMeasureSchema = z.number().min(MIN_BODY_MEASURE_M).max(MAX_BODY_MEASURE_M);

/** Wochentage wie `Date.getDay()` */
export const weekdaysSchema = z.array(z.number().int().min(0).max(6));

export const MAX_HABIT_TIMES_PER_WEEK = 6;

export const MAX_HABIT_AMOUNT = 100_000;
export const MAX_HABIT_ITEMS = 20;

const habitAmount = z.number().positive('Menge muss größer als 0 sein').max(MAX_HABIT_AMOUNT);
const habitUnit = z.string().trim().max(20, 'Einheit höchstens 20 Zeichen');

export const habitItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Bitte jedem Unterpunkt einen Namen geben').max(60),
  target: habitAmount,
  unit: habitUnit,
  step: habitAmount,
});

/** Felder einer Gewohnheit ohne Metadaten, Pausen und Archiv – für Formular und Backup */
export const habitFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(80, 'Höchstens 80 Zeichen'),
  icon: z.string().min(1),
  kind: z.enum(HABIT_KINDS),
  target: z.number().min(0).max(MAX_HABIT_AMOUNT),
  unit: habitUnit,
  step: habitAmount,
  items: z.array(habitItemSchema).max(MAX_HABIT_ITEMS),
  startDate: dayKeySchema.nullable(),
  frequency: z.enum(HABIT_FREQUENCIES),
  timesPerWeek: z.number().int().min(1).max(MAX_HABIT_TIMES_PER_WEEK),
  weekdays: weekdaysSchema,
  group: z.enum(HABIT_GROUPS),
});

/** Felder, die zur gewählten Art nicht passen, werden auf ihre Standardwerte gesetzt */
export const habitInputSchema = habitFieldsSchema
  .refine(
    (input) => input.frequency !== 'weekdays' || input.kind === 'quit' || input.weekdays.length > 0,
    {
      path: ['weekdays'],
      message: 'Mindestens einen Wochentag wählen',
    },
  )
  .refine((input) => input.kind !== 'count' || input.target > 0, {
    path: ['target'],
    message: 'Das Ziel muss größer als 0 sein',
  })
  .refine((input) => input.kind !== 'items' || input.items.length > 0, {
    path: ['items'],
    message: 'Mindestens einen Unterpunkt anlegen',
  })
  .refine((input) => input.kind !== 'quit' || input.startDate !== null, {
    path: ['startDate'],
    message: 'Bitte ein Startdatum wählen',
  })
  .transform((input) => {
    const counts = input.kind === 'count' || input.kind === 'quit';
    return {
      ...input,
      target: input.kind === 'check' || input.kind === 'items' ? 1 : input.target,
      unit: counts ? input.unit : '',
      step: counts ? input.step : 1,
      items: input.kind === 'items' ? input.items : [],
      startDate: input.kind === 'quit' ? input.startDate : null,
      frequency: input.kind === 'quit' ? ('daily' as const) : input.frequency,
    };
  });

export type HabitInput = z.input<typeof habitInputSchema>;
export type HabitValues = z.output<typeof habitInputSchema>;

export const EMPTY_HABIT_INPUT: HabitInput = {
  name: '',
  icon: '⭐',
  kind: 'check',
  target: 1,
  unit: '',
  step: 1,
  items: [],
  startDate: null,
  frequency: 'daily',
  timesPerWeek: 3,
  weekdays: [],
  group: 'other',
};

export const todoInputSchema = z.object({
  title: z.string().trim().min(1, 'Bitte eine Aufgabe eingeben').max(200, 'Höchstens 200 Zeichen'),
  priority: z.enum(TODO_PRIORITIES),
  date: dayKeySchema,
});

export type TodoInput = z.input<typeof todoInputSchema>;

export const SUPPLEMENT_SETTING_DEFAULTS = {
  supplementLowStockDays: 7,
  supplementRemindersEnabled: true,
  supplementNotificationsEnabled: false,
};

export const MAX_SUPPLEMENT_AMOUNT = 100_000;
export const MAX_SUPPLEMENT_DOSES = 10;
export const MAX_LOW_STOCK_DAYS = 90;

const supplementAmount = z
  .number()
  .positive('Menge muss größer als 0 sein')
  .max(MAX_SUPPLEMENT_AMOUNT);
export const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Ungültige Uhrzeit');

export const supplementDoseSchema = z
  .object({
    id: z.string().min(1),
    amount: supplementAmount,
    timing: z.enum(SUPPLEMENT_TIMINGS),
    time: timeOfDaySchema.nullable(),
    period: z.enum(SUPPLEMENT_PERIODS).nullable(),
  })
  .refine((dose) => dose.timing !== 'time' || dose.time !== null, {
    path: ['time'],
    message: 'Bitte eine Uhrzeit wählen',
  })
  .refine((dose) => dose.timing !== 'period' || dose.period !== null, {
    path: ['period'],
    message: 'Bitte eine Tageszeit wählen',
  })
  .transform((dose) => ({
    ...dose,
    time: dose.timing === 'time' ? dose.time : null,
    period: dose.timing === 'period' ? dose.period : null,
  }));

/** Felder eines Supplements ohne Metadaten, Reihenfolge und Archiv – für Formular und Backup */
export const supplementFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(80, 'Höchstens 80 Zeichen'),
  unit: z.string().trim().max(20, 'Einheit höchstens 20 Zeichen'),
  doses: z
    .array(supplementDoseSchema)
    .min(1, 'Mindestens eine Einnahme anlegen')
    .max(MAX_SUPPLEMENT_DOSES),
  schedule: z.enum(SUPPLEMENT_SCHEDULES),
  weekdays: weekdaysSchema,
  trainingKind: z.enum(TRAINING_KINDS),
  stock: z.number().min(0).max(MAX_SUPPLEMENT_AMOUNT).nullable(),
  packageSize: supplementAmount.nullable(),
  notes: z.string().trim().max(500, 'Notiz höchstens 500 Zeichen'),
});

export const supplementInputSchema = supplementFieldsSchema.refine(
  (input) => input.schedule !== 'weekdays' || input.weekdays.length > 0,
  { path: ['weekdays'], message: 'Mindestens einen Wochentag wählen' },
);

export type SupplementInput = z.input<typeof supplementInputSchema>;
export type SupplementValues = z.output<typeof supplementInputSchema>;

export const EMPTY_SUPPLEMENT_INPUT: SupplementInput = {
  name: '',
  unit: '',
  doses: [],
  schedule: 'daily',
  weekdays: [],
  trainingKind: 'any',
  stock: null,
  packageSize: null,
  notes: '',
};

// ---------- Ernährung ----------

export const NUTRITION_GOAL_DEFAULTS: NutritionGoals = {
  training: { kcal: 2500, protein: 150, carbs: null, fat: null },
  rest: { kcal: 2200, protein: 150, carbs: null, fat: null },
};

export const MAX_KCAL_GOAL = 10_000;
export const MAX_MACRO_GOAL_G = 1000;
/** Größte Menge eines Eintrags bzw. einer Portion */
export const MAX_FOOD_GRAMS = 10_000;
export const MAX_PORTION_COUNT = 100;
export const MAX_FOOD_PORTIONS = 10;
export const MAX_RECIPE_INGREDIENTS = 50;
export const MAX_RECIPE_GRAMS = 100_000;
export const MAX_RECIPE_SERVINGS = 100;

const macroGoal = z.number().int().min(0).max(MAX_MACRO_GOAL_G);
const nutritionGoalSchema = z.object({
  kcal: z.number().int().min(0).max(MAX_KCAL_GOAL),
  protein: macroGoal,
  carbs: macroGoal.nullable(),
  fat: macroGoal.nullable(),
});
export const nutritionGoalsSchema = z.object({
  training: nutritionGoalSchema,
  rest: nutritionGoalSchema,
});

export const nutrientsSchema = z.object({
  kcal: nutrient,
  protein: nutrient,
  carbs: nutrient,
  fat: nutrient,
  fiber: nutrient,
  sugar: nutrient,
  alcohol: nutrient,
});

const portionLabel = z
  .string()
  .trim()
  .min(1, 'Bitte jeder Portion einen Namen geben')
  .max(60, 'Portion höchstens 60 Zeichen');
const foodGrams = z.number().positive('Menge muss größer als 0 sein').max(MAX_FOOD_GRAMS);

export const mealPortionSchema = z.object({
  label: portionLabel,
  grams: foodGrams,
  count: z.number().positive('Anzahl muss größer als 0 sein').max(MAX_PORTION_COUNT),
});

/** Menge eines Eintrags; bei einer Portion ergibt sich `grams` aus Portion × Anzahl */
export const mealAmountSchema = z.object({
  grams: foodGrams,
  portion: mealPortionSchema.nullable(),
});

export type MealAmount = z.infer<typeof mealAmountSchema>;

const per100g = (max: number) =>
  z.number().min(0, 'Werte dürfen nicht negativ sein').max(max, `Höchstens ${max} pro 100 g`);

/** Formular „Eigenes Lebensmittel“ (Werte pro 100 g) */
export const foodInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(80, 'Höchstens 80 Zeichen'),
    aliases: z.array(z.string().trim()).transform((list) => list.filter(Boolean)),
    category: z.enum(FOOD_CATEGORIES),
    kcal: per100g(1000),
    protein: per100g(100),
    carbs: per100g(100),
    fat: per100g(100),
    fiber: per100g(100),
    sugar: per100g(100),
    alcohol: per100g(100),
    portions: z
      .array(z.object({ label: portionLabel, grams: foodGrams }))
      .max(MAX_FOOD_PORTIONS, `Höchstens ${MAX_FOOD_PORTIONS} Portionen`),
    // Leer = kein Strichcode; UPC-A wird zu EAN-13
    barcode: z
      .string()
      .nullable()
      .default(null)
      .transform((value) => (value === null ? null : normalizeBarcode(value) || null))
      .refine((value) => value === null || isValidBarcode(value), {
        message: 'Strichcode ungültig (8 oder 13 Ziffern, Prüfziffer prüfen)',
      }),
  })
  .refine((input) => input.sugar <= input.carbs, {
    path: ['sugar'],
    message: 'Zucker gehört zu den Kohlenhydraten und kann nicht mehr sein',
  })
  .refine(
    (input) => input.protein + input.carbs + input.fat + input.fiber + input.alcohol <= 100.5,
    { path: ['fat'], message: 'Zusammen sind das mehr als 100 g pro 100 g' },
  );

export type FoodInput = z.input<typeof foodInputSchema>;
export type FoodValues = z.output<typeof foodInputSchema>;

export const EMPTY_FOOD_INPUT: FoodInput = {
  name: '',
  aliases: [],
  category: 'dishes',
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  alcohol: 0,
  portions: [],
};

export const recipeIngredientSchema = z.object({
  id: z.string().min(1),
  foodId: z.string().min(1),
  grams: z.number().positive('Menge muss größer als 0 sein').max(MAX_RECIPE_GRAMS),
});

export const recipeSchema = z.object({
  ingredients: z
    .array(recipeIngredientSchema)
    .min(1, 'Mindestens eine Zutat hinzufügen')
    .max(MAX_RECIPE_INGREDIENTS, `Höchstens ${MAX_RECIPE_INGREDIENTS} Zutaten`),
  cookedWeightGrams: z
    .number()
    .positive('Gewicht muss größer als 0 sein')
    .max(MAX_RECIPE_GRAMS)
    .nullable(),
  servings: z.number().int().min(1).max(MAX_RECIPE_SERVINGS),
});

export const recipeInputSchema = recipeSchema.extend({
  name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(80, 'Höchstens 80 Zeichen'),
});

export type RecipeInput = z.input<typeof recipeInputSchema>;
export type RecipeValues = z.output<typeof recipeInputSchema>;

export const EMPTY_RECIPE_INPUT: RecipeInput = {
  name: '',
  ingredients: [],
  cookedWeightGrams: null,
  servings: 1,
};

export const savedMealItemSchema = mealAmountSchema.extend({
  id: z.string().min(1),
  foodId: z.string().min(1),
});
export const savedMealNameSchema = z
  .string()
  .trim()
  .min(1, 'Bitte einen Namen eingeben')
  .max(80, 'Höchstens 80 Zeichen');

// ---------- Ausdauer ----------

export const MAX_SESSION_SECONDS = 48 * 3600;
export const MAX_SESSION_METERS = 1_000_000;
export const MIN_HEART_RATE = 30;
export const MAX_HEART_RATE = 250;
export const MAX_ELEVATION_METERS = 20_000;
export const MAX_SESSION_KCAL = 20_000;
export const MAX_POOL_METERS = 100;
export const MAX_LAPS = 10_000;
export const MAX_SWOLF = 300;
export const MAX_GEAR_METERS = 100_000_000;

/** Sportarten mit Strecke (Mobility nur mit Dauer) */
export const DISTANCE_SPORTS: readonly EnduranceSport[] = ['run', 'ride', 'swim', 'hike', 'other'];

const heartRate = z.number().int().min(MIN_HEART_RATE).max(MAX_HEART_RATE).nullable();

/** Felder einer Einheit ohne Metadaten und Herkunft – für Formular und Backup */
export const enduranceSessionFieldsSchema = z.object({
  sport: z.enum(ENDURANCE_SPORTS),
  title: z.string().trim().max(80, 'Titel höchstens 80 Zeichen'),
  startedAt: z.iso.datetime({ message: 'Ungültiger Beginn' }),
  durationSeconds: z
    .number()
    .int()
    .min(1, 'Bitte eine Dauer eingeben')
    .max(MAX_SESSION_SECONDS, 'Höchstens 48 Stunden'),
  distanceMeters: z.number().positive().max(MAX_SESSION_METERS).nullable(),
  avgHeartRate: heartRate,
  maxHeartRate: heartRate,
  elevationGainMeters: z.number().min(0).max(MAX_ELEVATION_METERS).nullable(),
  calories: z.number().int().min(0).max(MAX_SESSION_KCAL).nullable(),
  rating: rating.nullable(),
  notes: z.string().trim().max(1000, 'Notiz höchstens 1000 Zeichen'),
  gearId: z.string().min(1).nullable(),
  poolLengthMeters: z.number().positive().max(MAX_POOL_METERS).nullable(),
  laps: z.number().int().min(1).max(MAX_LAPS).nullable(),
  swimStroke: z.enum(SWIM_STROKES).nullable(),
  swolf: z.number().int().min(1).max(MAX_SWOLF).nullable(),
});

/** Felder, die zur Sportart nicht passen, werden geleert; Schwimmen: Bahnen × Bahnlänge = Distanz */
export const enduranceSessionInputSchema = enduranceSessionFieldsSchema
  .refine(
    (input) =>
      input.avgHeartRate === null ||
      input.maxHeartRate === null ||
      input.maxHeartRate >= input.avgHeartRate,
    { path: ['maxHeartRate'], message: 'Max-Puls kann nicht unter dem Durchschnitt liegen' },
  )
  .transform((input) => {
    const swim = input.sport === 'swim';
    const hasDistance = DISTANCE_SPORTS.includes(input.sport);
    const laps = swim ? input.laps : null;
    const poolLengthMeters = swim ? input.poolLengthMeters : null;
    const lapDistance = laps !== null && poolLengthMeters !== null ? laps * poolLengthMeters : null;
    return {
      ...input,
      distanceMeters: hasDistance ? (lapDistance ?? input.distanceMeters) : null,
      elevationGainMeters: hasDistance && !swim ? input.elevationGainMeters : null,
      gearId: hasDistance ? input.gearId : null,
      poolLengthMeters,
      laps,
      swimStroke: swim ? input.swimStroke : null,
      swolf: swim ? input.swolf : null,
    };
  });

export type EnduranceSessionInput = z.input<typeof enduranceSessionInputSchema>;
export type EnduranceSessionValues = z.output<typeof enduranceSessionInputSchema>;

export const gearFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(80, 'Höchstens 80 Zeichen'),
  sports: z.array(z.enum(ENDURANCE_SPORTS)).min(1, 'Mindestens eine Sportart wählen'),
  initialDistanceMeters: z.number().min(0).max(MAX_GEAR_METERS),
  warnDistanceMeters: z.number().positive().max(MAX_GEAR_METERS).nullable(),
  notes: z.string().trim().max(500, 'Notiz höchstens 500 Zeichen'),
});

/** Max. Puls bzw. Ruhepuls in den Einstellungen */
export const heartRateSettingSchema = z
  .number()
  .int()
  .min(MIN_HEART_RATE)
  .max(MAX_HEART_RATE)
  .nullable();

const optionalNumber = z.number().nullable();

/** Verlauf einer importierten Einheit (ohne Metadaten) */
export const trackFieldsSchema = z.object({
  time: z.array(z.number()),
  distance: z.array(optionalNumber),
  heartRate: z.array(optionalNumber),
  altitude: z.array(optionalNumber),
  route: z.array(z.tuple([z.number(), z.number()])),
  laps: z.array(
    z.object({
      startSeconds: z.number(),
      durationSeconds: z.number(),
      distanceMeters: optionalNumber,
      avgHeartRate: optionalNumber,
      maxHeartRate: optionalNumber,
    }),
  ),
});

export const trackSummarySchema = z.object({
  bestEfforts: z.array(z.object({ meters: z.number().positive(), seconds: z.number().positive() })),
  heartRateSeconds: z.array(z.tuple([z.number(), z.number()])),
});

export type GearInput = z.input<typeof gearFieldsSchema>;
export type GearValues = z.output<typeof gearFieldsSchema>;

// ---------- Ziele ----------

export const MAX_GOAL_TARGET = 1_000_000_000;
export const MAX_GOAL_MIN_REPS = 100;
export const MAX_GOAL_UNIT_LENGTH = 20;

/** Felder eines Ziels ohne Metadaten – für Backup */
export const goalFieldsSchema = z.object({
  kind: z.enum(GOAL_KINDS),
  title: z.string().trim().max(80, 'Name höchstens 80 Zeichen'),
  /** 0 nur bei einer Obergrenze („ganz ohne“) */
  target: z
    .number({ message: 'Bitte einen Zielwert eingeben' })
    .min(0, 'Bitte einen Zielwert eingeben')
    .max(MAX_GOAL_TARGET, 'Zielwert zu groß'),
  startDate: dayKeySchema,
  deadline: dayKeySchema.nullable(),
  exerciseId: z.string().min(1).nullable(),
  strengthMetric: z.enum(STRENGTH_GOAL_METRICS).nullable(),
  minReps: z.number().int().min(1).max(MAX_GOAL_MIN_REPS).nullable(),
  sport: z.enum(ENDURANCE_SPORTS).nullable(),
  effortMeters: z.number().positive().nullable(),
  startValue: z.number().positive().nullable(),
  totalMetric: z.enum(TOTAL_GOAL_METRICS).nullable(),
  period: z.enum(GOAL_PERIODS).nullable(),
  habitId: z.string().min(1).nullable(),
  habitMetric: z.enum(HABIT_GOAL_METRICS).nullable(),
  customType: z.enum(CUSTOM_GOAL_TYPES).nullable(),
  unit: z.string().trim().max(MAX_GOAL_UNIT_LENGTH, 'Einheit höchstens 20 Zeichen'),
  icon: z.string().trim().max(32),
});

type GoalFields = z.output<typeof goalFieldsSchema>;

/** Gewohnheit, Menge (außer Serie): Zeitraum Pflicht */
const usesPeriod = (goal: Pick<GoalFields, 'kind' | 'habitMetric'>) =>
  goal.kind === 'total' || (goal.kind === 'habit' && goal.habitMetric !== 'streak');

/** Zielwert ist eine Anzahl (ganze Zahl) */
function isCountTarget(goal: Pick<GoalFields, 'kind' | 'totalMetric' | 'habitMetric'>): boolean {
  if (goal.kind === 'total')
    return goal.totalMetric !== 'distance' && goal.totalMetric !== 'duration';
  return goal.kind === 'habit' && (goal.habitMetric === 'days' || goal.habitMetric === 'streak');
}

function goalIssue(goal: GoalFields): { path: keyof GoalFields; message: string } | null {
  if (goal.deadline !== null && goal.deadline < goal.startDate) {
    return { path: 'deadline', message: 'Das Zieldatum liegt vor dem Beginn' };
  }
  if (goal.kind === 'custom' && goal.icon && !isSingleEmoji(goal.icon)) {
    return { path: 'icon', message: 'Bitte genau ein Emoji eingeben' };
  }
  switch (goal.kind) {
    case 'habit':
      if (goal.habitId === null)
        return { path: 'habitId', message: 'Bitte eine Gewohnheit wählen' };
      if (goal.habitMetric === null) {
        return { path: 'habitMetric', message: 'Bitte eine Kennzahl wählen' };
      }
      return periodIssue(goal);
    case 'custom':
      if (!goal.title) return { path: 'title', message: 'Bitte einen Namen eingeben' };
      if (goal.customType === null) return { path: 'customType', message: 'Bitte die Form wählen' };
      return null;
    case 'strength':
      if (goal.exerciseId === null)
        return { path: 'exerciseId', message: 'Bitte eine Übung wählen' };
      if (goal.strengthMetric === null) {
        return { path: 'strengthMetric', message: 'Bitte eine Kennzahl wählen' };
      }
      return null;
    case 'effort':
      if (goal.sport === null || !(BEST_EFFORT_METERS[goal.sport] ?? []).length) {
        return { path: 'sport', message: 'Bitte Laufen oder Rad wählen' };
      }
      if (!BEST_EFFORT_METERS[goal.sport]!.includes(goal.effortMeters ?? -1)) {
        return { path: 'effortMeters', message: 'Bitte eine Strecke wählen' };
      }
      return null;
    case 'bodyWeight':
      return goal.startValue === null
        ? { path: 'startValue', message: 'Bitte das Startgewicht eingeben' }
        : null;
    case 'total':
      if (goal.totalMetric === null) {
        return { path: 'totalMetric', message: 'Bitte eine Kennzahl wählen' };
      }
      return periodIssue(goal);
  }
}

function periodIssue(goal: GoalFields): { path: keyof GoalFields; message: string } | null {
  if (!usesPeriod(goal)) return null;
  if (goal.period === null) return { path: 'period', message: 'Bitte einen Zeitraum wählen' };
  if (goal.period === 'custom' && goal.deadline === null) {
    return { path: 'deadline', message: 'Bitte das Ende des Zeitraums angeben' };
  }
  return null;
}

/** Zielwert 0 ist nur bei einer Obergrenze sinnvoll, Ja/Nein braucht keinen */
function targetIssue(goal: GoalFields): string | null {
  if (goal.kind === 'custom' && goal.customType === 'check') return null;
  if (goal.kind === 'habit' && goal.habitMetric === 'limit') return null;
  return goal.target > 0 ? null : 'Bitte einen Zielwert eingeben';
}

/**
 * Formular: prüft je Art die Pflichtfelder und leert, was zur Art nicht passt. Der Zielwert kommt
 * zuletzt dran (das Feld erscheint z. B. erst nach der Wahl der Übung).
 */
export const goalInputSchema = goalFieldsSchema
  .superRefine((goal, context) => {
    const issue = goalIssue(goal);
    if (issue) {
      context.addIssue({ code: 'custom', path: [issue.path], message: issue.message });
      return;
    }
    const target = targetIssue(goal);
    if (target) context.addIssue({ code: 'custom', path: ['target'], message: target });
  })
  .transform((goal): GoalFields => {
    const strength = goal.kind === 'strength';
    const total = goal.kind === 'total';
    const habit = goal.kind === 'habit';
    const custom = goal.kind === 'custom';
    const withPeriod = usesPeriod(goal);
    const recurring = withPeriod && goal.period !== 'custom';
    const sportUsed =
      goal.kind === 'effort' ||
      (total && (goal.totalMetric === 'distance' || goal.totalMetric === 'duration'));
    const check = custom && goal.customType === 'check';
    return {
      ...goal,
      target: check ? 1 : isCountTarget(goal) ? Math.round(goal.target) : goal.target,
      deadline: recurring ? null : goal.deadline,
      exerciseId: strength ? goal.exerciseId : null,
      strengthMetric: strength ? goal.strengthMetric : null,
      minReps: strength && goal.strengthMetric === 'weight' ? goal.minReps : null,
      sport: sportUsed ? goal.sport : null,
      effortMeters: goal.kind === 'effort' ? goal.effortMeters : null,
      startValue: goal.kind === 'bodyWeight' ? goal.startValue : null,
      totalMetric: total ? goal.totalMetric : null,
      period: withPeriod ? goal.period : null,
      habitId: habit ? goal.habitId : null,
      habitMetric: habit ? goal.habitMetric : null,
      customType: custom ? goal.customType : null,
      unit: custom && !check ? goal.unit : '',
      icon: custom ? goal.icon : '',
    };
  });

export type GoalInput = z.input<typeof goalInputSchema>;
export type GoalValues = z.output<typeof goalInputSchema>;

/** Leeres Ziel; `target` 0 = noch nicht eingegeben */
export function emptyGoalInput(kind: GoalInput['kind'], today: string): GoalInput {
  return {
    kind,
    title: '',
    target: 0,
    startDate: today,
    deadline: null,
    exerciseId: null,
    strengthMetric: null,
    minReps: null,
    sport: kind === 'effort' ? 'run' : null,
    effortMeters: kind === 'effort' ? 10_000 : null,
    startValue: null,
    totalMetric: kind === 'total' ? 'trainings' : null,
    period: kind === 'total' || kind === 'habit' ? 'month' : null,
    habitId: null,
    habitMetric: null,
    customType: kind === 'custom' ? 'number' : null,
    unit: '',
    icon: '',
  };
}

export const MAX_GOAL_ENTRY_AMOUNT = 1_000_000;

// ---------- Journal ----------

export const MAX_JOURNAL_TEXT = 20_000;
export const MAX_JOURNAL_ANSWER = 5_000;
export const MAX_GRATITUDE_LENGTH = 300;
export const GRATITUDE_COUNT = 3;
export const MAX_JOURNAL_PROMPTS = 20;

export const journalPromptTextSchema = z
  .string()
  .trim()
  .min(1, 'Bitte eine Frage eingeben')
  .max(200, 'Höchstens 200 Zeichen');

/** Inhalt eines Eintrags (ohne Art und Tag) – für Speichern und Backup */
export const journalValuesSchema = z.object({
  text: z.string().max(MAX_JOURNAL_TEXT, 'Text zu lang'),
  gratitude: z.array(z.string().max(MAX_GRATITUDE_LENGTH)).max(GRATITUDE_COUNT),
  answers: z.record(z.string().min(1), z.string().max(MAX_JOURNAL_ANSWER)),
  rating: z.number().int().min(1).max(5).nullable(),
});

export type JournalValues = z.output<typeof journalValuesSchema>;

export const EMPTY_JOURNAL_VALUES: JournalValues = {
  text: '',
  gratitude: [],
  answers: {},
  rating: null,
};

// ---------- Lesen ----------

export const MAX_BOOK_PAGES = 20_000;

const pageCount = z
  .number()
  .int()
  .min(1, 'Mindestens 1 Seite')
  .max(MAX_BOOK_PAGES, 'Zu viele Seiten');

export const bookFieldsSchema = z.object({
  title: z.string().trim().min(1, 'Bitte einen Titel eingeben').max(200, 'Höchstens 200 Zeichen'),
  author: z.string().trim().max(120, 'Höchstens 120 Zeichen'),
  totalPages: pageCount.nullable(),
  status: z.enum(BOOK_STATUSES),
  startPage: z.number().int().min(0).max(MAX_BOOK_PAGES),
  startedOn: dayKeySchema.nullable(),
  finishedOn: dayKeySchema.nullable(),
  rating: z.number().int().min(1).max(5).nullable(),
});

/** Formular: Daten passend zum Status, schon gelesene Seiten nicht über das Buch hinaus */
export const bookInputSchema = bookFieldsSchema
  .refine((book) => book.totalPages === null || book.startPage <= book.totalPages, {
    path: ['startPage'],
    message: 'Mehr Seiten, als das Buch hat',
  })
  .refine((book) => !book.startedOn || !book.finishedOn || book.finishedOn >= book.startedOn, {
    path: ['finishedOn'],
    message: 'Liegt vor dem Beginn',
  })
  .transform((book) => {
    const done = book.status === 'finished' || book.status === 'abandoned';
    return {
      ...book,
      startedOn: book.status === 'want' ? null : book.startedOn,
      finishedOn: done ? book.finishedOn : null,
    };
  });

export type BookInput = z.input<typeof bookInputSchema>;

export function emptyBookInput(today: DayKey): BookInput {
  return {
    title: '',
    author: '',
    totalPages: null,
    status: 'reading',
    startPage: 0,
    startedOn: today,
    finishedOn: null,
    rating: null,
  };
}

export const readingPagesSchema = pageCount;

export const bookNoteInputSchema = z.object({
  text: z.string().trim().min(1, 'Bitte eine Notiz eingeben').max(5_000, 'Höchstens 5000 Zeichen'),
  page: pageCount.nullable(),
});

export type BookNoteInput = z.input<typeof bookNoteInputSchema>;

const builtinKey = z.string().regex(/^[a-z0-9-]+$/, 'Schlüssel nur aus a-z, 0-9 und -');

export const builtinExerciseSchema = exerciseFieldsSchema.extend({ key: builtinKey });
export const builtinFoodSchema = foodFieldsSchema.extend({ key: builtinKey });

export type BuiltinExercise = z.infer<typeof builtinExerciseSchema>;
export type BuiltinFood = z.infer<typeof builtinFoodSchema>;
