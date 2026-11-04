import type { EnduranceSession } from '../../db/types';
import {
  buildCandidate,
  cumulativeDistances,
  distanceBetween,
  elevationGain,
  isSameActivity,
  MAX_ROUTE_POINTS,
  MAX_TRACK_SAMPLES,
  mergeSessionValues,
  movingSeconds,
  planImport,
  simplifyRoute,
  type ImportCandidate,
} from './activity';
import { emptyActivity, ImportFileError, type TrackPoint } from './types';

const START = Date.parse('2026-10-01T06:00:00Z');

function point(seconds: number, values: Partial<TrackPoint> = {}): TrackPoint {
  return {
    time: START + seconds * 1000,
    lat: null,
    lon: null,
    altitude: null,
    heartRate: null,
    distance: null,
    ...values,
  };
}

/** Punkte nach Norden, `meters` je Schritt */
function northPoints(
  count: number,
  stepSeconds: number,
  meters: number,
  values: Partial<TrackPoint> = {},
) {
  return Array.from({ length: count }, (_, i) =>
    point(i * stepSeconds, { lat: 52.5 + (i * meters) / 111_195, lon: 13.4, ...values }),
  );
}

describe('Geometrie und Kennzahlen', () => {
  it('berechnet Abstände und kumulierte Strecke', () => {
    expect(distanceBetween(52.5, 13.4, 52.5 + 1000 / 111_195, 13.4)).toBeCloseTo(1000, 0);
    expect(cumulativeDistances(northPoints(3, 10, 100)).map((d) => Math.round(d!))).toEqual([
      0, 100, 200,
    ]);
    // Strecke vom Gerät hat Vorrang, Lücken behalten den letzten Wert
    expect(
      cumulativeDistances([point(0, { distance: 5 }), point(1), point(2, { distance: 12 })]),
    ).toEqual([5, 5, 12]);
    expect(cumulativeDistances([point(0), point(1)])).toEqual([null, null]);
  });

  it('zählt Höhenmeter ohne GPS-Rauschen', () => {
    expect(elevationGain([100, 102, 99, 101, 100, 102])).toBe(0);
    expect(elevationGain([100, 105, 103, 110, 90, 95])).toBe(5 + 7 + 5);
    expect(elevationGain([null, null])).toBeNull();
  });

  it('zählt Pausen nicht als Bewegungszeit', () => {
    expect(movingSeconds([0, 5000, 10_000, 100_000, 105_000])).toBe(15);
  });

  it('vereinfacht lange Strecken', () => {
    const zigzag = Array.from({ length: 3000 }, (_, i): [number, number] => [
      52.5 + i * 0.0001,
      13.4 + (i % 2) * 0.0005,
    ]);
    const route = simplifyRoute(zigzag);
    expect(route.length).toBeLessThanOrEqual(MAX_ROUTE_POINTS);
    expect(route[0]).toEqual(zigzag[0]);
    expect(route.at(-1)).toEqual(zigzag.at(-1));
    // gerade Linie: Anfang und Ende genügen
    expect(
      simplifyRoute(
        northPoints(1000, 1, 5).map((p) => [p.lat!, p.lon!]),
        10,
      ),
    ).toHaveLength(2);
  });
});

