import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Card } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { loadReviewInput } from '../../db/review';
import type { DayKey, Goal, Settings } from '../../db/types';
import { dayKey } from '../../domain/daily';
import { formatDistance, formatTotals, type DayRange } from '../../domain/endurance';
import { formatDecimal } from '../../domain/format';
import { formatGoalDate, goalName, goalProgress, type GoalData } from '../../domain/goals';
import { ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import {
  CALENDAR_PERIOD_LABELS,
  CALENDAR_PERIODS,
  comparisonRange,
  formatDayRange,
  formatPeriod,
  inRange,
  periodRange,
  shiftPeriod,
  type CalendarPeriod,
} from '../../domain/periods';
import {
  hasReviewData,
  reviewDelta,
  reviewSummary,
  type ReviewInput,
  type ReviewSummary,
} from '../../domain/review';
import { kgToDisplay } from '../../domain/units';
import { formatWorkoutDuration } from '../../domain/workout';
import { GOALS_PATH } from '../goals/paths';
import { useGoalExercises, useGoals } from '../goals/useGoals';
import { useSettings } from '../settings/useSettings';
import { useStatsFilter } from './statsFilter';

const HINT = 'text-sm text-slate-500 dark:text-slate-400';
const NAV_BUTTON =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl font-semibold active:bg-slate-200 disabled:opacity-40 dark:bg-slate-700 dark:active:bg-slate-600';

const PERIOD_OPTIONS = CALENDAR_PERIODS.map((value) => ({
  value,
  label: CALENDAR_PERIOD_LABELS[value],
}));

const PREVIOUS_LABELS: Record<CalendarPeriod, string> = {
  week: 'Vorwoche',
  month: 'Vormonat',
  year: 'Vorjahr',
};

/** `higher` = mehr ist besser (grün), `lower` = weniger ist besser, `null` = neutral */
type Better = 'higher' | 'lower' | null;

interface Row {
  label: string;
  current: number | null;
  previous: number | null;
  format: (value: number) => string;
  better: Better;
}

export function ReviewStats() {
  const settings = useSettings();
  const { reviewPeriod: period, reviewDate, setReview } = useStatsFilter();
  const today = useMemo(() => dayKey(new Date()), []);
  const date = reviewDate && reviewDate <= today ? reviewDate : today;
  const range = useMemo(() => periodRange(period, date), [period, date]);
  const compare = useMemo(() => comparisonRange(period, range, today), [period, range, today]);
  const input = useLiveQuery(
    () => loadReviewInput(compare.from, range.to),
    [compare.from, range.to],
  );
  const running = inRange(today, range);
  const move = (steps: number) => {
    const next = shiftPeriod(period, range, steps);
    setReview(period, inRange(today, next) ? null : next.from);
  };

  return (
    <>
      <Card>
        <div className="flex flex-col gap-3">
          <SegmentedControl
            label="Zeitraum"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(next) => setReview(next, reviewDate)}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Vorheriger Zeitraum"
              className={NAV_BUTTON}
              onClick={() => move(-1)}
            >
              ‹
            </button>
            <h2
              data-testid="review-period"
              className="min-w-0 flex-1 text-center text-lg font-semibold"
            >
              {formatPeriod(period, range)}
            </h2>
            <button
              type="button"
              aria-label="Nächster Zeitraum"
              className={NAV_BUTTON}
              disabled={running}
              onClick={() => move(1)}
            >
              ›
            </button>
          </div>
          <p data-testid="review-compare" className={`${HINT} text-center`}>
            {running ? 'Bis heute, verglichen mit ' : 'Verglichen mit '}
            {PREVIOUS_LABELS[period]}
            {running
              ? ` bis zum gleichen Tag (${formatDayRange(compare)})`
              : ` (${formatPeriod(period, compare)})`}
          </p>
        </div>
      </Card>
      {input && settings && (
        <ReviewContent
          input={input}
          range={range}
          compare={compare}
          today={today}
          settings={settings}
        />
      )}
    </>
  );
}

function ReviewContent({
  input,
  range,
  compare,
  today,
  settings,
}: {
  input: ReviewInput;
  range: DayRange;
  compare: DayRange;
  today: DayKey;
  settings: Settings;
}) {
  const current = useMemo(() => reviewSummary(input, range, today), [input, range, today]);
  const previous = useMemo(() => reviewSummary(input, compare, today), [input, compare, today]);

  if (!hasReviewData(current) && !hasReviewData(previous)) {
    return (
      <Card>
        <p className="text-slate-600 dark:text-slate-400">Keine Einträge in diesem Zeitraum.</p>
      </Card>
    );
  }
  return (
    <>
      <TrainingCard current={current} previous={previous} settings={settings} />
      <DailyCard current={current} previous={previous} settings={settings} />
      <NutritionCard current={current} previous={previous} settings={settings} />
      <GoalsCard input={input} range={range} today={today} settings={settings} />
    </>
  );
}

