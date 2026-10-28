import Dexie, { type Table } from 'dexie';
import { create, listActive, softDelete, update } from './repository';
import type { BaseEntity } from './types';

interface Item extends BaseEntity {
  label: string;
}

class TestDatabase extends Dexie {
  items!: Table<Item, string>;

  constructor() {
    super('repository-test');
    this.version(1).stores({ items: 'id' });
  }
}

const testDb = new TestDatabase();

beforeEach(async () => {
  await testDb.items.clear();
  vi.useRealTimers();
});

describe('repository', () => {
  it('create setzt UUID, Zeitstempel und deletedAt = null', async () => {
    const item = await create(testDb.items, { label: 'A' });
    expect(item.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(item.createdAt).toBe(item.updatedAt);
    expect(item.deletedAt).toBeNull();
    expect(await testDb.items.get(item.id)).toEqual(item);
  });

  it('create übernimmt eine vorgegebene ID', async () => {
    const item = await create(testDb.items, { id: 'fix', label: 'A' });
    expect(item.id).toBe('fix');
  });

  it('update ändert Felder und updatedAt, aber nicht createdAt', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const item = await create(testDb.items, { label: 'A' });
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
    await update(testDb.items, item.id, { label: 'B' });

    const stored = await testDb.items.get(item.id);
    expect(stored?.label).toBe('B');
    expect(stored?.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(stored?.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('update wirft bei unbekannter ID', async () => {
    await expect(update(testDb.items, 'gibt-es-nicht', { label: 'B' })).rejects.toThrow();
  });

  it('softDelete markiert statt zu löschen, listActive blendet aus', async () => {
    const a = await create(testDb.items, { label: 'A' });
    const b = await create(testDb.items, { label: 'B' });
    await softDelete(testDb.items, a.id);

    expect((await testDb.items.get(a.id))?.deletedAt).not.toBeNull();
    expect(await listActive(testDb.items)).toEqual([b]);
  });
});
