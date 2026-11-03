import { useLiveQuery } from 'dexie-react-hooks';
import {
  listEnduranceSessions,
  listGear,
  loadEnduranceSession,
  loadGear,
} from '../../db/endurance';
import { ENDURANCE_SPORTS, type EnduranceSport } from '../../db/types';

export function useEnduranceSessions() {
  return useLiveQuery(listEnduranceSessions, []);
}

/** `undefined` = lädt, `null` = gibt es nicht (mehr) */
export function useEnduranceSession(id: string | undefined) {
  return useLiveQuery(async () => (id ? loadEnduranceSession(id) : null), [id]);
}

export function useGearList() {
  return useLiveQuery(listGear, []);
}

export function useGear(id: string | undefined) {
  return useLiveQuery(async () => (id ? loadGear(id) : null), [id]);
}

export function parseSport(value: string | undefined | null): EnduranceSport | null {
  return ENDURANCE_SPORTS.find((sport) => sport === value) ?? null;
}
