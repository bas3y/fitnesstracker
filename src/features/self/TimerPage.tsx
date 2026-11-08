import { useId, useState, type ReactNode } from 'react';
import { primaryButton, secondaryButton, dangerButton, inputField } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Card, Page } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { Stepper } from '../../components/Stepper';
import { MAX_TIMER_NOTE } from '../../db/schemas';
import {
  addTimerSession,
  cancelTimer,
  canLinkTimerHabit,
  deleteTimerSession,
  finishTimer,
  pauseTimer,
  resumeTimer,
  setTimerHabit,
  setTimerSessionNote,
  skipTimerBreak,
  startTimer,
} from '../../db/timer';
import type {
  ActiveTimer,
  DayKey,
  Settings,
  TimerKind,
  TimerPresets,
  TimerSession,
} from '../../db/types';
import { formatDayLabel } from '../../domain/daily';
import { weekRange } from '../../domain/endurance';
import { TIMER_KIND_LABELS, TIMER_PHASE_LABELS } from '../../domain/labels';
import {
  formatTimerDuration,
  sortSessions,
  timerSecondsInRange,
  timerSecondsOn,
  timerState,
} from '../../domain/timer';
import { formatClock, formatTime } from '../../domain/workout';
import { useDayBackTo, useDayParam } from '../daily/useDaily';
import { useHabits } from '../daily/useHabits';
import { useSettings } from '../settings/useSettings';
import { playGong, primeAudio } from '../training/restAlarm';
import { useNow } from '../training/useWorkouts';
import { useTimerSessions } from './useSelf';
import { useWakeLock } from './useWakeLock';

const HINT = 'text-sm text-muted';
const MEDITATION_CHIPS = [5, 10, 15, 20, 30];

/** Fokus-Timer (Pomodoro) und Meditation mit Gong; Sitzungen des gewählten Tages */
export function TimerPage() {
  const { date, today } = useDayParam();
  const backTo = useDayBackTo(date, today);
  const settings = useSettings();
  const sessions = useTimerSessions();
  const [adding, setAdding] = useState(false);

  return (
    <Page title="Fokus & Meditation" backTo={backTo}>
      {settings &&
        (settings.activeTimer ? (
          <RunningTimer timer={settings.activeTimer} />
        ) : (
          <TimerSetup presets={settings.timerPresets} />
        ))}

      {sessions && (
        <>
          <Summary sessions={sessions} date={date} today={today} />
          <SessionList
            sessions={sessions.filter((session) => session.date === date)}
            date={date}
            today={today}
          />
        </>
      )}
      <button type="button" className={`${secondaryButton} mb-4`} onClick={() => setAdding(true)}>
        Sitzung nachtragen
      </button>

      {settings && <HabitLinks settings={settings} />}

      {adding && <AddSessionDialog date={date} onClose={() => setAdding(false)} />}
    </Page>
  );
}

// ---------- Einstellen & Starten ----------

function TimerSetup({ presets }: { presets: TimerPresets }) {
  const [kind, setKind] = useState<TimerKind>('focus');
  const [values, setValues] = useState(presets);
  const change = (changes: Partial<TimerPresets>) => setValues({ ...values, ...changes });
  const totalMinutes =
    kind === 'focus'
      ? values.focusMinutes * values.rounds + values.breakMinutes * (values.rounds - 1)
      : values.meditationMinutes;

  const start = () => {
    primeAudio();
    if (kind === 'meditation') playGong();
    void startTimer(kind, values);
  };

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <SegmentedControl
          label="Art"
          value={kind}
          options={[
            { value: 'focus', label: `${TIMER_KIND_LABELS.focus.icon} Fokus` },
            { value: 'meditation', label: `${TIMER_KIND_LABELS.meditation.icon} Meditation` },
          ]}
          onChange={setKind}
        />
        {kind === 'focus' ? (
          <>
            <Stepper
              label="Fokuszeit"
              value={values.focusMinutes}
              unit="min"
              step={5}
              min={1}
              max={180}
              decimals={0}
              onChange={(value) => value !== null && change({ focusMinutes: value })}
            />
            <Stepper
              label="Pause"
              value={values.breakMinutes}
              unit="min"
              step={1}
              min={1}
              max={60}
              decimals={0}
              onChange={(value) => value !== null && change({ breakMinutes: value })}
            />
            <Stepper
              label="Runden"
              value={values.rounds}
              step={1}
              min={1}
              max={12}
              decimals={0}
              onChange={(value) => value !== null && change({ rounds: value })}
            />
          </>
        ) : (
          <>
            <div role="group" aria-label="Dauer wählen" className="flex flex-wrap gap-2">
              {MEDITATION_CHIPS.map((minutes) => (
                <Chip
                  key={minutes}
                  pressed={values.meditationMinutes === minutes}
                  onClick={() => change({ meditationMinutes: minutes })}
                >
                  {minutes} min
                </Chip>
              ))}
            </div>
            <Stepper
              label="Dauer"
              value={values.meditationMinutes}
              unit="min"
              step={1}
              min={1}
              max={180}
              decimals={0}
              onChange={(value) => value !== null && change({ meditationMinutes: value })}
            />
          </>
        )}
        <p className={HINT}>
          {kind === 'focus'
            ? `Insgesamt ${formatTimerDuration(totalMinutes * 60)}. Gong am Ende jeder Phase.`
            : 'Gong zu Beginn und am Ende.'}{' '}
          Klingelt nur, solange die App geöffnet ist; der Bildschirm bleibt dafür an.
        </p>
        <button type="button" className={primaryButton} onClick={start}>
          {kind === 'focus' ? 'Fokus starten' : 'Meditation starten'}
        </button>
      </div>
    </Card>
  );
}

