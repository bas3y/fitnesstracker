import { z } from 'zod';
import { db } from './database';
import { nowIso } from './repository';
import {
  bodyMeasureSchema,
  DAILY_GOAL_DEFAULTS,
  dailyLogValuesSchema,
  dayKeySchema,
  enduranceSessionFieldsSchema,
  exerciseFieldsSchema,
  gearFieldsSchema,
  foodFieldsSchema,
  habitFieldsSchema,
  heartRateSettingSchema,
  mealAmountSchema,
  NUTRITION_GOAL_DEFAULTS,
  nutrientsSchema,
  nutritionGoalsSchema,
  planExerciseValuesSchema,
  recipeSchema,
  savedMealItemSchema,
  savedMealNameSchema,
  setValuesSchema,
  SUPPLEMENT_SETTING_DEFAULTS,
  supplementFieldsSchema,
  todoInputSchema,
  trackFieldsSchema,
  weekdaysSchema,
} from './schemas';
import { ensureSeeded } from './seed';
import { REST_TIMER_DEFAULTS, SETTINGS_ID } from './settings';
import {
  BODY_MEASURES,
  DASHBOARD_WIDGETS,
  DEFAULT_DASHBOARD_WIDGETS,
  DEFAULT_QUICK_ACTIONS,
  ENDURANCE_SOURCES,
  ENDURANCE_SPORTS,
  LOAD_TYPES,
  MEAL_TYPES,
  PLAN_SCHEDULES,
  QUICK_ACTIONS,
} from './types';

export const BACKUP_APP = 'fitnesstracker';
export const BACKUP_VERSION = 1;

const timestamp = z.iso.datetime({ message: 'Ungültiger Zeitstempel' });

const baseEntitySchema = z.object({
  id: z.string().min(1),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.nullable(),
});

const settingsSchema = baseEntitySchema.extend({
  name: z.string(),
  weightUnit: z.enum(['kg', 'lb']),
  distanceUnit: z.enum(['km', 'mi']),
  bodyWeightKg: z.number().positive().nullable(),
  theme: z.enum(['system', 'light', 'dark']),
  lastBackupAt: timestamp.nullable(),
  // Fehlt in Sicherungen vor DB-Version 2 → mitgelieferte Daten werden nach dem Import eingespielt
  seedVersion: z.number().int().nonnegative().default(0),
  // Seit DB-Version 4
  restTimerSeconds: z.number().int().nonnegative().default(REST_TIMER_DEFAULTS.restTimerSeconds),
  restTimerSound: z.boolean().default(REST_TIMER_DEFAULTS.restTimerSound),
  restTimerVibrate: z.boolean().default(REST_TIMER_DEFAULTS.restTimerVibrate),
  // Seit DB-Version 7
  activePlanId: z.string().nullable().default(null),
  // Seit DB-Version 10
  restTimerEnabled: z.boolean().default(REST_TIMER_DEFAULTS.restTimerEnabled),
  restAnalysisEnabled: z.boolean().default(false),
  // Seit DB-Version 11
  dashboardWidgets: z.array(z.enum(DASHBOARD_WIDGETS)).default([...DEFAULT_DASHBOARD_WIDGETS]),
  // Seit DB-Version 14
  quickActions: z.array(z.enum(QUICK_ACTIONS)).default([...DEFAULT_QUICK_ACTIONS]),
  // Seit DB-Version 12
  stepsGoal: z.number().int().positive().default(DAILY_GOAL_DEFAULTS.stepsGoal),
  waterGoalMl: z.number().int().positive().default(DAILY_GOAL_DEFAULTS.waterGoalMl),
  sleepGoalSeconds: z.number().int().positive().default(DAILY_GOAL_DEFAULTS.sleepGoalSeconds),
  // Seit DB-Version 15
  supplementLowStockDays: z
    .number()
    .int()
    .positive()
    .default(SUPPLEMENT_SETTING_DEFAULTS.supplementLowStockDays),
  supplementRemindersEnabled: z
    .boolean()
    .default(SUPPLEMENT_SETTING_DEFAULTS.supplementRemindersEnabled),
  supplementNotificationsEnabled: z
    .boolean()
    .default(SUPPLEMENT_SETTING_DEFAULTS.supplementNotificationsEnabled),
  // Seit DB-Version 16
  nutritionGoals: nutritionGoalsSchema.default(NUTRITION_GOAL_DEFAULTS),
  // Seit DB-Version 17
  trainingTiles: z.array(z.enum(ENDURANCE_SPORTS)).default([...ENDURANCE_SPORTS]),
  // Seit DB-Version 18
  maxHeartRate: heartRateSettingSchema.default(null),
  restingHeartRate: heartRateSettingSchema.default(null),
});

