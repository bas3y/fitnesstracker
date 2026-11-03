import type { EnduranceTrack } from '../db/types';
import { MAX_SAMPLE_GAP_SECONDS } from './import/activity';

type Track = Pick<
  EnduranceTrack,
  'time' | 'distance' | 'heartRate' | 'altitude' | 'route' | 'laps'
>;

// ---------- Pulszonen ----------

/** Untergrenzen der Zonen 1–5 in % des max. Pulses bzw. der Herzfrequenzreserve */
export const HEART_RATE_ZONE_SHARES = [0.5, 0.6, 0.7, 0.8, 0.9] as const;

export const HEART_RATE_ZONE_LABELS = [
  'Erholung',
  'Grundlage',
  'Aerob',
  'Schwelle',
  'Maximum',
] as const;

/** Untergrenzen in bpm; mit Ruhepuls nach Karvonen */
export function heartRateZoneBounds(
  maxHeartRate: number,
  restingHeartRate: number | null,
): number[] {
  const rest = restingHeartRate !== null && restingHeartRate < maxHeartRate ? restingHeartRate : 0;
  return HEART_RATE_ZONE_SHARES.map((share) => Math.round(rest + share * (maxHeartRate - rest)));
}

/** Sekunden je Zone (unterhalb Zone 1 zählt nicht); Pausen-Lücken zählen höchstens 30 s */
export function zoneSeconds(
  track: Pick<Track, 'time' | 'heartRate'>,
  bounds: readonly number[],
): number[] {
  const seconds = bounds.map(() => 0);
  for (let i = 0; i < track.time.length - 1; i++) {
    const hr = track.heartRate[i];
    if (hr === null || hr === undefined) continue;
    const gap = Math.min(track.time[i + 1]! - track.time[i]!, MAX_SAMPLE_GAP_SECONDS);
    let zone = -1;
    bounds.forEach((bound, index) => {
      if (hr >= bound) zone = index;
    });
    if (zone >= 0 && gap > 0) seconds[zone]! += gap;
  }
  return seconds;
}

// ---------- Abschnitte ----------

export interface TrackSplit {
  /** 1, 2, 3 … */
  index: number;
  distanceMeters: number;
  durationSeconds: number;
  avgHeartRate: number | null;
}

/** Zeit an einer Strecke, linear zwischen zwei Messpunkten */
function timeAtDistance(
  track: Pick<Track, 'time' | 'distance'>,
  i: number,
  meters: number,
): number {
  const d0 = track.distance[i - 1]!;
  const d1 = track.distance[i]!;
  const t0 = track.time[i - 1]!;
  const t1 = track.time[i]!;
  return d1 === d0 ? t1 : t0 + ((meters - d0) / (d1 - d0)) * (t1 - t0);
}

/** Abschnitte je km bzw. Meile; der letzte (Rest) ab 10 % der Länge */
export function distanceSplits(
  track: Pick<Track, 'time' | 'distance' | 'heartRate'>,
  splitMeters: number,
): TrackSplit[] {
  const splits: TrackSplit[] = [];
  let startTime = track.time[0] ?? 0;
  let startDistance = 0;
  let hrSum = 0;
  let hrCount = 0;
  let previous: number | null = null;
  const close = (endTime: number, distanceMeters: number) => {
    splits.push({
      index: splits.length + 1,
      distanceMeters,
      durationSeconds: Math.round(endTime - startTime),
      avgHeartRate: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
    });
    startTime = endTime;
    hrSum = 0;
    hrCount = 0;
  };
  for (let i = 0; i < track.time.length; i++) {
    const distance = track.distance[i];
    if (distance === null || distance === undefined) continue;
    while (previous !== null && distance >= startDistance + splitMeters) {
      startDistance += splitMeters;
      close(timeAtDistance(track, i, startDistance), splitMeters);
    }
    const hr = track.heartRate[i];
    if (hr !== null && hr !== undefined) {
      hrSum += hr;
      hrCount++;
    }
    previous = distance;
  }
  if (previous !== null && previous - startDistance >= splitMeters * 0.1) {
    close(track.time.at(-1)!, previous - startDistance);
  }
  return splits;
}

// ---------- Diagramm ----------

export interface TrackChartPoint {
  /** km bzw. Minuten */
  x: number;
  heartRate: number | null;
  altitude: number | null;
}

/** Höchstens `maxPoints` Punkte für die Diagramme; x = Strecke (falls vorhanden) oder Zeit */
export function trackChartPoints(
  track: Pick<Track, 'time' | 'distance' | 'heartRate' | 'altitude'>,
  xAxis: 'distance' | 'time',
  metersPerUnit: number,
  maxPoints = 300,
): TrackChartPoint[] {
  const step = Math.max(1, Math.ceil(track.time.length / maxPoints));
  const points: TrackChartPoint[] = [];
  for (let i = 0; i < track.time.length; i += step) {
    const x = xAxis === 'distance' ? track.distance[i] : track.time[i]! / 60;
    if (x === null || x === undefined) continue;
    points.push({
      x: xAxis === 'distance' ? x / metersPerUnit : x,
      heartRate: track.heartRate[i] ?? null,
      altitude: track.altitude[i] ?? null,
    });
  }
  return points;
}

export function hasValues(values: readonly (number | null)[]): boolean {
  return values.some((value) => value !== null);
}

// ---------- Strecke ----------

/** Strecke als SVG-Koordinaten in einem Rahmen (Breite × Höhe), Norden oben, unverzerrt */
export function projectRoute(
  route: readonly [number, number][],
  width: number,
  height: number,
  padding = 8,
): [number, number][] | null {
  if (route.length < 2) return null;
  const lat0 = (route[0]![0] * Math.PI) / 180;
  const projected = route.map(([lat, lon]) => [lon * Math.cos(lat0), -lat] as const);
  const xs = projected.map(([x]) => x);
  const ys = projected.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = Math.max(...ys) - minY;
  const scale = Math.min(
    (width - 2 * padding) / (spanX || 1e-9),
    (height - 2 * padding) / (spanY || 1e-9),
  );
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  const round = (value: number) => Math.round(value * 10) / 10;
  return projected.map(([x, y]) => [
    round(offsetX + (x - minX) * scale),
    round(offsetY + (y - minY) * scale),
  ]);
}

export function svgPath(points: readonly [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
}
