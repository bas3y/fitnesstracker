import type Dexie from 'dexie';

/**
 * Zustand der Datenbank-Verbindung, damit die App bei Problemen einen Hinweis zeigt statt leer zu
 * bleiben:
 * - `blocked`: Update der Datenbank wartet, weil ein anderes Fenster (Browser-Tab oder installierte
 *   App) noch die alte Version offen hält
 * - `outdated`: Ein anderes Fenster bringt die Datenbank gerade auf eine neuere Version; dieses
 *   Fenster läuft noch mit altem Code, hat die Verbindung dafür geschlossen und muss neu laden
 * - `error`: Datenbank lässt sich nicht öffnen (Speicher voll, privater Modus …)
 */
export type DbStatus = 'ok' | 'blocked' | 'outdated' | 'error';

export interface DbState {
  status: DbStatus;
  error: string | null;
}

let state: DbState = { status: 'ok', error: null };
const listeners = new Set<() => void>();

export function getDbState(): DbState {
  return state;
}

export function subscribeDbState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDbState(status: DbStatus, error: string | null = null): void {
  if (state.status === status && state.error === error) return;
  state = { status, error };
  listeners.forEach((listener) => listener());
}

/** Hängt die Ereignisse an und öffnet die Datenbank (einmal beim Start) */
export function watchDatabase(database: Dexie): Promise<void> {
  database.on('blocked', () => setDbState('blocked'));
  database.on('ready', () => {
    if (getDbState().status === 'blocked') setDbState('ok');
  });
  database.on('versionchange', () => {
    // Statt automatisch neu zu öffnen (scheitert mit altem Code): schließen und Neuladen anbieten
    database.close();
    setDbState('outdated');
    return false;
  });
  // Eine neuere Datenbank (anderes Fenster hat schon aktualisiert) öffnet Dexie 4 trotzdem
  return database.open().then(
    () => undefined,
    (error: unknown) => setDbState('error', error instanceof Error ? error.message : String(error)),
  );
}
