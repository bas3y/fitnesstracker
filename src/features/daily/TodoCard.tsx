import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Card } from '../../components/Page';
import type { DayKey } from '../../db/types';
import { doneOn, todayTodos, upcomingTodos } from '../../domain/todos';
import { TodoAddForm, TodoRow } from './TodoParts';
import { TODOS_PATH, useTodos } from './useTodos';

/** Heutige Aufgaben mit Schnelleingabe (Widget der Startseite); `limit` kürzt die Liste */
export function TodoCard({ today, limit }: { today: DayKey; limit?: number }) {
  const todos = useTodos();
  const from = useFromHere();
  const [showDone, setShowDone] = useState(false);
  if (!todos) return null;

  const open = todayTodos(todos, today);
  const shown = limit === undefined ? open : open.slice(0, limit);
  const done = doneOn(todos, today);
  const upcoming = upcomingTodos(todos, today).length;
  const more = [
    open.length > shown.length ? `${open.length - shown.length} weitere` : null,
    upcoming > 0 ? `${upcoming} geplant` : null,
  ].filter(Boolean);

  return (
    <Card title="To-dos">
      <TodoAddForm today={today} />
      {open.length === 0 && (
        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
          {done.length > 0 ? 'Alles erledigt für heute.' : 'Keine offenen Aufgaben.'}
        </p>
      )}
      <ul aria-label="Offene Aufgaben">
        {shown.map((todo) => (
          <TodoRow key={todo.id} todo={todo} today={today} />
        ))}
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
            {done.length} heute erledigt
          </button>
          {showDone && (
            <ul aria-label="Heute erledigt">
              {done.map((todo) => (
                <TodoRow key={todo.id} todo={todo} today={today} />
              ))}
            </ul>
          )}
        </>
      )}
      <Link
        to={TODOS_PATH}
        state={from}
        className="mt-1 flex min-h-11 items-center text-sm font-semibold text-emerald-700 dark:text-emerald-400"
      >
        Alle Aufgaben{more.length > 0 ? ` (${more.join(', ')})` : ''} ›
      </Link>
    </Card>
  );
}
