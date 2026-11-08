import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Card } from '../../components/Page';
import type { NutritionDayData } from '../../db/nutrition';
import type { DayKey, NutritionGoal, Settings } from '../../db/types';
import { formatDecimal } from '../../domain/format';
import { DASHBOARD_WIDGET_LABELS } from '../../domain/labels';
import { dayGoal, dayNutrients, formatKcal, proteinPerKg } from '../../domain/nutrition';
import { GoalBar } from '../daily/GoalBar';
import { withDate } from '../daily/paths';
import { NUTRITION_PATH } from './paths';
import { ProteinQuickAdd } from './ProteinQuickAdd';
import { useNutritionDay } from './useNutrition';

const MUTED = 'text-sm text-muted';

function remainingText(kcal: number, goal: number): string {
  const diff = Math.round(goal - kcal);
  if (diff > 0) return `Noch ${formatKcal(diff)}`;
  return diff === 0 ? 'Ziel genau erreicht' : `${formatKcal(-diff)} über dem Ziel`;
}

function proteinRemainingText(grams: number, goal: number): string {
  const diff = Math.round(goal - grams);
  return diff > 0 ? `Noch ${formatDecimal(diff, 0)} g Protein` : 'Proteinziel erreicht';
}

/** Summen des Tages gegen die Ziele (Trainings- oder Ruhetag); mit `proteinOnly` nur Protein */
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
  const total = dayNutrients(data.entries, data.quickProteinGrams);
  const goal: NutritionGoal = dayGoal(settings, data);
  const perKg = proteinPerKg(total.protein, settings.bodyWeightKg);
  const protein = { label: 'Protein', value: total.protein, goal: goal.protein, unit: 'g' };
  const rows: { label: string; value: number; goal: number | null; unit: string }[] =
    settings.proteinOnly
      ? [protein]
      : [
          { label: 'Kalorien', value: total.kcal, goal: goal.kcal, unit: 'kcal' },
          protein,
          { label: 'Kohlenhydrate', value: total.carbs, goal: goal.carbs, unit: 'g' },
          { label: 'Fett', value: total.fat, goal: goal.fat, unit: 'g' },
        ];
  const dayType = data.isTrainingDay ? 'Trainingstag' : 'Ruhetag';
  const quick =
    data.quickProteinGrams > 0 && !settings.proteinOnly
      ? ` · davon ${formatDecimal(Math.round(data.quickProteinGrams), 0)} g Protein ohne Lebensmittel`
      : '';
  const footer = settings.proteinOnly
    ? perKg !== null && `${formatDecimal(perKg, 1)} g pro kg Körpergewicht`
    : `Ballaststoffe ${formatDecimal(Math.round(total.fiber), 0)} g${
        perKg !== null ? ` · Protein ${formatDecimal(perKg, 1)} g/kg Körpergewicht` : ''
      }${quick}`;

  return (
    <Card title={title}>
      <p className={`mb-3 ${MUTED}`}>
        {settings.proteinOnly
          ? `${dayType} · ${proteinRemainingText(total.protein, goal.protein)}`
          : `${dayType} · ${remainingText(total.kcal, goal.kcal)}`}
      </p>
      {data.burnedKcal > 0 && !settings.proteinOnly && (
        <p data-testid="burned-kcal" className={`-mt-2 mb-3 ${MUTED}`}>
          Beim Training verbrannt: {formatKcal(data.burnedKcal)}
          {settings.addBurnedCalories ? ' (im Ziel enthalten)' : ''}
        </p>
      )}
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
      {footer && <p className={`mt-3 ${MUTED}`}>{footer}</p>}
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
      {settings.proteinOnly && (
        <div className="mt-3">
          <ProteinQuickAdd date={date} grams={data.quickProteinGrams} withTotal={false} />
        </div>
      )}
      <Link
        to={to}
        state={from}
        className="mt-1 flex min-h-11 items-center text-sm font-semibold text-primary-text"
      >
        {settings.proteinOnly
          ? 'Protein korrigieren ›'
          : data.entries.length === 0
            ? 'Mahlzeit eintragen ›'
            : 'Mahlzeiten ansehen ›'}
      </Link>
    </NutritionSummary>
  );
}
