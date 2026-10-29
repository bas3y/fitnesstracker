import { useLiveQuery } from 'dexie-react-hooks';
import { CatalogSearch } from '../../components/CatalogSearch';
import { Page } from '../../components/Page';
import { db } from '../../db/database';
import { listActive } from '../../db/repository';
import type { Exercise } from '../../db/types';
import { EQUIPMENT_LABELS, EXERCISE_CATEGORY_LABELS, MUSCLE_LABELS } from '../../domain/labels';

// Einfache Suchseite für die mitgelieferte Übungsdatenbank; Verwaltung folgt in Schritt 3
export function ExerciseSearchPage() {
  const exercises = useLiveQuery(() => listActive(db.exercises), []);

  return (
    <Page title="Übungen" backTo="/training">
      <CatalogSearch
        items={exercises}
        label="Übung suchen"
        placeholder="z. B. Bankdrücken, Kniebeuge …"
        noun="Übungen"
        renderItem={(exercise) => <ExerciseRow exercise={exercise} />}
      />
    </Page>
  );
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const muscles = exercise.primaryMuscles.map((muscle) => MUSCLE_LABELS[muscle]).join(', ');
  return (
    <>
      <p className="font-medium">{exercise.name}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {EXERCISE_CATEGORY_LABELS[exercise.category]} · {EQUIPMENT_LABELS[exercise.equipment]}
        {muscles && ` · ${muscles}`}
      </p>
    </>
  );
}
