import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings } from '../../db/settings';

/** `undefined`, solange geladen wird oder noch kein Datensatz existiert */
export function useSettings() {
  return useLiveQuery(getSettings);
}
