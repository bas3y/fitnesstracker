import { db } from './database';

export interface DataSummary {
  /** Alle eigenen, aktiven Einträge (ohne mitgelieferte Übungen/Lebensmittel und Einstellungen) */
  total: number;
  workouts: number;
  enduranceSessions: number;
  dailyLogs: number;
}

// Hilfsdaten, die nur zu anderen Einträgen gehören (Verläufe, Bilddaten) zählen nicht extra
const SKIPPED = new Set(['settings', 'enduranceTracks', 'photoFiles']);
const CATALOGS = new Set(['exercises', 'foods']);

/** Kennzahlen für „Speicher“: Sind die Daten auf diesem Gerät (in diesem Speicher) vorhanden? */
export async function loadDataSummary(): Promise<DataSummary> {
  const counts = await Promise.all(
    db.tables
      .filter((table) => !SKIPPED.has(table.name))
      .map(async (table) => {
        const count = CATALOGS.has(table.name)
          ? await table
              .where('source')
              .equals('user')
              .filter((row: { deletedAt?: string | null }) => row.deletedAt == null)
              .count()
          : await table
              .filter((row: { deletedAt?: string | null }) => row.deletedAt == null)
              .count();
        return [table.name, count] as const;
      }),
  );
  const byTable = new Map(counts);
  return {
    total: counts.reduce((sum, [, count]) => sum + count, 0),
    workouts: byTable.get('workouts') ?? 0,
    enduranceSessions: byTable.get('enduranceSessions') ?? 0,
    dailyLogs: byTable.get('dailyLogs') ?? 0,
  };
}
