import type {
  ActiveTimer,
  DayKey,
  TimerKind,
  TimerPhase,
  TimerPresets,
  TimerSession,
} from '../db/types';
import { dayKey } from './daily';
import type { DayRange } from './endurance';
import { formatWorkoutDuration } from './workout';

/** Fokus: Runden mit Pausen dazwischen (keine nach der letzten); Meditation: eine Phase */
export function timerPhases(kind: TimerKind, presets: TimerPresets): TimerPhase[] {
  if (kind === 'meditation')
    return [{ type: 'meditation', seconds: presets.meditationMinutes * 60 }];
  const phases: TimerPhase[] = [];
  for (let round = 1; round <= presets.rounds; round++) {
    phases.push({ type: 'focus', seconds: presets.focusMinutes * 60 });
    if (round < presets.rounds) phases.push({ type: 'break', seconds: presets.breakMinutes * 60 });
  }
  return phases;
}

export function newTimer(kind: TimerKind, presets: TimerPresets, now: Date): ActiveTimer {
  return {
    kind,
    startedAt: now.toISOString(),
    phases: timerPhases(kind, presets),
    pausedAt: null,
    pausedSeconds: 0,
    skippedSeconds: 0,
  };
}

export interface TimerState {
  phase: TimerPhase;
  phaseIndex: number;
  /** Restzeit der Phase in Sekunden (0 = fertig) */
  phaseRemaining: number;
  /** 1-basiert; Pause zählt zur vorherigen Runde */
  round: number;
  rounds: number;
  paused: boolean;
  finished: boolean;
  /** Fokus- bzw. Meditationszeit bisher (ohne Pausen) */
  activeSeconds: number;
  /** Abgeschlossene Fokus-Runden */
  completedRounds: number;
  /** Ende der laufenden Phase (ms), `null` = angehalten oder fertig */
  phaseEndsAt: number | null;
  /** Ende des ganzen Timers, wenn er ohne Unterbrechung weiterläuft (ms) */
  endsAt: number | null;
}

const totalSeconds = (timer: Pick<ActiveTimer, 'phases'>) =>
  timer.phases.reduce((sum, phase) => sum + phase.seconds, 0);

/** Vergangene Timer-Zeit in Sekunden (ohne Unterbrechungen, mit übersprungenen Pausen) */
export function timerElapsed(timer: ActiveTimer, now: Date): number {
  const until = timer.pausedAt ? Date.parse(timer.pausedAt) : now.getTime();
  const raw = Math.max(0, (until - Date.parse(timer.startedAt)) / 1000);
  return Math.min(
    totalSeconds(timer),
    Math.max(0, raw - timer.pausedSeconds + timer.skippedSeconds),
  );
}

export function timerState(timer: ActiveTimer, now: Date): TimerState {
  const elapsed = timerElapsed(timer, now);
  const total = totalSeconds(timer);
  const finished = elapsed >= total;
  let rest = elapsed;
  let phaseIndex = timer.phases.length - 1;
  let phaseElapsed = timer.phases[phaseIndex]!.seconds;
  let activeSeconds = 0;
  let completedRounds = 0;
  for (const [index, phase] of timer.phases.entries()) {
    const used = Math.min(rest, phase.seconds);
    if (phase.type !== 'break') activeSeconds += used;
    if (phase.type === 'focus' && used >= phase.seconds) completedRounds++;
    if (rest < phase.seconds && !finished) {
      phaseIndex = index;
      phaseElapsed = rest;
      break;
    }
    rest -= phase.seconds;
  }
  const phase = timer.phases[phaseIndex]!;
  const phaseRemaining = finished ? 0 : phase.seconds - phaseElapsed;
  const running = !finished && timer.pausedAt === null;
  const nowMs = now.getTime();
  return {
    phase,
    phaseIndex,
    phaseRemaining,
    round:
      timer.phases.slice(0, phaseIndex + 1).filter((item) => item.type === 'focus').length || 1,
    rounds: timer.phases.filter((item) => item.type === 'focus').length || 1,
    paused: timer.pausedAt !== null,
    finished,
    activeSeconds,
    completedRounds,
    phaseEndsAt: running ? nowMs + phaseRemaining * 1000 : null,
    endsAt: running ? nowMs + (total - elapsed) * 1000 : null,
  };
}

export function pausedTimer(timer: ActiveTimer, now: Date): ActiveTimer {
  return timer.pausedAt ? timer : { ...timer, pausedAt: now.toISOString() };
}

export function resumedTimer(timer: ActiveTimer, now: Date): ActiveTimer {
  if (!timer.pausedAt) return timer;
  const pause = Math.max(0, (now.getTime() - Date.parse(timer.pausedAt)) / 1000);
  return { ...timer, pausedAt: null, pausedSeconds: timer.pausedSeconds + pause };
}

/** Nur eine laufende Pause lässt sich überspringen (Fokuszeit bleibt so genau) */
export function skippedBreak(timer: ActiveTimer, now: Date): ActiveTimer {
  const state = timerState(timer, now);
  if (state.finished || state.phase.type !== 'break') return timer;
  return { ...timer, skippedSeconds: timer.skippedSeconds + state.phaseRemaining };
}

export interface TimerResult {
  kind: TimerKind;
  date: DayKey;
  startedAt: string;
  durationSeconds: number;
  rounds: number | null;
}

export function timerResult(timer: ActiveTimer, now: Date): TimerResult {
  const state = timerState(timer, now);
  return {
    kind: timer.kind,
    date: dayKey(new Date(timer.startedAt)),
    startedAt: timer.startedAt,
    durationSeconds: Math.round(state.activeSeconds),
    rounds: timer.kind === 'focus' ? state.completedRounds : null,
  };
}

/** Menge für die verknüpfte Zähl-Gewohnheit */
export function timerMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

type SessionTime = Pick<TimerSession, 'kind' | 'date' | 'durationSeconds'>;

export function timerSecondsInRange(
  sessions: readonly SessionTime[],
  range: DayRange,
  kind?: TimerKind,
): number {
  return sessions
    .filter(
      (session) =>
        (!kind || session.kind === kind) && session.date >= range.from && session.date <= range.to,
    )
    .reduce((sum, session) => sum + session.durationSeconds, 0);
}

export function timerSecondsOn(
  sessions: readonly SessionTime[],
  date: DayKey,
  kind?: TimerKind,
): number {
  return timerSecondsInRange(sessions, { from: date, to: date }, kind);
}

/** „25 min“, „1 h 05 min“ */
export function formatTimerDuration(seconds: number): string {
  return formatWorkoutDuration(seconds);
}

/** Neueste zuerst */
export function sortSessions<T extends Pick<TimerSession, 'date' | 'startedAt' | 'createdAt'>>(
  sessions: readonly T[],
): T[] {
  return [...sessions].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.startedAt ?? b.createdAt).localeCompare(a.startedAt ?? a.createdAt),
  );
}
