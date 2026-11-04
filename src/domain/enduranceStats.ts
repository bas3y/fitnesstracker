import type {
  DayKey,
  DistanceUnit,
  EnduranceSession,
  EnduranceSport,
  HeartRateSeconds,
  Timestamp,
} from '../db/types';
import { shiftDay } from './daily';
import { PACE_KINDS, sessionDay, sessionTotals, type SessionTotals } from './endurance';
import { formatDecimal } from './format';
import { weekStart } from './habits';
import { BEST_EFFORT_METERS } from './track';
import { metersToDisplay } from './units';
import { formatClock } from './workout';

type StatsSession = Pick<
  EnduranceSession,
  | 'id'
  | 'sport'
  | 'startedAt'
  | 'durationSeconds'
  | 'distanceMeters'
  | 'elevationGainMeters'
  | 'trackSummary'
>;

// ---------- Bestzeiten ----------

export interface EffortRecord {
  sport: EnduranceSport;
  meters: number;
  seconds: number;
  sessionId: string;
  startedAt: Timestamp;
}

export function sportEfforts(sport: EnduranceSport): readonly number[] {
  return BEST_EFFORT_METERS[sport] ?? [];
}

export const EFFORT_SPORTS = Object.keys(BEST_EFFORT_METERS) as EnduranceSport[];

/** Zeiten einer Strecke aus allen Einheiten mit Verlauf */
function effortsAt(sessions: readonly StatsSession[], sport: EnduranceSport, meters: number) {
  return sessions.flatMap((session) => {
    if (session.sport !== sport) return [];
    const effort = session.trackSummary?.bestEfforts.find((item) => item.meters === meters);
    return effort
      ? [
          {
            sport,
            meters,
            seconds: effort.seconds,
            sessionId: session.id,
            startedAt: session.startedAt,
          },
        ]
      : [];
  });
}

/** Schnellere zuerst, bei Gleichstand die frühere */
const byTime = (a: EffortRecord, b: EffortRecord) =>
  a.seconds - b.seconds || a.startedAt.localeCompare(b.startedAt);

/** Bestzeit je Strecke der Sportart (Strecken ohne Zeit fehlen) */
export function bestEffortsOf(
  sessions: readonly StatsSession[],
  sport: EnduranceSport,
): EffortRecord[] {
  return sportEfforts(sport).flatMap((meters) => {
    const best = effortsAt(sessions, sport, meters).sort(byTime)[0];
    return best ? [best] : [];
  });
}

/**
 * Bestzeiten der neuen Einheiten, die alle übrigen schlagen.
 * Ohne frühere Zeit über die Strecke gibt es keinen Rekord (wie beim Krafttraining).
 */
export function newEffortRecords(
  sessions: readonly StatsSession[],
  newIds: readonly string[],
): EffortRecord[] {
  const isNew = (id: string) => newIds.includes(id);
  return EFFORT_SPORTS.flatMap((sport) =>
    sportEfforts(sport).flatMap((meters) => {
      const all = effortsAt(sessions, sport, meters);
      const best = all.filter((effort) => isNew(effort.sessionId)).sort(byTime)[0];
      const previous = all.filter((effort) => !isNew(effort.sessionId)).sort(byTime)[0];
      return best && previous && best.seconds < previous.seconds ? [best] : [];
    }),
  );
}

export interface SessionEffort {
  meters: number;
  seconds: number;
  /** Schnellste Zeit über alle Einheiten (und es gibt eine andere zum Vergleich) */
  isBest: boolean;
}

export function sessionEfforts(
  session: StatsSession,
  sessions: readonly StatsSession[],
): SessionEffort[] {
  return (session.trackSummary?.bestEfforts ?? []).map(({ meters, seconds }) => {
    const others = effortsAt(sessions, session.sport, meters).filter(
      (effort) => effort.sessionId !== session.id,
    );
    return {
      meters,
      seconds,
      isBest: others.length > 0 && others.every((effort) => seconds <= effort.seconds),
    };
  });
}

const EFFORT_NAMES: Record<number, string> = { 21_097.5: 'Halbmarathon', 42_195: 'Marathon' };

/** z. B. „5 km“, „Halbmarathon“ (Wettkampfstrecken bleiben auch bei Meilen in km) */
export function formatEffortDistance(meters: number): string {
  return EFFORT_NAMES[meters] ?? `${formatDecimal(meters / 1000, 0)} km`;
}

// ---------- Zeiträume ----------

export interface PeriodTotals extends SessionTotals {
  elevationGainMeters: number;
}

export function periodTotals(sessions: readonly StatsSession[]): PeriodTotals {
  return {
    ...sessionTotals(sessions),
    elevationGainMeters: sessions.reduce(
      (sum, session) => sum + (session.elevationGainMeters ?? 0),
      0,
    ),
  };
}

