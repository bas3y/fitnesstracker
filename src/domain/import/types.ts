import type { EnduranceSport, TrackLap } from '../../db/types';

export type ImportFormat = 'fit' | 'gpx' | 'tcx';

/** Messpunkt aus der Datei, Zeit in ms seit 1970 */
export interface TrackPoint {
  time: number;
  lat: number | null;
  lon: number | null;
  altitude: number | null;
  heartRate: number | null;
  /** Strecke laut Gerät in m; fehlt sie, wird sie aus den Koordinaten berechnet */
  distance: number | null;
}

/** Eine Einheit, wie sie in der Datei steht (Werte, die fehlen, sind `null`) */
export interface ParsedActivity {
  format: ImportFormat;
  device: string | null;
  sport: EnduranceSport;
  title: string;
  /** ms seit 1970 */
  startTime: number;
  /** Bewegungszeit (Timer der Uhr), `null` = aus dem Verlauf berechnen */
  timerSeconds: number | null;
  /** Gesamtzeit inkl. Pausen, `null` = aus dem Verlauf berechnen */
  elapsedSeconds: number | null;
  distanceMeters: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  elevationGainMeters: number | null;
  calories: number | null;
  poolLengthMeters: number | null;
  /** Schwimmen: Anzahl Bahnen */
  lengths: number | null;
  points: TrackPoint[];
  laps: TrackLap[];
}

export function emptyActivity(
  format: ImportFormat,
  values: Partial<ParsedActivity> & Pick<ParsedActivity, 'startTime'>,
): ParsedActivity {
  return {
    format,
    device: null,
    sport: 'other',
    title: '',
    timerSeconds: null,
    elapsedSeconds: null,
    distanceMeters: null,
    avgHeartRate: null,
    maxHeartRate: null,
    elevationGainMeters: null,
    calories: null,
    poolLengthMeters: null,
    lengths: null,
    points: [],
    laps: [],
    ...values,
  };
}

/** Datei, die sich nicht lesen ließ */
export class ImportFileError extends Error {}
