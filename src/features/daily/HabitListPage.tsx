import { useState } from 'react';
import { Link } from 'react-router-dom';
import { primaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { LinkRow, Page } from '../../components/Page';
import { SortableList } from '../../components/SortableList';
import { deleteHabit, reorderHabits } from '../../db/habits';
import type { Habit } from '../../db/types';
import {
  formatHabitFrequency,
  formatHabitTarget,
  HABIT_GROUP_LABELS,
  isPaused,
} from '../../domain/habits';
import { HABITS_PATH, useHabits } from './useHabits';

function habitHint(habit: Habit): string {
  return [
    isPaused(habit) ? 'Pausiert' : null,
    HABIT_GROUP_LABELS[habit.group],
    habit.kind === 'quit' ? formatHabitTarget(habit) : formatHabitFrequency(habit),
  ]
    .filter(Boolean)
    .join(' · ');
}

export function HabitListPage() {
  const habits = useHabits();
  const [deleting, setDeleting] = useState<Habit | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const all = (habits ?? []).map(({ habit }) => habit);
  const active = all.filter((habit) => habit.archivedAt === null);
  const archived = all.filter((habit) => habit.archivedAt !== null);

  return (
    <Page title="Gewohnheiten" backTo="/daily">
      {habits && active.length === 0 && (
        <p className="mb-4 text-slate-600 dark:text-slate-400">
          Noch keine Gewohnheiten. Lege die erste an, sie erscheint dann auf der Alltag-Seite.
        </p>
      )}
      <SortableList
        label="Gewohnheiten"
        items={active}
        onReorder={reorderHabits}
        renderItem={(habit, { handle }) => (
          <LinkRow
            to={`${HABITS_PATH}/${habit.id}`}
            label={`${habit.icon} ${habit.name}`}
            hint={habitHint(habit)}
            handle={handle}
            action={<DeleteRowButton name={habit.name} onClick={() => setDeleting(habit)} />}
          />
        )}
      />
      {habits && (
        <Link to={`${HABITS_PATH}/new`} className={`${primaryButton} mt-2 mb-4`}>
          + Neue Gewohnheit
        </Link>
      )}
      {archived.length > 0 && (
        <section className="mb-4">
          <button
            type="button"
            aria-expanded={showArchive}
            className="flex min-h-11 w-full items-center gap-2 text-left font-semibold"
            onClick={() => setShowArchive(!showArchive)}
          >
            <span aria-hidden="true">{showArchive ? '▾' : '▸'}</span>
            Archiv ({archived.length})
          </button>
          {showArchive && (
            <ul aria-label="Archiv">
              {archived.map((habit) => (
                <li key={habit.id}>
                  <LinkRow
                    to={`${HABITS_PATH}/${habit.id}`}
                    label={`${habit.icon} ${habit.name}`}
                    hint="Archiviert"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {deleting && (
        <ConfirmDialog
          title={`„${deleting.name}“ löschen?`}
          confirmLabel="Löschen"
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteHabit(deleting.id);
            setDeleting(null);
          }}
        >
          Die Gewohnheit wird mit allen Einträgen entfernt. Zum Aufheben lieber archivieren.
        </ConfirmDialog>
      )}
    </Page>
  );
}
