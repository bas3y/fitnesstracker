import { useState } from 'react';
import { secondaryButton } from '../../components/buttons';
import { SortableList } from '../../components/SortableList';
import { REST_TIMER_DEFAULTS } from '../../db/settings';
import { addWorkoutExercise, reorderWorkoutExercises, type WorkoutDetail } from '../../db/workouts';
import { useSettings } from '../settings/useSettings';
import { ExercisePicker } from './ExercisePicker';
import { useWorkoutRecords } from './useWorkouts';
import { WorkoutExerciseCard, type WorkoutMode } from './WorkoutExerciseCard';

/** Übungen und Sätze eines Workouts bearbeiten – für das laufende Workout und die Historie */
export function WorkoutEditor({ detail, mode }: { detail: WorkoutDetail; mode: WorkoutMode }) {
  const settings = useSettings();
  const [picking, setPicking] = useState(false);
  const { workout, items } = detail;
  const records = useWorkoutRecords(workout.id);

  return (
    <>
      {items.length === 0 && (
        <p className="mb-4 text-slate-600 dark:text-slate-400">
          Noch keine Übungen. Füge die erste Übung hinzu.
        </p>
      )}
      <SortableList
        label="Übungen im Workout"
        items={items.map((item) => ({
          ...item,
          id: item.workoutExercise.id,
          name: item.exercise?.name ?? 'Unbekannte Übung',
        }))}
        onReorder={(ids) => reorderWorkoutExercises(workout.id, ids)}
        renderItem={(item, row) => (
          <WorkoutExerciseCard
            item={item}
            mode={mode}
            unit={settings?.weightUnit ?? 'kg'}
            restSeconds={
              settings?.restTimerEnabled === false
                ? 0
                : (item.workoutExercise.restSeconds ??
                  settings?.restTimerSeconds ??
                  REST_TIMER_DEFAULTS.restTimerSeconds)
            }
            records={records}
            otherExerciseIds={items
              .filter((other) => other.workoutExercise.id !== item.id)
              .map((other) => other.workoutExercise.exerciseId)}
            handle={row.handle}
          />
        )}
      />
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
