import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import { dangerButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Card, Page } from '../../components/Page';
import {
  deleteHabit,
  pauseHabit,
  resumeHabit,
  setHabitArchived,
  type HabitWithChecks,
} from '../../db/habits';
import { dayKey } from '../../domain/daily';
import {
  amountInWeek,
  formatHabitAmount,
  formatHabitFrequency,
  formatHabitTarget,
  formatStreak,
  habitStreak,
  HABIT_GROUP_LABELS,
  HABIT_KIND_LABELS,
  isPaused,
  quitStreak,
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

function statTiles({ habit, entries, dates }: HabitWithChecks, today: string) {
  if (habit.kind === 'quit') {
    const { current, best } = quitStreak(habit, entries, today);
    return [
      {
        label: habit.target === 0 ? 'Frei seit' : 'Im Limit seit',
        value: formatStreak(current, 'days'),
      },
      { label: 'Bestwert', value: formatStreak(best, 'days') },
      { label: 'Diese Woche', value: formatHabitAmount(amountInWeek(entries, today), habit.unit) },
    ];
  }
  const { current, best, unit } = habitStreak(habit, dates, today);
  return [
    { label: 'Aktuell', value: formatStreak(current, unit) },
    { label: 'Bestwert', value: formatStreak(best, unit) },
    { label: 'Gesamt', value: `${dates.length}×` },
  ];
}

function HabitDetail({ item, backTo }: { item: HabitWithChecks; backTo: string }) {
  const { habit } = item;
  const navigate = useNavigate();
  const today = dayKey(useNow(true, 60_000));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const paused = isPaused(habit);
  const archived = habit.archivedAt !== null;
  const info = [
    HABIT_KIND_LABELS[habit.kind],
    formatHabitTarget(habit),
    HABIT_GROUP_LABELS[habit.group],
    habit.kind === 'quit' ? null : formatHabitFrequency(habit),
  ].filter(Boolean);

  return (
    <Page title={`${habit.icon} ${habit.name}`} backTo={backTo}>
      {(paused || archived) && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {archived
            ? 'Archiviert: erscheint nicht mehr in Liste und Checkliste.'
            : 'Pausiert: erscheint nicht in der Checkliste, die Serie läuft danach weiter.'}
        </p>
      )}
      <Card>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">{info.join(' · ')}</p>
        {habit.kind === 'items' && (
          <ul className="mb-3 text-sm">
            {habit.items.map((sub) => (
              <li key={sub.id}>
                {sub.name}: {formatHabitAmount(sub.target, sub.unit)}
              </li>
            ))}
          </ul>
        )}
        <dl data-testid="habit-stats" className="grid grid-cols-3 gap-2 text-center">
          {statTiles(item, today).map(({ label, value }) => (
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
        {!archived && (
          <button
            type="button"
            className={secondaryButton}
            onClick={() => void (paused ? resumeHabit(habit.id) : pauseHabit(habit.id))}
          >
            {paused ? 'Fortsetzen' : 'Pausieren'}
          </button>
        )}
        <button
          type="button"
          className={secondaryButton}
          onClick={() => void setHabitArchived(habit.id, !archived)}
        >
          {archived ? 'Wiederherstellen' : 'Archivieren'}
        </button>
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
          Die Gewohnheit wird mit allen Einträgen entfernt. Zum Aufheben lieber archivieren.
        </ConfirmDialog>
      )}
    </Page>
  );
}
