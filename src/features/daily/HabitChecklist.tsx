import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Bump, ToggleChevron } from '../../components/Bump';
import { CheckButton, StatusCircle } from '../../components/CheckButton';
import { useLeavingIds } from '../../components/motion';
import { CHECK_HINT as HINT, checkNameClass as nameClass } from '../../components/checkStyles';
import { Card } from '../../components/Page';
import {
  addHabitAmount,
  setHabitAmount,
  setHabitDone,
  type HabitWithChecks,
} from '../../db/habits';
import { HABIT_GROUPS, type DayKey, type HabitItem } from '../../db/types';
import {
  checksInWeek,
  dayAmount,
  formatHabitAmount,
  formatStreak,
  habitStreak,
  HABIT_GROUP_TITLES,
  isHabitDoneOn,
  isHabitShownOn,
  isSingleTap,
  itemsDone,
  quitStreak,
} from '../../domain/habits';
import { GoalBar } from './GoalBar';
import { HABITS_PATH, useHabits } from './useHabits';
import { ChevronRightIcon, Icon, IconBadge, type IconName } from '../../components/icons';

const ROUND_BUTTON =
  'flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-subtle px-2 text-sm font-semibold tabular-nums active:bg-subtle-strong';

/**
 * `groups`: eine Karte je Gruppe (Gewohnheiten-Seite); `widget`: eine Karte für alles (Startseite).
 * Ohne anstehende Gewohnheiten rendert `groups` nichts, `widget` einen Hinweis.
 */
export function HabitChecklist({
  date,
  today,
  variant = 'groups',
  limit,
}: {
  date: DayKey;
  today: DayKey;
  variant?: 'groups' | 'widget';
  /** Nur so viele offene zeigen, erledigte ausblenden (mittleres Widget) */
  limit?: number;
}) {
  const habits = useHabits();
  if (!habits) return null;
  const due = habits.filter(({ habit }) => isHabitShownOn(habit, date));

  if (variant === 'widget') {
    const sorted = HABIT_GROUPS.flatMap((group) =>
      due.filter(({ habit }) => habit.group === group),
    );
    return (
      <Card title="Gewohnheiten">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted">
            {habits.length === 0 ? 'Noch keine Gewohnheiten. ' : 'Heute steht nichts an. '}
            <Link to={HABITS_PATH} className="font-semibold text-primary-text">
              {habits.length === 0 ? 'Jetzt anlegen' : 'Alle Gewohnheiten'}
            </Link>
          </p>
        ) : (
          <ChecklistBody
            title="Gewohnheiten heute"
            items={sorted}
            date={date}
            today={today}
            limit={limit}
          />
        )}
      </Card>
    );
  }

  return HABIT_GROUPS.map((group) => {
    const items = due.filter(({ habit }) => habit.group === group);
    if (items.length === 0) return null;
    const title = HABIT_GROUP_TITLES[group];
    return (
      <Card key={group} title={title}>
        <ChecklistBody title={title} items={items} date={date} today={today} />
      </Card>
    );
  });
}

/** Offene zuerst, dann Aufhören-Gewohnheiten; erledigte eingeklappt am Ende */
function ChecklistBody({
  title,
  items,
  date,
  today,
  limit,
}: {
  title: string;
  items: HabitWithChecks[];
  date: DayKey;
  today: DayKey;
  limit?: number;
}) {
  const [showDone, setShowDone] = useState(false);
  const from = useFromHere();
  const tasks = items.filter(({ habit }) => habit.kind !== 'quit');
  const quits = items.filter(({ habit }) => habit.kind === 'quit');
  const isDone = ({ habit, entries }: HabitWithChecks) => isHabitDoneOn(habit, entries, date);
  const done = tasks.filter(isDone);
  // Gerade abgehakte gleiten erst hinaus, dann wandern sie zu „erledigt“ (22d, C2)
  const leaving = useLeavingIds(
    tasks.filter((item) => !isDone(item)).map(({ habit }) => habit.id),
    `${title}:${date}`,
  );
  const open = tasks.filter((item) => !isDone(item) || leaving.has(item.habit.id));
  const doneListed = done.filter(({ habit }) => !leaving.has(habit.id));
  const row = (item: HabitWithChecks) => (
    <HabitRow
      key={item.habit.id}
      item={item}
      date={date}
      today={today}
      leaving={leaving.has(item.habit.id)}
    />
  );

  if (limit !== undefined) {
    const shown = [...open, ...quits].slice(0, limit);
    const more = open.length + quits.length - shown.length;
    return (
      <>
        {tasks.length > 0 && (
          <p className="mb-1 text-sm text-muted">
            {done.length} von {tasks.length} erledigt
          </p>
        )}
        {shown.length === 0 && <p className="text-sm text-muted">Alles erledigt für heute.</p>}
        <ul aria-label={title}>{shown.map(row)}</ul>
        <Link
          to={HABITS_PATH}
          state={from}
          className="mt-1 flex min-h-11 items-center gap-0.5 text-sm font-semibold text-primary-text"
        >
          {more > 0 ? `${more} weitere offen` : 'Alle Gewohnheiten'}
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </>
    );
  }

  return (
    <>
      {tasks.length > 0 && (
        <>
          <p className="mb-2 text-sm text-muted">
            {done.length} von {tasks.length} erledigt
          </p>
          <GoalBar label={title} value={done.length} goal={tasks.length} />
        </>
      )}
      <ul aria-label={title} className="mt-2">
        {open.map(row)}
        {quits.map(row)}
      </ul>
      {doneListed.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={showDone}
            className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-semibold text-muted"
            onClick={() => setShowDone(!showDone)}
          >
            <ToggleChevron open={showDone} />
            <span>
              <Bump value={doneListed.length}>{doneListed.length}</Bump> erledigt
            </span>
          </button>
          {showDone && (
            <ul aria-label={`${title}: erledigt`} className="anim-rise">
              {doneListed.map(row)}
            </ul>
          )}
        </>
      )}
    </>
  );
}

