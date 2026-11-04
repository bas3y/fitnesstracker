import type {
  BestEffort,
  EnduranceSport,
  EnduranceTrack,
  HeartRateSeconds,
  TrackSummary,
} from '../db/types';

/** Längere Lücken zwischen zwei Punkten gelten als Pause */
export const MAX_SAMPLE_GAP_SECONDS = 30;

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

/** Sekunden je Puls (bpm), aufsteigend; Pausen-Lücken zählen höchstens 30 s */
export function heartRateSeconds(track: Pick<Track, 'time' | 'heartRate'>): HeartRateSeconds {
  const seconds = new Map<number, number>();
  for (let i = 0; i < track.time.length - 1; i++) {
    const hr = track.heartRate[i];
    if (hr === null || hr === undefined) continue;
    const gap = Math.min(track.time[i + 1]! - track.time[i]!, MAX_SAMPLE_GAP_SECONDS);
    if (gap <= 0) continue;
    const bpm = Math.round(hr);
    seconds.set(bpm, (seconds.get(bpm) ?? 0) + gap);
  }
  return [...seconds].sort(([a], [b]) => a - b);
}

/** Sekunden je Zone (unterhalb Zone 1 zählt nicht) */
export function zoneSecondsOf(histogram: HeartRateSeconds, bounds: readonly number[]): number[] {
  const seconds = bounds.map(() => 0);
  for (const [bpm, value] of histogram) {
    let zone = -1;
    bounds.forEach((bound, index) => {
      if (bpm >= bound) zone = index;
    });
    if (zone >= 0) seconds[zone]! += value;
  }
  return seconds;
}

export function zoneSeconds(
  track: Pick<Track, 'time' | 'heartRate'>,
  bounds: readonly number[],
): number[] {
  return zoneSecondsOf(heartRateSeconds(track), bounds);
}

// ---------- Bestzeiten ----------

/** Strecken, für die Bestzeiten aus dem Verlauf gesucht werden */
export const BEST_EFFORT_METERS: Partial<Record<EnduranceSport, readonly number[]>> = {
  run: [1000, 5000, 10_000, 21_097.5, 42_195],
  ride: [10_000, 20_000, 50_000, 100_000],
};

/** Schneller (m/s) ist ein GPS-Fehler */
const MAX_EFFORT_SPEED: Partial<Record<EnduranceSport, number>> = { run: 7, ride: 25 };

/** Schnellste Zeit über `meters` innerhalb des Verlaufs (Anfang interpoliert), `null` = zu kurz */
export function fastestSeconds(
  track: Pick<Track, 'time' | 'distance'>,
  meters: number,
): number | null {
  const times: number[] = [];
  const distances: number[] = [];
  for (let i = 0; i < track.time.length; i++) {
    const distance = track.distance[i];
    if (distance === null || distance === undefined) continue;
    // Strecke wächst nur; Rücksprünge (GPS) überspringen
    if (distances.length > 0 && distance <= distances.at(-1)!) continue;
    times.push(track.time[i]!);
    distances.push(distance);
  }
  let best: number | null = null;
  let start = 0;
  for (let end = 1; end < distances.length; end++) {
    const target = distances[end]! - meters;
    if (target < distances[0]!) continue;
    while (distances[start + 1]! <= target) start++;
    const d0 = distances[start]!;
    const d1 = distances[start + 1]!;
    const t0 = times[start]!;
    const startTime = t0 + ((target - d0) / (d1 - d0)) * (times[start + 1]! - t0);
    const seconds = times[end]! - startTime;
    if (best === null || seconds < best) best = seconds;
  }
  return best === null ? null : Math.round(best);
}

export function bestEfforts(
  track: Pick<Track, 'time' | 'distance'>,
  sport: EnduranceSport,
): BestEffort[] {
  const maxSpeed = MAX_EFFORT_SPEED[sport] ?? Infinity;
  return (BEST_EFFORT_METERS[sport] ?? []).flatMap((meters) => {
    const seconds = fastestSeconds(track, meters);
    return seconds !== null && seconds > 0 && meters / seconds <= maxSpeed
      ? [{ meters, seconds }]
      : [];
  });
}

/** Gespeichert an der Einheit, damit Statistiken die Verläufe nicht laden müssen */
export function trackSummary(track: Track, sport: EnduranceSport): TrackSummary {
  return { bestEfforts: bestEfforts(track, sport), heartRateSeconds: heartRateSeconds(track) };
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
