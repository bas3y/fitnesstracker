import { useLiveQuery } from 'dexie-react-hooks';
import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import type { BackState } from '../../components/backNavigation';
import { Link } from 'react-router-dom';
import { BaseyLogo } from '../../components/BaseyLogo';
import { Chip } from '../../components/Chip';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { CompactHeader } from '../../components/CompactHeader';
import { useScrolledPast } from '../../components/useScrolledPast';
import { Card, CustomizeToggle, HeaderAction, LinkRow, type CardTone } from '../../components/Page';
import { SortableList } from '../../components/SortableList';
import { updateSettings, updateSettingsFrom } from '../../db/settings';
import { loadStatsSessions } from '../../db/stats';
import {
  DASHBOARD_WIDGETS,
  QUICK_ACTIONS,
  type DashboardWidget,
  type DayKey,
  type EnduranceSession,
  type Goal,
  type QuickAction,
  type Settings,
  type WeightUnit,
  type WidgetSize,
} from '../../db/types';
import type { WorkoutSummary } from '../../db/workouts';
import { formatDecimal } from '../../domain/format';
import { formatTotals } from '../../domain/endurance';
import { weekBySport } from '../../domain/enduranceStats';
import {
  DASHBOARD_WIDGET_LABELS,
  ENDURANCE_SPORT_LABELS,
  QUICK_ACTION_LABELS,
  WIDGET_SIZE_LABELS,
} from '../../domain/labels';
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
import { formatPeekDay, trainingsOn, weekTrainings } from '../../domain/week';
import { formatTrainingGap, trainingGap } from '../../domain/nudges';
import { DayPeek } from '../../components/DayPeek';
import { secondaryButton } from '../../components/buttons';
import { sessionPath } from '../endurance/paths';
import {
  filterWidgets,
  sizeChoices,
  WIDGET_GROUP_LABELS,
  WIDGET_GROUP_OF,
  WIDGET_GROUPS,
  widgetSize,
  type WidgetGroup,
} from '../../domain/widgets';
import { SearchInput } from '../../components/SearchInput';
import {
  formatWorkoutDate,
  formatWorkoutDuration,
  workoutDurationSeconds,
} from '../../domain/workout';
import { HabitChecklist } from '../daily/HabitChecklist';
import { EnduranceWidget } from '../endurance/EnduranceWidget';
import { GoalsWidget } from '../goals/GoalsWidget';
import { useGoals } from '../goals/useGoals';
import { useEnduranceSessions } from '../endurance/useEndurance';
import { TodayCard } from '../daily/TodayCard';
import { TodoCard } from '../daily/TodoCard';
import { NutritionDayCard } from '../nutrition/NutritionSummary';
import { SHARE_APP_PATH, settingsPath } from '../settings/paths';
import { useSettings } from '../settings/useSettings';
import { ActivityCard } from '../stats/ActivityCard';
import { SupplementChecklist } from '../supplements/SupplementChecklist';
import { HISTORY_PATH } from '../training/paths';
import { TrainingStartCard } from '../training/TrainingStartCard';
import { useNow, useWorkoutHistory } from '../training/useWorkouts';
import { DailyMetricWidget } from './DailyMetricWidget';
import { dayHintVisible, lastTraining } from './dayHintData';
import { DayHintWidget } from './DayHintWidget';
import { QuickActions } from './QuickActions';
import {
  EnduranceSmall,
  HabitsSmall,
  NutritionSmall,
  ProgressSmall,
  SupplementsSmall,
  TodosSmall,
} from './SmallWidgets';
import { SmallWidget, WeekDots, WidgetHeader } from './WidgetParts';
import { ChevronRightIcon, Icon } from '../../components/icons';

// Serien und Abzeichen rechnen viel: eigener Chunk, nicht im Hauptbundle
const MotivationWidget = lazy(() =>
  import('../motivation/MotivationWidget').then((module) => ({
    default: module.MotivationWidget,
  })),
);

const RECENT_RECORD_ROWS = 3;
const TODO_LIMIT = 5;
const MEDIUM_LIMIT = 3;
const RECORDS_PER_ROW = 2;
const FROM_DASHBOARD: BackState = { from: '/' };
const MUTED = 'text-muted';
const DATE_FORMAT = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

interface WidgetData {
  settings: Settings;
  sessions: StatsSession[];
  /** Ausdauer-Einheiten, neueste zuerst */
  endurance: EnduranceSession[];
  history: WorkoutSummary[];
  records: RecentRecords[];
  goals: Goal[];
  now: Date;
}

