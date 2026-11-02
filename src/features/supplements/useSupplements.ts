import { useLiveQuery } from 'dexie-react-hooks';
import {
  listSupplementHabitCandidates,
  loadSupplement,
  loadSupplementOverview,
  loadTrainingDays,
} from '../../db/supplements';

export function useSupplementOverview() {
  return useLiveQuery(loadSupplementOverview, []);
}

/** `undefined` = lädt, `null` = gibt es nicht (mehr) */
export function useSupplement(id: string | undefined) {
  return useLiveQuery(async () => {
    if (!id) return null;
    const [item, trainingDays] = await Promise.all([loadSupplement(id), loadTrainingDays()]);
    return item && { item, trainingDays };
  }, [id]);
}

export function useSupplementHabitCandidates() {
  return useLiveQuery(listSupplementHabitCandidates, []);
}