function streakHint({ habit, entries, dates }: HabitWithChecks, date: DayKey, today: DayKey) {
  if (habit.kind === 'quit') {
    const { current } = quitStreak(habit, entries, today);
    return current > 0 ? `${formatStreak(current, 'days')} in Folge` : null;
  }
  const { current, unit } = habitStreak(habit, dates, today);
  const parts = current > 0 ? [`${formatStreak(current, unit)} in Folge`] : [];
  if (habit.frequency === 'weekly') {
    parts.push(`${checksInWeek(dates, date)} von ${habit.timesPerWeek} diese Woche`);
  }
  return parts.join(' · ') || null;
}

function HabitRow({
  item,
  date,
  today,
  leaving = false,
}: {
  item: HabitWithChecks;
  date: DayKey;
  today: DayKey;
  leaving?: boolean;
}) {
  const { habit, entries } = item;
  const streak = streakHint(item, date, today);
  const amount = dayAmount(entries, date);
  const done = isHabitDoneOn(habit, entries, date);
  const details = <DetailsLink id={habit.id} name={habit.name} />;
  const rowClass = `flex items-center ${leaving ? 'anim-leave' : ''}`;

  switch (habit.kind) {
    case 'check':
      return (
        <li className={rowClass}>
          <CheckButton
            label={habit.name}
            icon={habit.icon}
            checked={done}
            hint={streak}
            onChange={(checked) => void setHabitDone(habit, date, checked)}
          />
          {details}
        </li>
      );
    case 'count':
      return (
        <li className={rowClass}>
          {isSingleTap(habit) ? (
            <CheckButton
              label={habit.name}
              icon={habit.icon}
              checked={done}
              hint={join(formatHabitAmount(habit.target, habit.unit), streak)}
              onChange={(checked) => void setHabitDone(habit, date, checked)}
            />
          ) : (
            <AmountRow
              name={habit.name}
              icon={habit.icon}
              done={done}
              amount={amount}
              step={habit.step}
              unit={habit.unit}
              hint={join(
                `${formatHabitAmount(amount, '')} von ${formatHabitAmount(habit.target, habit.unit)}`,
                streak,
              )}
              onAdd={(delta) => void addHabitAmount(habit.id, date, delta)}
            />
          )}
          {details}
        </li>
      );
    case 'quit': {
      const over = amount > habit.target;
      const status =
        amount === 0
          ? 'Heute nichts eingetragen'
          : habit.target === 0
            ? `${formatHabitAmount(amount, habit.unit)} eingetragen`
            : `${formatHabitAmount(amount, '')} von max. ${formatHabitAmount(habit.target, habit.unit)}`;
      return (
        <li className="flex items-center">
          <AmountRow
            name={habit.name}
            icon={habit.icon}
            done={!over}
            warn={over}
            amount={amount}
            step={habit.step}
            unit={habit.unit}
            hint={join(status, streak)}
            onAdd={(delta) => void addHabitAmount(habit.id, date, delta)}
          />
          {details}
        </li>
      );
    }
    case 'items':
      return (
        <ItemsRow item={item} date={date} streak={streak} details={details} leaving={leaving} />
      );
  }
}

