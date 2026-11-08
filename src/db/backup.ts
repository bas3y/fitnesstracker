import { z } from 'zod';
import { base64ToBytes, bytesToBase64 } from '../domain/photos';
import { db } from './database';
import { nowIso } from './repository';
import {
  bodyMeasureSchema,
  bookFieldsSchema,
  celebrationsSchema,
  DAILY_GOAL_DEFAULTS,
  dailyLogValuesSchema,
  dayKeySchema,
  enduranceSessionFieldsSchema,
  exerciseFieldsSchema,
  gearFieldsSchema,
  foodFieldsSchema,
  goalFieldsSchema,
  habitFieldsSchema,
  heartRateSettingSchema,
  journalPromptTextSchema,
  journalValuesSchema,
  mealAmountSchema,
  NUTRITION_GOAL_DEFAULTS,
  nutrientsSchema,
  nutritionGoalsSchema,
  photoInputSchema,
  planBlockProgressSchema,
  planBlocksSchema,
  planExerciseValuesSchema,
  readingPagesSchema,
  recipeSchema,
  savedMealItemSchema,
  savedMealNameSchema,
  setValuesSchema,
  SUPPLEMENT_SETTING_DEFAULTS,
  supplementFieldsSchema,
  activeTimerSchema,
  TIMER_PRESET_DEFAULTS,
  timerPresetsSchema,
  todoInputSchema,
  trackFieldsSchema,
  trackSummarySchema,
  TRAINING_WEEK_TARGET_DEFAULT,
  trainingWeekTargetSchema,
  weekdaysSchema,
  workoutBlockSchema,
} from './schemas';
import { ensureTrackSummaries } from './endurance';
import { ensureSeeded } from './seed';
import { REST_TIMER_DEFAULTS, SETTINGS_ID } from './settings';
import {
  BODY_MEASURES,
  COLOR_PALETTES,
  DAILY_IMPORT_FIELDS,
  DASHBOARD_WIDGETS,
  DEFAULT_DASHBOARD_WIDGETS,
  DEFAULT_QUICK_ACTIONS,
  ENDURANCE_SOURCES,
  ENDURANCE_SPORTS,
  JOURNAL_KINDS,
  LOAD_TYPES,
  MEAL_TYPES,
  PLAN_SCHEDULES,
  QUICK_ACTIONS,
  TIMER_KINDS,
  type PhotoFile,
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
  // Seit DB-Version 20
  addBurnedCalories: z.boolean().default(false),
  // Seit DB-Version 21; wer eine ältere Sicherung einspielt, kennt die App schon
  proteinOnly: z.boolean().default(false),
  welcomeDismissed: z.boolean().default(true),
  // Seit DB-Version 25
  readingHabitId: z.string().nullable().default(null),
  // Seit DB-Version 26
  timerPresets: timerPresetsSchema.default(TIMER_PRESET_DEFAULTS),
  activeTimer: activeTimerSchema.nullable().default(null),
  focusHabitId: z.string().nullable().default(null),
  meditationHabitId: z.string().nullable().default(null),
  // Seit DB-Version 27; ältere Sicherungen gleichen die Erfolge beim nächsten Start still ab
  trainingWeekTarget: trainingWeekTargetSchema.default(TRAINING_WEEK_TARGET_DEFAULT),
  celebrations: celebrationsSchema.nullable().default(null),
  // Seit DB-Version 29
  palette: z.enum(COLOR_PALETTES).default('green'),
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
    // Seit DB-Version 22
    barcode: z.string().nullable().default(null),
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
  // Seit DB-Version 28
  block: workoutBlockSchema.nullable().default(null),
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
  // Seit DB-Version 28
  blocks: planBlocksSchema.default([]),
  blockProgress: planBlockProgressSchema.nullable().default(null),
  blockAdjust: z.boolean().default(true),
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

const dailyLogSchema = baseEntitySchema.extend(dailyLogValuesSchema.shape).extend({
  date: dayKeySchema,
  // Seit DB-Version 19
  restingHeartRate: dailyLogValuesSchema.shape.restingHeartRate.default(null),
  hrvMs: dailyLogValuesSchema.shape.hrvMs.default(null),
  sleepPhases: dailyLogValuesSchema.shape.sleepPhases.default(null),
  // Seit DB-Version 21
  proteinGrams: dailyLogValuesSchema.shape.proteinGrams.default(null),
  importedFields: z.array(z.enum(DAILY_IMPORT_FIELDS)).default([]),
});
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
  // Seit DB-Version 20; fehlt sie, wird sie nach dem Import aus dem Verlauf berechnet
  trackSummary: trackSummarySchema.nullable().default(null),
});
const gearSchema = baseEntitySchema.extend(gearFieldsSchema.shape).extend({
  archivedAt: timestamp.nullable(),
});
const enduranceTrackSchema = baseEntitySchema.extend(trackFieldsSchema.shape).extend({
  sessionId: z.string().min(1),
});
// Seit DB-Version 23, Gewohnheiten und eigene Ziele seit 24
const goalSchema = baseEntitySchema.extend(goalFieldsSchema.shape).extend({
  habitId: goalFieldsSchema.shape.habitId.default(null),
  habitMetric: goalFieldsSchema.shape.habitMetric.default(null),
  customType: goalFieldsSchema.shape.customType.default(null),
  unit: goalFieldsSchema.shape.unit.default(''),
  icon: goalFieldsSchema.shape.icon.default(''),
});
const goalEntrySchema = baseEntitySchema.extend({
  goalId: z.string().min(1),
  date: dayKeySchema,
  amount: z.number().positive(),
});
// Seit DB-Version 25
const journalPromptSchema = baseEntitySchema.extend({
  kind: z.enum(JOURNAL_KINDS),
  text: journalPromptTextSchema,
  order: z.number(),
  archivedAt: timestamp.nullable(),
});
const journalEntrySchema = baseEntitySchema.extend(journalValuesSchema.shape).extend({
  kind: z.enum(JOURNAL_KINDS),
  date: dayKeySchema,
});
const bookSchema = baseEntitySchema.extend(bookFieldsSchema.shape);
const readingLogSchema = baseEntitySchema.extend({
  bookId: z.string().min(1),
  date: dayKeySchema,
  pages: readingPagesSchema,
  habitId: z.string().nullable(),
});
const bookNoteSchema = baseEntitySchema.extend({
  bookId: z.string().min(1),
  text: z.string().min(1),
  page: readingPagesSchema.nullable(),
});
// Seit DB-Version 26
const timerSessionSchema = baseEntitySchema.extend({
  kind: z.enum(TIMER_KINDS),
  date: dayKeySchema,
  startedAt: timestamp.nullable(),
  durationSeconds: z.number().int().nonnegative(),
  rounds: z.number().int().nonnegative().nullable(),
  note: z.string(),
  habitId: z.string().nullable(),
  habitAmount: z.number().nonnegative(),
});
const progressPhotoSchema = baseEntitySchema.extend(photoInputSchema.shape).extend({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().nonnegative(),
});
/** Bilddaten als Base64 (im Gerät als `ArrayBuffer`) */
const photoFileSchema = baseEntitySchema.extend({
  photoId: z.string().min(1),
  variant: z.enum(['full', 'thumb']),
  mimeType: z.string().min(1),
  data: z.base64(),
});

