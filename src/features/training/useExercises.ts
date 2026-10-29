import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { listActive } from '../../db/repository';
import type { Exercise } from '../../db/types';

/** Alle nicht gelöschten Übungen (inkl. ausgeblendeter), `undefined` während des Ladens */
export function useActiveExercises(): Exercise[] | undefined {
  return useLiveQuery(() => listActive(db.exercises), []);
}

/** `undefined` = lädt, `null` = nicht gefunden oder gelöscht */
export function useExercise(id: string | undefined): Exercise | null | undefined {
  return useLiveQuery(async () => {
    const exercise = id ? await db.exercises.get(id) : undefined;
    return exercise && exercise.deletedAt === null ? exercise : null;
  }, [id]);
}
