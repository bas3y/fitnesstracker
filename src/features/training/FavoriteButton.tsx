import { StarIcon } from '../../components/icons';
import { setExerciseFavorite } from '../../db/exercises';
import type { Exercise } from '../../db/types';

/** Stern als eigene Schaltfläche neben der Listenzeile (nicht in einen Button oder Link schachteln) */
export function FavoriteButton({ exercise }: { exercise: Exercise }) {
  return (
    <button
      type="button"
      aria-pressed={exercise.isFavorite}
      aria-label={`Favorit: ${exercise.name}`}
      className="flex h-14 w-14 shrink-0 items-center justify-center"
      onClick={() => void setExerciseFavorite(exercise.id, !exercise.isFavorite)}
    >
      <StarIcon
        filled={exercise.isFavorite}
        className={`h-6 w-6 ${exercise.isFavorite ? 'text-amber-500' : 'text-slate-400'}`}
      />
    </button>
  );
}
