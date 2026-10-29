import { db } from './database';
import { setExerciseFavorite, setExerciseHidden, setExerciseNotes } from './exercises';
import { create } from './repository';
import type { BuiltinExercise, BuiltinFood } from './schemas';
import {
  applySeed,
  ensureSeeded,
  EXERCISE_USER_DEFAULTS,
  SEED_VERSION,
  type SeedData,
} from './seed';
import { getSettings } from './settings';
import { resetDatabase } from './testUtils';
import type { Exercise } from './types';

beforeEach(resetDatabase);

const bench: BuiltinExercise = {
  key: 'barbell-bench-press',
  name: 'Bankdrücken (Langhantel)',
  aliases: ['Bench Press'],
  category: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps', 'shoulders'],
  equipment: 'barbell',
  isUnilateral: false,
  isTimed: false,
};
const squat: BuiltinExercise = {
  ...bench,
  key: 'barbell-squat',
  name: 'Kniebeugen (Langhantel)',
  aliases: [],
  primaryMuscles: ['quads'],
};
const oats: BuiltinFood = {
  key: 'oats',
  name: 'Haferflocken',
  aliases: ['Hafer'],
  category: 'grains',
  kcal: 379,
  protein: 13.2,
  carbs: 57.6,
  fat: 6.5,
  fiber: 10.1,
  sugar: 1,
  alcohol: 0,
  portions: [{ label: '1 EL', grams: 10 }],
  sourceRef: 'usda:173904',
};

const seed = (exercises: BuiltinExercise[], foods: BuiltinFood[] = [oats]): SeedData => ({
  exercises,
  foods,
});

const builtin = (key: string) => db.exercises.where('builtinKey').equals(key).first();

describe('applySeed', () => {
  it('legt beim ersten Start alle Einträge als builtin an und merkt sich die Version', async () => {
    await applySeed(seed([bench, squat]), 1);

    expect(await db.exercises.count()).toBe(2);
    expect(await db.foods.count()).toBe(1);
    const entry = await builtin('barbell-bench-press');
    const { key, ...fields } = bench;
    expect(entry).toMatchObject({
      ...fields,
      ...EXERCISE_USER_DEFAULTS,
      source: 'builtin',
      builtinKey: key,
      deletedAt: null,
    });
    expect(entry).not.toHaveProperty('key');
    expect(entry?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect((await getSettings())?.seedVersion).toBe(1);
  });

  it('läuft bei gleicher Version nicht erneut', async () => {
    await applySeed(seed([bench]), 1);
    await applySeed(seed([bench, squat]), 1);
    expect(await db.exercises.count()).toBe(1);
  });

  it('aktualisiert builtin-Einträge, überschreibt aber keine eigenen Einträge', async () => {
    await applySeed(seed([bench]), 1);
    const before = await builtin('barbell-bench-press');
    const own = await create<Exercise>(db.exercises, {
      ...bench,
      ...EXERCISE_USER_DEFAULTS,
      name: 'Mein Bankdrücken',
      source: 'user',
      builtinKey: null,
    });

    await applySeed(seed([{ ...bench, name: 'Bankdrücken (LH)' }, squat]), 2);

    const after = await builtin('barbell-bench-press');
    expect(after?.id).toBe(before?.id);
    expect(after?.name).toBe('Bankdrücken (LH)');
    expect(after?.createdAt).toBe(before?.createdAt);
    expect(await db.exercises.get(own.id)).toEqual(own);
    expect(await builtin('barbell-squat')).toBeDefined();
    expect((await getSettings())?.seedVersion).toBe(2);
  });

  it('lässt unveränderte Einträge unangetastet und behält Nutzerfelder', async () => {
    await applySeed(seed([bench, squat]), 1);
    const squatBefore = await builtin('barbell-squat');
    const benchBefore = await builtin('barbell-bench-press');
    await setExerciseFavorite(benchBefore!.id, true);
    await setExerciseHidden(benchBefore!.id, true);
    await setExerciseNotes(benchBefore!.id, 'Griff 81 cm');

    await applySeed(seed([{ ...bench, aliases: ['Bench'] }, squat]), 2);

    expect(await builtin('barbell-squat')).toEqual(squatBefore);
    expect(await builtin('barbell-bench-press')).toMatchObject({
      aliases: ['Bench'],
      isFavorite: true,
      hiddenAt: expect.any(String),
      notes: 'Griff 81 cm',
      deletedAt: null,
    });
  });

  it('blendet entfernte builtin-Einträge aus statt sie zu löschen', async () => {
    await applySeed(seed([bench, squat]), 1);
    await applySeed(seed([bench]), 2);

    const squatAfter = await builtin('barbell-squat');
    expect(squatAfter?.deletedAt).not.toBeNull();
    expect(await db.exercises.count()).toBe(2);
  });

  it('holt wieder aufgenommene builtin-Einträge zurück (gleiche ID)', async () => {
    await applySeed(seed([bench, squat]), 1);
    const squatBefore = await builtin('barbell-squat');
    await applySeed(seed([bench]), 2);
    await applySeed(seed([bench, squat]), 3);

    const squatAfter = await builtin('barbell-squat');
    expect(squatAfter?.id).toBe(squatBefore?.id);
    expect(squatAfter?.deletedAt).toBeNull();
    expect(await db.exercises.count()).toBe(2);
  });
});

describe('ensureSeeded', () => {
  it('lädt die Daten nur, wenn der Stand veraltet ist', async () => {
    const load = vi.fn(async () => seed([bench]));
    await Promise.all([ensureSeeded(load), ensureSeeded(load)]);
    await ensureSeeded(load);

    expect(load).toHaveBeenCalledTimes(1);
    expect((await getSettings())?.seedVersion).toBe(SEED_VERSION);
  });

  it('spielt die echten mitgelieferten Daten ein', async () => {
    await ensureSeeded();
    expect(await db.exercises.count()).toBeGreaterThan(150);
    expect(await db.foods.count()).toBeGreaterThan(500);
  });
});