const catalogEntryFields = {
  source: z.enum(['builtin', 'user']),
  builtinKey: z.string().nullable(),
};

const exerciseSchema = baseEntitySchema
  .extend(exerciseFieldsSchema.shape)
  .extend(catalogEntryFields)
  .extend({
    // Seit DB-Version 3; Defaults halten ältere Sicherungen importierbar
    isFavorite: z.boolean().default(false),
    hiddenAt: timestamp.nullable().default(null),
    notes: z.string().default(''),
    // Seit DB-Version 4 (mitgelieferte Halteübungen korrigiert der Seed nach dem Import)
    isTimed: z.boolean().default(false),
    // Seit DB-Version 5
    loadType: z.enum(LOAD_TYPES).default('weight'),
  });
const foodSchema = baseEntitySchema
  .extend(foodFieldsSchema.shape)
  .extend(catalogEntryFields)
  .extend({
    // Seit DB-Version 16
    isFavorite: z.boolean().default(false),
    hiddenAt: timestamp.nullable().default(null),
    recipe: recipeSchema.nullable().default(null),
  });
const mealEntrySchema = baseEntitySchema.extend(mealAmountSchema.shape).extend({
  date: dayKeySchema,
  meal: z.enum(MEAL_TYPES),
  foodId: z.string().min(1),
  name: z.string().min(1),
  nutrients: nutrientsSchema,
});
const savedMealSchema = baseEntitySchema.extend({
  name: savedMealNameSchema,
  items: z.array(savedMealItemSchema),
});

const workoutSchema = baseEntitySchema.extend({
  startedAt: timestamp,
  endedAt: timestamp.nullable(),
  notes: z.string(),
  restEndsAt: timestamp.nullable(),
  // Seit DB-Version 7
  planId: z.string().nullable().default(null),
  planDayId: z.string().nullable().default(null),
});
const workoutExerciseSchema = baseEntitySchema.extend({
  workoutId: z.string().min(1),
  exerciseId: z.string().min(1),
  order: z.number(),
  // Seit DB-Version 7
  repMin: z.number().int().nullable().default(null),
  repMax: z.number().int().nullable().default(null),
  targetDurationSeconds: z.number().int().nullable().default(null),
  restSeconds: z.number().int().nonnegative().nullable().default(null),
});
const setSchema = baseEntitySchema.extend(setValuesSchema.shape).extend({
  // Seit DB-Version 5
  level: setValuesSchema.shape.level.default(null),
  // Seit DB-Version 6
  eccentricWeight: setValuesSchema.shape.eccentricWeight.default(null),
  eccentricLevel: setValuesSchema.shape.eccentricLevel.default(null),
  workoutId: z.string().min(1),
  workoutExerciseId: z.string().min(1),
  order: z.number(),
  restSeconds: z.number().int().nonnegative().nullable(),
  completedAt: timestamp.nullable(),
});

const planSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  schedule: z.enum(PLAN_SCHEDULES),
  // Seit DB-Version 8; bei gleichem Wert zählt die Anlagereihenfolge
  order: z.number().default(0),
});
const planDaySchema = baseEntitySchema.extend({
  planId: z.string().min(1),
  name: z.string().min(1),
  order: z.number(),
  weekdays: weekdaysSchema,
});
const planExerciseSchema = baseEntitySchema.extend(planExerciseValuesSchema.shape).extend({
  // Seit DB-Version 9
  warmupSets: planExerciseValuesSchema.shape.warmupSets.default(0),
  planId: z.string().min(1),
  planDayId: z.string().min(1),
  exerciseId: z.string().min(1),
  order: z.number(),
});

const dailyLogSchema = baseEntitySchema
  .extend(dailyLogValuesSchema.shape)
  .extend({ date: dayKeySchema });
const bodyMeasurementSchema = baseEntitySchema.extend({
  date: dayKeySchema,
  values: z.partialRecord(z.enum(BODY_MEASURES), bodyMeasureSchema),
});

const habitSchema = baseEntitySchema.extend(habitFieldsSchema.shape).extend({
  order: z.number(),
  // Seit DB-Version 14
  kind: habitFieldsSchema.shape.kind.default('check'),
  target: habitFieldsSchema.shape.target.default(1),
  unit: habitFieldsSchema.shape.unit.default(''),
  step: habitFieldsSchema.shape.step.default(1),
  items: habitFieldsSchema.shape.items.default([]),
  startDate: habitFieldsSchema.shape.startDate.default(null),
  pauses: z.array(z.object({ from: dayKeySchema, to: dayKeySchema.nullable() })).default([]),
  archivedAt: timestamp.nullable().default(null),
});
const habitCheckSchema = baseEntitySchema.extend({
  habitId: z.string().min(1),
  date: dayKeySchema,
  // Seit DB-Version 14
  itemId: z.string().nullable().default(null),
  amount: z.number().positive().default(1),
});
const todoSchema = baseEntitySchema.extend(todoInputSchema.shape).extend({
  completedAt: timestamp.nullable(),
});

const supplementSchema = baseEntitySchema.extend(supplementFieldsSchema.shape).extend({
  order: z.number(),
  archivedAt: timestamp.nullable(),
});
const supplementIntakeSchema = baseEntitySchema.extend({
  supplementId: z.string().min(1),
  doseId: z.string().min(1),
  date: dayKeySchema,
  amount: z.number().positive(),
  takenAt: timestamp,
  stockDeducted: z.number().nonnegative(),
});

const enduranceSessionSchema = baseEntitySchema.extend(enduranceSessionFieldsSchema.shape).extend({
  source: z.enum(ENDURANCE_SOURCES),
  importInfo: z
    .object({ format: z.string(), fileName: z.string().nullable(), device: z.string().nullable() })
    .nullable(),
});
const gearSchema = baseEntitySchema.extend(gearFieldsSchema.shape).extend({
  archivedAt: timestamp.nullable(),
});
const enduranceTrackSchema = baseEntitySchema.extend(trackFieldsSchema.shape).extend({
  sessionId: z.string().min(1),
});

// Neue Tabellen hier ergänzen; `default([])` hält ältere Backups ohne die Tabelle importierbar
export const backupSchema = z.object({
  app: z.literal(BACKUP_APP, { message: 'Keine Fitnesstracker-Sicherung' }),
  backupVersion: z
    .number()
    .int()
    .positive()
    .max(BACKUP_VERSION, { message: 'Sicherung stammt aus einer neueren App-Version' }),
  dbVersion: z.number().int().positive(),
  exportedAt: timestamp,
  tables: z.object({
    settings: z.array(settingsSchema).default([]),
    exercises: z.array(exerciseSchema).default([]),
    foods: z.array(foodSchema).default([]),
    workouts: z.array(workoutSchema).default([]),
    workoutExercises: z.array(workoutExerciseSchema).default([]),
    sets: z.array(setSchema).default([]),
    plans: z.array(planSchema).default([]),
    planDays: z.array(planDaySchema).default([]),
    planExercises: z.array(planExerciseSchema).default([]),
    dailyLogs: z.array(dailyLogSchema).default([]),
    bodyMeasurements: z.array(bodyMeasurementSchema).default([]),
    habits: z.array(habitSchema).default([]),
    habitChecks: z.array(habitCheckSchema).default([]),
    todos: z.array(todoSchema).default([]),
    supplements: z.array(supplementSchema).default([]),
    supplementIntakes: z.array(supplementIntakeSchema).default([]),
    mealEntries: z.array(mealEntrySchema).default([]),
    savedMeals: z.array(savedMealSchema).default([]),
    enduranceSessions: z.array(enduranceSessionSchema).default([]),
    gear: z.array(gearSchema).default([]),
    enduranceTracks: z.array(enduranceTrackSchema).default([]),
  }),
});

