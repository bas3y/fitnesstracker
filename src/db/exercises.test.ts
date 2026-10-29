import { db } from './database';
import {
  createUserExercise,
  deleteUserExercise,
  setExerciseFavorite,
  setExerciseHidden,
  setExerciseNotes,
  updateUserExercise,
} from './exercises';
import type { ExerciseInput } from './schemas';
import { applySeed } from './seed';
import { resetDatabase } from './testUtils';

beforeEach(resetDatabase);

const input: ExerciseInput = {
  name: '  Hip Thrust Maschine ',
  aliases: ['Glute Drive', ' '],
  category: 'strength',
  primaryMuscles: ['glutes'],
  secondaryMuscles: ['hamstrings'],
  equipment: 'machine',
  isUnilateral: false,
};

async function seedBench() {
  await applySeed(
    {
      exercises: [
        {
          key: 'barbell-bench-press',
          name: 'Bankdrücken (Langhantel)',
          aliases: [],
          category: 'strength',
          primaryMuscles: ['chest'],
          secondaryMuscles: [],
          equipment: 'barbell',
          isUnilateral: false,
        },
      ],
      foods: [],
    },
    1,
  );
  return (await db.exercises.where('builtinKey').equals('barbell-bench-press').first())!;
}

describe('createUserExercise', () => {
  it('legt eine eigene Übung mit bereinigten Feldern an', async () => {
    const created = await createUserExercise(input);
    expect(created).toMatchObject({
      name: 'Hip Thrust Maschine',
      aliases: ['Glute Drive'],
      source: 'user',
      builtinKey: null,
      isFavorite: false,
      hiddenAt: null,
      notes: '',
      deletedAt: null,
    });
    expect(await db.exercises.get(created.id)).toEqual(created);
  });

  it('verlangt bei Kraftübungen eine Hauptmuskelgruppe, sonst nicht', async () => {
    await expect(createUserExercise({ ...input, primaryMuscles: [] })).rejects.toThrow();
    await expect(
      createUserExercise({ ...input, category: 'cardio', primaryMuscles: [] }),
    ).resolves.toBeDefined();
  });

  it('lehnt doppelte Namen ab (auch gegenüber mitgelieferten Übungen)', async () => {
    await seedBench();
    await expect(
      createUserExercise({ ...input, name: 'bankdruecken (langhantel)' }),
    ).rejects.toThrow(/bereits/);
  });
});

describe('updateUserExercise / deleteUserExercise', () => {
  it('ändert eigene Übungen, auch mit gleichem Namen wie vorher', async () => {
    const created = await createUserExercise(input);
    await updateUserExercise(created.id, { ...input, equipment: 'barbell' });
    expect((await db.exercises.get(created.id))?.equipment).toBe('barbell');
  });

  it('schützt mitgelieferte Übungen vor Bearbeiten und Löschen', async () => {
    const bench = await seedBench();
    await expect(updateUserExercise(bench.id, input)).rejects.toThrow(/Mitgelieferte/);
    await expect(deleteUserExercise(bench.id)).rejects.toThrow(/Mitgelieferte/);
  });

  it('löscht eigene Übungen nur weich', async () => {
    const created = await createUserExercise(input);
    await deleteUserExercise(created.id);
    expect((await db.exercises.get(created.id))?.deletedAt).not.toBeNull();
    // Name ist danach wieder frei
    await expect(createUserExercise(input)).resolves.toBeDefined();
  });
});

describe('Favorit, Ausblenden, Notiz', () => {
  it('setzt die Nutzerfelder', async () => {
    const bench = await seedBench();
    await setExerciseFavorite(bench.id, true);
    await setExerciseHidden(bench.id, true);
    await setExerciseNotes(bench.id, '  Griff 81 cm ');
    expect(await db.exercises.get(bench.id)).toMatchObject({
      isFavorite: true,
      hiddenAt: expect.any(String),
      notes: 'Griff 81 cm',
      deletedAt: null,
    });

    await setExerciseHidden(bench.id, false);
    expect((await db.exercises.get(bench.id))?.hiddenAt).toBeNull();
  });
});
