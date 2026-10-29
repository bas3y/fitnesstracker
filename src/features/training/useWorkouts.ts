import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { countWorkoutRecords, getWorkoutRecords } from '../../db/records';
import {
  getActiveWorkout,
  getLastPerformance,
  listWorkoutHistory,
  loadWorkoutDetail,
} from '../../db/workouts';

/** Laufendes Workout; `undefined` = lädt, `null` = keins */
export function useActiveWorkout() {
  return useLiveQuery(async () => (await getActiveWorkout()) ?? null, []);
}

/** `undefined` = lädt, `null` = nicht gefunden oder gelöscht */
export function useWorkoutDetail(id: string | undefined) {
  return useLiveQuery(async () => (id ? loadWorkoutDetail(id) : null), [id]);
}

export function useLastPerformance(exerciseId: string, workoutId: string) {
  return useLiveQuery(() => getLastPerformance(exerciseId, workoutId), [exerciseId, workoutId]);
}

export function useWorkoutHistory() {
  return useLiveQuery(listWorkoutHistory, []);
}

/** Rekorde je Satz-ID; `undefined` = lädt */
export function useWorkoutRecords(workoutId: string) {
  return useLiveQuery(() => getWorkoutRecords(workoutId), [workoutId]);
}

/** Anzahl Rekorde je Workout-ID */
export function useWorkoutRecordCounts() {
  return useLiveQuery(countWorkoutRecords, []);
}

/** Aktuelle Zeit, solange `active` jede Sekunde (bzw. `intervalMs`) aktualisiert */
export function useNow(active = true, intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);
  return now;
}