/** `null` = das Widget hat noch nichts zu zeigen */
function renderWidget(
  id: DashboardWidget,
  data: WidgetData,
  size: WidgetSize,
  tone?: CardTone,
): ReactNode {
  const { settings, sessions, endurance, history, records, now } = data;
  const trained = sessions.length > 0 || endurance.length > 0;
  const last = history[0];
  const today = dayKey(now);
  const small = size === 'small';
  switch (id) {
    case 'quickActions':
      return <QuickActions settings={settings} today={today} />;
    case 'habits':
      if (small) return <HabitsSmall today={today} tone={tone} />;
      return (
        <HabitChecklist
          variant="widget"
          date={today}
          today={today}
          limit={size === 'medium' ? MEDIUM_LIMIT : undefined}
        />
      );
    case 'todos':
      if (small) return <TodosSmall today={today} tone={tone} />;
      return size === 'medium' ? (
        <TodoCard today={today} limit={MEDIUM_LIMIT} withDone={false} />
      ) : (
        <TodoCard today={today} limit={TODO_LIMIT} />
      );
    case 'progress':
      if (sessions.length === 0) return null;
      return small ? (
        <ProgressSmall
          sessions={sessions}
          bodyWeightKg={settings.bodyWeightKg}
          now={now}
          tone={tone}
        />
      ) : (
        <ProgressCard sessions={sessions} bodyWeightKg={settings.bodyWeightKg} now={now} />
      );
    case 'week':
      return trained ? (
        <WeekCard
          sessions={sessions}
          endurance={endurance}
          history={history}
          settings={settings}
          now={now}
          size={size}
          tone={tone}
        />
      ) : null;
    case 'lastWorkout':
      return last ? <LastWorkout summary={last} now={now} /> : null;
    case 'records':
      return records.length > 0 ? (
        <RecentRecordsSection
          rows={size === 'medium' ? records.slice(0, 1) : records}
          unit={settings.weightUnit}
        />
      ) : null;
    case 'activity':
      return trained ? (
        <ActivityCard sessions={sessions} endurance={endurance} now={now} span="3m" />
      ) : null;
    case 'nextTraining':
      return <TrainingStartCard compact />;
    case 'daily':
      return <TodayCard settings={settings} now={now} />;
    case 'supplements':
      return small ? (
        <SupplementsSmall today={today} tone={tone} />
      ) : (
        <SupplementChecklist variant="widget" date={today} today={today} settings={settings} />
      );
    case 'nutrition':
      return small ? (
        <NutritionSmall today={today} tone={tone} settings={settings} />
      ) : (
        <NutritionDayCard date={today} today={today} settings={settings} />
      );
    case 'endurance':
      if (endurance.length === 0) return null;
      return small ? (
        <EnduranceSmall today={today} tone={tone} sessions={endurance} settings={settings} />
      ) : (
        <EnduranceWidget sessions={endurance} today={today} unit={settings.distanceUnit} />
      );
    case 'motivation':
      return (
        <Suspense fallback={null}>
          <MotivationWidget settings={settings} today={today} small={small} tone={tone} />
        </Suspense>
      );
    case 'goals':
      return data.goals.length > 0 ? (
        <GoalsWidget
          goals={data.goals}
          strength={sessions}
          endurance={endurance}
          settings={settings}
          today={today}
          small={small}
          tone={tone}
        />
      ) : null;
    case 'dayHint': {
      const training = lastTraining(history, endurance, records, settings, now);
      if (!dayHintVisible(settings, today, now, training)) return null;
      return <DayHintWidget settings={settings} today={today} now={now} training={training} />;
    }
    case 'steps':
    case 'water':
    case 'sleep':
      return (
        <DailyMetricWidget metric={id} size={size} settings={settings} today={today} tone={tone} />
      );
  }
}