describe('buildCandidate', () => {
  it('ergänzt fehlende Kennzahlen aus dem Verlauf (GPX)', () => {
    // 30 min mit 5-s-Punkten, dazwischen 5 min Pause
    const before = northPoints(181, 5, 15, { heartRate: 150, altitude: 40 });
    const after = northPoints(181, 5, 15, { heartRate: 160, altitude: 50 }).map((p, i) => ({
      ...p,
      time: before.at(-1)!.time + 300_000 + i * 5000,
      lat: before.at(-1)!.lat! + (i * 15) / 111_195,
    }));
    const activity = emptyActivity('gpx', {
      sport: 'run',
      title: '  Abendlauf  ',
      startTime: START,
      points: [...before, ...after],
    });
    const candidate = buildCandidate(activity, 'lauf.gpx', 'k1');
    expect(candidate.session).toMatchObject({
      sport: 'run',
      title: 'Abendlauf',
      startedAt: new Date(START).toISOString(),
      durationSeconds: 1800,
      avgHeartRate: 155,
      maxHeartRate: 160,
      elevationGainMeters: 10,
      calories: null,
      rating: null,
      notes: '',
    });
    // 2 × 180 Schritte à 15 m, die Pause bleibt am Ort
    expect(candidate.session.distanceMeters).toBeCloseTo(5400, -1);
    expect(candidate.elapsedSeconds).toBe(2100);
    expect(candidate.importInfo).toEqual({ format: 'gpx', fileName: 'lauf.gpx', device: null });
    expect(candidate.track!.time).toHaveLength(362);
    expect(candidate.track!.time[1]).toBe(5);
    expect(candidate.track!.route.length).toBeGreaterThan(1);
  });

  it('dünnt lange Verläufe aus und prüft Grenzwerte', () => {
    const points = Array.from({ length: 4 * 3600 }, (_, i) =>
      point(i, { heartRate: i === 10 ? 300 : 140, distance: i * 8 }),
    );
    const candidate = buildCandidate(
      emptyActivity('fit', {
        sport: 'ride',
        startTime: START,
        timerSeconds: 14_000,
        elapsedSeconds: 14_400,
        avgHeartRate: 140,
        maxHeartRate: 120,
        calories: 1e6,
        elevationGainMeters: -5,
        points,
      }),
      null,
      'k',
    );
    expect(candidate.track!.time.length).toBeLessThanOrEqual(MAX_TRACK_SAMPLES + 1);
    expect(candidate.track!.time.at(-1)).toBe(4 * 3600 - 1);
    expect(candidate.track!.heartRate).not.toContain(300);
    expect(candidate.session).toMatchObject({
      durationSeconds: 14_000,
      maxHeartRate: null,
      calories: null,
      elevationGainMeters: null,
    });
    expect(candidate.session.distanceMeters).toBe((4 * 3600 - 1) * 8);
  });

  it('übernimmt Bahnen nur mit Bahnlänge beim Schwimmen', () => {
    const swim = emptyActivity('fit', {
      sport: 'swim',
      startTime: START,
      timerSeconds: 1800,
      poolLengthMeters: 25,
      lengths: 40,
    });
    expect(buildCandidate(swim, null, 'k').session).toMatchObject({
      poolLengthMeters: 25,
      laps: 40,
    });
    const open = emptyActivity('fit', {
      sport: 'swim',
      startTime: START,
      timerSeconds: 1800,
      lengths: 40,
    });
    expect(buildCandidate(open, null, 'k').session).toMatchObject({
      poolLengthMeters: null,
      laps: null,
    });
    expect(buildCandidate(open, null, 'k').track).toBeNull();
  });

  it('lehnt Einheiten ohne Dauer ab', () => {
    expect(() =>
      buildCandidate(emptyActivity('gpx', { startTime: START, points: [point(0)] }), null, 'k'),
    ).toThrow(ImportFileError);
  });
});

function candidate(
  key: string,
  startedAt: string,
  durationSeconds: number,
  format = 'fit',
  elapsedSeconds = durationSeconds,
): ImportCandidate {
  return {
    key,
    session: {
      sport: 'run',
      title: '',
      startedAt,
      durationSeconds,
      distanceMeters: 10_000,
      avgHeartRate: 150,
      maxHeartRate: 170,
      elevationGainMeters: 50,
      calories: 600,
      rating: null,
      notes: '',
      poolLengthMeters: null,
      laps: null,
      swimStroke: null,
      swolf: null,
    },
    elapsedSeconds,
    track: null,
    importInfo: { format, fileName: `${key}.${format}`, device: null },
  };
}

function stored(
  id: string,
  startedAt: string,
  durationSeconds: number,
  values: Partial<EnduranceSession> = {},
): EnduranceSession {
  return {
    ...candidate(id, startedAt, durationSeconds).session,
    id,
    createdAt: startedAt,
    updatedAt: startedAt,
    deletedAt: null,
    gearId: null,
    source: 'manual',
    importInfo: null,
    trackSummary: null,
    ...values,
  };
}

