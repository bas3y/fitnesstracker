import type { HealthDayChange } from '../domain/import/health';
import { syncBodyWeight, writeImportedDailyLog } from './daily';
import { db } from './database';

/**
 * Schreibt die Änderungen aus `planHealthImport` in einer Transaktion; ein importiertes Gewicht
 * wird zum Körpergewicht
 */
export async function applyHealthImport(changes: readonly HealthDayChange[]): Promise<void> {
  await db.transaction('rw', db.dailyLogs, db.settings, async () => {
    for (const { date, values, importedFields } of changes) {
      await writeImportedDailyLog(date, values, importedFields);
    }
    if (changes.some((change) => 'weightKg' in change.values)) await syncBodyWeight();
  });
}