export function HomePage() {
  const settings = useSettings();
  const sessions = useLiveQuery(loadStatsSessions);
  const endurance = useEnduranceSessions();
  const history = useWorkoutHistory();
  const goals = useGoals();
  const now = useNow(true, 60_000);
  const [editing, setEditing] = useState(false);
  const [header, compact] = useScrolledPast<HTMLDivElement>();
  const bodyWeightKg = settings?.bodyWeightKg ?? null;
  const records = useMemo(
    () => recentRecords(sessions ?? [], bodyWeightKg, RECENT_RECORD_ROWS),
    [sessions, bodyWeightKg],
  );
  const data = settings &&
    sessions &&
    endurance &&
    history &&
    goals && { settings, sessions, endurance, history, records, goals, now };

  const toggle = <CustomizeToggle editing={editing} onChange={setEditing} />;
  return (
    <div className="mx-auto max-w-md px-4 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      {compact && <CompactHeader title="Heute" action={toggle} />}
      <div ref={header} className="mb-4 flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] font-semibold tracking-wide text-muted uppercase">
            {DATE_FORMAT.format(now)}
          </p>
          <h1 className="text-[2rem] leading-tight font-bold tracking-tight">
            {settings?.name ? `Hallo, ${settings.name}!` : 'Heute'}
          </h1>
        </div>
        <HeaderAction hidden={compact}>{toggle}</HeaderAction>
      </div>
      {settings && !settings.welcomeDismissed && !editing && <WelcomeCard />}
      {data && (editing ? <WidgetEditor data={data} /> : <WidgetList data={data} />)}
    </div>
  );
}

/** Beim ersten Öffnen: Was die App ist und wo die Daten liegen */
function WelcomeCard() {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="mb-4 rounded-2xl border border-primary bg-primary-soft p-4"
    >
      <div className="mb-2 flex items-center gap-3">
        <BaseyLogo className="h-11 w-11" />
        <h2 id="welcome-heading" className="text-lg font-semibold">
          Willkommen bei Basey!
        </h2>
      </div>
      <ul className="mb-3 flex list-disc flex-col gap-1 pl-5 text-sm">
        <li>Die App ist leer und gehört ganz dir: Training, Ernährung und Alltag an einem Ort.</li>
        <li>Alles bleibt nur auf diesem Gerät – ohne Konto, ohne Server, auch ohne Internet.</li>
        <li>Tipp: Zum Startbildschirm hinzufügen und ab und zu ein Backup exportieren.</li>
      </ul>
      <p className="mb-3 text-sm text-muted">
        Schon benutzt und alles leer? Die App über ihr Icon auf dem Startbildschirm öffnen (der
        Browser hat einen eigenen Speicher) oder{' '}
        <Link
          to={settingsPath('backup')}
          state={FROM_DASHBOARD}
          className="font-semibold text-primary-text underline"
        >
          Backup wiederherstellen
        </Link>
        .
      </p>
      <div className="flex gap-2">
        <Link
          to={SHARE_APP_PATH}
          state={FROM_DASHBOARD}
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-primary px-3 text-sm font-semibold text-primary-text"
        >
          Installieren
        </Link>
        <button
          type="button"
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-3 text-sm font-semibold text-on-primary active:bg-primary-press"
          onClick={() => void updateSettings({ welcomeDismissed: true })}
        >
          Los geht’s
        </button>
      </div>
    </section>
  );
}

/** Kleine Widgets als Farbblöcke: das erste in Akzentfarbe, das zweite im Hellton */
const SMALL_TONES: readonly CardTone[] = ['accent', 'soft'];

/** Raster: kleine Widgets nehmen eine halbe Zeile, alle anderen die ganze */
function WidgetList({ data }: { data: WidgetData }) {
  const { dashboardWidgets, widgetSizes } = data.settings;
  const sizes = dashboardWidgets.map((id) => widgetSize(id, widgetSizes));
  const visible = dashboardWidgets.flatMap((id, index) => {
    const size = sizes[index]!;
    const smallBefore = sizes.slice(0, index).filter((item) => item === 'small').length;
    const tone = size === 'small' ? SMALL_TONES[smallBefore] : undefined;
    const content = renderWidget(id, data, size, tone);
    return content ? [{ id, size, content }] : [];
  });
  if (visible.length === 0) {
    return (
      <Card>
        <p className={MUTED}>
          {dashboardWidgets.length === 0
            ? 'Keine Widgets ausgewählt. Über „Anpassen“ stellst du dir die Startseite zusammen.'
            : 'Nach deinem ersten Workout siehst du hier deine Woche, deine Rekorde und deine Trainingstage.'}
        </p>
      </Card>
    );
  }
  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      {visible.map(({ id, size, content }) => (
        <div
          key={id}
          data-widget={id}
          className={`grid min-w-0 *:mb-0 ${size === 'small' ? '' : 'col-span-2'}`}
        >
          {content}
        </div>
      ))}
    </div>
  );
}

