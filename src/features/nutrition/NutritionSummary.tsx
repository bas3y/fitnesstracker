import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Card } from '../../components/Page';
import type { NutritionDayData } from '../../db/nutrition';
import type { DayKey, NutritionGoal, Settings } from '../../db/types';
import { formatDecimal } from '../../domain/format';
import { DASHBOARD_WIDGET_LABELS } from '../../domain/labels';
import { formatKcal, goalForDay, nutritionDay, proteinPerKg } from '../../domain/nutrition';
import { GoalBar } from '../daily/GoalBar';
import { withDate } from '../daily/paths';
import { NUTRITION_PATH } from './paths';
import { useNutritionDay } from './useNutrition';

const MUTED = 'text-sm text-slate-500 dark:text-slate-400';

function remainingText(kcal: number, goal: number): string {
  const diff = Math.round(goal - kcal);
  if (diff > 0) return `Noch ${formatKcal(diff)}`;
  return diff === 0 ? 'Ziel genau erreicht' : `${formatKcal(-diff)} über dem Ziel`;
}

/** Summen des Tages gegen die Ziele (Trainings- oder Ruhetag) */
export function NutritionSummary({
  data,
  settings,
  title,
  children,
}: {
  data: NutritionDayData;
  settings: Settings;
  title: string;
  children?: ReactNode;
}) {
  const { total } = nutritionDay(data.entries);
  const goal: NutritionGoal = goalForDay(settings.nutritionGoals, data.isTrainingDay);
  const perKg = proteinPerKg(total.protein, settings.bodyWeightKg);
  const rows = [
    { label: 'Kalorien', value: total.kcal, goal: goal.kcal, unit: 'kcal' },
    { label: 'Protein', value: total.protein, goal: goal.protein, unit: 'g' },
    { label: 'Kohlenhydrate', value: total.carbs, goal: goal.carbs, unit: 'g' },
    { label: 'Fett', value: total.fat, goal: goal.fat, unit: 'g' },
  ];

  return (
    <Card title={title}>
      <p className={`mb-3 ${MUTED}`}>
        {data.isTrainingDay ? 'Trainingstag' : 'Ruhetag'} · {remainingText(total.kcal, goal.kcal)}
      </p>
      <dl data-testid="nutrition-summary" className="flex flex-col gap-3">
        {rows.map(({ label, value, goal: target, unit }) => (
          <div key={label}>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="font-medium">{label}</dt>
              <dd className="tabular-nums">
                {formatDecimal(Math.round(value), 0)}
                {target !== null && ` von ${formatDecimal(target, 0)}`} {unit}
              </dd>
            </div>
            {target !== null && <GoalBar label={`Ziel ${label}`} value={value} goal={target} />}
          </div>
        ))}
      </dl>
      <p className={`mt-3 ${MUTED}`}>
        Ballaststoffe {formatDecimal(Math.round(total.fiber), 0)} g
        {perKg !== null && ` · Protein ${formatDecimal(perKg, 1)} g/kg Körpergewicht`}
      </p>
      {children}
    </Card>
  );
}

/** Widget der Startseite */
export function NutritionDayCard({
  date,
  today,
  settings,
}: {
  date: DayKey;
  today: DayKey;
  settings: Settings;
}) {
  const data = useNutritionDay(date);
  const from = useFromHere();
  if (!data) return null;
  const to = withDate(NUTRITION_PATH, date, today);
  return (
    <NutritionSummary
      data={data}
      settings={settings}
      title={DASHBOARD_WIDGET_LABELS.nutrition.name}
    >
      <Link
        to={to}
        state={from}
        className="mt-1 flex min-h-11 items-center text-sm font-semibold text-emerald-700 dark:text-emerald-400"
      >
        {data.entries.length === 0 ? 'Mahlzeit eintragen ›' : 'Mahlzeiten ansehen ›'}
      </Link>
    </NutritionSummary>
  );
}
