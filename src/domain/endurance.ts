import { DISTANCE_SPORTS } from '../db/schemas';
import type {
  DayKey,
  DistanceUnit,
  EnduranceSession,
  EnduranceSport,
  Gear,
  Timestamp,
} from '../db/types';
import { dayKey, shiftDay } from './daily';
import { formatDecimal } from './format';
import { weekStart } from './habits';
import { ENDURANCE_SPORT_LABELS } from './labels';
import { parseDayKey } from './stats';
import { metersToDisplay } from './units';
import { formatClock, formatWorkoutDuration } from './workout';

/** `pace` = Zeit pro km/mi, `speed` = km/h bzw. mph, `swim` = Zeit pro 100 m */
export type PaceKind = 'pace' | 'speed' | 'swim';

export const PACE_KINDS: Record<EnduranceSport, PaceKind | null> = {
  run: 'pace',
  ride: 'speed',
  swim: 'swim',
  hike: 'pace',
  mobility: null,
  other: 'speed',
};

export function hasDistance(sport: EnduranceSport): boolean {
  return DISTANCE_SPORTS.includes(sport);
}

export function sessionTitle(session: Pick<EnduranceSession, 'title' | 'sport'>): string {
  return session.title || ENDURANCE_SPORT_LABELS[session.sport].name;
}

export function paceLabel(sport: EnduranceSport): string {
  return PACE_KINDS[sport] === 'speed' ? 'Geschwindigkeit' : 'Pace';
}

/** Pace bzw. Geschwindigkeit; `null` ohne Distanz oder bei Sportarten ohne Strecke */
export function formatPace(
  sport: EnduranceSport,
  distanceMeters: number | null,
  durationSeconds: number,
  unit: DistanceUnit,
): string | null {
  const kind = PACE_KINDS[sport];
  if (!kind || !distanceMeters || durationSeconds <= 0) return null;
  if (kind === 'swim') return `${formatClock(durationSeconds / (distanceMeters / 100))} /100 m`;
  const distance = metersToDisplay(distanceMeters, unit);
  if (kind === 'pace') return `${formatClock(durationSeconds / distance)} /${unit}`;
  const speed = distance / (durationSeconds / 3600);
  return `${formatDecimal(speed, 1)} ${unit === 'km' ? 'km/h' : 'mph'}`;
}

/** Schwimmen immer in Metern */
export function formatDistance(
  meters: number,
  sport: EnduranceSport,
  unit: DistanceUnit,
  decimals = 2,
): string {
  if (sport === 'swim') return `${formatDecimal(meters, 0)} m`;
  return `${formatDecimal(metersToDisplay(meters, unit), decimals)} ${unit}`;
}

export function sessionDay(session: { startedAt: Timestamp }): DayKey {
  return dayKey(new Date(session.startedAt));
}

export function sessionEnd(session: Pick<EnduranceSession, 'startedAt' | 'durationSeconds'>) {
  return new Date(Date.parse(session.startedAt) + session.durationSeconds * 1000).toISOString();
}

