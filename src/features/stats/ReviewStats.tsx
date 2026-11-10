import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Card } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { loadReviewInput } from '../../db/review';
import type { DayKey, Settings } from '../../db/types';
import { dayKey } from '../../domain/daily';
import { formatTotals, type DayRange } from '../../domain/endurance';
import { formatGoalDate, goalName, goalsAchievedIn, goalSubject } from '../../domain/goals';
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
  reviewSummary,
  type ReviewInput,
  type ReviewSummary,
} from '../../domain/review';
import {
  dailyRows,
  formatReviewDelta,
  growthRows,
  habitRows,
  nutritionRows,
  shownRows,
  trainingRows,
  type ReviewRow,
} from '../../domain/reviewRows';
import { GOALS_PATH } from '../goals/paths';
import { useGoalData, useGoalExercises, useGoals } from '../goals/useGoals';
import { REPORT_KINDS } from '../../domain/report';
import { ExportButton } from '../reports/ExportButton';
import { useSettings } from '../settings/useSettings';
import { useStatsFilter } from './statsFilter';
import { ChevronLeftIcon, ChevronRightIcon, Icon } from '../../components/icons';

const HINT = 'text-sm text-muted';
const NAV_BUTTON =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-subtle text-xl font-semibold active:bg-subtle-strong disabled:opacity-40';

const PERIOD_OPTIONS = CALENDAR_PERIODS.map((value) => ({
  value,
  label: CALENDAR_PERIOD_LABELS[value],
}));

const PREVIOUS_LABELS: Record<CalendarPeriod, string> = {
  week: 'Vorwoche',
  month: 'Vormonat',
  year: 'Vorjahr',
};

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
              <ChevronLeftIcon className="h-5 w-5" />
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
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <p data-testid="review-compare" className={`${HINT} text-center`}>
            {running ? 'Bis heute, verglichen mit ' : 'Verglichen mit '}
            {PREVIOUS_LABELS[period]}
            {running
              ? ` bis zum gleichen Tag (${formatDayRange(compare)})`
              : ` (${formatPeriod(period, compare)})`}
          </p>
          <ExportButton
            label={`${REPORT_KINDS[period]} als PDF`}
            success="PDF wurde erstellt"
            create={async () => {
              const { createPeriodReportFile } = await import('../reports/reportFiles');
              return createPeriodReportFile(period, range.from, today);
            }}
          />
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
        <p className="text-muted">Keine Einträge in diesem Zeitraum.</p>
      </Card>
    );
  }
  return (
    <>
      <TrainingCard current={current} previous={previous} settings={settings} />
      <RowsCard
        title="Alltag"
        rows={dailyRows(current, previous, settings)}
        hint="Ø über die Tage mit Eintrag."
      />
      <RowsCard
        title="Ernährung"
        rows={nutritionRows(current, previous, settings)}
        hint="Ø über die Tage mit Einträgen."
      />
      <RowsCard title="Gewohnheiten" rows={habitRows(current, previous)} />
      <RowsCard title="Persönliche Entwicklung" rows={growthRows(current, previous)} />
      <GoalsCard range={range} today={today} settings={settings} />
    </>
  );
}

function ReviewRows({ rows, label }: { rows: ReviewRow[]; label: string }) {
  const shown = shownRows(rows);
  if (shown.length === 0) return null;
  return (
    <dl aria-label={label} className="flex flex-col divide-y divide-line">
      {shown.map((row) => {
        const delta = formatReviewDelta(row);
        const tone =
          delta?.better === true
            ? 'text-primary-text'
            : delta?.better === false
              ? 'text-danger'
              : 'text-muted';
        return (
          <div key={row.label} className="flex items-baseline justify-between gap-3 py-2">
            <dt className="min-w-0">{row.label}</dt>
            <dd className="shrink-0 text-right tabular-nums">
              <span className="font-semibold">
                {row.current === null ? '–' : row.format(row.current)}
              </span>
              {delta && (
                <span
                  className={`ml-2 inline-block min-w-14 text-sm ${tone}`}
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

/** Karte mit Vergleichszeilen; ohne Werte unsichtbar */
function RowsCard({ title, rows, hint }: { title: string; rows: ReviewRow[]; hint?: string }) {
  if (shownRows(rows).length === 0) return null;
  return (
    <Card title={title}>
      <ReviewRows rows={rows} label={`${title} im Vergleich`} />
      {hint && <p className={`mt-2 ${HINT}`}>{hint}</p>}
    </Card>
  );
}

function TrainingCard({
  current,
  previous,
  settings,
}: {
  current: ReviewSummary;
  previous: ReviewSummary;
  settings: Settings;
}) {
  return (
    <Card title="Training">
      {current.trainingDays === 0 && previous.trainingDays === 0 ? (
        <p className={HINT}>Kein Training in diesem und im Vergleichszeitraum.</p>
      ) : (
        <>
          <ReviewRows
            rows={trainingRows(current, previous, settings)}
            label="Training im Vergleich"
          />
          {current.endurance.bySport.length > 0 && (
            <p data-testid="review-sports" className={`mt-2 ${HINT}`}>
              {current.endurance.bySport
                .map(
                  ({ sport, totals }) =>
                    `${ENDURANCE_SPORT_LABELS[sport].name} ${formatTotals(totals, sport, settings.distanceUnit)}`,
                )
                .join(' · ')}
            </p>
          )}
        </>
      )}
    </Card>
  );
}

/** Im Zeitraum erreichte Ziele (wiederkehrende zählen nicht) */
function GoalsCard({
  range,
  today,
  settings,
}: {
  range: DayRange;
  today: DayKey;
  settings: Settings;
}) {
  const goals = useGoals();
  const data = useGoalData();
  const exercises = useGoalExercises(goals);
  const from = useFromHere();
  const achieved = useMemo(
    () => (goals && data ? goalsAchievedIn(goals, data, range, today) : []),
    [goals, data, range, today],
  );
  if (!goals || !data || !exercises || goals.length === 0) return null;

  return (
    <Card title="Ziele">
      {achieved.length === 0 ? (
        <p className={HINT}>Kein Ziel in diesem Zeitraum erreicht.</p>
      ) : (
        <ul aria-label="Erreichte Ziele" className="flex flex-col gap-1">
          {achieved.map(({ goal, on }) => (
            <li key={goal.id} className="flex items-start gap-2">
              <Icon name="trophy" className="mt-0.5 h-4 w-4 text-primary-text" />
              <span>
                {goalName(goal, goalSubject(goal, exercises, data), settings)}{' '}
                <span className={HINT}>({formatGoalDate(on)})</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        to={GOALS_PATH}
        state={from}
        className="mt-1 flex min-h-11 items-center gap-0.5 text-sm font-semibold text-primary-text"
      >
        Alle Ziele
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </Card>
  );
}
