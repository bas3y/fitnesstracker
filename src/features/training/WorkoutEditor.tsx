import { useState } from 'react';
import { secondaryButton } from '../../components/buttons';
import { REST_TIMER_DEFAULTS } from '../../db/settings';
import { addWorkoutExercise, type WorkoutDetail } from '../../db/workouts';
import { useSettings } from '../settings/useSettings';
import { ExerciseOrderList } from './ExerciseOrderList';
import { ExercisePicker } from './ExercisePicker';
import { useWorkoutRecords } from './useWorkouts';
import { WorkoutExerciseCard, type WorkoutMode } from './WorkoutExerciseCard';

/** Übungen und Sätze eines Workouts bearbeiten – für das laufende Workout und die Historie */
export function WorkoutEditor({ detail, mode }: { detail: WorkoutDetail; mode: WorkoutMode }) {
  const settings = useSettings();
  const [picking, setPicking] = useState(false);
  const [sorting, setSorting] = useState(false);
  const { workout, items } = detail;
  const records = useWorkoutRecords(workout.id);

  if (sorting && items.length > 1) {
    return (
      <ExerciseOrderList workoutId={workout.id} items={items} onDone={() => setSorting(false)} />
    );
  }

  return (
    <>
      {items.length === 0 && (
        <p className="mb-4 text-slate-600 dark:text-slate-400">
          Noch keine Übungen. Füge die erste Übung hinzu.
        </p>
      )}
      {items.length > 1 && (
        <button
          type="button"
          className="-mt-2 mb-2 min-h-11 text-sm font-medium text-emerald-700 dark:text-emerald-400"
          onClick={() => setSorting(true)}
        >
          ⠿ Reihenfolge ändern
        </button>
      )}
      {items.map((item) => (
        <WorkoutExerciseCard
          key={item.workoutExercise.id}
          item={item}
          mode={mode}
          unit={settings?.weightUnit ?? 'kg'}
          restSeconds={settings?.restTimerSeconds ?? REST_TIMER_DEFAULTS.restTimerSeconds}
          records={records}
        />
      ))}
      <button type="button" className={`${secondaryButton} mb-4`} onClick={() => setPicking(true)}>
        + Übung hinzufügen
      </button>
      {picking && (
        <ExercisePicker
          title="Übung hinzufügen"
          onClose={() => setPicking(false)}
          onSelect={async (exercise) => {
            setPicking(false);
            await addWorkoutExercise(workout.id, exercise.id);
          }}
        />
      )}
    </>
  );
}