export type Backup = z.infer<typeof backupSchema>;
export type TableName = keyof Backup['tables'];

export const TABLE_LABELS: Record<TableName, string> = {
  settings: 'Einstellungen',
  exercises: 'Übungen',
  foods: 'Lebensmittel',
  workouts: 'Workouts',
  workoutExercises: 'Übungen in Workouts',
  sets: 'Sätze',
  plans: 'Trainingspläne',
  planDays: 'Trainings in Plänen',
  planExercises: 'Übungen in Plänen',
  dailyLogs: 'Alltagseinträge',
  bodyMeasurements: 'Körpermaße',
  habits: 'Gewohnheiten',
  habitChecks: 'Erledigte Gewohnheiten',
  todos: 'To-dos',
  supplements: 'Supplements',
  supplementIntakes: 'Supplement-Einnahmen',
  mealEntries: 'Einträge in Mahlzeiten',
  savedMeals: 'Lieblingsmahlzeiten',
  enduranceSessions: 'Ausdauer-Einheiten',
  gear: 'Ausrüstung',
  enduranceTracks: 'Verläufe von Einheiten',
};

export async function createBackup(): Promise<Backup> {
  return db.transaction('r', db.tables, async () => {
    const entries = await Promise.all(
      db.tables.map(async (table) => [table.name, await table.toArray()] as const),
    );
    return {
      app: BACKUP_APP,
      backupVersion: BACKUP_VERSION,
      dbVersion: db.verno,
      exportedAt: nowIso(),
      tables: Object.fromEntries(entries) as Backup['tables'],
    };
  });
}

export type ParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

export function parseBackup(data: unknown): ParseResult {
  const result = backupSchema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join('.');
    return {
      ok: false,
      error: `Ungültige Sicherung${path ? ` (${path})` : ''}: ${issue?.message ?? 'unbekannter Fehler'}`,
    };
  }
  if (result.data.dbVersion > db.verno) {
    return { ok: false, error: 'Sicherung stammt aus einer neueren App-Version' };
  }
  return { ok: true, backup: result.data };
}

export function parseBackupText(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Die Datei ist keine gültige JSON-Datei' };
  }
  return parseBackup(data);
}

export function countRows(backup: Backup): Record<TableName, number> {
  const counts = {} as Record<TableName, number>;
  for (const name of Object.keys(backup.tables) as TableName[]) {
    counts[name] = backup.tables[name].length;
  }
  return counts;
}

/** Ersetzt **alle** Daten durch den Inhalt der Sicherung und bringt mitgelieferte Daten auf den aktuellen Stand */
export async function restoreBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
    for (const [name, rows] of Object.entries(backup.tables)) {
      await db.table(name).bulkAdd(rows);
    }
    // Die wiederhergestellten Daten entsprechen genau dem Stand der Sicherung
    const settings = await db.settings.get(SETTINGS_ID);
    if (settings && (settings.lastBackupAt ?? '') < backup.exportedAt) {
      await db.settings.update(SETTINGS_ID, { lastBackupAt: backup.exportedAt });
    }
  });
  await ensureSeeded();
}

export function backupFileName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `fitnesstracker-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

export function backupToFile(backup: Backup, date = new Date()): File {
  return new File([JSON.stringify(backup, null, 2)], backupFileName(date), {
    type: 'application/json',
  });
}
