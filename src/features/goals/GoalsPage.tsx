import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import { Card, Page } from '../../components/Page';
import { dayKey } from '../../domain/daily';
import { goalProgress, sortGoalsByDeadline } from '../../domain/goals';
import { useSettings } from '../settings/useSettings';
import { GoalCard } from './GoalCard';
import { NEW_GOAL_PATH } from './paths';
import { useGoalData, useGoalExercises, useGoals } from './useGoals';

const HINT = 'text-sm text-slate-500 dark:text-slate-400';

export function GoalsPage() {
  const backTo = useBackTo('/stats');
  const goals = useGoals();
  const data = useGoalData();
  const exercises = useGoalExercises(goals);
  const settings = useSettings();
  const today = useMemo(() => dayKey(new Date()), []);

  const items = useMemo(
    () =>
      goals && data
        ? goals.map((goal) => ({ goal, progress: goalProgress(goal, data, today) }))
        : null,
    [goals, data, today],
  );

  const action = (
    <Link
      to={NEW_GOAL_PATH}
      className="flex min-h-11 shrink-0 items-center rounded-xl bg-emerald-700 px-3 text-sm font-semibold text-white active:bg-emerald-800"
    >
      + Neues Ziel
    </Link>
  );

  if (!items || !settings || !exercises) {
    return (
      <Page title="Ziele" backTo={backTo} action={action}>
        {null}
      </Page>
    );
  }

  const units = settings;
  const active = sortGoalsByDeadline(items.filter(({ progress }) => progress.status === 'active'));
  const done = items
    .filter(({ progress }) => progress.status !== 'active')
    .sort((a, b) =>
      (b.progress.achievedOn ?? b.goal.deadline ?? '').localeCompare(
        a.progress.achievedOn ?? a.goal.deadline ?? '',
      ),
    );
  const card = ({ goal, progress }: (typeof items)[number]) => (
    <GoalCard
      key={goal.id}
      goal={goal}
      progress={progress}
      exercise={goal.exerciseId ? (exercises.get(goal.exerciseId) ?? null) : null}
      units={units}
    />
  );

  return (
    <Page title="Ziele" backTo={backTo} action={action}>
      {items.length === 0 && (
        <Card>
          <p className="mb-2 text-slate-600 dark:text-slate-400">
            Noch keine Ziele. Setze dir zum Beispiel:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            <li>Bankdrücken 100 kg bis Dezember</li>
            <li>10 km unter 50 Minuten laufen</li>
            <li>Auf 80 kg Körpergewicht</li>
            <li>12 Trainings pro Monat oder 500 km im Jahr</li>
          </ul>
        </Card>
      )}
      {active.length > 0 && (
        <section aria-label="Aktive Ziele" className="mb-4">
          {active.map(card)}
          <p className={HINT}>
            Der Fortschritt kommt aus deinen Trainings und Einträgen. Die Marke im Balken zeigt, wo
            du bei gleichmäßigem Tempo heute wärst.
          </p>
        </section>
      )}
      {done.length > 0 && (
        <section aria-labelledby="goals-done" className="mb-4">
          <h2 id="goals-done" className="mb-3 text-lg font-semibold">
            Abgeschlossen
          </h2>
          {done.map(card)}
        </section>
      )}
    </Page>
  );
}
