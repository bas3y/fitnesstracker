import type { DistanceUnit, EnduranceSession, Exercise, WeightUnit, WorkoutSet } from '../db/types';
import { formatDistance, formatPace, paceLabel, sessionTitle } from './endurance';
import { formatEffortDistance, type SessionEffort } from './enduranceStats';
import { formatDecimal } from './format';
import { bestSet, exerciseKind, sessionVolumeKg } from './strength';
import { kgToDisplay } from './units';
import { formatClock, formatSetSummary, formatWorkoutDate, formatWorkoutDuration } from './workout';

/** `story` = Hochformat mit Hintergrund, `sticker` = transparent zum Einfügen in eine Story */
export const SHARE_FORMATS = ['story', 'sticker'] as const;
export type ShareFormat = (typeof SHARE_FORMATS)[number];

export const SHARE_SIZES: Record<ShareFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  sticker: { width: 1080, height: 1080 },
};

export interface ShareStat {
  label: string;
  value: string;
}

export interface ShareCardContent {
  title: string;
  subtitle: string;
  /** Höchstens 4, als 2 × 2 */
  stats: ShareStat[];
  /** Strecke als [Breite, Länge]; `null` = keine */
  route: [number, number][] | null;
  /** Zeilen statt Strecke (z. B. Übungen) */
  lines: string[];
  /** Hervorgehobene Zeile, z. B. Bestzeit oder Rekorde */
  badge: string | null;
}

const MAX_STATS = 4;
export const MAX_SHARE_LINES = 7;

export function enduranceShareContent(
  session: EnduranceSession,
  route: [number, number][] | null,
  efforts: readonly SessionEffort[],
  unit: DistanceUnit,
): ShareCardContent {
  const { sport, distanceMeters, durationSeconds } = session;
  const pace = formatPace(sport, distanceMeters, durationSeconds, unit);
  const stats: (ShareStat | null)[] = [
    distanceMeters
      ? { label: 'Distanz', value: formatDistance(distanceMeters, sport, unit) }
      : null,
    { label: 'Zeit', value: formatClock(durationSeconds) },
    pace ? { label: paceLabel(sport), value: pace } : null,
    session.elevationGainMeters
      ? { label: 'Höhenmeter', value: `${formatDecimal(session.elevationGainMeters, 0)} m` }
      : null,
    session.avgHeartRate ? { label: 'Puls Ø', value: `${session.avgHeartRate} bpm` } : null,
    session.calories ? { label: 'Kalorien', value: `${session.calories} kcal` } : null,
  ];
  const bests = efforts.filter((effort) => effort.isBest);
  return {
    title: sessionTitle(session),
    subtitle: formatWorkoutDate(session.startedAt),
    stats: stats.filter((stat) => stat !== null).slice(0, MAX_STATS),
    route: route && route.length >= 2 ? route : null,
    lines: [],
    badge:
      bests.length > 0
        ? `Bestzeit ${bests.map((effort) => `${formatEffortDistance(effort.meters)} ${formatClock(effort.seconds)}`).join(' · ')}`
        : null,
  };
}

export interface ShareWorkoutItem {
  exercise: Pick<Exercise, 'name' | 'isTimed' | 'equipment'> | null;
  sets: WorkoutSet[];
}

export function workoutShareContent({
  title,
  startedAt,
  durationSeconds,
  items,
  recordCount,
  bodyWeightKg,
  unit,
}: {
  title: string | null;
  startedAt: string;
  durationSeconds: number;
  items: readonly ShareWorkoutItem[];
  recordCount: number;
  bodyWeightKg: number | null;
  unit: WeightUnit;
}): ShareCardContent {
  const working = items.flatMap(({ sets }) => sets.filter((set) => !set.isWarmup));
  const volumeKg = items.reduce(
    (sum, { exercise, sets }) => sum + sessionVolumeKg(sets, exerciseKind(exercise, bodyWeightKg)),
    0,
  );
  const lines = items.map(({ exercise, sets }) => {
    const best = bestSet(sets, exerciseKind(exercise, bodyWeightKg));
    const name = exercise?.name ?? 'Übung';
    if (!best) return name;
    const format = {
      unit,
      isTimed: exercise?.isTimed ?? false,
      isBodyweight: exercise?.equipment === 'bodyweight',
    };
    return `${name}: ${formatSetSummary({ ...best, rpe: null, rir: null }, format)}`;
  });
  const more = lines.length - MAX_SHARE_LINES;
  return {
    title: title ?? 'Krafttraining',
    subtitle: formatWorkoutDate(startedAt),
    stats: [
      { label: 'Dauer', value: formatWorkoutDuration(durationSeconds) },
      { label: 'Übungen', value: String(items.length) },
      { label: 'Sätze', value: String(working.length) },
      ...(volumeKg > 0
        ? [{ label: 'Volumen', value: `${formatDecimal(kgToDisplay(volumeKg, unit), 0)} ${unit}` }]
        : []),
    ],
    route: null,
    lines:
      more > 0 ? [...lines.slice(0, MAX_SHARE_LINES - 1), `+ ${more + 1} weitere Übungen`] : lines,
    badge: recordCount > 0 ? `${recordCount === 1 ? '1 Rekord' : `${recordCount} Rekorde`}` : null,
  };
}

/** z. B. `fitnesstracker-2026-11-04-sticker.png` */
export function shareFileName(startedAt: string, format: ShareFormat): string {
  const date = new Date(startedAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `fitnesstracker-${day}${format === 'sticker' ? '-sticker' : ''}.png`;
}
