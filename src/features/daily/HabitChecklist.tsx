import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { CheckIcon } from '../../components/icons';
import { Card } from '../../components/Page';
import { setHabitChecked, type HabitWithChecks } from '../../db/habits';
import { HABIT_GROUPS, type DayKey } from '../../db/types';
import {
  checksInWeek,
  formatStreak,
  habitStreak,
  HABIT_GROUP_TITLES,
  isHabitDue,
} from '../../domain/habits';
import { GoalBar } from './GoalBar';
import { HABITS_PATH, useHabits } from './useHabits';

/** Morgen-, Abendroutine und Sonstiges als Checklisten; nur Gewohnheiten, die an `date` anstehen */
export function HabitChecklist({ date, today }: { date: DayKey; today: DayKey }) {
  const habits = useHabits();
  const due = habits?.filter(({ habit }) => isHabitDue(habit, date)) ?? [];

  return HABIT_GROUPS.map((group) => {
    const items = due.filter(({ habit }) => habit.group === group);
    if (items.length === 0) return null;
    const title = HABIT_GROUP_TITLES[group];
    const doneCount = items.filter(({ dates }) => dates.includes(date)).length;
    return (
      <Card key={group} title={title}>
        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
          {doneCount} von {items.length} erledigt
        </p>
        <GoalBar label={title} value={doneCount} goal={items.length} />
        <ul aria-label={title} className="mt-2">
          {items.map((item) => (
            <HabitRow key={item.habit.id} item={item} date={date} today={today} />
          ))}
        </ul>
      </Card>
    );
  });
}

function habitHint({ habit, dates }: HabitWithChecks, date: DayKey, today: DayKey): string {
  const { current, unit } = habitStreak(habit, dates, today);
  const parts = current > 0 ? [`🔥 ${formatStreak(current, unit)}`] : [];
  if (habit.frequency === 'weekly') {
    parts.push(`${checksInWeek(dates, date)} von ${habit.timesPerWeek} diese Woche`);
  }
  return parts.join(' · ');
}

function HabitRow({ item, date, today }: { item: HabitWithChecks; date: DayKey; today: DayKey }) {
  const { habit, dates } = item;
  const from = useFromHere();
  const checked = dates.includes(date);
  const hint = habitHint(item, date, today);

  return (
    <li className="flex items-center">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={habit.name}
        className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 text-left"
        onClick={() => void setHabitChecked(habit.id, date, !checked)}
      >
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
            checked
              ? 'border-emerald-700 bg-emerald-700 text-white'
              : 'border-slate-300 dark:border-slate-600'
          }`}
        >
          {checked && <CheckIcon className="h-5 w-5" />}
        </span>
        <span aria-hidden="true" className="text-xl">
          {habit.icon}
        </span>
        <span className="min-w-0">
          <span
            className={`block font-medium ${checked ? 'text-slate-500 line-through dark:text-slate-400' : ''}`}
          >
            {habit.name}
          </span>
          {hint && <span className="block text-sm text-slate-500 dark:text-slate-400">{hint}</span>}
        </span>
      </button>
      <Link
        to={`${HABITS_PATH}/${habit.id}`}
        state={from}
        aria-label={`Details: ${habit.name}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center text-xl text-slate-400"
      >
        ›
      </Link>
    </li>
  );
}
