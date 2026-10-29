import { z } from 'zod';
import { db } from './database';
import { nowIso } from './repository';
import { exerciseFieldsSchema, foodFieldsSchema, setValuesSchema } from './schemas';
import { ensureSeeded } from './seed';
import { REST_TIMER_DEFAULTS, SETTINGS_ID } from './settings';

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
  });
const foodSchema = baseEntitySchema.extend(foodFieldsSchema.shape).extend(catalogEntryFields);

const workoutSchema = baseEntitySchema.extend({
  startedAt: timestamp,
  endedAt: timestamp.nullable(),
  notes: z.string(),
  restEndsAt: timestamp.nullable(),
});
const workoutExerciseSchema = baseEntitySchema.extend({
  workoutId: z.string().min(1),
  exerciseId: z.string().min(1),
  order: z.number(),
});
const setSchema = baseEntitySchema.extend(setValuesSchema.shape).extend({
  workoutId: z.string().min(1),
  workoutExerciseId: z.string().min(1),
  order: z.number(),
  restSeconds: z.number().int().nonnegative().nullable(),
  completedAt: timestamp.nullable(),
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