// ---------- Laufender Timer ----------

function RunningTimer({ timer }: { timer: ActiveTimer }) {
  const now = useNow(true, 250);
  const state = timerState(timer, now);
  const [ending, setEnding] = useState(false);
  useWakeLock(!state.paused && !state.finished);

  const phaseName = TIMER_PHASE_LABELS[state.phase.type];
  const roundText =
    timer.kind === 'focus'
      ? state.phase.type === 'break'
        ? `danach Runde ${state.round + 1} von ${state.rounds}`
        : `Runde ${state.round} von ${state.rounds}`
      : null;
  const phaseDone = state.phase.seconds - state.phaseRemaining;

  return (
    <section
      aria-label="Timer läuft"
      className={`mb-4 rounded-2xl p-5 ${
        state.phase.type === 'break' ? 'bg-hero-2 text-on-hero-2' : 'bg-hero text-on-hero'
      }`}
    >
      <p className="text-sm font-medium uppercase opacity-80">
        {phaseName}
        {roundText && ` · ${roundText}`}
        {state.paused && ' · angehalten'}
      </p>
      <p
        role="timer"
        aria-label={`${phaseName} Restzeit`}
        className="my-2 text-6xl font-bold tabular-nums"
      >
        {formatClock(state.phaseRemaining)}
      </p>
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-current/25">
        <div
          className="h-full rounded-full bg-current"
          style={{ width: `${Math.min(100, (phaseDone / state.phase.seconds) * 100)}%` }}
        />
      </div>
      <p className="mb-4 text-sm opacity-90">
        {TIMER_KIND_LABELS[timer.kind].name} bisher {formatTimerDuration(state.activeSeconds)}
        {state.endsAt !== null &&
          ` · fertig um ${formatTime(new Date(state.endsAt).toISOString())}`}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {state.paused ? (
          <button
            type="button"
            className={LIGHT_BUTTON}
            onClick={() => {
              primeAudio();
              void resumeTimer();
            }}
          >
            Fortsetzen
          </button>
        ) : (
          <button type="button" className={LIGHT_BUTTON} onClick={() => void pauseTimer()}>
            Anhalten
          </button>
        )}
        {state.phase.type === 'break' && !state.paused ? (
          <button type="button" className={LIGHT_BUTTON} onClick={() => void skipTimerBreak()}>
            Pause überspringen
          </button>
        ) : (
          <button type="button" className={LIGHT_BUTTON} onClick={() => setEnding(true)}>
            Beenden
          </button>
        )}
      </div>
      {state.phase.type === 'break' && !state.paused && (
        <button
          type="button"
          className={`${LIGHT_BUTTON} mt-2 w-full`}
          onClick={() => setEnding(true)}
        >
          Beenden
        </button>
      )}
      {ending && (
        <EndDialog timer={timer} seconds={state.activeSeconds} onClose={() => setEnding(false)} />
      )}
    </section>
  );
}

const LIGHT_BUTTON =
  'flex min-h-11 items-center justify-center rounded-xl bg-current/15 px-3 font-semibold active:bg-current/25';

