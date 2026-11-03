import {
  MAX_ELEVATION_METERS,
  MAX_HEART_RATE,
  MAX_LAPS,
  MAX_POOL_METERS,
  MAX_SESSION_KCAL,
  MAX_SESSION_METERS,
  MAX_SESSION_SECONDS,
  MIN_HEART_RATE,
  type EnduranceSessionValues,
} from '../../db/schemas';
import type {
  EnduranceImportInfo,
  EnduranceSession,
  EnduranceTrack,
  TrackLap,
} from '../../db/types';
import { ImportFileError, type ImportFormat, type ParsedActivity, type TrackPoint } from './types';

/** Höchstens so viele Messpunkte je Einheit (ca. 50 KB) */
export const MAX_TRACK_SAMPLES = 1500;
/** Höchstens so viele Punkte für die Streckenlinie */
export const MAX_ROUTE_POINTS = 500;
/** Längere Lücken zwischen zwei Punkten gelten als Pause */
export const MAX_SAMPLE_GAP_SECONDS = 30;
/** Höhenrauschen unterhalb dieser Schwelle zählt nicht als Anstieg */
const ELEVATION_THRESHOLD_METERS = 3;
const EARTH_RADIUS_METERS = 6_371_000;

export type TrackData = Omit<
  EnduranceTrack,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'sessionId'
>;

/** Eingabe für die Einheit, ohne Ausrüstung (die ordnet erst der Import zu) */
export type ImportedSessionValues = Omit<EnduranceSessionValues, 'gearId'>;

/** Eine aufbereitete Einheit aus einer Datei, bereit zum Speichern */
export interface ImportCandidate {
  /** Eindeutig innerhalb eines Imports */
  key: string;
  session: ImportedSessionValues;
  /** Gesamtzeit inkl. Pausen (Strava und Garmin zählen die Dauer unterschiedlich) */
  elapsedSeconds: number;
  track: TrackData | null;
  importInfo: EnduranceImportInfo;
}

// ---------- Geometrie ----------

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Abstand zweier Koordinaten in m (Haversine) */
export function distanceBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Strecke je Punkt: vom Gerät, sonst aus den Koordinaten; `null` ohne beides */
export function cumulativeDistances(points: readonly TrackPoint[]): (number | null)[] {
  const fromDevice = points.some((point) => point.distance !== null);
  let total = 0;
  let last: TrackPoint | null = null;
  let known = false;
  return points.map((point) => {
    if (fromDevice) {
      if (point.distance !== null) {
        total = Math.max(total, point.distance);
        known = true;
      }
      return known ? total : null;
    }
    if (point.lat === null || point.lon === null) return known ? total : null;
    if (last) total += distanceBetween(last.lat!, last.lon!, point.lat, point.lon);
    last = point;
    known = true;
    return total;
  });
}

/** Summe der Anstiege; kleine Schwankungen (GPS-Rauschen) zählen nicht */
export function elevationGain(altitudes: readonly (number | null)[]): number | null {
  let reference: number | null = null;
  let gain = 0;
  for (const altitude of altitudes) {
    if (altitude === null) continue;
    if (reference === null || altitude < reference) {
      reference = altitude;
    } else if (altitude > reference + ELEVATION_THRESHOLD_METERS) {
      gain += altitude - reference;
      reference = altitude;
    }
  }
  return reference === null ? null : gain;
}

/** Zeit in Bewegung: Lücken über 30 s (Auto-Pause) zählen nicht */
export function movingSeconds(times: readonly number[]): number {
  let total = 0;
  for (let i = 1; i < times.length; i++) {
    const gap = (times[i]! - times[i - 1]!) / 1000;
    if (gap > 0 && gap <= MAX_SAMPLE_GAP_SECONDS) total += gap;
  }
  return total;
}

