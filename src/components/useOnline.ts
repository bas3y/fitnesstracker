import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

/**
 * Verbindungsstatus des Browsers für Online-Funktionen (ausgegraut mit „Nur mit Internet“).
 * `true` heißt nur „vermutlich online“ – Anfragen brauchen trotzdem eine Fehlerbehandlung.
 */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
