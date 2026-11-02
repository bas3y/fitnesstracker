import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState, type ReactNode } from 'react';
import type { BackState } from '../../components/backNavigation';
import { Link } from 'react-router-dom';
import { Chip } from '../../components/Chip';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Card, LinkRow } from '../../components/Page';
import { SortableList } from '../../components/SortableList';
import { getSettings, updateSettings } from '../../db/settings';
import { loadStatsSessions } from '../../db/stats';
import {
  DASHBOARD_WIDGETS,
  QUICK_ACTIONS,
  type DashboardWidget,
  type QuickAction,
  type Settings,
  type WeightUnit,
} from '../../db/types';
import type { WorkoutSummary } from '../../db/workouts';
import { formatDecimal } from '../../domain/format';
import { DASHBOARD_WIDGET_LABELS, QUICK_ACTION_LABELS } from '../../domain/labels';
import { dayKey } from '../../domain/daily';
import {
  formatPercent,
  recentRecords,
  trainingProgress,
  weekSummary,
  type RecentRecords,
  type StatsSession,
} from '../../domain/stats';
import { formatRecord, type PersonalRecord } from '../../domain/strength';
import { kgToDisplay } from '../../domain/units';
import {
  formatWorkoutDate,
  formatWorkoutDuration,
  workoutDurationSeconds,
} from '../../domain/workout';
import { HabitChecklist } from '../daily/HabitChecklist';
import { TodayCard } from '../daily/TodayCard';
import { TodoCard } from '../daily/TodoCard';
import { NutritionDayCard } from '../nutrition/NutritionSummary';
import { useSettings } from '../settings/useSettings';
import { ActivityCard } from '../stats/ActivityCard';
import { SupplementChecklist } from '../supplements/SupplementChecklist';
import { HISTORY_PATH } from '../training/paths';
import { TrainingStartCard } from '../training/TrainingStartCard';
import { useNow, useWorkoutHistory } from '../training/useWorkouts';
import { QuickActions } from './QuickActions';

const RECENT_RECORD_ROWS = 3;
const TODO_LIMIT = 5;
const RECORDS_PER_ROW = 2;
const FROM_DASHBOARD: BackState = { from: '/' };
const MUTED = 'text-slate-600 dark:text-slate-400';

interface WidgetData {
  settings: Settings;
  sessions: StatsSession[];
  history: WorkoutSummary[];
  records: RecentRecords[];
  now: Date;
}

/** `null` = das Widget hat noch nichts zu zeigen */
function renderWidget(id: DashboardWidget, data: WidgetData): ReactNode {
  const { settings, sessions, history, records, now } = data;
  const last = history[0];
  const today = dayKey(now);
  switch (id) {
    case 'quickActions':
      return <QuickActions settings={settings} today={today} />;
    case 'habits':
      return <HabitChecklist variant="widget" date={today} today={today} />;
    case 'todos':
      return <TodoCard today={today} limit={TODO_LIMIT} />;
    case 'progress':
      return sessions.length > 0 ? (
        <ProgressCard sessions={sessions} bodyWeightKg={settings.bodyWeightKg} now={now} />
      ) : null;
    case 'week':
      return sessions.length > 0 ? (
        <WeekCard
          sessions={sessions}
          bodyWeightKg={settings.bodyWeightKg}
          unit={settings.weightUnit}
          now={now}
        />
      ) : null;
    case 'lastWorkout':
      return last ? <LastWorkout summary={last} now={now} /> : null;
    case 'records':
      return records.length > 0 ? (
        <RecentRecordsSection rows={records} unit={settings.weightUnit} />
      ) : null;
    case 'activity':
      return sessions.length > 0 ? <ActivityCard sessions={sessions} now={now} span="3m" /> : null;
    case 'nextTraining':
      return <TrainingStartCard compact />;
    case 'daily':
      return <TodayCard settings={settings} now={now} />;
    case 'supplements':
      return (
        <SupplementChecklist variant="widget" date={today} today={today} settings={settings} />
      );
    case 'nutrition':
      return <NutritionDayCard date={today} today={today} settings={settings} />;
  }
}