function formatDelta(row: Row): { text: string; tone: string } | null {
  const delta = reviewDelta(row.current, row.previous);
  if (delta === null) return null;
  const text = row.format(Math.abs(delta));
  if (Math.abs(delta) < 1e-9 || text === row.format(0)) {
    return { text: '±0', tone: 'text-slate-500 dark:text-slate-400' };
  }
  const better = row.better === null ? null : delta > 0 === (row.better === 'higher');
  const tone =
    better === null
      ? 'text-slate-600 dark:text-slate-300'
      : better
        ? 'text-emerald-700 dark:text-emerald-400'
        : 'text-red-700 dark:text-red-400';
  return { text: `${delta > 0 ? '+' : '−'}${text}`, tone };
}

function ReviewRows({ rows, label }: { rows: Row[]; label: string }) {
  const shown = rows.filter((row) => row.current || row.previous);
  if (shown.length === 0) return null;
  return (
    <dl
      aria-label={label}
      className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700"
    >
      {shown.map((row) => {
        const delta = formatDelta(row);
        return (
          <div key={row.label} className="flex items-baseline justify-between gap-3 py-2">
            <dt className="min-w-0">{row.label}</dt>
            <dd className="shrink-0 text-right tabular-nums">
              <span className="font-semibold">
                {row.current === null ? '–' : row.format(row.current)}
              </span>
              {delta && (
                <span
                  className={`ml-2 inline-block min-w-14 text-sm ${delta.tone}`}
                  aria-label={`Unterschied ${delta.text}`}
                >
                  {delta.text}
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

const count = (value: number) => formatDecimal(value, 0);

function TrainingCard({
  current,
  previous,
  settings,
}: {
  current: ReviewSummary;
  previous: ReviewSummary;
  settings: Settings;
}) {
  const unit = settings.weightUnit;
  const distance = (meters: number) => formatDistance(meters, 'run', settings.distanceUnit, 1);
  const rows: Row[] = [
    {
      label: 'Trainingstage',
      current: current.trainingDays,
      previous: previous.trainingDays,
      format: count,
      better: 'higher',
    },
    {
      label: 'Krafttrainings',
      current: current.strength.workouts,
      previous: previous.strength.workouts,
      format: count,
      better: 'higher',
    },
    {
      label: 'Arbeitssätze',
      current: current.strength.sets,
      previous: previous.strength.sets,
      format: count,
      better: 'higher',
    },
    {
      label: `Volumen`,
      current: current.strength.volumeKg,
      previous: previous.strength.volumeKg,
      format: (kg) => `${formatDecimal(kgToDisplay(kg, unit), 0)} ${unit}`,
      better: 'higher',
    },
    {
      label: 'Kraft-Rekorde',
      current: current.strength.records,
      previous: previous.strength.records,
      format: count,
      better: 'higher',
    },
    {
      label: 'Ausdauer-Einheiten',
      current: current.endurance.count,
      previous: previous.endurance.count,
      format: count,
      better: 'higher',
    },
    {
      label: 'Ausdauer-Zeit',
      current: current.endurance.durationSeconds,
      previous: previous.endurance.durationSeconds,
      format: formatWorkoutDuration,
      better: 'higher',
    },
    {
      label: 'Strecke',
      current: current.endurance.distanceMeters,
      previous: previous.endurance.distanceMeters,
      format: distance,
      better: 'higher',
    },
    {
      label: 'Höhenmeter',
      current: current.endurance.elevationGainMeters,
      previous: previous.endurance.elevationGainMeters,
      format: (meters) => `${formatDecimal(meters, 0)} m`,
      better: 'higher',
    },
    {
      label: 'Neue Bestzeiten',
      current: current.endurance.records,
      previous: previous.endurance.records,
      format: count,
      better: 'higher',
    },
  ];
  return (
    <Card title="Training">
      {current.trainingDays === 0 && previous.trainingDays === 0 ? (
        <p className={HINT}>Kein Training in diesem und im Vergleichszeitraum.</p>
      ) : (
        <>
          <ReviewRows rows={rows} label="Training im Vergleich" />
          {current.endurance.bySport.length > 0 && (
            <p data-testid="review-sports" className={`mt-2 ${HINT}`}>
              {current.endurance.bySport
                .map(
                  ({ sport, totals }) =>
                    `${ENDURANCE_SPORT_LABELS[sport].icon} ${formatTotals(totals, sport, settings.distanceUnit)}`,
                )
                .join(' · ')}
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function DailyCard({
  current,
  previous,
  settings,
}: {
  current: ReviewSummary;
  previous: ReviewSummary;
  settings: Settings;
}) {
  const unit = settings.weightUnit;
  const rating = (value: number) => `${formatDecimal(value, 1)} / 5`;
  const pick = (key: keyof ReviewSummary['daily']) => ({
    current: current.daily[key],
    previous: previous.daily[key],
  });
  const rows: Row[] = [
    { label: 'Ø Schritte', ...pick('steps'), format: count, better: 'higher' },
    {
      label: 'Ø Schlaf',
      ...pick('sleepSeconds'),
      format: (seconds) => `${formatDecimal(seconds / 3600, 1)} h`,
      better: 'higher',
    },
    {
      label: 'Ø Wasser',
      ...pick('waterMl'),
      format: (ml) => `${formatDecimal(ml / 1000, 1)} l`,
      better: 'higher',
    },
    { label: 'Ø Stimmung', ...pick('mood'), format: rating, better: 'higher' },
    { label: 'Ø Energie', ...pick('energy'), format: rating, better: 'higher' },
    {
      label: 'Ø Ruhepuls',
      ...pick('restingHeartRate'),
      format: (bpm) => `${formatDecimal(bpm, 0)} bpm`,
      better: 'lower',
    },
    {
      label: 'Gewicht (zuletzt)',
      ...pick('weightKg'),
      format: (kg) => `${formatDecimal(kgToDisplay(kg, unit), 1)} ${unit}`,
      better: null,
    },
    {
      label: 'Gewohnheiten erledigt',
      current: current.habitCompletion,
      previous: previous.habitCompletion,
      format: (percent) => `${formatDecimal(percent, 0)} %`,
      better: 'higher',
    },
  ];
  if (rows.every((row) => !row.current && !row.previous)) return null;
  return (
    <Card title="Alltag">
      <ReviewRows rows={rows} label="Alltag im Vergleich" />
      <p className={`mt-2 ${HINT}`}>Ø über die Tage mit Eintrag.</p>
    </Card>
  );
}

function NutritionCard({
  current,
  previous,
  settings,
}: {
  current: ReviewSummary;
  previous: ReviewSummary;
  settings: Settings;
}) {
  if (current.nutrition.days === 0 && previous.nutrition.days === 0) return null;
  const rows: Row[] = [
    {
      label: 'Tage erfasst',
      current: current.nutrition.days,
      previous: previous.nutrition.days,
      format: count,
      better: 'higher',
    },
    ...(settings.proteinOnly
      ? []
      : [
          {
            label: 'Ø Kalorien',
            current: current.nutrition.kcal,
            previous: previous.nutrition.kcal,
            format: (kcal: number) => `${formatDecimal(kcal, 0)} kcal`,
            better: null,
          },
        ]),
    {
      label: 'Ø Protein',
      current: current.nutrition.protein,
      previous: previous.nutrition.protein,
      format: (grams) => `${formatDecimal(grams, 0)} g`,
      better: 'higher',
    },
  ];
  return (
    <Card title="Ernährung">
      <ReviewRows rows={rows} label="Ernährung im Vergleich" />
      <p className={`mt-2 ${HINT}`}>Ø über die Tage mit Einträgen.</p>
    </Card>
  );
}

/** Im Zeitraum erreichte Ziele (wiederkehrende zählen nicht) */
function GoalsCard({
  input,
  range,
  today,
  settings,
}: {
  input: ReviewInput;
  range: DayRange;
  today: DayKey;
  settings: Settings;
}) {
  const goals = useGoals();
  const exercises = useGoalExercises(goals);
  const from = useFromHere();
  const achieved = useMemo(() => {
    if (!goals) return [];
    const data: GoalData = {
      strength: input.strength,
      endurance: input.endurance,
      weights: input.logs.flatMap(({ date, weightKg }) =>
        weightKg === null ? [] : [{ date, weightKg }],
      ),
    };
    return goals.flatMap((goal): { goal: Goal; on: DayKey }[] => {
      const progress = goalProgress(goal, data, today);
      return !progress.recurring && progress.achievedOn && inRange(progress.achievedOn, range)
        ? [{ goal, on: progress.achievedOn }]
        : [];
    });
  }, [goals, input, range, today]);
  if (!goals || !exercises || goals.length === 0) return null;

  return (
    <Card title="Ziele">
      {achieved.length === 0 ? (
        <p className={HINT}>Kein Ziel in diesem Zeitraum erreicht.</p>
      ) : (
        <ul aria-label="Erreichte Ziele" className="flex flex-col gap-1">
          {achieved.map(({ goal, on }) => (
            <li key={goal.id}>
              🏆{' '}
              {goalName(
                goal,
                goal.exerciseId ? (exercises.get(goal.exerciseId) ?? null) : null,
                settings,
              )}{' '}
              <span className={HINT}>({formatGoalDate(on)})</span>
            </li>
          ))}
        </ul>
      )}
      <Link
        to={GOALS_PATH}
        state={from}
        className="mt-1 flex min-h-11 items-center text-sm font-semibold text-emerald-700 dark:text-emerald-400"
      >
        Alle Ziele ›
      </Link>
    </Card>
  );
}
