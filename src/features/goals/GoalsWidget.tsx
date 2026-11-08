import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { BackState } from '../../components/backNavigation';
import { ChevronRightIcon } from '../../components/icons';
import { Card, type CardTone } from '../../components/Page';
import { SmallWidget } from '../dashboard/WidgetParts';
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
  small = false,
  tone,
}: {
  goals: Goal[];
  strength: StatsSession[];
  endurance: GoalEnduranceSession[];
  settings: Settings;
  today: DayKey;
  /** Kleines Widget: nur „erreicht von gesamt“ */
  small?: boolean;
  tone?: CardTone;
}) {
  const extras = useLiveQuery(loadGoalExtras, []);
  const exercises = useGoalExercises(goals);
  const data = useMemo(
    () => (extras ? { strength, endurance, ...extras } : null),
    [strength, endurance, extras],
  );
  const items = useMemo(
    () => data && goals.map((goal) => ({ goal, progress: goalProgress(goal, data, today) })),
    [goals, data, today],
  );
  const active = useMemo(
    () =>
      items && sortGoalsByDeadline(items.filter(({ progress }) => progress.status === 'active')),
    [items],
  );
  if (!items || !active || !data || !exercises) return null;

  if (small) {
    const achieved = items.filter(({ progress }) => progress.status === 'achieved').length;
    return (
      <SmallWidget
        to={GOALS_PATH}
        state={FROM_DASHBOARD}
        icon="target"
        label={DASHBOARD_WIDGET_LABELS.goals.name}
        value={`${achieved}/${goals.length}`}
        sub={active.length === 0 ? 'erreicht' : `erreicht, ${active.length} offen`}
        tone={tone}
      />
    );
  }

  return (
    <Card title={DASHBOARD_WIDGET_LABELS.goals.name}>
      {active.length === 0 ? (
        <p className="mb-2 text-sm text-muted">Keine offenen Ziele – Zeit für ein neues?</p>
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
        className="flex min-h-11 items-center gap-0.5 text-sm font-semibold text-primary-text"
      >
        {active.length > SHOWN_GOALS ? `Alle ${active.length} Ziele` : 'Alle Ziele'}
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </Card>
  );
}