/** Durchschnitt nach Zeit gewichtet, Pausen zählen nicht */
function weightedHeartRate(points: readonly TrackPoint[]): number | null {
  let sum = 0;
  let seconds = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const hr = points[i]!.heartRate;
    const gap = (points[i + 1]!.time - points[i]!.time) / 1000;
    if (hr === null || gap <= 0) continue;
    const weight = Math.min(gap, MAX_SAMPLE_GAP_SECONDS);
    sum += hr * weight;
    seconds += weight;
  }
  return seconds > 0 ? sum / seconds : null;
}

/** Douglas-Peucker mit wachsender Toleranz, bis höchstens `maxPoints` übrig sind */
export function simplifyRoute(
  points: readonly [number, number][],
  maxPoints = MAX_ROUTE_POINTS,
): [number, number][] {
  if (points.length <= maxPoints) return [...points];
  const lat0 = toRad(points[0]![0]);
  // Lokale Ebene in m: genau genug für die Vereinfachung
  const xy = points.map(([lat, lon]) => [
    toRad(lon) * Math.cos(lat0) * EARTH_RADIUS_METERS,
    toRad(lat) * EARTH_RADIUS_METERS,
  ]);
  const segmentDistance = (p: number, a: number, b: number) => {
    const [px, py] = xy[p]!;
    const [ax, ay] = xy[a]!;
    const [bx, by] = xy[b]!;
    const dx = bx! - ax!;
    const dy = by! - ay!;
    const length = dx * dx + dy * dy;
    const t =
      length === 0 ? 0 : Math.max(0, Math.min(1, ((px! - ax!) * dx + (py! - ay!) * dy) / length));
    return Math.hypot(px! - (ax! + t * dx), py! - (ay! + t * dy));
  };
  const simplify = (tolerance: number) => {
    const keep = new Uint8Array(points.length);
    keep[0] = 1;
    keep[points.length - 1] = 1;
    const stack: [number, number][] = [[0, points.length - 1]];
    while (stack.length > 0) {
      const [a, b] = stack.pop()!;
      let farthest = -1;
      let max = tolerance;
      for (let i = a + 1; i < b; i++) {
        const distance = segmentDistance(i, a, b);
        if (distance > max) {
          max = distance;
          farthest = i;
        }
      }
      if (farthest !== -1) {
        keep[farthest] = 1;
        stack.push([a, farthest], [farthest, b]);
      }
    }
    return points.filter((_, i) => keep[i]);
  };
  let tolerance = 2;
  let result = simplify(tolerance);
  while (result.length > maxPoints) {
    tolerance *= 2;
    result = simplify(tolerance);
  }
  return result;
}

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
const roundOrNull = (value: number | null, decimals: number) =>
  value === null ? null : round(value, decimals);

