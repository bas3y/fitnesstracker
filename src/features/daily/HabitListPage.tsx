import { useState } from 'react';
import { Link } from 'react-router-dom';
import { primaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { LinkRow, Page } from '../../components/Page';
import { SortableList } from '../../components/SortableList';
import { deleteHabit, reorderHabits } from '../../db/habits';
import type { Habit } from '../../db/types';
import { formatHabitFrequency, HABIT_GROUP_LABELS } from '../../domain/habits';
import { HABITS_PATH, useHabits } from './useHabits';

export function HabitListPage() {
  const habits = useHabits();
  const [deleting, setDeleting] = useState<Habit | null>(null);

  return (
    <Page title="Gewohnheiten" backTo="/daily">
      {habits?.length === 0 && (
        <p className="mb-4 text-slate-600 dark:text-slate-400">
          Noch keine Gewohnheiten. Lege die erste an, sie erscheint dann auf der Alltag-Seite.
        </p>
      )}
      <SortableList
        label="Gewohnheiten"
        items={(habits ?? []).map(({ habit }) => habit)}
        onReorder={reorderHabits}
        renderItem={(habit, { handle }) => (
          <LinkRow
            to={`${HABITS_PATH}/${habit.id}`}
            label={`${habit.icon} ${habit.name}`}
            hint={`${HABIT_GROUP_LABELS[habit.group]} · ${formatHabitFrequency(habit)}`}
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
          Die Gewohnheit wird mit allen erledigten Tagen entfernt.
        </ConfirmDialog>
      )}
    </Page>
  );
}
