import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import { dangerButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Card, Page } from '../../components/Page';
import { deleteHabit, type HabitWithChecks } from '../../db/habits';
import { dayKey } from '../../domain/daily';
import {
  formatHabitFrequency,
  formatStreak,
  habitStreak,
  HABIT_GROUP_LABELS,
} from '../../domain/habits';
import { useNow } from '../training/useWorkouts';
import { HabitCalendar } from './HabitCalendar';
import { HABITS_PATH, useHabit } from './useHabits';

export function HabitDetailPage() {
  const { id } = useParams();
  const item = useHabit(id);
  const backTo = useBackTo(HABITS_PATH);

  if (item === undefined) {
    return (
      <Page title="Gewohnheit" backTo={backTo}>
        {null}
      </Page>
    );
  }
  if (item === null) {
    return (
      <Page title="Gewohnheit" backTo={backTo}>
        <Card>
          <p className="text-slate-600 dark:text-slate-400">
            Diese Gewohnheit existiert nicht mehr.
          </p>
        </Card>
      </Page>
    );
  }
  return <HabitDetail item={item} backTo={backTo} />;
}

function HabitDetail({ item, backTo }: { item: HabitWithChecks; backTo: string }) {
  const { habit, dates } = item;
  const navigate = useNavigate();
  const today = dayKey(useNow(true, 60_000));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { current, best, unit } = habitStreak(habit, dates, today);
  const tiles = [
    { label: 'Aktuell', value: formatStreak(current, unit) },
    { label: 'Bestwert', value: formatStreak(best, unit) },
    { label: 'Gesamt', value: `${dates.length}×` },
  ];

  return (
    <Page title={`${habit.icon} ${habit.name}`} backTo={backTo}>
      <Card>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          {HABIT_GROUP_LABELS[habit.group]} · {formatHabitFrequency(habit)}
        </p>
        <dl data-testid="habit-stats" className="grid grid-cols-3 gap-2 text-center">
          {tiles.map(({ label, value }) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="text-xl font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Kalender">
        <HabitCalendar item={item} today={today} />
      </Card>

      <div className="mb-4 flex flex-col gap-2">
        <Link to={`${HABITS_PATH}/${habit.id}/edit`} className={secondaryButton}>
          Bearbeiten
        </Link>
        <button type="button" className={dangerButton} onClick={() => setConfirmDelete(true)}>
          Gewohnheit löschen
        </button>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`„${habit.name}“ löschen?`}
          confirmLabel="Löschen"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteHabit(habit.id);
            navigate(HABITS_PATH, { replace: true });
          }}
        >
          Die Gewohnheit wird mit allen erledigten Tagen entfernt.
        </ConfirmDialog>
      )}
    </Page>
  );
}
