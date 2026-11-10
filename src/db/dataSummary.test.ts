import { loadDataSummary } from './dataSummary';
import { db } from './database';
import { create } from './repository';
import { ensureSettings } from './settings';
import { resetDatabase } from './testUtils';
import type { Exercise, Workout } from './types';

beforeEach(resetDatabase);

const exercise = (
  source: 'builtin' | 'user',
): Omit<Exercise, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> =>
  ({
    name: source,
    aliases: [],
    category: 'strength',
    primaryMuscles: [],
    secondaryMuscles: [],
    equipment: 'barbell',
    isUnilateral: false,
    isTimed: false,
    source,
    builtinKey: source === 'builtin' ? 'b' : null,
    isFavorite: false,
    hiddenAt: null,
    notes: '',
    loadType: 'weight',
  }) as unknown as Omit<Exercise, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

describe('loadDataSummary', () => {
  it('zählt nur eigene, aktive Einträge', async () => {
    await ensureSettings();
    await create(db.exercises, exercise('builtin'));
    await create(db.exercises, exercise('user'));
    const workout = { startedAt: '2026-11-01T10:00:00.000Z', endedAt: null } as unknown as Workout;
    await create(db.workouts, workout);
    const removed = await create(db.workouts, workout);
    await db.workouts.update(removed.id, { deletedAt: '2026-11-02T10:00:00.000Z' });

    expect(await loadDataSummary()).toEqual({
      total: 2,
      workouts: 1,
      enduranceSessions: 0,
      dailyLogs: 0,
    });
  });
});
