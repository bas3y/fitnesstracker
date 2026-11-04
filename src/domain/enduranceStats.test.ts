import type { EnduranceSession } from '../db/types';
import {
  bestEffortsOf,
  enduranceDays,
  enduranceHeatLevel,
  formatEffortDistance,
  formatPaceValue,
  lowerIsFaster,
  newEffortRecords,
  pacePoints,
  periodTotals,
  sessionEfforts,
  sumHeartRateSeconds,
  weekBySport,
  weeklyTotals,
} from './enduranceStats';

function session(
  id: string,
  startedAt: Date,
  overrides: Partial<EnduranceSession> = {},
): EnduranceSession {
  return {
    id,
    createdAt: startedAt.toISOString(),
    updatedAt: startedAt.toISOString(),
    deletedAt: null,
    sport: 'run',
    title: '',
    startedAt: startedAt.toISOString(),
    durationSeconds: 1800,
    distanceMeters: 6000,
    avgHeartRate: null,
    maxHeartRate: null,
    elevationGainMeters: null,
    calories: null,
    rating: null,
    notes: '',
    gearId: null,
    poolLengthMeters: null,
    laps: null,
    swimStroke: null,
    swolf: null,
    source: 'import',
    importInfo: null,
    trackSummary: null,
    ...overrides,
  };
}

const efforts = (fiveK: number, oneK = 280) => ({
  bestEfforts: [
    { meters: 1000, seconds: oneK },
    { meters: 5000, seconds: fiveK },
  ],
  heartRateSeconds: [] as [number, number][],
});

// Di 03.11.2026 ist in der Woche ab Mo 02.11.
const day = (date: number, hour = 18) => new Date(2026, 10, date, hour);

describe('Bestzeiten über Einheiten', () => {
  const a = session('a', day(1), { trackSummary: efforts(1500) });
  const b = session('b', day(2), { trackSummary: efforts(1450, 290) });
  const ride = session('c', day(2), { sport: 'ride', trackSummary: efforts(600) });
  const manual = session('d', day(3), { source: 'manual' });

  it('nimmt je Strecke die schnellste, bei Gleichstand die frühere', () => {
    expect(bestEffortsOf([a, b, ride, manual], 'run')).toEqual([
      { sport: 'run', meters: 1000, seconds: 280, sessionId: 'a', startedAt: a.startedAt },
      { sport: 'run', meters: 5000, seconds: 1450, sessionId: 'b', startedAt: b.startedAt },
    ]);
    const tie = session('e', day(4), { trackSummary: efforts(1450) });
    expect(bestEffortsOf([tie, b], 'run')[1]?.sessionId).toBe('b');
    expect(bestEffortsOf([manual], 'run')).toEqual([]);
  });

  it('meldet neue Bestzeiten nur gegenüber früheren Zeiten', () => {
    expect(newEffortRecords([a, b], ['b'])).toEqual([
      { sport: 'run', meters: 5000, seconds: 1450, sessionId: 'b', startedAt: b.startedAt },
    ]);
    // Erste Zeit über die Strecke = kein Rekord
    expect(newEffortRecords([a], ['a'])).toEqual([]);
    // Mehrere neue: nur die beste zählt
    const c = session('f', day(5), { trackSummary: efforts(1400) });
    expect(newEffortRecords([a, b, c], ['b', 'f']).map((record) => record.sessionId)).toEqual([
      'f',
    ]);
  });

  it('markiert die Bestzeiten einer Einheit', () => {
    expect(sessionEfforts(b, [a, b])).toEqual([
      { meters: 1000, seconds: 290, isBest: false },
      { meters: 5000, seconds: 1450, isBest: true },
    ]);
    expect(sessionEfforts(a, [a])).toEqual([
      { meters: 1000, seconds: 280, isBest: false },
      { meters: 5000, seconds: 1500, isBest: false },
    ]);
    expect(sessionEfforts(manual, [a, manual])).toEqual([]);
  });

  it('benennt die Strecken', () => {
    expect(formatEffortDistance(1000)).toBe('1 km');
    expect(formatEffortDistance(21_097.5)).toBe('Halbmarathon');
    expect(formatEffortDistance(42_195)).toBe('Marathon');
  });
});

