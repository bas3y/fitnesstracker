import { db } from './database';

export async function resetDatabase(): Promise<void> {
  await Promise.all(db.tables.map((table) => table.clear()));
}
