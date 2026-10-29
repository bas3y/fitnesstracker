import Dexie, { type Table } from 'dexie';
import type { Exercise, Food, Settings } from './types';

export const DB_NAME = 'fitnesstracker';

// Schemaänderungen nur über eine neue `version(n)` mit Upgrade-Funktion – alte Versionen nie entfernen
export class AppDatabase extends Dexie {
  settings!: Table<Settings, string>;
  exercises!: Table<Exercise, string>;
  foods!: Table<Food, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({
      settings: 'id, updatedAt',
    });
    this.version(2)
      .stores({
        exercises: 'id, builtinKey, source, category, updatedAt',
        foods: 'id, builtinKey, source, category, updatedAt',
      })
      .upgrade((tx) =>
        tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.seedVersion ??= 0;
          }),
      );
  }
}

export const db = new AppDatabase();