describe('Zeiträume', () => {
  it('summiert Einheiten mit Höhenmetern', () => {
    expect(
      periodTotals([
        session('a', day(1), { elevationGainMeters: 120 }),
        session('b', day(2), { distanceMeters: null }),
      ]),
    ).toEqual({ count: 2, distanceMeters: 6000, durationSeconds: 3600, elevationGainMeters: 120 });
  });

  it('teilt in Kalenderwochen bis zur laufenden Woche, auch leere', () => {
    const sessions = [session('a', day(1)), session('b', day(10)), session('c', day(11))];
    expect(weeklyTotals(sessions, null, '2026-11-18')).toEqual([
      { weekStart: '2026-10-26', count: 1, distanceMeters: 6000, durationSeconds: 1800 },
      { weekStart: '2026-11-02', count: 0, distanceMeters: 0, durationSeconds: 0 },
      { weekStart: '2026-11-09', count: 2, distanceMeters: 12_000, durationSeconds: 3600 },
      { weekStart: '2026-11-16', count: 0, distanceMeters: 0, durationSeconds: 0 },
    ]);
    expect(weeklyTotals(sessions, '2026-11-09', '2026-11-11')).toHaveLength(1);
    expect(weeklyTotals([], null, '2026-11-11')).toEqual([]);
  });

  it('fasst die laufende Woche je Sportart zusammen', () => {
    const sessions = [
      session('a', day(2)),
      session('b', day(3), { sport: 'ride', durationSeconds: 3600 }),
      session('c', day(1)),
    ];
    expect(weekBySport(sessions, '2026-11-04')).toEqual([
      { sport: 'ride', totals: { count: 1, distanceMeters: 6000, durationSeconds: 3600 } },
      { sport: 'run', totals: { count: 1, distanceMeters: 6000, durationSeconds: 1800 } },
    ]);
  });
});

describe('Pace', () => {
  it('rechnet je Sportart in der Anzeigeeinheit, älteste zuerst', () => {
    const sessions = [
      session('b', day(2), { durationSeconds: 1500, distanceMeters: 5000 }),
      session('a', day(1)),
      session('c', day(3), { distanceMeters: null }),
    ];
    expect(pacePoints(sessions, 'run', 'km').map((point) => point.value)).toEqual([300, 300]);
    expect(pacePoints(sessions, 'run', 'km')[0]!.time).toBe(day(1).getTime());
    const ride = [
      session('r', day(1), { sport: 'ride', durationSeconds: 3600, distanceMeters: 30_000 }),
    ];
    expect(pacePoints(ride, 'ride', 'km')[0]!.value).toBe(30);
    const swim = [
      session('s', day(1), { sport: 'swim', durationSeconds: 1200, distanceMeters: 1000 }),
    ];
    expect(pacePoints(swim, 'swim', 'km')[0]!.value).toBe(120);
    expect(pacePoints(sessions, 'mobility', 'km')).toEqual([]);
  });

  it('formatiert Pace und Geschwindigkeit', () => {
    expect(formatPaceValue('run', 300, 'km')).toBe('5:00 /km');
    expect(formatPaceValue('swim', 120, 'km')).toBe('2:00 /100 m');
    expect(formatPaceValue('ride', 28.44, 'mi')).toBe('28,4 mph');
    expect(lowerIsFaster('run')).toBe(true);
    expect(lowerIsFaster('ride')).toBe(false);
  });
});

describe('Puls und Trainingstage', () => {
  it('summiert die Pulsverteilung', () => {
    const summary = (heartRateSeconds: [number, number][]) => ({
      bestEfforts: [],
      heartRateSeconds,
    });
    expect(
      sumHeartRateSeconds([
        session('a', day(1), {
          trackSummary: summary([
            [140, 10],
            [150, 5],
          ]),
        }),
        session('b', day(2), { trackSummary: summary([[140, 20]]) }),
        session('c', day(3)),
      ]),
    ).toEqual([
      [140, 30],
      [150, 5],
    ]);
  });

  it('fasst Einheiten je Tag zusammen und stuft nach Dauer', () => {
    const days = enduranceDays([
      session('b', day(2, 18), { sport: 'ride' }),
      session('a', day(2, 7)),
      session('c', day(3)),
    ]);
    expect(days.get('2026-11-02')).toEqual({
      durationSeconds: 3600,
      sessions: [
        { id: 'a', sport: 'run' },
        { id: 'b', sport: 'ride' },
      ],
    });
    expect([0, 600, 1800, 2700, 5400, 20_000].map(enduranceHeatLevel)).toEqual([0, 1, 1, 2, 3, 4]);
  });
});
