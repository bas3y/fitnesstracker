import { useLocation } from 'react-router-dom';

/** `state` eines Links in einen anderen Bereich: „Zurück“ führt dann zur Herkunft */
export interface BackState {
  from: string;
}

export function useFromHere(): BackState {
  const { pathname, search } = useLocation();
  return { from: pathname + search };
}

/** Herkunft aus dem `state` des Links, sonst die übergeordnete Seite */
export function useBackTo(fallback: string): string {
  return (useLocation().state as BackState | null)?.from ?? fallback;
}