// Neue Tabellen hier ergänzen; `default([])` hält ältere Backups ohne die Tabelle importierbar.
// Fotos sind optional: Fehlen sie, bleiben beim Import die Fotos auf dem Gerät erhalten.
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
    goals: z.array(goalSchema).default([]),
    goalEntries: z.array(goalEntrySchema).default([]),
    journalPrompts: z.array(journalPromptSchema).default([]),
    journalEntries: z.array(journalEntrySchema).default([]),
    books: z.array(bookSchema).default([]),
    readingLogs: z.array(readingLogSchema).default([]),
    bookNotes: z.array(bookNoteSchema).default([]),
    timerSessions: z.array(timerSessionSchema).default([]),
    progressPhotos: z.array(progressPhotoSchema).optional(),
    photoFiles: z.array(photoFileSchema).optional(),
  }),
});

export type Backup = z.infer<typeof backupSchema>;
export type TableName = keyof Backup['tables'];

/** Nur mit dem Schalter „Fotos einschließen“ in der Sicherung */
const PHOTO_TABLES: readonly string[] = ['progressPhotos', 'photoFiles'] satisfies TableName[];

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
  goals: 'Ziele',
  goalEntries: 'Einträge zu eigenen Zielen',
  journalPrompts: 'Eigene Journal-Fragen',
  journalEntries: 'Journal-Einträge',
  books: 'Bücher',
  readingLogs: 'Gelesene Seiten',
  bookNotes: 'Notizen zu Büchern',
  timerSessions: 'Fokus- und Meditations-Sitzungen',
  progressPhotos: 'Fortschrittsfotos',
  photoFiles: 'Bilddaten der Fotos',
};

