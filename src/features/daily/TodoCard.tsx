import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Bump, ToggleChevron } from '../../components/Bump';
import { ChevronRightIcon } from '../../components/icons';
import { useLeavingIds } from '../../components/motion';
import { Card } from '../../components/Page';
import type { DayKey } from '../../db/types';
import { doneOn, todayTodos, upcomingTodos, withOpen } from '../../domain/todos';
import { TodoAddForm, TodoRow } from './TodoParts';
import { TODOS_PATH, useTodos } from './useTodos';

/**
 * Heutige Aufgaben mit Schnelleingabe (Widget der Startseite); `limit` kürzt die Liste,
 * `withDone = false` blendet die erledigten aus (mittleres Widget)
 */
export function TodoCard({
  today,
  limit,
  withDone = true,
}: {
  today: DayKey;
  limit?: number;
  withDone?: boolean;
}) {
  const todos = useTodos();
  const from = useFromHere();
  const [showDone, setShowDone] = useState(false);
  const open = todos ? todayTodos(todos, today) : [];
  const leaving = useLeavingIds(
    open.map((todo) => todo.id),
    today,
  );
  if (!todos) return null;

  // Gerade abgehakte bleiben kurz an ihrem Platz und gleiten hinaus
  const listed = leaving.size === 0 ? open : todayTodos(withOpen(todos, leaving), today);
  const shown = limit === undefined ? listed : listed.slice(0, limit);
  const done = doneOn(todos, today).filter((todo) => !leaving.has(todo.id));
  const upcoming = upcomingTodos(todos, today).length;
  const more = [
    open.length > shown.length ? `${open.length - shown.length} weitere` : null,
    upcoming > 0 ? `${upcoming} geplant` : null,
  ].filter(Boolean);

  return (
    <Card title="To-dos">
      <TodoAddForm today={today} />
      {open.length === 0 && (
        <p className="mb-2 text-sm text-muted">
          {done.length > 0 ? 'Alles erledigt für heute.' : 'Keine offenen Aufgaben.'}
        </p>
      )}
      <ul aria-label="Offene Aufgaben">
        {shown.map((todo) => (
          <TodoRow
            key={todo.id}
            todo={todos.find((item) => item.id === todo.id) ?? todo}
            today={today}
            leaving={leaving.has(todo.id)}
          />
        ))}
      </ul>
      {withDone && done.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={showDone}
            className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-semibold text-muted"
            onClick={() => setShowDone(!showDone)}
          >
            <ToggleChevron open={showDone} />
            <Bump value={done.length}>{done.length}</Bump> heute erledigt
          </button>
          {showDone && (
            <ul aria-label="Heute erledigt" className="anim-rise">
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
        className="mt-1 flex min-h-11 items-center gap-0.5 text-sm font-semibold text-primary-text"
      >
        Alle Aufgaben{more.length > 0 ? ` (${more.join(', ')})` : ''}
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </Card>
  );
}
