import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Card, Page } from '../../components/Page';
import { createGoal, deleteGoal, updateGoal } from '../../db/goals';
import { emptyGoalInput, goalFieldsSchema } from '../../db/schemas';
import { dayKey } from '../../domain/daily';
import { useSettings } from '../settings/useSettings';
import { useExercise } from '../training/useExercises';
import { GoalForm } from './GoalForm';
import { GOALS_PATH } from './paths';
import { useGoal, useGoalData } from './useGoals';

export function GoalCreatePage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const data = useGoalData();
  const today = useMemo(() => dayKey(new Date()), []);
  if (!settings || !data) return <Page title="Neues Ziel">{null}</Page>;

  const back = () => navigate(GOALS_PATH, { replace: true });
  return (
    <Page title="Neues Ziel" backTo={GOALS_PATH}>
      <GoalForm
        initial={emptyGoalInput('strength', today)}
        initialExercise={null}
        settings={settings}
        data={data}
        today={today}
        submitLabel="Ziel anlegen"
        onSubmit={async (values) => {
          await createGoal(values);
          back();
        }}
        onCancel={back}
      />
    </Page>
  );
}

export function GoalEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goal = useGoal(id);
  const exercise = useExercise(goal?.exerciseId ?? undefined);
  const settings = useSettings();
  const data = useGoalData();
  const today = useMemo(() => dayKey(new Date()), []);
  const [confirming, setConfirming] = useState(false);

  const loadingExercise = goal?.exerciseId ? exercise === undefined : false;
  if (goal === undefined || !settings || !data || loadingExercise) {
    return <Page title="Ziel bearbeiten">{null}</Page>;
  }
  if (goal === null) {
    return (
      <Page title="Ziel bearbeiten" backTo={GOALS_PATH}>
        <Card>
          <p className="text-slate-600 dark:text-slate-400">Dieses Ziel gibt es nicht mehr.</p>
        </Card>
      </Page>
    );
  }

  const back = () => navigate(GOALS_PATH, { replace: true });
  // Ohne Metadaten (Zod entfernt unbekannte Felder)
  const initial = goalFieldsSchema.parse(goal);
  return (
    <Page title="Ziel bearbeiten" backTo={GOALS_PATH}>
      <GoalForm
        initial={initial}
        initialExercise={exercise ?? null}
        settings={settings}
        data={data}
        today={today}
        submitLabel="Speichern"
        onSubmit={async (values) => {
          await updateGoal(goal.id, values);
          back();
        }}
        onCancel={back}
        onDelete={() => setConfirming(true)}
      />
      {confirming && (
        <ConfirmDialog
          title="Ziel löschen?"
          confirmLabel="Löschen"
          onConfirm={() => {
            void deleteGoal(goal.id).then(back);
          }}
          onCancel={() => setConfirming(false)}
        >
          Deine Trainings und Einträge bleiben erhalten.
        </ConfirmDialog>
      )}
    </Page>
  );
}
