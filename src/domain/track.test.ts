import {
  distanceSplits,
  heartRateZoneBounds,
  projectRoute,
  svgPath,
  trackChartPoints,
  zoneSeconds,
} from './track';

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