export function HomePage() {
  const settings = useSettings();
  const sessions = useLiveQuery(loadStatsSessions);
  const history = useWorkoutHistory();
  const now = useNow(true, 60_000);
  const [editing, setEditing] = useState(false);
  const bodyWeightKg = settings?.bodyWeightKg ?? null;
  const records = useMemo(
    () => recentRecords(sessions ?? [], bodyWeightKg, RECENT_RECORD_ROWS),
    [sessions, bodyWeightKg],
  );
  const data = settings && sessions && history && { settings, sessions, history, records, now };

  return (
    <div className="mx-auto max-w-md px-4 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <div className="mb-4 flex items-center gap-3">
        <img src="./favicon.svg" alt="" className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">Fitnesstracker</h1>
          <p className={MUTED}>{settings?.name ? `Hallo, ${settings.name}!` : 'Hallo!'}</p>
        </div>
        <button
          type="button"
          className="min-h-11 shrink-0 rounded-xl border border-slate-300 px-3 text-sm font-semibold dark:border-slate-600"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Fertig' : 'Anpassen'}
        </button>
      </div>
      {data && (editing ? <WidgetEditor data={data} /> : <WidgetList data={data} />)}
    </div>
  );
}

function WidgetList({ data }: { data: WidgetData }) {
  const { dashboardWidgets } = data.settings;
  const visible = dashboardWidgets.flatMap((id) => {
    const content = renderWidget(id, data);
    return content ? [{ id, content }] : [];
  });
  if (visible.length === 0) {
    return (
      <Card>
        <p className={MUTED}>
          {dashboardWidgets.length === 0
            ? 'Keine Widgets ausgewählt. Über „Anpassen“ stellst du dir die Startseite zusammen.'
            : 'Nach deinem ersten Workout siehst du hier deine Woche, deine Erfolge und deine Trainingstage.'}
        </p>
      </Card>
    );
  }
  return visible.map(({ id, content }) => <div key={id}>{content}</div>);
}

