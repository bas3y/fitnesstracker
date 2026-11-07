import {
  newTimer,
  pausedTimer,
  resumedTimer,
  skippedBreak,
  timerMinutes,
  timerResult,
} from '../domain/timer';
import { db } from './database';
import { addHabitAmount, setHabitChecked } from './habits';
import { create, listActive, softDelete, update } from './repository';
import {
  timerNoteSchema,
  timerPresetsSchema,
  timerSessionInputSchema,
  type TimerSessionInput,
} from './schemas';
import { ensureSettings, SETTINGS_ID, updateSettings } from './settings';
import type {
  ActiveTimer,
  BaseEntity,
  DayKey,
  Habit,
  TimerKind,
  TimerPresets,
  TimerSession,
} from './types';

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;

const TIMER_TABLES = [db.settings, db.timerSessions, db.habits, db.habitChecks];

export function listTimerSessions(): Promise<TimerSession[]> {
  return listActive(db.timerSessions);
}

/** Gewohnheiten, mit denen sich ein Timer verknüpfen lässt */
export function canLinkTimerHabit(habit: Pick<Habit, 'kind' | 'archivedAt'>): boolean {
  return (habit.kind === 'count' || habit.kind === 'check') && habit.archivedAt === null;
}

export function setTimerHabit(kind: TimerKind, habitId: string | null): Promise<void> {
  return updateSettings(
    kind === 'focus' ? { focusHabitId: habitId } : { meditationHabitId: habitId },
  );
}

async function linkedHabit(kind: TimerKind): Promise<Habit | null> {
  const settings = await ensureSettings();
  const id = kind === 'focus' ? settings.focusHabitId : settings.meditationHabitId;
  if (!id) return null;
  const habit = await db.habits.get(id);
  return habit && isActive(habit) && canLinkTimerHabit(habit) ? habit : null;
}

/** Zählt bei der verknüpften Gewohnheit mit: Zählen = Minuten, Abhaken = erledigt */
async function countForHabit(
  kind: TimerKind,
  date: DayKey,
  seconds: number,
): Promise<Pick<TimerSession, 'habitId' | 'habitAmount'>> {
  const habit = await linkedHabit(kind);
  if (!habit) return { habitId: null, habitAmount: 0 };
  if (habit.kind === 'check') {
    await setHabitChecked(habit.id, date, true);
    return { habitId: habit.id, habitAmount: 1 };
  }
  const minutes = timerMinutes(seconds);
  if (minutes > 0) await addHabitAmount(habit.id, date, minutes);
  return { habitId: habit.id, habitAmount: minutes };
}

async function saveSession(
  values: Omit<TimerSession, keyof BaseEntity | 'habitId' | 'habitAmount'>,
): Promise<TimerSession> {
  const habit = await countForHabit(values.kind, values.date, values.durationSeconds);
  return create<TimerSession>(db.timerSessions, { ...values, ...habit });
}

// ---------- Laufender Timer ----------

async function changeTimer(change: (timer: ActiveTimer) => ActiveTimer): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const timer = (await ensureSettings()).activeTimer;
    if (timer) await update(db.settings, SETTINGS_ID, { activeTimer: change(timer) });
  });
}

/** Startet einen Timer und merkt sich die Einstellungen; läuft schon einer, bleibt er */
export async function startTimer(
  kind: TimerKind,
  presets: TimerPresets,
  now = new Date(),
): Promise<ActiveTimer> {
  const values = timerPresetsSchema.parse(presets);
  return db.transaction('rw', db.settings, async () => {
    const settings = await ensureSettings();
    if (settings.activeTimer) return settings.activeTimer;
    const timer = newTimer(kind, values, now);
    await update(db.settings, SETTINGS_ID, { activeTimer: timer, timerPresets: values });
    return timer;
  });
}

export function pauseTimer(now = new Date()): Promise<void> {
  return changeTimer((timer) => pausedTimer(timer, now));
}

export function resumeTimer(now = new Date()): Promise<void> {
  return changeTimer((timer) => resumedTimer(timer, now));
}

export function skipTimerBreak(now = new Date()): Promise<void> {
  return changeTimer((timer) => skippedBreak(timer, now));
}

/** Verwirft den laufenden Timer ohne Sitzung */
export function cancelTimer(): Promise<void> {
  return updateSettings({ activeTimer: null });
}

/**
 * Beendet den Timer, der um `startedAt` begann (schützt vor doppeltem Speichern aus zwei
 * Fenstern), und speichert die Sitzung. `null` = kein solcher Timer oder keine Zeit gezählt.
 */
export function finishTimer(startedAt: string, now = new Date()): Promise<TimerSession | null> {
  return db.transaction('rw', TIMER_TABLES, async () => {
    const timer = (await ensureSettings()).activeTimer;
    if (!timer || timer.startedAt !== startedAt) return null;
    await update(db.settings, SETTINGS_ID, { activeTimer: null });
    const result = timerResult(timer, now);
    if (result.durationSeconds < 1) return null;
    return saveSession({ ...result, note: '' });
  });
}

// ---------- Sitzungen ----------

/** Nachtragen (z. B. ohne App meditiert) */
export async function addTimerSession(input: TimerSessionInput): Promise<TimerSession> {
  const values = timerSessionInputSchema.parse(input);
  return db.transaction('rw', TIMER_TABLES, () =>
    saveSession({
      ...values,
      startedAt: null,
      rounds: null,
    }),
  );
}

export async function setTimerSessionNote(id: string, note: string): Promise<void> {
  await update(db.timerSessions, id, { note: timerNoteSchema.parse(note) });
}

/** Löscht weich und nimmt den Beitrag bei der Gewohnheit zurück */
export function deleteTimerSession(id: string): Promise<void> {
  return db.transaction('rw', TIMER_TABLES, async () => {
    const session = await db.timerSessions.get(id);
    if (!session || !isActive(session)) return;
    await softDelete(db.timerSessions, id);
    if (!session.habitId || session.habitAmount <= 0) return;
    const habit = await db.habits.get(session.habitId);
    if (!habit || !isActive(habit)) return;
    if (habit.kind === 'check') {
      const others = await db.timerSessions
        .where('date')
        .equals(session.date)
        .filter((other) => isActive(other) && other.habitId === habit.id)
        .count();
      if (others === 0) await setHabitChecked(habit.id, session.date, false);
    } else {
      await addHabitAmount(habit.id, session.date, -session.habitAmount);
    }
  });
}