/** Widgets als Vorschau: am Griff ziehen, Größe wählen, entfernen, aus „Weitere Widgets“ hinzufügen */
function WidgetEditor({ data }: { data: WidgetData }) {
  const { dashboardWidgets, widgetSizes } = data.settings;
  const save = (widgets: DashboardWidget[]) => updateSettings({ dashboardWidgets: widgets });
  const change = (next: (current: DashboardWidget[]) => DashboardWidget[]) =>
    updateSettingsFrom((current) => ({ dashboardWidgets: next(current.dashboardWidgets) }));
  const setSize = (id: DashboardWidget, size: WidgetSize) =>
    updateSettingsFrom((current) => ({ widgetSizes: { ...current.widgetSizes, [id]: size } }));
  const hidden = DASHBOARD_WIDGETS.filter((id) => !dashboardWidgets.includes(id));
  const remove = (id: DashboardWidget) =>
    void change((current) => current.filter((item) => item !== id));

  return (
    <>
      {/* Raster wie auf der Startseite: kleine Widgets stehen nebeneinander, auch beim Ziehen */}
      <SortableList
        label="Widgets"
        grid
        wide={({ id }) => widgetSize(id as DashboardWidget, widgetSizes) !== 'small'}
        items={dashboardWidgets.map((id) => ({ id, name: DASHBOARD_WIDGET_LABELS[id].name }))}
        onReorder={(ids) => save(ids as DashboardWidget[])}
        renderItem={({ id, name }, { handle }) => {
          const widget = id as DashboardWidget;
          const size = widgetSize(widget, widgetSizes);
          const small = size === 'small';
          const sizes = (
            <SizePicker
              name={name}
              choices={sizeChoices(widget)}
              value={size}
              stretch={small}
              onChange={(next) => void setSize(widget, next)}
            />
          );
          const preview = (
            <div inert className={`grid min-w-0 *:mb-0 ${small ? 'px-1.5' : 'px-2'}`}>
              {renderWidget(widget, data, size, small ? 'accent' : undefined) ?? (
                <p className={`px-1 pb-1 text-sm ${MUTED}`}>
                  {widget === 'dayHint'
                    ? 'Erscheint morgens, nach dem Training und abends.'
                    : 'Zeigt erst nach deinem ersten Workout etwas.'}
                </p>
              )}
            </div>
          );
          if (small) {
            return (
              <div className="mb-3 flex h-[calc(100%-0.75rem)] flex-col rounded-2xl border-2 border-dashed border-line-strong bg-page">
                <div className="flex min-h-14 items-center">
                  {handle ?? <span className="w-3 shrink-0" />}
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span>
                  <DeleteRowButton name={name} verb="entfernen" onClick={() => remove(widget)} />
                </div>
                <div className="flex-1">{preview}</div>
                <div className="p-1.5">{sizes}</div>
              </div>
            );
          }
          return (
            <div className="mb-3 rounded-2xl border-2 border-dashed border-line-strong bg-page">
              <div className="flex min-h-14 items-center">
                {handle ?? <span className="w-3 shrink-0" />}
                <span className="min-w-0 flex-1 truncate font-semibold">{name}</span>
                {sizes}
                <DeleteRowButton name={name} verb="entfernen" onClick={() => remove(widget)} />
              </div>
              {widget === 'quickActions' && (
                <QuickActionPicker selected={data.settings.quickActions} />
              )}
              <div className="pb-2">{preview}</div>
            </div>
          );
        }}
      />
      {hidden.length > 0 && (
        <MoreWidgets
          hidden={hidden}
          onAdd={(id) =>
            void change((current) => (current.includes(id) ? current : [...current, id]))
          }
        />
      )}
    </>
  );
}

const WIDGET_NAMES = Object.fromEntries(
  DASHBOARD_WIDGETS.map((id) => [id, DASHBOARD_WIDGET_LABELS[id].name]),
) as Record<DashboardWidget, string>;

