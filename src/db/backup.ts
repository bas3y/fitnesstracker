import { z } from 'zod';
import { db } from './database';
import { nowIso } from './repository';
import { SETTINGS_ID } from './settings';

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
  }),
});

export type Backup = z.infer<typeof backupSchema>;
export type TableName = keyof Backup['tables'];

export const TABLE_LABELS: Record<TableName, string> = {
  settings: 'Einstellungen',
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

/** Ersetzt **alle** Daten durch den Inhalt der Sicherung */
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
