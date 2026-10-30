import { SortableList } from '../../components/SortableList';
import { reorderWorkoutExercises, type WorkoutItem } from '../../db/workouts';

/** Übungsblöcke eines Workouts umsortieren (z. B. wenn ein Gerät belegt ist) */
export function ExerciseOrderList({
  workoutId,
  items,
  onDone,
}: {
  workoutId: string;
  items: WorkoutItem[];
  onDone: () => void;
}) {
  return (
    <SortableList
      label="Reihenfolge der Übungen"
      items={items.map((item) => ({
        id: item.workoutExercise.id,
        name: item.exercise?.name ?? 'Unbekannte Übung',
        hint: item.sets.length === 1 ? '1 Satz' : `${item.sets.length} Sätze`,
      }))}
      onReorder={(ids) => reorderWorkoutExercises(workoutId, ids)}
      onDone={onDone}
    />
  );
}