/** Widgets als Vorschau: am Griff ziehen, entfernen, aus „Weitere Widgets“ hinzufügen */
function WidgetEditor({ data }: { data: WidgetData }) {
  const { dashboardWidgets } = data.settings;
  const save = (widgets: DashboardWidget[]) => updateSettings({ dashboardWidgets: widgets });
  const hidden = DASHBOARD_WIDGETS.filter((id) => !dashboardWidgets.includes(id));

  return (
    <>
      <SortableList
        label="Widgets"
        items={dashboardWidgets.map((id) => ({ id, name: DASHBOARD_WIDGET_LABELS[id].name }))}
        onReorder={(ids) => save(ids as DashboardWidget[])}
        renderItem={({ id, name }, { handle, compact }) => (
          <div className="mb-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-900">
            <div className="flex min-h-14 items-center">
              {handle ?? <span className="w-3 shrink-0" />}
              <span className="min-w-0 flex-1 font-semibold">{name}</span>
              <DeleteRowButton
                name={name}
                verb="entfernen"
                onClick={() => void save(dashboardWidgets.filter((widget) => widget !== id))}
              />
            </div>
            {!compact && id === 'quickActions' && (
              <QuickActionPicker selected={data.settings.quickActions} />
            )}
            {!compact && (
              <div inert className="px-2">
                {renderWidget(id as DashboardWidget, data) ?? (
                  <p className={`px-1 pb-3 text-sm ${MUTED}`}>
                    Zeigt erst nach deinem ersten Workout etwas.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      />
      {hidden.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-3 text-lg font-semibold">Weitere Widgets</h2>
          <ul aria-label="Weitere Widgets">
            {hidden.map((id) => (
              <li key={id} className="mb-2">
                <button
                  type="button"
                  aria-label={`${DASHBOARD_WIDGET_LABELS[id].name} hinzufügen`}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-sm active:bg-slate-50 dark:bg-slate-800 dark:active:bg-slate-700"
                  onClick={() => void save([...dashboardWidgets, id])}
                >
                  <span
                    aria-hidden="true"
                    className="text-xl text-emerald-700 dark:text-emerald-400"
                  >
                    +
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{DASHBOARD_WIDGET_LABELS[id].name}</span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400">
                      {DASHBOARD_WIDGET_LABELS[id].hint}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** Buttons des Schnellzugriffs wählen; Reihenfolge wie in `QUICK_ACTIONS` */
function QuickActionPicker({ selected }: { selected: QuickAction[] }) {
  // Aktuellen Stand lesen, damit schnelles Tippen auf zwei Chips nichts verliert
  const toggle = async (action: QuickAction) => {
    const current = (await getSettings())?.quickActions ?? selected;
    const next = current.includes(action)
      ? current.filter((item) => item !== action)
      : QUICK_ACTIONS.filter((item) => item === action || current.includes(item));
    await updateSettings({ quickActions: next });
  };
  return (
    <div
      role="group"
      aria-label="Buttons im Schnellzugriff"
      className="flex flex-wrap gap-1 px-3 pb-3"
    >
      {QUICK_ACTIONS.map((action) => (
        <Chip
          key={action}
          pressed={selected.includes(action)}
          className="px-3"
          onClick={() => void toggle(action)}
        >
          {QUICK_ACTION_LABELS[action].icon} {QUICK_ACTION_LABELS[action].name}
        </Chip>
      ))}
    </div>
  );
}

function ProgressCard({
  sessions,
  bodyWeightKg,
  now,
}: {
  sessions: StatsSession[];
  bodyWeightKg: number | null;
  now: Date;
}) {
  const progress = useMemo(
    () => trainingProgress(sessions, bodyWeightKg, now),
    [sessions, bodyWeightKg, now],
  );
  const { strengthPercent, workoutsThisMonth, workoutsLastMonth, recordsThisMonth } = progress;
  const tiles = [
    {
      label: 'Kraft (3 Monate)',
      value: strengthPercent === null ? '–' : formatPercent(strengthPercent),
    },
    { label: 'Workouts im Monat', value: String(workoutsThisMonth) },
    { label: 'Rekorde im Monat', value: String(recordsThisMonth) },
  ];
  const diff = workoutsThisMonth - workoutsLastMonth;
  return (
    <Card title={DASHBOARD_WIDGET_LABELS.progress.name}>
      <dl data-testid="training-progress" className="grid grid-cols-3 gap-2 text-center">
        {tiles.map(({ label, value }) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {strengthPercent === null
          ? 'Kraft: ab 4 Einheiten einer Übung in 3 Monaten. '
          : `Median über ${progress.exerciseCount} ${progress.exerciseCount === 1 ? 'Übung' : 'Übungen'}. `}
        Vormonat: {workoutsLastMonth} Workouts
        {diff !== 0 && ` (${diff > 0 ? '+' : '−'}${Math.abs(diff)})`}.
      </p>
      <Link
        to="/stats"
        className="mt-1 flex min-h-11 items-center text-sm font-semibold text-emerald-700 dark:text-emerald-400"
      >
        Zur Statistik ›
      </Link>
    </Card>
  );
}

function WeekCard({
  sessions,
  bodyWeightKg,
  unit,
  now,
}: {
  sessions: StatsSession[];
  bodyWeightKg: number | null;
  unit: WeightUnit;
  now: Date;
}) {
  const { workouts, sets, volumeKg } = weekSummary(sessions, bodyWeightKg, now);
  const tiles = [
    { label: 'Workouts', value: String(workouts) },
    { label: 'Sätze', value: String(sets) },
    { label: `Volumen (${unit})`, value: formatDecimal(kgToDisplay(volumeKg, unit), 0) },
  ];
  return (
    <Card title={DASHBOARD_WIDGET_LABELS.week.name}>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {tiles.map(({ label, value }) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Ohne Aufwärmsätze; Stufen und Halteübungen zählen nicht zum Volumen.
      </p>
    </Card>
  );
}

function LastWorkout({ summary, now }: { summary: WorkoutSummary; now: Date }) {
  const { workout, planDayName, exerciseNames, setCount } = summary;
  return (
    <section className="mb-4">
      <h2 className="mb-3 text-lg font-semibold">{DASHBOARD_WIDGET_LABELS.lastWorkout.name}</h2>
      <LinkRow
        to={`${HISTORY_PATH}/${workout.id}`}
        state={FROM_DASHBOARD}
        label={planDayName ?? (exerciseNames.join(', ') || 'Workout')}
        hint={[
          formatWorkoutDate(workout.startedAt),
          formatWorkoutDuration(workoutDurationSeconds(workout, now)),
          setCount === 1 ? '1 Satz' : `${setCount} Sätze`,
        ].join(' · ')}
      />
    </section>
  );
}

function recordsHint(records: PersonalRecord[], unit: WeightUnit, isBodyweight: boolean) {
  const shown = records.slice(0, RECORDS_PER_ROW).map((record) => {
    const { label, value } = formatRecord(record, { unit, isBodyweight });
    return `${label}: ${value}`;
  });
  const more = records.length - shown.length;
  return shown.join(', ') + (more > 0 ? ` (+${more})` : '');
}

function RecentRecordsSection({ rows, unit }: { rows: RecentRecords[]; unit: WeightUnit }) {
  return (
    <section className="mb-4">
      <h2 className="mb-3 text-lg font-semibold">{DASHBOARD_WIDGET_LABELS.records.name}</h2>
      {rows.map(({ workoutId, startedAt, exercise, records }) => (
        <LinkRow
          key={`${workoutId}-${exercise.id}`}
          to={`${HISTORY_PATH}/${workoutId}`}
          state={FROM_DASHBOARD}
          label={exercise.name}
          hint={`${recordsHint(records, unit, exercise.equipment === 'bodyweight')} · ${formatWorkoutDate(startedAt)}`}
        />
      ))}
    </section>
  );
}
