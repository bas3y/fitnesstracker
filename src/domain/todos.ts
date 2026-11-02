import type { DayKey, Todo, TodoPriority } from '../db/types';
import { dayKey, formatDayLabel, shiftDay } from './daily';
import { parseDayKey } from './stats';

export const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

const PRIORITY_RANK: Record<TodoPriority, number> = { high: 0, medium: 1, low: 2 };

export type TodoFields = Pick<
  Todo,
  'id' | 'title' | 'priority' | 'date' | 'completedAt' | 'createdAt'
>;

function byPriority(a: TodoFields, b: TodoFields): number {
  return (
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    a.date.localeCompare(b.date) ||
    a.createdAt.localeCompare(b.createdAt)
  );
}

/** Offene Aufgaben bis heute; nicht erledigte von früheren Tagen wandern mit */
export function todayTodos<T extends TodoFields>(todos: readonly T[], today: DayKey): T[] {
  return todos.filter((todo) => todo.completedAt === null && todo.date <= today).sort(byPriority);
}

/** Offene Aufgaben ab morgen, nach Datum */
export function upcomingTodos<T extends TodoFields>(todos: readonly T[], today: DayKey): T[] {
  return todos
    .filter((todo) => todo.completedAt === null && todo.date > today)
    .sort((a, b) => a.date.localeCompare(b.date) || byPriority(a, b));
}

/** Heute erledigte Aufgaben, zuletzt erledigte zuerst */
export function doneOn<T extends TodoFields>(todos: readonly T[], day: DayKey): T[] {
  return todos
    .filter((todo) => todo.completedAt !== null && dayKey(new Date(todo.completedAt)) === day)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));
}

/** Tage, die eine offene Aufgabe schon überfällig ist (0 = für heute geplant) */
export function daysCarried(todo: Pick<Todo, 'date'>, today: DayKey): number {
  if (todo.date >= today) return 0;
  const days = (parseDayKey(today).getTime() - parseDayKey(todo.date).getTime()) / 86_400_000;
  return Math.round(days);
}

/** Hinweis unter der Aufgabe, z. B. „seit gestern“ oder „Morgen“; `null` = heute geplant */
export function formatTodoDate(todo: Pick<Todo, 'date'>, today: DayKey): string | null {
  const carried = daysCarried(todo, today);
  if (carried === 1) return 'seit gestern';
  if (carried > 1) return `seit ${carried} Tagen`;
  if (todo.date === today) return null;
  if (todo.date === shiftDay(today, 1)) return 'Morgen';
  return formatDayLabel(todo.date, today);
}
