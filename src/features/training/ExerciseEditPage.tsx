import { useNavigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { createUserExercise, updateUserExercise } from '../../db/exercises';
import { EMPTY_EXERCISE_INPUT } from '../../db/schemas';
import { ExerciseForm } from './ExerciseForm';
import { useExercise } from './useExercises';

const LIST_PATH = '/training/exercises';

export function ExerciseCreatePage() {
  const navigate = useNavigate();
  return (
    <Page title="Eigene Übung" backTo={LIST_PATH}>
      <ExerciseForm
        initial={EMPTY_EXERCISE_INPUT}
        submitLabel="Anlegen"
        onSubmit={async (input) => {
          const exercise = await createUserExercise(input);
          navigate(`${LIST_PATH}/${exercise.id}`, { replace: true });
        }}
        onCancel={() => navigate(LIST_PATH)}
      />
    </Page>
  );
}

export function ExerciseEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const exercise = useExercise(id);
  const detailPath = `${LIST_PATH}/${id ?? ''}`;

  if (exercise === undefined) return <Page title="Übung bearbeiten">{null}</Page>;
  if (exercise === null || exercise.source !== 'user') {
    return (
      <Page title="Übung bearbeiten" backTo={LIST_PATH}>
        <Card>
          <p className="text-slate-600 dark:text-slate-400">
            Nur eigene Übungen können bearbeitet werden.
          </p>
        </Card>
      </Page>
    );
  }

  const { name, aliases, category, primaryMuscles, secondaryMuscles, equipment, isUnilateral } =
    exercise;
  return (
    <Page title="Übung bearbeiten" backTo={detailPath}>
      <ExerciseForm
        initial={{
          name,
          aliases,
          category,
          primaryMuscles,
          secondaryMuscles,
          equipment,
          isUnilateral,
        }}
        submitLabel="Speichern"
        onSubmit={async (input) => {
          await updateUserExercise(exercise.id, input);
          navigate(detailPath, { replace: true });
        }}
        onCancel={() => navigate(detailPath)}
      />
    </Page>
  );
}
