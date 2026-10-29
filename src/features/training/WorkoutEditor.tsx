import { useState } from 'react';
import { secondaryButton } from '../../components/buttons';
import { addWorkoutExercise, type WorkoutDetail } from '../../db/workouts';
import { useSettings } from '../settings/useSettings';
import { ExercisePicker } from './ExercisePicker';
import { WorkoutExerciseCard, type WorkoutMode } from './WorkoutExerciseCard';

/** Übungen und Sätze eines Workouts bearbeiten – für das laufende Workout und die Historie */
export function WorkoutEditor({ detail, mode }: { detail: WorkoutDetail; mode: WorkoutMode }) {
  const settings = useSettings();
  const [picking, setPicking] = useState(false);
  const { workout, items } = detail;

  return (
    <>
      {items.length === 0 && (
        <p className="mb-4 text-slate-600 dark:text-slate-400">
          Noch keine Übungen. Füge die erste Übung hinzu.
        </p>
      )}
      {items.map((item, index) => (
        <WorkoutExerciseCard
          key={item.workoutExercise.id}
          item={item}
          index={index}
          count={items.length}
          mode={mode}
          unit={settings?.weightUnit ?? 'kg'}
          restSeconds={settings?.restTimerSeconds ?? 90}
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
