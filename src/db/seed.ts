import type { Table } from 'dexie';
import { db } from './database';
import { nowIso } from './repository';
import type { BuiltinExercise, BuiltinFood } from './schemas';
import { ensureSettings, SETTINGS_ID } from './settings';
import type { BaseEntity, DataSource, Timestamp } from './types';

/** Bei jeder Änderung an `src/data/*.json` erhöhen, damit Geräte die neuen Daten übernehmen */
export const SEED_VERSION = 1;

export interface SeedData {
  exercises: BuiltinExercise[];
  foods: BuiltinFood[];
}

// Dynamischer Import: eigene Chunks, werden nur bei neuer Seed-Version geladen (offline aus dem Precache)
export async function loadSeedData(): Promise<SeedData> {
  const [exercises, foods] = await Promise.all([
    import('../data/exercises.json'),
    import('../data/foods.json'),
  ]);
  return {
    exercises: exercises.default as unknown as BuiltinExercise[],
    foods: foods.default as unknown as BuiltinFood[],
  };
}

let pending: Promise<void> | null = null;

/** Spielt mitgelieferte Daten ein, falls dieses Gerät einen älteren Stand hat */
export function ensureSeeded(load: () => Promise<SeedData> = loadSeedData): Promise<void> {
  pending ??= (async () => {
    const settings = await ensureSettings();
    if (settings.seedVersion >= SEED_VERSION) return;
    await applySeed(await load(), SEED_VERSION);
  })().finally(() => {
    pending = null;
  });
  return pending;
}

/**
 * Gleicht `builtin`-Einträge mit den Seed-Daten ab: neue anlegen, geänderte aktualisieren,
 * entfernte ausblenden. Eigene Einträge (`source: 'user'`) werden nie angefasst.
 */
export async function applySeed(data: SeedData, version: number): Promise<void> {
  await db.transaction('rw', [db.settings, db.exercises, db.foods], async () => {
    const settings = await ensureSettings();
    if (settings.seedVersion >= version) return;
    const now = nowIso();
    await syncBuiltins(db.exercises, data.exercises, now);
    await syncBuiltins(db.foods, data.foods, now);
    await db.settings.update(SETTINGS_ID, { seedVersion: version, updatedAt: now });
  });
}

type CatalogEntity = BaseEntity & { source: DataSource; builtinKey: string | null };

async function syncBuiltins<T extends CatalogEntity>(
  table: Table<T, string>,
  items: Array<{ key: string }>,
  now: Timestamp,
): Promise<void> {
  const builtins = await table.where('source').equals('builtin').toArray();
  const remaining = new Map(builtins.map((entity) => [entity.builtinKey, entity]));
  const changes: T[] = [];

  for (const { key, ...fields } of items) {
    const current = remaining.get(key);
    remaining.delete(key);
    if (!current) {
      changes.push({
        ...fields,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        source: 'builtin',
        builtinKey: key,
      } as unknown as T);
      continue;
    }
    const record = current as unknown as Record<string, unknown>;
    const changed = Object.entries(fields).some(
      ([field, value]) => JSON.stringify(record[field]) !== JSON.stringify(value),
    );
    // Zusätzliche Felder am Datensatz (z. B. spätere Favoriten-Markierung) bleiben erhalten
    if (changed) changes.push({ ...current, ...fields, updatedAt: now });
  }

  // Nicht mehr mitgelieferte Einträge nur ausblenden – sie können bereits verwendet worden sein
  for (const removed of remaining.values()) {
    if (removed.deletedAt === null) changes.push({ ...removed, deletedAt: now, updatedAt: now });
  }

  await table.bulkPut(changes);
}
