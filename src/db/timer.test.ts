import { loadGoalData } from './goals';
import { createHabit, loadHabit, setHabitArchived } from './habits';
import { EMPTY_HABIT_INPUT, TIMER_PRESET_DEFAULTS } from './schemas';
import { getSettings } from './settings';
import { resetDatabase } from './testUtils';
import {
  addTimerSession,
  cancelTimer,
  deleteTimerSession,
  finishTimer,
  listTimerSessions,
  pauseTimer,
  resumeTimer,
  setTimerHabit,
  setTimerSessionNote,
  skipTimerBreak,
  startTimer,
} from './timer';

beforeEach(resetDatabase);

const START = new Date('2026-11-07T09:00:00');
const at = (minutes: number) => new Date(START.getTime() + minutes * 60_000);
const PRESETS = { ...TIMER_PRESET_DEFAULTS, focusMinutes: 20, breakMinutes: 5, rounds: 2 };

describe('laufender Timer', () => {
  it('startet, merkt sich die Einstellungen und startet keinen zweiten', async () => {
    const timer = await startTimer('focus', PRESETS, START);
    expect(timer.phases).toHaveLength(3);
    const settings = await getSettings();
    expect(settings?.activeTimer).toEqual(timer);
    expect(settings?.timerPresets).toEqual(PRESETS);
    expect(await startTimer('meditation', PRESETS, at(1))).toEqual(timer);
    await expect(startTimer('focus', { ...PRESETS, rounds: 0 })).rejects.toThrow();
  });

  it('hält an, läuft weiter, überspringt die Pause und speichert nur Fokuszeit', async () => {
    const timer = await startTimer('focus', PRESETS, START);
    await pauseTimer(at(10));
    await resumeTimer(at(15));
    await skipTimerBreak(at(26));
    expect((await getSettings())?.activeTimer).toMatchObject({
      pausedAt: null,
      pausedSeconds: 300,
      skippedSeconds: 240,
    });
    const session = await finishTimer(timer.startedAt, at(35));
    // 20 min erste Runde + 9 min der zweiten (Ende 35 − 5 Pause − 21 bisher)
    expect(session).toMatchObject({
      kind: 'focus',
      date: '2026-11-07',
      startedAt: START.toISOString(),
      durationSeconds: 29 * 60,
      rounds: 1,
      note: '',
      habitId: null,
    });
    expect((await getSettings())?.activeTimer).toBeNull();
    // Zweites Beenden (anderes Fenster) speichert nicht doppelt
    expect(await finishTimer(timer.startedAt, at(36))).toBeNull();
    expect(await listTimerSessions()).toHaveLength(1);
  });

  it('verwirft ohne Sitzung', async () => {
    await startTimer('meditation', PRESETS, START);
    await cancelTimer();
    expect((await getSettings())?.activeTimer).toBeNull();
    expect(await listTimerSessions()).toHaveLength(0);
  });
});

describe('Gewohnheiten und Sitzungen', () => {
  it('zählt Minuten bei einer Zähl-Gewohnheit und zieht sie beim Löschen ab', async () => {
    const habit = await createHabit({
      ...EMPTY_HABIT_INPUT,
      name: 'Fokus',
      kind: 'count',
      target: 60,
      unit: 'min',
    });
    await setTimerHabit('focus', habit.id);
    const timer = await startTimer('focus', PRESETS, START);
    const session = await finishTimer(timer.startedAt, at(60));
    expect(session).toMatchObject({ habitId: habit.id, habitAmount: 40, rounds: 2 });
    await addTimerSession({ kind: 'focus', date: '2026-11-07', durationSeconds: 900, note: '' });
    expect((await loadHabit(habit.id))?.entries).toMatchObject([
      { date: '2026-11-07', amount: 55 },
    ]);

    await deleteTimerSession(session!.id);
    expect((await loadHabit(habit.id))?.entries).toMatchObject([{ amount: 15 }]);

    // Meditation ist nicht verknüpft, archivierte Gewohnheiten zählen nicht
    await addTimerSession({
      kind: 'meditation',
      date: '2026-11-07',
      durationSeconds: 600,
      note: '',
    });
    await setHabitArchived(habit.id, true);
    const later = await addTimerSession({
      kind: 'focus',
      date: '2026-11-07',
      durationSeconds: 600,
      note: '',
    });
    expect(later.habitId).toBeNull();
    expect((await loadHabit(habit.id))?.entries).toMatchObject([{ amount: 15 }]);
  });

  it('hakt eine Abhak-Gewohnheit ab und erst mit der letzten Sitzung wieder ab', async () => {
    const habit = await createHabit({ ...EMPTY_HABIT_INPUT, name: 'Meditieren' });
    await setTimerHabit('meditation', habit.id);
    const input = {
      kind: 'meditation' as const,
      date: '2026-11-06',
      durationSeconds: 600,
      note: '',
    };
    const first = await addTimerSession(input);
    const second = await addTimerSession(input);
    expect(first).toMatchObject({ habitId: habit.id, habitAmount: 1 });
    expect((await loadHabit(habit.id))?.entries).toMatchObject([{ date: '2026-11-06', amount: 1 }]);

    await deleteTimerSession(first.id);
    expect((await loadHabit(habit.id))?.entries).toHaveLength(1);
    await deleteTimerSession(second.id);
    expect((await loadHabit(habit.id))?.entries).toHaveLength(0);
  });

  it('prüft Nachtragen und Notiz, liefert Sitzungen für Ziele', async () => {
    await expect(
      addTimerSession({ kind: 'focus', date: '2026-11-07', durationSeconds: 30, note: '' }),
    ).rejects.toThrow();
    const session = await addTimerSession({
      kind: 'focus',
      date: '2026-11-07',
      durationSeconds: 1800,
      note: '',
    });
    await setTimerSessionNote(session.id, '  ruhig  ');
    expect((await listTimerSessions())[0]).toMatchObject({ note: 'ruhig', startedAt: null });
    expect((await loadGoalData()).timerSessions).toMatchObject([
      { kind: 'focus', durationSeconds: 1800 },
    ]);
  });
});