function EndDialog({
  timer,
  seconds,
  onClose,
}: {
  timer: ActiveTimer;
  seconds: number;
  onClose: () => void;
}) {
  const titleId = useId();
  const canSave = seconds >= 60;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4 text-fg"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-sm flex-col gap-2 rounded-2xl bg-surface p-4 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          Timer beenden?
        </h2>
        <p className={HINT}>
          {canSave
            ? `Bisher ${formatTimerDuration(seconds)} ${TIMER_KIND_LABELS[timer.kind].name}.`
            : 'Unter einer Minute – wird nicht gespeichert.'}
        </p>
        {canSave && (
          <button
            type="button"
            className={primaryButton}
            onClick={() => {
              void finishTimer(timer.startedAt);
              onClose();
            }}
          >
            {formatTimerDuration(seconds)} speichern
          </button>
        )}
        <button
          type="button"
          className={dangerButton}
          onClick={() => {
            void cancelTimer();
            onClose();
          }}
        >
          Verwerfen
        </button>
        <button type="button" className={secondaryButton} onClick={onClose}>
          Weiterlaufen lassen
        </button>
      </div>
    </div>
  );
}

// ---------- Sitzungen ----------

function Summary({
  sessions,
  date,
  today,
}: {
  sessions: TimerSession[];
  date: DayKey;
  today: DayKey;
}) {
  const week = weekRange(date);
  const cell = (label: string, seconds: number) => (
    <div>
      <dt className={HINT}>{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{formatTimerDuration(seconds)}</dd>
    </div>
  );
  const weekLabel = date === today ? 'diese Woche' : 'in der Woche';
  return (
    <Card>
      <dl className="grid grid-cols-2 gap-3">
        {cell(
          `Fokus ${formatDayLabel(date, today).toLowerCase()}`,
          timerSecondsOn(sessions, date, 'focus'),
        )}
        {cell(
          `Meditation ${formatDayLabel(date, today).toLowerCase()}`,
          timerSecondsOn(sessions, date, 'meditation'),
        )}
        {cell(`Fokus ${weekLabel}`, timerSecondsInRange(sessions, week, 'focus'))}
        {cell(`Meditation ${weekLabel}`, timerSecondsInRange(sessions, week, 'meditation'))}
      </dl>
    </Card>
  );
}

function SessionList({
  sessions,
  date,
  today,
}: {
  sessions: TimerSession[];
  date: DayKey;
  today: DayKey;
}) {
  const [editing, setEditing] = useState<TimerSession | null>(null);
  const [deleting, setDeleting] = useState<TimerSession | null>(null);
  const title = `Sitzungen ${date === today ? 'heute' : `am ${formatDayLabel(date, today)}`}`;
  return (
    <section aria-labelledby="sessions-heading" className="mb-2">
      <h2 id="sessions-heading" className="mb-2 text-lg font-semibold">
        {title}
      </h2>
      {sessions.length === 0 ? (
        <Card>
          <p className={HINT}>Noch keine Sitzung.</p>
        </Card>
      ) : (
        <ul aria-label={title} className="mb-2">
          {sortSessions(sessions).map((session) => {
            const label = TIMER_KIND_LABELS[session.kind];
            const details = [
              session.startedAt ? `ab ${formatTime(session.startedAt)}` : 'nachgetragen',
              session.rounds
                ? `${session.rounds} ${session.rounds === 1 ? 'Runde' : 'Runden'}`
                : null,
            ].filter(Boolean);
            return (
              <li
                key={session.id}
                className="mb-2 flex items-start gap-2 rounded-2xl bg-surface p-3"
              >
                <span aria-hidden="true" className="text-2xl">
                  {label.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {label.name} · {formatTimerDuration(session.durationSeconds)}
                  </p>
                  <p className={HINT}>{details.join(' · ')}</p>
                  {session.note && (
                    <p className="mt-1 text-sm whitespace-pre-wrap">{session.note}</p>
                  )}
                  <button
                    type="button"
                    className="mt-1 min-h-11 text-sm font-semibold text-primary-text"
                    aria-label={`Notiz: ${label.name} ${formatTimerDuration(session.durationSeconds)}`}
                    onClick={() => setEditing(session)}
                  >
                    {session.note ? 'Notiz ändern' : '+ Notiz'}
                  </button>
                </div>
                <DeleteRowButton
                  name={`${label.name} ${formatTimerDuration(session.durationSeconds)}`}
                  onClick={() => setDeleting(session)}
                />
              </li>
            );
          })}
        </ul>
      )}
      {editing && <NoteDialog session={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Sitzung löschen?"
          confirmLabel="Löschen"
          onConfirm={() => {
            void deleteTimerSession(deleting.id);
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        >
          {TIMER_KIND_LABELS[deleting.kind].name} · {formatTimerDuration(deleting.durationSeconds)}
          {deleting.habitId && ' – wird auch bei der Gewohnheit wieder abgezogen.'}
        </ConfirmDialog>
      )}
    </section>
  );
}

function NoteDialog({ session, onClose }: { session: TimerSession; onClose: () => void }) {
  const [note, setNote] = useState(session.note);
  const id = useId();
  return (
    <FormDialog
      title="Notiz"
      onCancel={onClose}
      onSave={async () => {
        await setTimerSessionNote(session.id, note);
        onClose();
      }}
    >
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        Wie war die Sitzung?
      </label>
      <textarea
        id={id}
        rows={4}
        maxLength={MAX_TIMER_NOTE}
        className={`${inputField} h-auto py-2`}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
    </FormDialog>
  );
}

function AddSessionDialog({ date, onClose }: { date: DayKey; onClose: () => void }) {
  const [kind, setKind] = useState<TimerKind>('meditation');
  const [minutes, setMinutes] = useState<number | null>(10);
  const [day, setDay] = useState(date);
  const [error, setError] = useState<string | null>(null);
  const dateId = useId();
  return (
    <FormDialog
      title="Sitzung nachtragen"
      onCancel={onClose}
      onSave={async () => {
        if (!minutes) {
          setError('Bitte eine Dauer eingeben');
          return;
        }
        await addTimerSession({ kind, date: day, durationSeconds: minutes * 60, note: '' });
        onClose();
      }}
    >
      <SegmentedControl
        label="Art"
        value={kind}
        options={[
          { value: 'focus', label: 'Fokus' },
          { value: 'meditation', label: 'Meditation' },
        ]}
        onChange={setKind}
      />
      <Stepper
        label="Dauer"
        value={minutes}
        unit="min"
        step={5}
        min={1}
        max={1440}
        decimals={0}
        startValue={10}
        allowEmpty
        onChange={(value) => {
          setMinutes(value);
          setError(null);
        }}
      />
      <div>
        <label htmlFor={dateId} className="mb-1 block text-sm font-medium">
          Tag
        </label>
        <input
          id={dateId}
          type="date"
          className={inputField}
          value={day}
          onChange={(event) => event.target.value && setDay(event.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </FormDialog>
  );
}

function FormDialog({
  title,
  children,
  onSave,
  onCancel,
}: {
  title: string;
  children: ReactNode;
  onSave: () => Promise<void>;
  onCancel: () => void;
}) {
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-surface p-4 shadow-lg"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel();
        }}
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          void onSave().finally(() => setBusy(false));
        }}
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {children}
        <div className="flex gap-2">
          <button type="button" className={secondaryButton} onClick={onCancel}>
            Abbrechen
          </button>
          <button type="submit" className={primaryButton} disabled={busy}>
            Speichern
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- Gewohnheiten ----------

function HabitLinks({ settings }: { settings: Settings }) {
  const habits = useHabits();
  if (!habits) return null;
  const linkable = habits.map(({ habit }) => habit).filter(canLinkTimerHabit);
  const labels = Object.fromEntries(
    linkable.map((habit) => [
      habit.id,
      `${habit.icon} ${habit.name}${habit.kind === 'count' ? ` (${habit.unit || 'Menge'})` : ''}`,
    ]),
  );
  const valid = (id: string | null) => (linkable.some((habit) => habit.id === id) ? id : null);
  return (
    <Card title="Mit Gewohnheit verknüpfen">
      {linkable.length === 0 ? (
        <p className={HINT}>
          Lege eine Gewohnheit an (z. B. „Meditieren“ zum Abhaken oder „Fokus“ zum Zählen in
          Minuten), dann zählen Sitzungen dort automatisch mit.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {(['focus', 'meditation'] as const).map((kind) => (
            <Select
              key={kind}
              label={`${TIMER_KIND_LABELS[kind].name} zählt bei`}
              value={valid(kind === 'focus' ? settings.focusHabitId : settings.meditationHabitId)}
              options={linkable.map((habit) => habit.id)}
              labels={labels}
              emptyLabel="Keiner Gewohnheit"
              onChange={(habitId) => void setTimerHabit(kind, habitId)}
            />
          ))}
          <p className={HINT}>
            Zählen: Minuten werden addiert. Abhaken: Der Tag wird abgehakt. Gelöschte Sitzungen
            werden wieder abgezogen.
          </p>
        </div>
      )}
    </Card>
  );
}
