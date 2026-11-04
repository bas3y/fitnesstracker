import {
  bestEfforts,
  distanceSplits,
  fastestSeconds,
  heartRateSeconds,
  heartRateZoneBounds,
  projectRoute,
  svgPath,
  trackChartPoints,
  trackSummary,
  zoneSeconds,
  zoneSecondsOf,
} from './track';

describe('Puls je bpm', () => {
  it('summiert Sekunden je gerundetem Puls, Lücken höchstens 30 s', () => {
    const track = { time: [0, 10, 20, 320, 330], heartRate: [140.4, 140, null, 150, 160] };
    expect(heartRateSeconds(track)).toEqual([
      [140, 20],
      [150, 10],
    ]);
    expect(
      zoneSecondsOf(
        [
          [99, 5],
          [140, 20],
          [150, 10],
        ],
        [100, 120, 140, 160, 180],
      ),
    ).toEqual([0, 0, 30, 0, 0]);
  });
});

describe('Bestzeiten', () => {
  // 5 km in 25 min gleichmäßig, dazwischen ein schneller Kilometer (3:30)
  const steady = {
    time: [0, 300, 600, 810, 1110, 1410],
    distance: [0, 1000, 2000, 3000, 4000, 5000],
  };

  it('findet den schnellsten Abschnitt und interpoliert den Anfang', () => {
    expect(fastestSeconds(steady, 1000)).toBe(210);
    expect(fastestSeconds(steady, 5000)).toBe(1410);
    expect(fastestSeconds(steady, 1500)).toBe(360);
    expect(fastestSeconds(steady, 10_000)).toBeNull();
  });

  it('überspringt fehlende Strecken und Rücksprünge', () => {
    const track = {
      time: [0, 100, 200, 300, 400],
      distance: [0, null, 1000, 900, 2000],
    };
    expect(fastestSeconds(track, 1000)).toBe(200);
  });

  it('nimmt die Strecken der Sportart und verwirft GPS-Sprünge', () => {
    expect(bestEfforts(steady, 'run')).toEqual([
      { meters: 1000, seconds: 210 },
      { meters: 5000, seconds: 1410 },
    ]);
    expect(bestEfforts(steady, 'swim')).toEqual([]);
    // 1 km in 60 s ist zu schnell für einen Lauf
    expect(bestEfforts({ time: [0, 60], distance: [0, 1000] }, 'run')).toEqual([]);
  });

  it('fasst Bestzeiten und Puls zusammen', () => {
    const summary = trackSummary(
      {
        ...steady,
        heartRate: [150, 150, 150, 170, 150, 150],
        altitude: [],
        route: [],
        laps: [],
      },
      'run',
    );
    expect(summary.bestEfforts).toHaveLength(2);
    // Abstände über 30 s zählen je 30 s
    expect(summary.heartRateSeconds).toEqual([
      [150, 120],
      [170, 30],
    ]);
  });
});

describe('Pulszonen', () => {
  it('rechnet mit max. Puls oder nach Karvonen', () => {
    expect(heartRateZoneBounds(200, null)).toEqual([100, 120, 140, 160, 180]);
    expect(heartRateZoneBounds(200, 60)).toEqual([130, 144, 158, 172, 186]);
    // unsinniger Ruhepuls wird ignoriert
    expect(heartRateZoneBounds(150, 160)).toEqual([75, 90, 105, 120, 135]);
  });

  it('summiert die Zeit je Zone, Pausen zählen höchstens 30 s', () => {
    const track = {
      time: [0, 10, 20, 30, 330, 340],
      heartRate: [90, 125, 150, 185, 130, null],
    };
    // 300-s-Lücke nach dem Punkt mit 185 zählt als 30 s in Zone 5
    expect(zoneSeconds(track, [100, 120, 140, 160, 180])).toEqual([0, 20, 10, 0, 30]);
  });
});

describe('distanceSplits', () => {
  it('teilt nach Strecke und interpoliert die Zeit', () => {
    const track = {
      time: [0, 300, 600, 900],
      distance: [0, 1000, 2000, 2500],
      heartRate: [140, 150, 160, 170],
    };
    expect(distanceSplits(track, 1000)).toEqual([
      { index: 1, distanceMeters: 1000, durationSeconds: 300, avgHeartRate: 140 },
      { index: 2, distanceMeters: 1000, durationSeconds: 300, avgHeartRate: 150 },
      { index: 3, distanceMeters: 500, durationSeconds: 300, avgHeartRate: 165 },
    ]);
    expect(
      distanceSplits({ time: [0, 450], distance: [0, 1500], heartRate: [null, null] }, 1000),
    ).toEqual([
      { index: 1, distanceMeters: 1000, durationSeconds: 300, avgHeartRate: null },
      { index: 2, distanceMeters: 500, durationSeconds: 150, avgHeartRate: null },
    ]);
  });

  it('lässt einen sehr kurzen Rest weg und braucht eine Strecke', () => {
    expect(
      distanceSplits({ time: [0, 300, 310], distance: [0, 1000, 1050], heartRate: [] }, 1000),
    ).toHaveLength(1);
    expect(distanceSplits({ time: [0, 10], distance: [null, null], heartRate: [] }, 1000)).toEqual(
      [],
    );
  });
});

describe('Diagramm und Strecke', () => {
  it('liefert Punkte nach Strecke oder Zeit, ausgedünnt', () => {
    const track = {
      time: [0, 60, 120, 180],
      distance: [0, 500, null, 1500],
      heartRate: [100, 110, 120, 130],
      altitude: [10, null, 12, 13],
    };
    expect(trackChartPoints(track, 'distance', 1000)).toEqual([
      { x: 0, heartRate: 100, altitude: 10 },
      { x: 0.5, heartRate: 110, altitude: null },
      { x: 1.5, heartRate: 130, altitude: 13 },
    ]);
    expect(trackChartPoints(track, 'time', 1000, 2).map((p) => p.x)).toEqual([0, 2]);
  });

  it('zeichnet die Strecke in den Rahmen', () => {
    expect(projectRoute([[52.5, 13.4]], 100, 100)).toBeNull();
    const points = projectRoute(
      [
        [52.5, 13.4],
        [52.6, 13.4],
      ],
      100,
      200,
    );
    // Norden oben: der zweite Punkt liegt höher (kleineres y)
    expect(points).toEqual([
      [50, 192],
      [50, 8],
    ]);
    expect(svgPath(points!)).toBe('M50 192 L50 8');
  });
});