/** Neueste zuerst */
export function sortSessions<T extends { startedAt: Timestamp }>(sessions: readonly T[]): T[] {
  return [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export interface DayRange {
  from: DayKey;
  to: DayKey;
}

/** Kalenderwoche Mo–So */
export function weekRange(today: DayKey): DayRange {
  const from = weekStart(today);
  return { from, to: shiftDay(from, 6) };
}

export function monthRange(today: DayKey): DayRange {
  const date = parseDayKey(today);
  const from = dayKey(new Date(date.getFullYear(), date.getMonth(), 1));
  const to = dayKey(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  return { from, to };
}

export function sessionsInRange<T extends { startedAt: Timestamp }>(
  sessions: readonly T[],
  { from, to }: DayRange,
): T[] {
  return sessions.filter((session) => {
    const day = sessionDay(session);
    return day >= from && day <= to;
  });
}

export interface SessionTotals {
  count: number;
  distanceMeters: number;
  durationSeconds: number;
}

export function sessionTotals(
  sessions: readonly Pick<EnduranceSession, 'distanceMeters' | 'durationSeconds'>[],
): SessionTotals {
  return {
    count: sessions.length,
    distanceMeters: sessions.reduce((sum, session) => sum + (session.distanceMeters ?? 0), 0),
    durationSeconds: sessions.reduce((sum, session) => sum + session.durationSeconds, 0),
  };
}

/** Summe einer Sportart in der laufenden Woche */
export function sportWeekTotals(
  sessions: readonly EnduranceSession[],
  sport: EnduranceSport,
  today: DayKey,
): SessionTotals {
  return sessionTotals(
    sessionsInRange(
      sessions.filter((session) => session.sport === sport),
      weekRange(today),
    ),
  );
}

export function formatSessionCount(count: number): string {
  return count === 1 ? '1 Einheit' : `${count} Einheiten`;
}

/** Strecke, sonst Dauer – z. B. „12,4 km“ oder „1 h 30 min“ */
export function formatTotals(
  totals: SessionTotals,
  sport: EnduranceSport,
  unit: DistanceUnit,
): string {
  return hasDistance(sport) && totals.distanceMeters > 0
    ? formatDistance(totals.distanceMeters, sport, unit, 1)
    : formatWorkoutDuration(totals.durationSeconds);
}

/** Kurzinfo einer Einheit: Distanz · Dauer · Pace */
export function formatSessionSummary(session: EnduranceSession, unit: DistanceUnit): string {
  const { sport, distanceMeters, durationSeconds } = session;
  return [
    distanceMeters ? formatDistance(distanceMeters, sport, unit) : null,
    formatClock(durationSeconds),
    formatPace(sport, distanceMeters, durationSeconds, unit),
  ]
    .filter((part) => part !== null)
    .join(' · ');
}

// ---------- Dauer-Eingabe ----------

export interface DurationParts {
  hours: number;
  minutes: number;
  seconds: number;
}

export function splitDuration(totalSeconds: number): DurationParts {
  const total = Math.max(0, Math.round(totalSeconds));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function joinDuration({ hours, minutes, seconds }: DurationParts): number {
  return hours * 3600 + minutes * 60 + seconds;
}

// ---------- Ausrüstung ----------

export interface GearUsage {
  /** Inklusive Startwert */
  distanceMeters: number;
  sessionCount: number;
}

export function gearUsage(
  gear: Pick<Gear, 'id' | 'initialDistanceMeters'>,
  sessions: readonly Pick<EnduranceSession, 'gearId' | 'distanceMeters'>[],
): GearUsage {
  const used = sessions.filter((session) => session.gearId === gear.id);
  return {
    distanceMeters:
      gear.initialDistanceMeters +
      used.reduce((sum, session) => sum + (session.distanceMeters ?? 0), 0),
    sessionCount: used.length,
  };
}

export function isGearWorn(gear: Pick<Gear, 'warnDistanceMeters'>, distanceMeters: number) {
  return gear.warnDistanceMeters !== null && distanceMeters >= gear.warnDistanceMeters;
}

/** Zur Auswahl in einer Einheit: aktive Ausrüstung der Sportart, dazu die bisher gewählte */
export function gearOptions(
  gear: readonly Gear[],
  sport: EnduranceSport,
  selectedId: string | null,
): Gear[] {
  return gear.filter(
    (item) => item.id === selectedId || (item.archivedAt === null && item.sports.includes(sport)),
  );
}

/** Zuletzt genutzte aktive Ausrüstung der Sportart, sonst die einzige passende */
export function suggestGearId(
  sport: EnduranceSport,
  gear: readonly Gear[],
  sessions: readonly EnduranceSession[],
): string | null {
  const candidates = gearOptions(gear, sport, null).map((item) => item.id);
  const last = sortSessions(sessions).find(
    (session) =>
      session.sport === sport && session.gearId !== null && candidates.includes(session.gearId),
  );
  if (last) return last.gearId;
  return candidates.length === 1 ? candidates[0]! : null;
}

/** Aktive Ausrüstung einer Sportart, die ihre Warnschwelle erreicht hat */
export function wornGear(
  gear: readonly Gear[],
  sessions: readonly EnduranceSession[],
  sport?: EnduranceSport,
): { gear: Gear; distanceMeters: number }[] {
  return gear
    .filter((item) => item.archivedAt === null && (!sport || item.sports.includes(sport)))
    .map((item) => ({ gear: item, distanceMeters: gearUsage(item, sessions).distanceMeters }))
    .filter(({ gear: item, distanceMeters }) => isGearWorn(item, distanceMeters));
}
