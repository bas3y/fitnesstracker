import { useLiveQuery } from 'dexie-react-hooks';
import {
  listPlans,
  loadActivePlanSuggestion,
  loadPlanDayDetail,
  loadPlanDetail,
} from '../../db/plans';

export function usePlans() {
  return useLiveQuery(listPlans, []);
}

/** `undefined` = lädt, `null` = nicht gefunden oder gelöscht */
export function usePlanDetail(id: string | undefined) {
  return useLiveQuery(async () => (id ? loadPlanDetail(id) : null), [id]);
}

/** `undefined` = lädt, `null` = nicht gefunden oder gelöscht */
export function usePlanDayDetail(id: string | undefined) {
  return useLiveQuery(async () => (id ? loadPlanDayDetail(id) : null), [id]);
}

/** Aktiver Plan mit Vorschlag; `undefined` = lädt, `null` = kein aktiver Plan */
export function useActivePlanSuggestion() {
  return useLiveQuery(() => loadActivePlanSuggestion(), []);
}
