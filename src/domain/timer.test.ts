import { describe, expect, it } from 'vitest';
import {
  newTimer,
  pausedTimer,
  resumedTimer,
  skippedBreak,
  sortSessions,
  timerElapsed,
  timerMinutes,
  timerPhases,
  timerResult,
  timerSecondsInRange,
  timerSecondsOn,
  timerState,
} from './timer';

const PRESETS = { focusMinutes: 25, breakMinutes: 5, rounds: 3, meditationMinutes: 10 };
const START = new Date('2026-11-07T09:00:00');
const at = (minutes: number, seconds = 0) =>
  new Date(START.getTime() + minutes * 60_000 + seconds * 1000);

describe('timerPhases', () => {
  it('wechselt Fokus und Pause ab, ohne Pause nach der letzten Runde', () => {
    expect(timerPhases('focus', PRESETS).map((phase) => phase.type)).toEqual([
      'focus',
      'break',
      'focus',
      'break',
      'focus',
    ]);
    expect(timerPhases('focus', { ...PRESETS, rounds: 1 })).toEqual([
      { type: 'focus', seconds: 1500 },
    ]);
  });

  it('Meditation ist eine Phase', () => {
    expect(timerPhases('meditation', PRESETS)).toEqual([{ type: 'meditation', seconds: 600 }]);
  });
});

describe('timerState', () => {
  const timer = newTimer('focus', PRESETS, START);

  it('zeigt Phase, Runde und Restzeit', () => {
    expect(timerState(timer, at(10))).toMatchObject({
      phaseIndex: 0,
      phaseRemaining: 900,
      round: 1,
      rounds: 3,
      activeSeconds: 600,
      completedRounds: 0,
      finished: false,
      paused: false,
      phaseEndsAt: at(25).getTime(),
      endsAt: at(85).getTime(),
    });
    const inBreak = timerState(timer, at(27));
    expect(inBreak.phase.type).toBe('break');
    expect(inBreak).toMatchObject({ round: 1, phaseRemaining: 180, activeSeconds: 1500 });
    expect(inBreak.completedRounds).toBe(1);
    expect(timerState(timer, at(31))).toMatchObject({ round: 2, phaseRemaining: 1440 });
  });

  it('ist am Ende fertig und zählt nur die Fokuszeit', () => {
    const state = timerState(timer, at(200));
    expect(state).toMatchObject({
      finished: true,
      phaseIndex: 4,
      phaseRemaining: 0,
      activeSeconds: 3 * 1500,
      completedRounds: 3,
      phaseEndsAt: null,
    });
    expect(timerElapsed(timer, at(200))).toBe(85 * 60);
  });

  it('hält an und läuft danach mit der Restzeit weiter', () => {
    const paused = pausedTimer(timer, at(10));
    expect(timerState(paused, at(40))).toMatchObject({
      paused: true,
      phaseRemaining: 900,
      phaseEndsAt: null,
    });
    expect(pausedTimer(paused, at(20))).toBe(paused);
    const resumed = resumedTimer(paused, at(40));
    expect(resumed.pausedSeconds).toBe(1800);
    expect(timerState(resumed, at(45))).toMatchObject({ paused: false, phaseRemaining: 600 });
    expect(resumedTimer(resumed, at(50))).toBe(resumed);
  });

  it('überspringt nur eine Pause, die Fokuszeit bleibt genau', () => {
    expect(skippedBreak(timer, at(10))).toBe(timer);
    const skipped = skippedBreak(timer, at(27));
    expect(skipped.skippedSeconds).toBe(180);
    expect(timerState(skipped, at(27))).toMatchObject({
      round: 2,
      phaseIndex: 2,
      phaseRemaining: 1500,
      activeSeconds: 1500,
    });
  });
});

describe('timerResult', () => {
  it('nimmt Tag des Beginns, Fokuszeit und fertige Runden', () => {
    const timer = newTimer('focus', PRESETS, START);
    expect(timerResult(timer, at(40))).toEqual({
      kind: 'focus',
      date: '2026-11-07',
      startedAt: START.toISOString(),
      durationSeconds: 1500 + 600,
      rounds: 1,
    });
  });

  it('Meditation ohne Runden, höchstens die geplante Dauer', () => {
    const timer = newTimer('meditation', PRESETS, START);
    expect(timerResult(timer, at(4, 30))).toMatchObject({ durationSeconds: 270, rounds: null });
    expect(timerResult(timer, at(60))).toMatchObject({ durationSeconds: 600 });
  });
});

describe('Summen', () => {
  const sessions = [
    { kind: 'focus' as const, date: '2026-11-06', durationSeconds: 1500 },
    { kind: 'focus' as const, date: '2026-11-07', durationSeconds: 3000 },
    { kind: 'meditation' as const, date: '2026-11-07', durationSeconds: 600 },
  ];

  it('summiert je Tag, Zeitraum und Art', () => {
    expect(timerSecondsOn(sessions, '2026-11-07')).toBe(3600);
    expect(timerSecondsOn(sessions, '2026-11-07', 'meditation')).toBe(600);
    expect(timerSecondsInRange(sessions, { from: '2026-11-01', to: '2026-11-07' }, 'focus')).toBe(
      4500,
    );
  });

  it('rundet Minuten für die Gewohnheit', () => {
    expect(timerMinutes(89)).toBe(1);
    expect(timerMinutes(29)).toBe(0);
    expect(timerMinutes(1500)).toBe(25);
  });

  it('sortiert neueste zuerst, Nachgetragene nach Anlage', () => {
    const sorted = sortSessions([
      { id: 'a', date: '2026-11-06', startedAt: '2026-11-06T08:00:00.000Z', createdAt: 'x' },
      { id: 'b', date: '2026-11-07', startedAt: '2026-11-07T08:00:00.000Z', createdAt: 'x' },
      { id: 'c', date: '2026-11-07', startedAt: null, createdAt: '2026-11-07T09:00:00.000Z' },
    ]);
    expect(sorted.map((session) => session.id)).toEqual(['c', 'b', 'a']);
  });
});