export interface BackupOptions {
  /** Fortschrittsfotos samt Bilddaten (macht die Datei groß) */
  includePhotos?: boolean;
}

export async function createBackup({ includePhotos = false }: BackupOptions = {}): Promise<Backup> {
  const tables = db.tables.filter((table) => includePhotos || !PHOTO_TABLES.includes(table.name));
  return db.transaction('r', tables, async () => {
    const entries = await Promise.all(
      tables.map(async (table) => {
        const rows = await table.toArray();
        if (table.name !== 'photoFiles') return [table.name, rows] as const;
        return [
          table.name,
          (rows as PhotoFile[]).map((file) => ({
            ...file,
            data: bytesToBase64(new Uint8Array(file.data)),
          })),
        ] as const;
      }),
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

/** Zeilen je Tabelle; fehlende (Fotos nicht enthalten) fehlen auch hier */
export function countRows(backup: Backup): Partial<Record<TableName, number>> {
  const counts: Partial<Record<TableName, number>> = {};
  for (const name of Object.keys(backup.tables) as TableName[]) {
    const rows = backup.tables[name];
    if (rows) counts[name] = rows.length;
  }
  return counts;
}

/** Sicherung enthält Fotos (sonst bleiben die Fotos auf dem Gerät beim Import erhalten) */
export function backupHasPhotos(backup: Backup): boolean {
  return backup.tables.progressPhotos !== undefined;
}

/**
 * Ersetzt **alle** Daten durch den Inhalt der Sicherung (Fotos nur, wenn sie enthalten sind) und
 * bringt mitgelieferte Daten auf den aktuellen Stand
 */
export async function restoreBackup(backup: Backup): Promise<void> {
  const replaced = backupHasPhotos(backup)
    ? db.tables
    : db.tables.filter((table) => !PHOTO_TABLES.includes(table.name));
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(replaced.map((table) => table.clear()));
    for (const [name, rows] of Object.entries(backup.tables)) {
      if (!rows) continue;
      if (name === 'photoFiles') {
        await db.photoFiles.bulkAdd(
          backup.tables.photoFiles!.map((file) => ({
            ...file,
            data: base64ToBytes(file.data).buffer,
          })),
        );
      } else {
        await db.table(name).bulkAdd(rows);
      }
    }
    // Die wiederhergestellten Daten entsprechen genau dem Stand der Sicherung
    const settings = await db.settings.get(SETTINGS_ID);
    if (settings && (settings.lastBackupAt ?? '') < backup.exportedAt) {
      await db.settings.update(SETTINGS_ID, { lastBackupAt: backup.exportedAt });
    }
  });
  await ensureSeeded();
  await ensureTrackSummaries();
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