function ItemsRow({
  item,
  date,
  streak,
  details,
  leaving,
}: {
  item: HabitWithChecks;
  date: DayKey;
  streak: string | null;
  details: ReactNode;
  leaving: boolean;
}) {
  const { habit, entries } = item;
  const doneCount = itemsDone(habit, entries, date);
  const done = doneCount === habit.items.length;
  const [open, setOpen] = useState(!done);

  return (
    <li className={leaving ? 'anim-leave' : undefined}>
      <div className="flex items-center">
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${habit.name}: ${doneCount} von ${habit.items.length}`}
          className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 text-left"
          onClick={() => setOpen(!open)}
        >
          <StatusCircle done={done} />
          <IconBadge name={habit.icon} className="h-8 w-8" iconClassName="h-4.5 w-4.5" />
          <span className="min-w-0 flex-1">
            <span className={nameClass(done)}>{habit.name}</span>
            <span className={HINT}>{join(`${doneCount} von ${habit.items.length}`, streak)}</span>
          </span>
          <Icon
            name={open ? 'chevronUp' : 'chevronDown'}
            className="mr-1 h-4 w-4 shrink-0 text-faint"
          />
        </button>
        {details}
      </div>
      {open && (
        <ul
          aria-label={`Unterpunkte ${habit.name}`}
          className="mb-2 ml-11 border-l-2 border-line pl-2"
        >
          {habit.items.map((sub) => (
            <SubItemRow
              key={sub.id}
              habitId={habit.id}
              item={sub}
              amount={dayAmount(entries, date, sub.id)}
              date={date}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function SubItemRow({
  habitId,
  item,
  amount,
  date,
}: {
  habitId: string;
  item: HabitItem;
  amount: number;
  date: DayKey;
}) {
  const done = amount >= item.target;
  return (
    <li className="flex items-center">
      {isSingleTap(item) ? (
        <CheckButton
          label={item.name}
          checked={done}
          hint={formatHabitAmount(item.target, item.unit)}
          onChange={(checked) =>
            void setHabitAmount(habitId, date, checked ? item.target : 0, item.id)
          }
        />
      ) : (
        <AmountRow
          name={item.name}
          done={done}
          amount={amount}
          step={item.step}
          unit={item.unit}
          hint={`${formatHabitAmount(amount, '')} von ${formatHabitAmount(item.target, item.unit)}`}
          onAdd={(delta) => void addHabitAmount(habitId, date, delta, item.id)}
        />
      )}
    </li>
  );
}

function join(...parts: Array<string | null>): string {
  return parts.filter(Boolean).join(' · ');
}

/** Menge mit − und +Schritt; bei `quit` ist `done` = im Limit (kein Durchstreichen) */
function AmountRow({
  name,
  icon,
  done,
  warn = false,
  amount,
  step,
  unit,
  hint,
  onAdd,
}: {
  name: string;
  icon?: IconName;
  done: boolean;
  warn?: boolean;
  amount: number;
  step: number;
  unit: string;
  hint: string;
  onAdd: (delta: number) => void;
}) {
  const stepLabel = formatHabitAmount(step, unit);
  return (
    <div className="flex min-h-14 min-w-0 flex-1 items-center gap-1 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <StatusCircle done={done} warn={warn} />
        {icon && <IconBadge name={icon} className="h-8 w-8" iconClassName="h-4.5 w-4.5" />}
        <span className="min-w-0">
          <span className="block font-medium">{name}</span>
          <span className={HINT} data-testid="habit-amount">
            {hint}
          </span>
        </span>
      </div>
      {amount > 0 && (
        <button
          type="button"
          aria-label={`${name}: ${stepLabel} weniger`}
          className={ROUND_BUTTON}
          onClick={() => onAdd(-step)}
        >
          −
        </button>
      )}
      <button
        type="button"
        aria-label={`${name}: ${stepLabel} mehr`}
        className={ROUND_BUTTON}
        onClick={() => onAdd(step)}
      >
        +{formatHabitAmount(step, '')}
      </button>
    </div>
  );
}

function DetailsLink({ id, name }: { id: string; name: string }) {
  const from = useFromHere();
  return (
    <Link
      to={`${HABITS_PATH}/${id}`}
      state={from}
      aria-label={`Details: ${name}`}
      className="flex h-11 w-9 shrink-0 items-center justify-center text-faint"
    >
      <ChevronRightIcon className="h-4 w-4" />
    </Link>
  );
}