/** Noch nicht gewählte Widgets mit Bereichs-Filter und Suche */
function MoreWidgets({
  hidden,
  onAdd,
}: {
  hidden: DashboardWidget[];
  onAdd: (id: DashboardWidget) => void;
}) {
  const [group, setGroup] = useState<WidgetGroup | null>(null);
  const [query, setQuery] = useState('');
  const shown = filterWidgets(hidden, WIDGET_NAMES, group, query);
  const chips: { value: WidgetGroup | null; label: string }[] = [
    { value: null, label: 'Alle' },
    ...WIDGET_GROUPS.map((value) => ({ value, label: WIDGET_GROUP_LABELS[value] })),
  ];
  return (
    <section className="mb-4">
      <h2 className="mb-3 text-lg font-semibold">Weitere Widgets</h2>
      <SearchInput label="Widgets suchen" value={query} onChange={setQuery} placeholder="Suchen" />
      <div role="group" aria-label="Bereich" className="-mt-1 mb-3 flex flex-wrap gap-1.5">
        {chips.map(({ value, label }) => (
          <Chip key={label} pressed={group === value} onClick={() => setGroup(value)}>
            {label}
          </Chip>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className={`text-sm ${MUTED}`}>Kein Widget gefunden.</p>
      ) : (
        <ul aria-label="Weitere Widgets">
          {shown.map((id) => (
            <li key={id} className="mb-2">
              <button
                type="button"
                aria-label={`${WIDGET_NAMES[id]} hinzufügen`}
                className="flex min-h-13 w-full items-center gap-3 rounded-2xl bg-surface px-4 py-2 text-left active:bg-pressed"
                onClick={() => onAdd(id)}
              >
                <Icon name="plus" className="h-5 w-5 text-primary-text" />
                <span className="min-w-0 flex-1 truncate font-medium">{WIDGET_NAMES[id]}</span>
                <span className="shrink-0 text-xs text-muted">
                  {WIDGET_GROUP_LABELS[WIDGET_GROUP_OF[id]]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** S / M / L; bei nur einer Größe nichts */
function SizePicker({
  name,
  choices,
  value,
  stretch = false,
  onChange,
}: {
  name: string;
  choices: WidgetSize[];
  value: WidgetSize;
  /** Ganze Breite (unter kleinen Widgets) */
  stretch?: boolean;
  onChange: (size: WidgetSize) => void;
}) {
  if (choices.length < 2) return null;
  return (
    <div
      role="group"
      aria-label={`Größe: ${name}`}
      className={`flex shrink-0 gap-0.5 rounded-xl bg-subtle p-0.5 ${stretch ? '*:flex-1' : ''}`}
    >
      {choices.map((size) => (
        <button
          key={size}
          type="button"
          aria-pressed={size === value}
          aria-label={WIDGET_SIZE_LABELS[size].name}
          title={WIDGET_SIZE_LABELS[size].name}
          className={`h-10 min-w-10 rounded-[0.625rem] text-sm font-semibold ${
            size === value ? 'bg-surface text-primary-text shadow-sm' : 'text-muted'
          }`}
          onClick={() => onChange(size)}
        >
          {WIDGET_SIZE_LABELS[size].short}
        </button>
      ))}
    </div>
  );
}

/** Buttons des Schnellzugriffs wählen; Reihenfolge wie in `QUICK_ACTIONS` */
function QuickActionPicker({ selected }: { selected: QuickAction[] }) {
  const toggle = (action: QuickAction) =>
    updateSettingsFrom(({ quickActions: current }) => ({
      quickActions: current.includes(action)
        ? current.filter((item) => item !== action)
        : QUICK_ACTIONS.filter((item) => item === action || current.includes(item)),
    }));
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
          <Icon name={QUICK_ACTION_LABELS[action].icon} className="h-4 w-4" />
          {QUICK_ACTION_LABELS[action].name}
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
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-muted">
        {strengthPercent === null
          ? 'Kraft: ab 4 Einheiten einer Übung in 3 Monaten. '
          : `Median über ${progress.exerciseCount} ${progress.exerciseCount === 1 ? 'Übung' : 'Übungen'}. `}
        Vormonat: {workoutsLastMonth} Workouts
        {diff !== 0 && ` (${diff > 0 ? '+' : '−'}${Math.abs(diff)})`}.
      </p>
      <Link
        to="/stats"
        className="mt-1 flex min-h-11 items-center gap-0.5 text-sm font-semibold text-primary-text"
      >
        Zur Statistik
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </Card>
  );
}

/** Klein: Trainings / Wochenziel; mittel: Tage Mo–So; groß: dazu Sätze, Volumen, Ausdauer */
function WeekCard({
  sessions,
  endurance,
  history,
  settings,
  now,
  size,
  tone,
}: {
  sessions: StatsSession[];
  endurance: EnduranceSession[];
  history: WorkoutSummary[];
  settings: Settings;
  now: Date;
  size: WidgetSize;
  tone?: CardTone;
}) {
  const today = dayKey(now);
  const [selected, setSelected] = useState<DayKey>(today);
  const target = settings.trainingWeekTarget;
  const week = weekTrainings(sessions, endurance, today);
  const gap = useMemo(() => trainingGap(sessions, today), [sessions, today]);
  const label = DASHBOARD_WIDGET_LABELS.week.name;
  const count = `${week.count} von ${target} ${target === 1 ? 'Training' : 'Trainings'}`;

  if (size === 'small') {
    return (
      <SmallWidget
        to="/stats"
        state={FROM_DASHBOARD}
        icon="calendar"
        label={label}
        value={`${week.count}/${target}`}
        bar={{ value: week.count, goal: target }}
        tone={tone}
      />
    );
  }
  const day = week.days.some((item) => item.date === selected) ? selected : today;
  const trainings = trainingsOn(
    day,
    history.map(({ workout, planDayName, exerciseNames }) => ({
      id: workout.id,
      startedAt: workout.startedAt,
      name: planDayName ?? (exerciseNames.slice(0, 2).join(', ') || 'Krafttraining'),
    })),
    endurance.map((session) => ({
      id: session.id,
      startedAt: session.startedAt,
      name: ENDURANCE_SPORT_LABELS[session.sport].name,
    })),
  );
  return (
    <Card>
      <WidgetHeader title={label} aside={count} />
      <div className="mb-4">
        <WeekBar value={week.count} goal={target} />
      </div>
      <WeekDots
        days={week.days}
        today={today}
        selection={{ selected: day, onSelect: setSelected }}
      />
      <DayPeek
        day={formatPeekDay(day, today)}
        value={
          trainings.length === 0
            ? day > today
              ? 'noch offen'
              : 'kein Training'
            : trainings.map((item) => item.name).join(' · ')
        }
      >
        {trainings.slice(0, 2).map((item) => (
          <Link
            key={item.id}
            to={item.kind === 'strength' ? `${HISTORY_PATH}/${item.id}` : sessionPath(item.id)}
            state={FROM_DASHBOARD}
            className={secondaryButton}
          >
            {trainings.length === 1 ? 'Ansehen' : item.name}
          </Link>
        ))}
      </DayPeek>
      {gap && <p className="mt-3 text-sm text-muted">{formatTrainingGap(gap)}</p>}
      {size === 'large' && (
        <WeekDetails
          sessions={sessions}
          endurance={endurance}
          settings={settings}
          now={now}
          today={today}
        />
      )}
    </Card>
  );
}

function WeekBar({ value, goal }: { value: number; goal: number }) {
  const percent = Math.min(100, Math.round((value / Math.max(goal, 1)) * 100));
  return (
    <div
      role="progressbar"
      aria-label="Wochenziel Trainings"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2 overflow-hidden rounded-full bg-subtle-strong"
    >
      <div className="bar-fill h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  );
}

function WeekDetails({
  sessions,
  endurance,
  settings,
  now,
  today,
}: {
  sessions: StatsSession[];
  endurance: EnduranceSession[];
  settings: Settings;
  now: Date;
  today: string;
}) {
  const unit = settings.weightUnit;
  const { workouts, sets, volumeKg } = weekSummary(sessions, settings.bodyWeightKg, now);
  const cardio = weekBySport(endurance, today);
  const tiles = [
    { label: 'Workouts', value: String(workouts) },
    { label: 'Sätze', value: String(sets) },
    { label: `Volumen (${unit})`, value: formatDecimal(kgToDisplay(volumeKg, unit), 0) },
  ];
  return (
    <>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {tiles.map(({ label, value }) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {cardio.length > 0 && (
        <p data-testid="week-endurance" className="mt-3 text-sm">
          <span className="font-medium">Ausdauer:</span>{' '}
          {cardio
            .map(
              ({ sport, totals }) =>
                `${ENDURANCE_SPORT_LABELS[sport].name} ${formatTotals(totals, sport, settings.distanceUnit)}`,
            )
            .join(' · ')}
        </p>
      )}
      <p className="mt-2 text-sm text-muted">
        Ohne Aufwärmsätze; Stufen und Halteübungen zählen nicht zum Volumen.
      </p>
    </>
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
