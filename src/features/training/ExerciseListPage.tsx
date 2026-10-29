import { useState } from 'react';
import { Link } from 'react-router-dom';
import { primaryButton } from '../../components/buttons';
import { StarIcon } from '../../components/icons';
import { Page } from '../../components/Page';
import { setExerciseFavorite } from '../../db/exercises';
import type { Exercise } from '../../db/types';
import { INITIAL_BROWSER_STATE, type ExerciseBrowserState } from '../../domain/exercises';
import { ExerciseBrowser, ExerciseSummary } from './ExerciseBrowser';
import { useActiveExercises } from './useExercises';

// Suche und Filter bleiben beim Wechsel zur Detailseite und zurück erhalten (bis zum Neuladen)
const remembered = { state: INITIAL_BROWSER_STATE };

export function ExerciseListPage() {
  const exercises = useActiveExercises();
  const [state, setState] = useState(remembered.state);

  const handleStateChange = (next: ExerciseBrowserState) => {
    remembered.state = next;
    setState(next);
  };

  return (
    <Page title="Übungen" backTo="/training">
      <Link to="/training/exercises/new" className={`${primaryButton} mb-4`}>
        + Eigene Übung
      </Link>
      <ExerciseBrowser
        exercises={exercises}
        state={state}
        onStateChange={handleStateChange}
        allowHidden
        renderItem={(exercise) => <ExerciseListRow exercise={exercise} />}
      />
    </Page>
  );
}

function ExerciseListRow({ exercise }: { exercise: Exercise }) {
  return (
    <div className="flex items-center">
      <Link
        to={`/training/exercises/${exercise.id}`}
        className="flex min-h-14 min-w-0 flex-1 items-center py-2 pl-4 active:bg-slate-50 dark:active:bg-slate-700"
      >
        <ExerciseSummary exercise={exercise} />
      </Link>
      <FavoriteButton exercise={exercise} />
    </div>
  );
}

function FavoriteButton({ exercise }: { exercise: Exercise }) {
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