/** Wert nur, wenn er in den erlaubten Bereich passt */
function within(value: number | null, min: number, max: number): number | null {
  return value !== null && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

function buildTrack(
  points: readonly TrackPoint[],
  distances: readonly (number | null)[],
  startTime: number,
  laps: readonly TrackLap[],
): TrackData | null {
  const route = simplifyRoute(
    points
      .filter((point) => point.lat !== null && point.lon !== null)
      .map((point): [number, number] => [round(point.lat!, 5), round(point.lon!, 5)]),
  );
  const hasSamples = points.some(
    (point, i) => point.heartRate !== null || point.altitude !== null || distances[i] !== null,
  );
  if (!hasSamples && route.length < 2 && laps.length < 2) return null;

  // Gleichmäßig ausdünnen: mindestens alle `interval` Sekunden ein Punkt, der letzte immer
  const durationSeconds = points.length > 0 ? (points.at(-1)!.time - startTime) / 1000 : 0;
  const interval = Math.max(1, Math.ceil(durationSeconds / MAX_TRACK_SAMPLES));
  const track: TrackData = {
    time: [],
    distance: [],
    heartRate: [],
    altitude: [],
    route,
    laps: [...laps],
  };
  let lastKept = -Infinity;
  points.forEach((point, i) => {
    const seconds = Math.max(0, Math.round((point.time - startTime) / 1000));
    if (seconds - lastKept < interval && i !== points.length - 1) return;
    if (seconds === lastKept) return;
    lastKept = seconds;
    track.time.push(seconds);
    track.distance.push(roundOrNull(distances[i] ?? null, 1));
    track.heartRate.push(within(point.heartRate, MIN_HEART_RATE, MAX_HEART_RATE));
    track.altitude.push(roundOrNull(point.altitude, 1));
  });
  return track;
}

/** Datei-Inhalt → speicherbare Einheit; fehlende Kennzahlen kommen aus dem Verlauf */
export function buildCandidate(
  activity: ParsedActivity,
  fileName: string | null,
  key: string,
): ImportCandidate {
  const points = activity.points.filter((point) => point.time >= activity.startTime - 60_000);
  const distances = cumulativeDistances(points);
  const lastTime = points.at(-1)?.time;
  const pointSeconds = lastTime === undefined ? 0 : (lastTime - activity.startTime) / 1000;
  const elapsedSeconds = Math.round(activity.elapsedSeconds ?? pointSeconds);
  const timerSeconds =
    activity.timerSeconds ?? (points.length > 1 ? movingSeconds(points.map((p) => p.time)) : null);
  const durationSeconds = Math.round(timerSeconds || elapsedSeconds);
  if (durationSeconds < 1) throw new ImportFileError('Die Einheit hat keine Dauer');
  if (durationSeconds > MAX_SESSION_SECONDS)
    throw new ImportFileError('Die Einheit ist länger als 48 Stunden');

  const lastDistance = distances.findLast((distance) => distance !== null) ?? null;
  const distanceMeters = within(activity.distanceMeters ?? lastDistance, 1, MAX_SESSION_METERS);
  const heartRates = points.map((point) => point.heartRate).filter((hr) => hr !== null && hr > 0);
  const avgHeartRate = within(
    roundOrNull(activity.avgHeartRate ?? weightedHeartRate(points), 0),
    MIN_HEART_RATE,
    MAX_HEART_RATE,
  );
  let maxHeartRate = within(
    activity.maxHeartRate ?? (heartRates.length > 0 ? Math.max(...(heartRates as number[])) : null),
    MIN_HEART_RATE,
    MAX_HEART_RATE,
  );
  if (maxHeartRate !== null && avgHeartRate !== null && maxHeartRate < avgHeartRate)
    maxHeartRate = null;
  const poolLengthMeters = within(activity.poolLengthMeters, 1, MAX_POOL_METERS);
  const laps = within(activity.lengths, 1, MAX_LAPS);

  return {
    key,
    session: {
      sport: activity.sport,
      title: activity.title.trim().slice(0, 80),
      startedAt: new Date(activity.startTime).toISOString(),
      durationSeconds,
      distanceMeters: roundOrNull(distanceMeters, 1),
      avgHeartRate,
      maxHeartRate,
      elevationGainMeters: roundOrNull(
        within(
          activity.elevationGainMeters ?? elevationGain(points.map((point) => point.altitude)),
          0,
          MAX_ELEVATION_METERS,
        ),
        0,
      ),
      calories: roundOrNull(within(activity.calories, 0, MAX_SESSION_KCAL), 0),
      rating: null,
      notes: '',
      poolLengthMeters: activity.sport === 'swim' && laps !== null ? poolLengthMeters : null,
      laps: activity.sport === 'swim' && poolLengthMeters !== null ? laps : null,
      swimStroke: null,
      swolf: null,
    },
    elapsedSeconds: Math.max(elapsedSeconds, durationSeconds),
    track: buildTrack(points, distances, activity.startTime, activity.laps),
    importInfo: { format: activity.format, fileName, device: activity.device },
  };
}

// ---------- Duplikate ----------

/** Startzeit darf so weit abweichen */
const SAME_START_SECONDS = 120;

/** Gleiche Einheit: Start ±2 min und Dauer ±10 % (mind. 2 min); Bewegungs- oder Gesamtzeit */
export function isSameActivity(
  a: { startedAt: string; durations: readonly number[] },
  b: { startedAt: string; durations: readonly number[] },
): boolean {
  if (Math.abs(Date.parse(a.startedAt) - Date.parse(b.startedAt)) > SAME_START_SECONDS * 1000) {
    return false;
  }
  return a.durations.some((x) =>
    b.durations.some((y) => Math.abs(x - y) <= Math.max(SAME_START_SECONDS, 0.1 * Math.max(x, y))),
  );
}

export type ImportStatus = 'new' | 'merge' | 'duplicate';

export interface PlannedImport {
  candidate: ImportCandidate;
  status: ImportStatus;
  /** Vorhandene Einheit, die ergänzt wird bzw. schon da ist */
  matchId: string | null;
}

const FORMAT_PRIORITY: Record<ImportFormat, number> = { fit: 0, tcx: 1, gpx: 2 };

/**
 * Neu, ergänzen (manuell erfasste Einheit ohne bisherigen Import) oder schon vorhanden.
 * Doppelte innerhalb der Auswahl (z. B. FIT von Garmin + GPX von Strava): die ausführlichere zählt.
 */
export function planImport(
  candidates: readonly ImportCandidate[],
  existing: readonly EnduranceSession[],
): PlannedImport[] {
  const ordered = [...candidates].sort(
    (a, b) =>
      a.session.startedAt.localeCompare(b.session.startedAt) ||
      FORMAT_PRIORITY[a.importInfo.format as ImportFormat] -
        FORMAT_PRIORITY[b.importInfo.format as ImportFormat],
  );
  const asMatch = (candidate: ImportCandidate) => ({
    startedAt: candidate.session.startedAt,
    durations: [candidate.session.durationSeconds, candidate.elapsedSeconds],
  });
  const accepted: ImportCandidate[] = [];
  const merged = new Set<string>();
  return ordered.map((candidate) => {
    const match = existing.find((session) =>
      isSameActivity(asMatch(candidate), {
        startedAt: session.startedAt,
        durations: [session.durationSeconds],
      }),
    );
    if (match) {
      const canMerge =
        match.source === 'manual' && match.importInfo === null && !merged.has(match.id);
      if (canMerge) merged.add(match.id);
      return { candidate, status: canMerge ? 'merge' : 'duplicate', matchId: match.id };
    }
    if (accepted.some((other) => isSameActivity(asMatch(candidate), asMatch(other)))) {
      return { candidate, status: 'duplicate', matchId: null };
    }
    accepted.push(candidate);
    return { candidate, status: 'new', matchId: null };
  });
}

const FILLABLE = [
  'distanceMeters',
  'avgHeartRate',
  'maxHeartRate',
  'elevationGainMeters',
  'calories',
  'poolLengthMeters',
  'laps',
] as const;

/** Manuell erfasste Werte bleiben, der Import füllt nur leere Felder */
export function mergeSessionValues(
  session: EnduranceSessionValues,
  imported: ImportedSessionValues,
): EnduranceSessionValues {
  const merged = { ...session };
  for (const field of FILLABLE) {
    if (merged[field] === null) merged[field] = imported[field];
  }
  if (!merged.title) merged.title = imported.title;
  if (
    merged.maxHeartRate !== null &&
    merged.avgHeartRate !== null &&
    merged.maxHeartRate < merged.avgHeartRate
  ) {
    merged.avgHeartRate = session.avgHeartRate;
    merged.maxHeartRate = session.maxHeartRate;
  }
  // Bahnen nur zusammen mit der Bahnlänge
  if (merged.laps === null || merged.poolLengthMeters === null) {
    merged.laps = session.laps;
    merged.poolLengthMeters = session.poolLengthMeters;
  }
  return merged;
}
