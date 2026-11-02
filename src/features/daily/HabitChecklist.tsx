import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { CheckButton, StatusCircle } from '../../components/CheckButton';
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

const ROUND_BUTTON =
  'flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 px-2 text-sm font-semibold tabular-nums active:bg-slate-200 dark:bg-slate-700 dark:active:bg-slate-600';

/**
 * `groups`: eine Karte je Gruppe (Alltag-Seite); `widget`: eine Karte für alles (Startseite).
 * Ohne anstehende Gewohnheiten rendert `groups` nichts, `widget` einen Hinweis.
 */
export function HabitChecklist({
  date,
  today,
  variant = 'groups',
}: {
  date: DayKey;
  today: DayKey;
  variant?: 'groups' | 'widget';
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
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {habits.length === 0 ? 'Noch keine Gewohnheiten. ' : 'Heute steht nichts an. '}
            <Link to={HABITS_PATH} className="font-semibold text-emerald-700 dark:text-emerald-400">
              {habits.length === 0 ? 'Jetzt anlegen' : 'Alle Gewohnheiten'}
            </Link>
          </p>
        ) : (
          <ChecklistBody title="Gewohnheiten heute" items={sorted} date={date} today={today} />
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
}: {
  title: string;
  items: HabitWithChecks[];
  date: DayKey;
  today: DayKey;
}) {
  const [showDone, setShowDone] = useState(false);
  const tasks = items.filter(({ habit }) => habit.kind !== 'quit');
  const quits = items.filter(({ habit }) => habit.kind === 'quit');
  const isDone = ({ habit, entries }: HabitWithChecks) => isHabitDoneOn(habit, entries, date);
  const open = tasks.filter((item) => !isDone(item));
  const done = tasks.filter(isDone);
  const row = (item: HabitWithChecks) => (
    <HabitRow key={item.habit.id} item={item} date={date} today={today} />
  );

  return (
    <>
      {tasks.length > 0 && (
        <>
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
            {done.length} von {tasks.length} erledigt
          </p>
          <GoalBar label={title} value={done.length} goal={tasks.length} />
        </>
      )}
      <ul aria-label={title} className="mt-2">
        {open.map(row)}
        {quits.map(row)}
      </ul>
      {done.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={showDone}
            className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-semibold text-slate-600 dark:text-slate-300"
            onClick={() => setShowDone(!showDone)}
          >
            <span aria-hidden="true">{showDone ? '▾' : '▸'}</span>
            {done.length} erledigt
          </button>
          {showDone && <ul aria-label={`${title}: erledigt`}>{done.map(row)}</ul>}
        </>
      )}
    </>
  );
}

function streakHint({ habit, entries, dates }: HabitWithChecks, date: DayKey, today: DayKey) {
  if (habit.kind === 'quit') {
    const { current } = quitStreak(habit, entries, today);
    return current > 0 ? `🔥 ${formatStreak(current, 'days')}` : null;
  }
  const { current, unit } = habitStreak(habit, dates, today);
  const parts = current > 0 ? [`🔥 ${formatStreak(current, unit)}`] : [];
  if (habit.frequency === 'weekly') {
    parts.push(`${checksInWeek(dates, date)} von ${habit.timesPerWeek} diese Woche`);
  }
  return parts.join(' · ') || null;
}

function HabitRow({ item, date, today }: { item: HabitWithChecks; date: DayKey; today: DayKey }) {
  const { habit, entries } = item;
  const streak = streakHint(item, date, today);
  const amount = dayAmount(entries, date);
  const done = isHabitDoneOn(habit, entries, date);
  const details = <DetailsLink id={habit.id} name={habit.name} />;

  switch (habit.kind) {
    case 'check':
      return (
        <li className="flex items-center">
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
        <li className="flex items-center">
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
      return <ItemsRow item={item} date={date} streak={streak} details={details} />;
  }
}

function ItemsRow({
  item,
  date,
  streak,
  details,
}: {
  item: HabitWithChecks;
  date: DayKey;
  streak: string | null;
  details: ReactNode;
}) {
  const { habit, entries } = item;
  const doneCount = itemsDone(habit, entries, date);
  const done = doneCount === habit.items.length;
  const [open, setOpen] = useState(!done);

  return (
    <li>
      <div className="flex items-center">
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${habit.name}: ${doneCount} von ${habit.items.length}`}
          className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 text-left"
          onClick={() => setOpen(!open)}
        >
          <StatusCircle done={done} />
          <span aria-hidden="true" className="text-xl">
            {habit.icon}
          </span>
          <span className="min-w-0">
            <span className={nameClass(done)}>{habit.name}</span>
            <span className={HINT}>
              {join(`${doneCount} von ${habit.items.length} ${open ? '▾' : '▸'}`, streak)}
            </span>
          </span>
        </button>
        {details}
      </div>
      {open && (
        <ul
          aria-label={`Unterpunkte ${habit.name}`}
          className="mb-2 ml-11 border-l-2 border-slate-200 pl-2 dark:border-slate-700"
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
  icon?: string;
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
        {icon && (
          <span aria-hidden="true" className="text-xl">
            {icon}
          </span>
        )}
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
      className="flex h-11 w-9 shrink-0 items-center justify-center text-xl text-slate-400"
    >
      ›
    </Link>
  );
}
