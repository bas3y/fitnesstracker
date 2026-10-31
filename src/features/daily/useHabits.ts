import { useLiveQuery } from 'dexie-react-hooks';
import { loadHabit, loadHabits } from '../../db/habits';

export const HABITS_PATH = '/daily/habits';

export function useHabits() {
  return useLiveQuery(loadHabits, []);
}

/** `undefined` = lädt, `null` = gibt es nicht (mehr) */
export function useHabit(id: string | undefined) {
  return useLiveQuery(async () => (id ? loadHabit(id) : null), [id]);
}