export interface WeekTotals extends SessionTotals {
  weekStart: DayKey;
}

/** Je Kalenderwoche ab `from` (sonst ab der ersten Einheit) bis zur laufenden Woche */
export function weeklyTotals(
  sessions: readonly StatsSession[],
  from: DayKey | null,
  today: DayKey,
): WeekTotals[] {
  if (sessions.length === 0) return [];
  const days = sessions.map(sessionDay);
  const first = weekStart(from ?? days.reduce((min, day) => (day < min ? day : min)));
  const last = weekStart(today);
  const weeks: WeekTotals[] = [];
  for (let week = first; week <= last; week = shiftDay(week, 7)) {
    const end = shiftDay(week, 6);
    weeks.push({
      weekStart: week,
      ...sessionTotals(sessions.filter((_, i) => days[i]! >= week && days[i]! <= end)),
    });
  }
  return weeks;
}

// ---------- Pace ----------

export interface PacePoint {
  time: number;
  /** Pace: Sekunden pro km/mi bzw. 100 m; Geschwindigkeit: km/h bzw. mph */
  value: number;
}

/** Pace bzw. Geschwindigkeit je Einheit mit Strecke, älteste zuerst */
export function pacePoints(
  sessions: readonly StatsSession[],
  sport: EnduranceSport,
  unit: DistanceUnit,
): PacePoint[] {
  const kind = PACE_KINDS[sport];
  if (!kind) return [];
  return sessions
    .filter((session) => session.sport === sport && session.distanceMeters)
    .map((session) => {
      const meters = session.distanceMeters!;
      const seconds = session.durationSeconds;
      const value =
        kind === 'swim'
          ? seconds / (meters / 100)
          : kind === 'pace'
            ? seconds / metersToDisplay(meters, unit)
            : metersToDisplay(meters, unit) / (seconds / 3600);
      return { time: Date.parse(session.startedAt), value };
    })
    .sort((a, b) => a.time - b.time);
}

/** Achsen- und Tooltip-Text, z. B. „5:12 /km“ oder „28,4 km/h“ */
export function formatPaceValue(sport: EnduranceSport, value: number, unit: DistanceUnit): string {
  const kind = PACE_KINDS[sport];
  if (kind === 'swim') return `${formatClock(value)} /100 m`;
  if (kind === 'pace') return `${formatClock(value)} /${unit}`;
  return `${formatDecimal(value, 1)} ${unit === 'km' ? 'km/h' : 'mph'}`;
}

/** Bei der Pace ist weniger besser */
export function lowerIsFaster(sport: EnduranceSport): boolean {
  const kind = PACE_KINDS[sport];
  return kind === 'pace' || kind === 'swim';
}

// ---------- Puls ----------

export function sumHeartRateSeconds(sessions: readonly StatsSession[]): HeartRateSeconds {
  const total = new Map<number, number>();
  for (const session of sessions) {
    for (const [bpm, seconds] of session.trackSummary?.heartRateSeconds ?? []) {
      total.set(bpm, (total.get(bpm) ?? 0) + seconds);
    }
  }
  return [...total].sort(([a], [b]) => a - b);
}

// ---------- Trainingstage ----------

export interface EnduranceDay {
  durationSeconds: number;
  sessions: { id: string; sport: EnduranceSport }[];
}

export function enduranceDays(sessions: readonly StatsSession[]): Map<DayKey, EnduranceDay> {
  const days = new Map<DayKey, EnduranceDay>();
  for (const session of [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt))) {
    const key = sessionDay(session);
    const day = days.get(key) ?? { durationSeconds: 0, sessions: [] };
    day.durationSeconds += session.durationSeconds;
    day.sessions.push({ id: session.id, sport: session.sport });
    days.set(key, day);
  }
  return days;
}

/** Farbstufe 0–4 nach Dauer (halbe Stunden) */
export function enduranceHeatLevel(seconds: number): 0 | 1 | 2 | 3 | 4 {
  if (seconds <= 0) return 0;
  return Math.min(4, Math.ceil(seconds / 1800)) as 1 | 2 | 3 | 4;
}

/** Laufende Woche je Sportart (nur Sportarten mit Einheiten), meiste Zeit zuerst */
export function weekBySport(
  sessions: readonly StatsSession[],
  today: DayKey,
): { sport: EnduranceSport; totals: SessionTotals }[] {
  const from = weekStart(today);
  const to = shiftDay(from, 6);
  const inWeek = sessions.filter((session) => {
    const day = sessionDay(session);
    return day >= from && day <= to;
  });
  const sports = [...new Set(inWeek.map((session) => session.sport))];
  return sports
    .map((sport) => ({
      sport,
      totals: sessionTotals(inWeek.filter((session) => session.sport === sport)),
    }))
    .sort((a, b) => b.totals.durationSeconds - a.totals.durationSeconds);
}
