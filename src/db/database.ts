import Dexie, { type Table } from 'dexie';
import type { Settings } from './types';

export const DB_NAME = 'fitnesstracker';

// Schemaänderungen nur über eine neue `version(n)` mit Upgrade-Funktion – alte Versionen nie entfernen
export class AppDatabase extends Dexie {
  settings!: Table<Settings, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({
      settings: 'id, updatedAt',
    });
  }
}

export const db = new AppDatabase();
