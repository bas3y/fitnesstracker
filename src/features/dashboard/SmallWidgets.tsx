import { useMemo } from 'react';
import { useFromHere } from '../../components/backNavigation';
import type { CardTone } from '../../components/Page';
import type { DayKey, EnduranceSession, Settings } from '../../db/types';
import { formatTotals } from '../../domain/endurance';
import { weekBySport } from '../../domain/enduranceStats';
import { formatDecimal } from '../../domain/format';
import { habitDayProgress } from '../../domain/habits';
import { dayGoal, dayNutrients } from '../../domain/nutrition';
import { formatPercent, trainingProgress, type StatsSession } from '../../domain/stats';
import { supplementDay } from '../../domain/supplements';
import { todayTodos } from '../../domain/todos';
import { HABITS_PATH, useHabits } from '../daily/useHabits';
import { TODOS_PATH, useTodos } from '../daily/useTodos';
import { NUTRITION_PATH } from '../nutrition/paths';
import { useNutritionDay } from '../nutrition/useNutrition';
import { ENDURANCE_STATS_PATH } from '../stats/statsFilter';
import { SUPPLEMENTS_PATH } from '../supplements/paths';
import { useSupplementOverview } from '../supplements/useSupplements';
import { SmallWidget } from './WidgetParts';

interface SmallProps {
  today: DayKey;
  tone?: CardTone;
}

export function HabitsSmall({ today, tone }: SmallProps) {
  const habits = useHabits();
  const from = useFromHere();
  if (!habits) return null;
  const { done, total } = habitDayProgress(habits, today);
  return (
    <SmallWidget
      to={HABITS_PATH}
      state={from}
      icon="repeat"
      label="Gewohnheiten"
      value={total === 0 ? '–' : `${done}/${total}`}
      {...(total > 0 ? { bar: { value: done, goal: total } } : { sub: 'Nichts fällig' })}
      tone={tone}
    />
  );
}

export function TodosSmall({ today, tone }: SmallProps) {
  const todos = useTodos();
  const from = useFromHere();
  if (!todos) return null;
  const open = todayTodos(todos, today).length;
  return (
    <SmallWidget
      to={TODOS_PATH}
      state={from}
      icon="todo"
      label="To-dos"
      value={String(open)}
      sub={open === 0 ? 'Nichts offen' : 'offen heute'}
      tone={tone}
    />
  );
}

export function SupplementsSmall({ today, tone }: SmallProps) {
  const overview = useSupplementOverview();
  const from = useFromHere();
  if (!overview) return null;
  const active = overview.items.filter(({ supplement }) => supplement.archivedAt === null);
  const due = supplementDay(active, today, today, overview.trainingDays).filter(
    (entry) => entry.status === 'due',
  );
  const taken = due.filter((entry) => entry.intake !== null).length;
  return (
    <SmallWidget
      to={SUPPLEMENTS_PATH}
      state={from}
      icon="pill"
      label="Supplements"
      value={due.length === 0 ? '–' : `${taken}/${due.length}`}
      {...(due.length > 0
        ? { bar: { value: taken, goal: due.length } }
        : { sub: active.length === 0 ? 'Noch keine' : 'Nichts fällig' })}
      tone={tone}
    />
  );
}

export function NutritionSmall({ today, tone, settings }: SmallProps & { settings: Settings }) {
  const data = useNutritionDay(today);
  const from = useFromHere();
  if (!data) return null;
  const total = dayNutrients(data.entries, data.quickProteinGrams);
  const goal = dayGoal(settings, data);
  const [label, value, target, unit] = settings.proteinOnly
    ? ['Protein', total.protein, goal.protein, 'g']
    : ['Kalorien', total.kcal, goal.kcal, 'kcal'];
  return (
    <SmallWidget
      to={NUTRITION_PATH}
      state={from}
      icon={settings.proteinOnly ? 'egg' : 'utensils'}
      label={label}
      value={`${formatDecimal(Math.round(value), 0)} ${unit}`}
      bar={{ value, goal: target }}
      tone={tone}
    />
  );
}

export function EnduranceSmall({
  today,
  tone,
  sessions,
  settings,
}: SmallProps & { sessions: EnduranceSession[]; settings: Settings }) {
  const from = useFromHere();
  const week = weekBySport(sessions, today);
  const count = week.reduce((sum, { totals }) => sum + totals.count, 0);
  const first = week[0];
  return (
    <SmallWidget
      to={ENDURANCE_STATS_PATH}
      state={from}
      icon="run"
      label="Ausdauer"
      value={count === 1 ? '1 Einheit' : `${count} Einh.`}
      sub={
        first
          ? formatTotals(first.totals, first.sport, settings.distanceUnit)
          : 'Diese Woche noch nichts'
      }
      tone={tone}
    />
  );
}

export function ProgressSmall({
  tone,
  sessions,
  bodyWeightKg,
  now,
}: Omit<SmallProps, 'today'> & {
  sessions: StatsSession[];
  bodyWeightKg: number | null;
  now: Date;
}) {
  const from = useFromHere();
  const progress = useMemo(
    () => trainingProgress(sessions, bodyWeightKg, now),
    [sessions, bodyWeightKg, now],
  );
  return (
    <SmallWidget
      to="/stats"
      state={from}
      icon="trend"
      label="Kraft (3 Monate)"
      value={progress.strengthPercent === null ? '–' : formatPercent(progress.strengthPercent)}
      sub={`${progress.workoutsThisMonth} Workouts im Monat`}
      tone={tone}
    />
  );
}
