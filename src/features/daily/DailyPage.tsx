import { Page } from '../../components/Page';
import { Tile } from '../../components/Tile';
import type { DayKey, Settings } from '../../db/types';
import { formatSleep } from '../../domain/daily';
import { formatDecimal } from '../../domain/format';
import { habitDayProgress } from '../../domain/habits';
import { dayGoal, nutritionDay } from '../../domain/nutrition';
import { lowStockSupplements, supplementDay } from '../../domain/supplements';
import { doneOn, todayTodos } from '../../domain/todos';
import { NUTRITION_PATH } from '../nutrition/paths';
import { useNutritionDay } from '../nutrition/useNutrition';
import { useSettings } from '../settings/useSettings';
import { SUPPLEMENTS_PATH } from '../supplements/paths';
import { useSupplementOverview } from '../supplements/useSupplements';
import { DayNavigator } from './DayNavigator';
import { GoalBar } from './GoalBar';
import { BODY_PATH, DAILY_HISTORY_PATH, withDate } from './paths';
import { useDailyLog, useDayParam } from './useDaily';
import { HABITS_PATH, useHabits } from './useHabits';
import { TODOS_PATH, useTodos } from './useTodos';

const MUTED = 'text-sm text-slate-500 dark:text-slate-400';

interface TileProps {
  date: DayKey;
  today: DayKey;
}

/** Alltag-Übersicht: Tag wählen, je Bereich eine Kachel mit dem Stand des Tages */
export function DailyPage() {
  const settings = useSettings();
  const { date, today, setDate } = useDayParam();
  const day = { date, today };

  return (
    <Page title="Alltag">
      <DayNavigator date={date} today={today} onChange={setDate} />
      <ul aria-label="Bereiche" className="mb-4 grid grid-cols-2 gap-3">
        <HabitsTile {...day} />
        <TodosTile {...day} />
        {settings && <NutritionTile {...day} settings={settings} />}
        {settings && <SupplementsTile {...day} settings={settings} />}
        <BodyTile {...day} />
        <Tile to={withDate(DAILY_HISTORY_PATH, date, today)} icon="📈" name="Verlauf">
          <span className={MUTED}>Graphen über Tage und Wochen</span>
        </Tile>
      </ul>
    </Page>
  );
}

function Progress({ label, done, total }: { label: string; done: number; total: number }) {
  return (
    <>
      <span className={`tabular-nums ${MUTED}`}>
        {done} von {total}
      </span>
      <GoalBar label={label} value={done} goal={total} />
    </>
  );
}

function HabitsTile({ date, today }: TileProps) {
  const habits = useHabits();
  const progress = habits && habitDayProgress(habits, date);
  return (
    <Tile to={withDate(HABITS_PATH, date, today)} icon="🔁" name="Gewohnheiten">
      {habits &&
        progress &&
        (habits.every(({ habit }) => habit.archivedAt !== null) ? (
          <span className={MUTED}>Noch keine</span>
        ) : progress.total === 0 ? (
          <span className={MUTED}>Nichts fällig</span>
        ) : (
          <Progress label="Gewohnheiten erledigt" {...progress} />
        ))}
    </Tile>
  );
}

function TodosTile({ date, today }: TileProps) {
  const todos = useTodos();
  const status = (() => {
    if (!todos) return null;
    if (date !== today) {
      const done = doneOn(todos, date).length;
      return done === 0 ? 'Nichts erledigt' : `${done} erledigt`;
    }
    const open = todayTodos(todos, today).length;
    if (open > 0) return `${open} offen`;
    return doneOn(todos, today).length > 0 ? 'Alles erledigt' : 'Keine offen';
  })();
  return (
    <Tile to={withDate(TODOS_PATH, date, today)} icon="✅" name="To-dos">
      {status && <span className={MUTED}>{status}</span>}
    </Tile>
  );
}

function NutritionTile({ date, today, settings }: TileProps & { settings: Settings }) {
  const data = useNutritionDay(date);
  const kcal = data && nutritionDay(data.entries).total.kcal;
  const goal = data && dayGoal(settings, data).kcal;
  return (
    <Tile to={withDate(NUTRITION_PATH, date, today)} icon="🍽️" name="Ernährung">
      {kcal != null && goal != null && (
        <>
          <span className={`tabular-nums ${MUTED}`}>
            {formatDecimal(Math.round(kcal), 0)} von {formatDecimal(goal, 0)} kcal
          </span>
          <GoalBar label="Kalorienziel" value={kcal} goal={goal} />
        </>
      )}
    </Tile>
  );
}

function SupplementsTile({ date, today, settings }: TileProps & { settings: Settings }) {
  const overview = useSupplementOverview();
  const content = (() => {
    if (!overview) return null;
    const active = overview.items.filter(({ supplement }) => supplement.archivedAt === null);
    if (active.length === 0) return <span className={MUTED}>Noch keine</span>;
    const due = supplementDay(active, date, today, overview.trainingDays).filter(
      (entry) => entry.status === 'due',
    );
    const taken = due.filter((entry) => entry.intake !== null).length;
    const lowStock = lowStockSupplements(
      active.map(({ supplement }) => supplement),
      overview.trainingDays,
      today,
      settings.supplementLowStockDays,
    ).length;
    return (
      <>
        {due.length === 0 ? (
          <span className={MUTED}>Nichts fällig</span>
        ) : (
          <Progress label="Supplements genommen" done={taken} total={due.length} />
        )}
        {lowStock > 0 && (
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            ⚠️ Bestand niedrig
          </span>
        )}
      </>
    );
  })();
  return (
    <Tile to={withDate(SUPPLEMENTS_PATH, date, today)} icon="💊" name="Supplements">
      {content}
    </Tile>
  );
}

function BodyTile({ date, today }: TileProps) {
  const log = useDailyLog(date);
  const lines = log
    ? [
        log.waterMl ? `Wasser ${formatDecimal(log.waterMl, 0)} ml` : null,
        log.sleepSeconds ? `Schlaf ${formatSleep(log.sleepSeconds)}` : null,
        log.steps ? `${formatDecimal(log.steps, 0)} Schritte` : null,
      ]
        .filter((line) => line !== null)
        .slice(0, 2)
    : [];
  // Nur Gewicht oder Befinden: kurzer Hinweis statt „Noch nichts“
  if (
    lines.length === 0 &&
    log &&
    (log.weightKg ?? log.mood ?? log.energy ?? log.sleepQuality) != null
  ) {
    lines.push('Eingetragen');
  }
  return (
    <Tile to={withDate(BODY_PATH, date, today)} icon="❤️" name="Körper & Befinden">
      {log !== undefined &&
        (lines.length === 0 ? (
          <span className={MUTED}>Noch nichts eingetragen</span>
        ) : (
          lines.map((line) => (
            <span key={line} className={`tabular-nums ${MUTED}`}>
              {line}
            </span>
          ))
        ))}
    </Tile>
  );
}