describe('Duplikate', () => {
  it('vergleicht Start ±2 min und Dauer ±10 % (Bewegungs- oder Gesamtzeit)', () => {
    const a = { startedAt: '2026-10-01T06:00:00.000Z', durations: [3000, 3600] };
    expect(isSameActivity(a, { startedAt: '2026-10-01T06:01:30.000Z', durations: [3050] })).toBe(
      true,
    );
    expect(isSameActivity(a, { startedAt: '2026-10-01T06:01:30.000Z', durations: [3650] })).toBe(
      true,
    );
    expect(isSameActivity(a, { startedAt: '2026-10-01T06:03:00.000Z', durations: [3000] })).toBe(
      false,
    );
    expect(isSameActivity(a, { startedAt: '2026-10-01T06:00:00.000Z', durations: [1800] })).toBe(
      false,
    );
    // kurze Einheiten: mindestens 2 min Spielraum
    expect(
      isSameActivity(
        { startedAt: a.startedAt, durations: [600] },
        { startedAt: a.startedAt, durations: [700] },
      ),
    ).toBe(true);
  });

  it('plant neu, ergänzen und übersprungen', () => {
    const existing = [
      stored('manual', '2026-10-01T06:00:00.000Z', 3000),
      stored('imported', '2026-10-02T06:00:00.000Z', 3000, { source: 'import' }),
      stored('merged', '2026-10-03T06:00:00.000Z', 3000, {
        importInfo: { format: 'gpx', fileName: null, device: null },
      }),
    ];
    const plan = planImport(
      [
        candidate('c4-gpx', '2026-10-04T06:00:30.000Z', 3000, 'gpx'),
        candidate('c1', '2026-10-01T06:00:20.000Z', 2950),
        candidate('c2', '2026-10-02T06:00:00.000Z', 3000),
        candidate('c3', '2026-10-03T06:00:00.000Z', 3000),
        candidate('c4-fit', '2026-10-04T06:00:30.000Z', 3010, 'fit'),
        candidate('c5', '2026-10-05T06:00:00.000Z', 3000),
        candidate('c1-again', '2026-10-01T06:00:00.000Z', 3000),
      ],
      existing,
    );
    expect(plan.map(({ candidate: c, status, matchId }) => [c.key, status, matchId])).toEqual([
      ['c1-again', 'merge', 'manual'],
      ['c1', 'duplicate', 'manual'],
      ['c2', 'duplicate', 'imported'],
      ['c3', 'duplicate', 'merged'],
      // FIT vor GPX bei gleicher Einheit in einer Auswahl
      ['c4-fit', 'new', null],
      ['c4-gpx', 'duplicate', null],
      ['c5', 'new', null],
    ]);
  });

  it('füllt beim Ergänzen nur leere Felder', () => {
    const manual = {
      ...candidate('m', '2026-10-01T06:00:00.000Z', 3000).session,
      title: '',
      gearId: 'shoe',
      distanceMeters: 10_200,
      avgHeartRate: null,
      maxHeartRate: null,
      elevationGainMeters: null,
      calories: null,
      rating: 4,
      notes: 'locker',
    };
    const imported = {
      ...candidate('i', '2026-10-01T06:00:00.000Z', 3050).session,
      title: 'Morgenrunde',
    };
    expect(mergeSessionValues(manual, imported)).toEqual({
      ...manual,
      title: 'Morgenrunde',
      avgHeartRate: 150,
      maxHeartRate: 170,
      elevationGainMeters: 50,
      calories: 600,
    });
    // Max-Puls unter dem manuellen Durchschnitt: Pulswerte bleiben wie eingetragen
    expect(mergeSessionValues({ ...manual, avgHeartRate: 175 }, imported)).toMatchObject({
      avgHeartRate: 175,
      maxHeartRate: null,
    });
  });
});
