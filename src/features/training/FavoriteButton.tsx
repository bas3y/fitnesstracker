import { FavoriteToggle } from '../../components/FavoriteToggle';
import { setExerciseFavorite } from '../../db/exercises';
import type { Exercise } from '../../db/types';

export function FavoriteButton({ exercise }: { exercise: Exercise }) {
  return (
    <FavoriteToggle
      name={exercise.name}
      isFavorite={exercise.isFavorite}
      onToggle={(isFavorite) => void setExerciseFavorite(exercise.id, isFavorite)}
    />
  );
}
