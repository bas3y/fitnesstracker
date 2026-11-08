import { useState } from 'react';
import { secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Card, Page } from '../../components/Page';
import { clearDoneTodos } from '../../db/todos';
import type { Todo } from '../../db/types';
import { todayTodos, upcomingTodos } from '../../domain/todos';
import { TodoAddForm, TodoRow } from './TodoParts';
import { useDayBackTo, useDayParam } from './useDaily';
import { useTodos } from './useTodos';

const HINT = 'text-sm text-muted';
const DONE_SHOWN = 50;

export function TodoPage() {
  const todos = useTodos();
  // Aufgaben gelten immer ab heute, der gewählte Tag zählt nur für den Rückweg
  const { date, today } = useDayParam();
  const backTo = useDayBackTo(date, today);
  const [confirmClear, setConfirmClear] = useState(false);

  const open = todos ? todayTodos(todos, today) : [];
  const upcoming = todos ? upcomingTodos(todos, today) : [];
  const done = (todos ?? [])
    .filter((todo) => todo.completedAt !== null)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));

  const list = (label: string, items: Todo[]) => (
    <ul aria-label={label}>
      {items.map((todo) => (
        <TodoRow key={todo.id} todo={todo} today={today} />
      ))}
    </ul>
  );

  return (
    <Page title="To-dos" backTo={backTo}>
      <Card>
        <TodoAddForm today={today} withPicker />
        <p className={HINT}>
          Nicht erledigte Aufgaben wandern automatisch in den nächsten Tag. Antippen zum Bearbeiten.
        </p>
      </Card>
      {todos && (
        <>
          <Card title="Heute">
            {open.length === 0 ? (
              <p className={HINT}>Keine offenen Aufgaben.</p>
            ) : (
              list('Heute', open)
            )}
          </Card>
          {upcoming.length > 0 && <Card title="Geplant">{list('Geplant', upcoming)}</Card>}
          {done.length > 0 && (
            <Card title="Erledigt">
              {list('Erledigt', done.slice(0, DONE_SHOWN))}
              <button
                type="button"
                className={`${secondaryButton} mt-3`}
                onClick={() => setConfirmClear(true)}
              >
                Erledigte entfernen
              </button>
            </Card>
          )}
        </>
      )}
      {confirmClear && (
        <ConfirmDialog
          title="Erledigte Aufgaben entfernen?"
          confirmLabel="Entfernen"
          onCancel={() => setConfirmClear(false)}
          onConfirm={async () => {
            await clearDoneTodos();
            setConfirmClear(false);
          }}
        >
          {done.length === 1
            ? '1 erledigte Aufgabe wird'
            : `${done.length} erledigte Aufgaben werden`}{' '}
          gelöscht.
        </ConfirmDialog>
      )}
    </Page>
  );
}
