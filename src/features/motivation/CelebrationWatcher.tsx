import Dexie, { type ObservabilitySet } from 'dexie';
import { useEffect } from 'react';
import { getToast, showToast, subscribeToast } from '../../components/toastStore';
import { db } from '../../db/database';
import { checkCelebrations } from '../../db/motivation';

/** Wartezeit nach der letzten Änderung (mehrere Schreibvorgänge eines Tipps zusammenfassen) */
const DELAY_MS = 1500;
/** Auch bei laufenden Änderungen spätestens nach dieser Zeit prüfen */
const MAX_WAIT_MS = 5000;

/**
 * Laufend geloggte Sätze (und große Daten) lösen keinen Abgleich aus; gezählt werden ohnehin nur
 * beendete Workouts, deren Ende in `workouts` steht.
 */
const IGNORED_TABLES = new Set(['sets', 'workoutExercises', 'enduranceTracks', 'photoFiles']);

function touchesRelevantTable(parts: ObservabilitySet): boolean {
  const prefix = `idb://${db.name}/`;
  return Object.keys(parts).some((part) => {
    if (!part.startsWith(prefix)) return false;
    const table = part.slice(prefix.length).split('/')[0] ?? '';
    return !IGNORED_TABLES.has(table);
  });
}

/** Zeigt den Hinweis, sobald kein anderer (z. B. Rekord) mehr zu sehen ist */
function showWhenFree(toast: { title: string; lines: string[] }) {
  if (!getToast()) {
    showToast(toast);
    return;
  }
  const unsubscribe = subscribeToast(() => {
    if (getToast()) return;
    unsubscribe();
    showToast(toast);
  });
}

/**
 * Im Layout eingehängt: meldet neu erreichte Abzeichen und Ziele, kurz nachdem sich Daten geändert
 * haben (und beim Start)
 */
export function CelebrationWatcher() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let again = false;
    let disposed = false;

    let pendingSince: number | null = null;
    const schedule = () => {
      clearTimeout(timer);
      pendingSince ??= Date.now();
      const wait = Math.max(0, Math.min(DELAY_MS, pendingSince + MAX_WAIT_MS - Date.now()));
      timer = setTimeout(() => void run(), wait);
    };
    const run = async () => {
      pendingSince = null;
      if (running) {
        again = true;
        return;
      }
      running = true;
      try {
        const toast = await checkCelebrations();
        if (toast && !disposed) showWhenFree(toast);
      } catch (error) {
        console.error('Erfolge konnten nicht geprüft werden', error);
      } finally {
        running = false;
        if (again && !disposed) {
          again = false;
          schedule();
        }
      }
    };
    const onMutated = (parts: ObservabilitySet) => {
      if (touchesRelevantTable(parts)) schedule();
    };

    Dexie.on.storagemutated.subscribe(onMutated);
    // Sofort beim Start: Der erste (stille) Abgleich soll vor dem ersten Erfolg liegen
    void run();
    return () => {
      disposed = true;
      clearTimeout(timer);
      Dexie.on.storagemutated.unsubscribe(onMutated);
    };
  }, []);
  return null;
}
