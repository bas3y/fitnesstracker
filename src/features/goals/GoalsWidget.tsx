import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { BackState } from '../../components/backNavigation';
import { Card } from '../../components/Page';
import { loadGoalExtras } from '../../db/goals';
import type { DayKey, Goal, Settings } from '../../db/types';
import {
  goalProgress,
  goalSubject,
  sortGoalsByDeadline,
  type GoalEnduranceSession,
} from '../../domain/goals';
import { DASHBOARD_WIDGET_LABELS } from '../../domain/labels';
import type { StatsSession } from '../../domain/stats';
import { GoalCard } from './GoalCard';
import { GOALS_PATH } from './paths';
import { useGoalExercises } from './useGoals';

const SHOWN_GOALS = 3;
const FROM_DASHBOARD: BackState = { from: '/' };

/** Offene Ziele, das nächste Zieldatum zuerst */
export function GoalsWidget({
  goals,
  strength,
  endurance,
  settings,
  today,
}: {
  goals: Goal[];
  strength: StatsSession[];
  endurance: GoalEnduranceSession[];
  settings: Settings;
  today: DayKey;
}) {
  const extras = useLiveQuery(loadGoalExtras, []);
  const exercises = useGoalExercises(goals);
  const data = useMemo(
    () => (extras ? { strength, endurance, ...extras } : null),
    [strength, endurance, extras],
  );
  const active = useMemo(() => {
    if (!data) return null;
    const items = goals.map((goal) => ({ goal, progress: goalProgress(goal, data, today) }));
    return sortGoalsByDeadline(items.filter(({ progress }) => progress.status === 'active'));
  }, [goals, data, today]);
  if (!active || !data || !exercises) return null;

  return (
    <Card title={DASHBOARD_WIDGET_LABELS.goals.name}>
      {active.length === 0 ? (
        <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
          Keine offenen Ziele – Zeit für ein neues?
        </p>
      ) : (
        <div data-testid="goals-widget">
          {active.slice(0, SHOWN_GOALS).map(({ goal, progress }) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={progress}
              subject={goalSubject(goal, exercises, data)}
              units={settings}
              compact
              linkState={FROM_DASHBOARD}
            />
          ))}
        </div>
      )}
      <Link
        to={GOALS_PATH}
        state={FROM_DASHBOARD}
        className="flex min-h-11 items-center text-sm font-semibold text-emerald-700 dark:text-emerald-400"
      >
        {active.length > SHOWN_GOALS ? `Alle ${active.length} Ziele ›` : 'Alle Ziele ›'}
      </Link>
    </Card>
  );
}
