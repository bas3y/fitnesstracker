import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { listGoals, loadGoal, loadGoalData } from '../../db/goals';
import type { Exercise, Goal } from '../../db/types';

export function useGoals() {
  return useLiveQuery(listGoals, []);
}

/** `undefined` = lädt, `null` = gibt es nicht (mehr) */
export function useGoal(id: string | undefined) {
  return useLiveQuery(async () => (id ? loadGoal(id) : null), [id]);
}

export function useGoalData() {
  return useLiveQuery(loadGoalData, []);
}

/** Übungen der Kraftziele (auch ausgeblendete), für die Namen */
export function useGoalExercises(goals: readonly Goal[] | undefined) {
  const ids = [
    ...new Set((goals ?? []).flatMap((goal) => (goal.exerciseId ? [goal.exerciseId] : []))),
  ].sort();
  const key = ids.join(',');
  return useLiveQuery(async () => {
    const exercises = await db.exercises.bulkGet(ids);
    return new Map(
      exercises.flatMap((exercise): [string, Exercise][] =>
        exercise ? [[exercise.id, exercise]] : [],
      ),
    );
  }, [key]);
}
