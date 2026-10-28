import type { Table, UpdateSpec } from 'dexie';
import type { BaseEntity, Timestamp } from './types';

export type NewEntity<T extends BaseEntity> = Omit<T, keyof BaseEntity> & { id?: string };
export type EntityChanges<T extends BaseEntity> = Partial<Omit<T, keyof BaseEntity>>;

export function nowIso(): Timestamp {
  return new Date().toISOString();
}

export async function create<T extends BaseEntity>(
  table: Table<T, string>,
  data: NewEntity<T>,
): Promise<T> {
  const now = nowIso();
  const entity = {
    ...data,
    id: data.id ?? crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  } as unknown as T;
  await table.add(entity);
  return entity;
}

export async function update<T extends BaseEntity>(
  table: Table<T, string>,
  id: string,
  changes: EntityChanges<T>,
): Promise<void> {
  const count = await table.update(id, { ...changes, updatedAt: nowIso() } as UpdateSpec<T>);
  if (count === 0) throw new Error(`Datensatz ${id} nicht gefunden`);
}

export async function softDelete<T extends BaseEntity>(
  table: Table<T, string>,
  id: string,
): Promise<void> {
  const now = nowIso();
  const changes = { deletedAt: now, updatedAt: now } as unknown as UpdateSpec<T>;
  const count = await table.update(id, changes);
  if (count === 0) throw new Error(`Datensatz ${id} nicht gefunden`);
}

export function listActive<T extends BaseEntity>(table: Table<T, string>): Promise<T[]> {
  return table.filter((entity) => entity.deletedAt === null).toArray();
}
