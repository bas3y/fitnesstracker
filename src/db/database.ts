import Dexie, { type Table } from 'dexie';
import type { Exercise, Food, Settings, Workout, WorkoutExercise, WorkoutSet } from './types';

export const DB_NAME = 'fitnesstracker';

// Schemaänderungen nur über eine neue `version(n)` mit Upgrade-Funktion – alte Versionen nie entfernen
export class AppDatabase extends Dexie {
  settings!: Table<Settings, string>;
  exercises!: Table<Exercise, string>;
  foods!: Table<Food, string>;
  workouts!: Table<Workout, string>;
  workoutExercises!: Table<WorkoutExercise, string>;
  sets!: Table<WorkoutSet, string>;

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
    this.version(3)
      .stores({
        exercises: 'id, builtinKey, source, category, updatedAt',
      })
      .upgrade((tx) =>
        tx
          .table<Exercise, string>('exercises')
          .toCollection()
          .modify((exercise) => {
            exercise.isFavorite ??= false;
            exercise.hiddenAt ??= null;
            exercise.notes ??= '';
          }),
      );
    // Mitgelieferte Halteübungen bekommen `isTimed: true` über Seed-Version 3
    this.version(4)
      .stores({
        workouts: 'id, startedAt, updatedAt',
        workoutExercises: 'id, workoutId, exerciseId, updatedAt',
        sets: 'id, workoutId, workoutExerciseId, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.restTimerSeconds ??= 180;
            settings.restTimerSound ??= true;
            settings.restTimerVibrate ??= true;
          });
        await tx
          .table<Exercise, string>('exercises')
          .toCollection()
          .modify((exercise) => {
            exercise.isTimed ??= false;
          });
      });
    // Stufe statt Gewicht (Maschinen ohne kg-Anzeige)
    this.version(5)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table<Exercise, string>('exercises')
          .toCollection()
          .modify((exercise) => {
            exercise.loadType ??= 'weight';
          });
        await tx
          .table<WorkoutSet, string>('sets')
          .toCollection()
          .modify((set) => {
            set.level ??= null;
          });
      });
  }
}

export const db = new AppDatabase();
