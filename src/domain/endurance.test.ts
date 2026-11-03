import type { EnduranceSession, Gear } from '../db/types';
import {
  formatDistance,
  formatPace,
  formatSessionSummary,
  formatTotals,
  gearOptions,
  gearUsage,
  hasDistance,
  isGearWorn,
  joinDuration,
  monthRange,
  sessionEnd,
  sessionsInRange,
  sessionTitle,
  sessionTotals,
  sortSessions,
  splitDuration,
  sportWeekTotals,
  suggestGearId,
  weekRange,
  wornGear,
} from './endurance';

const BASE = {
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  deletedAt: null,
};

function session(overrides: Partial<EnduranceSession> = {}): EnduranceSession {
  return {
    ...BASE,
    id: crypto.randomUUID(),
    sport: 'run',
    title: '',
    startedAt: new Date(2026, 10, 3, 18, 0).toISOString(),
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
    source: 'manual',
    importInfo: null,
    ...overrides,
  };
}

function gear(overrides: Partial<Gear> = {}): Gear {
  return {
    ...BASE,
    id: crypto.randomUUID(),
    name: 'Schuh',
    sports: ['run'],
    initialDistanceMeters: 0,
    warnDistanceMeters: null,
    notes: '',
    archivedAt: null,
    ...overrides,
  };
}

const at = (day: number, hour = 18) => new Date(2026, 10, day, hour, 0).toISOString();

describe('Pace und Distanz', () => {
  it('Laufen/Wandern: Zeit pro km bzw. Meile', () => {
    expect(formatPace('run', 6000, 1800, 'km')).toBe('5:00 /km');
    expect(formatPace('hike', 10_000, 2 * 3600, 'km')).toBe('12:00 /km');
    expect(formatPace('run', 1609.344, 480, 'mi')).toBe('8:00 /mi');
  });

  it('Rad/Sonstiges: Geschwindigkeit, Schwimmen: pro 100 m', () => {
    expect(formatPace('ride', 50_000, 2 * 3600, 'km')).toBe('25 km/h');
    expect(formatPace('ride', 32_186.88, 3600, 'mi')).toBe('20 mph');
    expect(formatPace('other', 10_000, 3600, 'km')).toBe('10 km/h');
    expect(formatPace('swim', 1000, 1050, 'km')).toBe('1:45 /100 m');
  });

  it('ohne Distanz oder bei Mobility keine Pace', () => {
    expect(formatPace('run', null, 1800, 'km')).toBeNull();
    expect(formatPace('mobility', 1000, 1800, 'km')).toBeNull();
    expect(hasDistance('mobility')).toBe(false);
    expect(hasDistance('swim')).toBe(true);
  });

  it('formatiert Distanzen, Schwimmen immer in Metern', () => {
    expect(formatDistance(12_345, 'run', 'km')).toBe('12,35 km');
    expect(formatDistance(12_345, 'run', 'km', 1)).toBe('12,3 km');
    expect(formatDistance(1609.344, 'ride', 'mi')).toBe('1 mi');
    expect(formatDistance(1500, 'swim', 'mi')).toBe('1500 m');
  });

  it('Titel fällt auf die Sportart zurück, Kurzinfo verbindet die Werte', () => {
    expect(sessionTitle(session())).toBe('Laufen');
    expect(sessionTitle(session({ title: 'Intervalle' }))).toBe('Intervalle');
    expect(formatSessionSummary(session(), 'km')).toBe('6 km · 30:00 · 5:00 /km');
    expect(formatSessionSummary(session({ sport: 'mobility', distanceMeters: null }), 'km')).toBe(
      '30:00',
    );
  });

  it('Ende = Beginn + Dauer', () => {
    expect(
      sessionEnd(session({ startedAt: '2026-11-03T17:00:00.000Z', durationSeconds: 5400 })),
    ).toBe('2026-11-03T18:30:00.000Z');
  });
});

describe('Zeiträume und Summen', () => {
  it('Woche Mo–So und Kalendermonat', () => {
    expect(weekRange('2026-11-03')).toEqual({ from: '2026-11-02', to: '2026-11-08' });
    expect(weekRange('2026-11-08')).toEqual({ from: '2026-11-02', to: '2026-11-08' });
    expect(monthRange('2026-02-10')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  it('zählt nur die Sportart in der laufenden Woche', () => {
    const sessions = [
      session({ startedAt: at(2, 7), distanceMeters: 5000 }),
      session({ startedAt: at(8, 20), distanceMeters: 7400 }),
      session({ startedAt: at(1), distanceMeters: 10_000 }),
      session({ sport: 'ride', startedAt: at(3), distanceMeters: 30_000 }),
    ];
    expect(sportWeekTotals(sessions, 'run', '2026-11-03')).toEqual({
      count: 2,
      distanceMeters: 12_400,
      durationSeconds: 3600,
    });
    expect(sessionsInRange(sessions, monthRange('2026-11-03'))).toHaveLength(4);
  });

  it('Summe als Strecke, ohne Strecke als Dauer', () => {
    const run = sessionTotals([session({ distanceMeters: 12_400 })]);
    expect(formatTotals(run, 'run', 'km')).toBe('12,4 km');
    const yoga = sessionTotals([
      session({ sport: 'mobility', distanceMeters: null, durationSeconds: 5400 }),
    ]);
    expect(formatTotals(yoga, 'mobility', 'km')).toBe('1 h 30 min');
  });

  it('sortiert neueste zuerst', () => {
    const old = session({ startedAt: at(1) });
    const recent = session({ startedAt: at(3) });
    expect(sortSessions([old, recent])).toEqual([recent, old]);
  });
});

describe('Dauer-Eingabe', () => {
  it('zerlegt und setzt zusammen', () => {
    expect(splitDuration(3723)).toEqual({ hours: 1, minutes: 2, seconds: 3 });
    expect(joinDuration({ hours: 1, minutes: 2, seconds: 3 })).toBe(3723);
    expect(splitDuration(-5)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });
});

describe('Ausrüstung', () => {
  it('Kilometerstand = Startwert + zugeordnete Einheiten', () => {
    const shoe = gear({ initialDistanceMeters: 100_000, warnDistanceMeters: 110_000 });
    const sessions = [
      session({ gearId: shoe.id, distanceMeters: 6000 }),
      session({ gearId: shoe.id, distanceMeters: 4000 }),
      session({ distanceMeters: 20_000 }),
    ];
    expect(gearUsage(shoe, sessions)).toEqual({ distanceMeters: 110_000, sessionCount: 2 });
    expect(isGearWorn(shoe, 109_999)).toBe(false);
    expect(isGearWorn(shoe, 110_000)).toBe(true);
    expect(isGearWorn(gear(), 1e9)).toBe(false);
    expect(wornGear([shoe], sessions, 'run')).toEqual([{ gear: shoe, distanceMeters: 110_000 }]);
    expect(wornGear([shoe], sessions, 'ride')).toEqual([]);
  });

  it('Auswahl: aktive der Sportart plus die bisher gewählte', () => {
    const road = gear({ name: 'Straße' });
    const old = gear({ name: 'Alt', archivedAt: BASE.createdAt });
    const bike = gear({ name: 'Rad', sports: ['ride'] });
    expect(gearOptions([road, old, bike], 'run', null)).toEqual([road]);
    expect(gearOptions([road, old, bike], 'run', old.id)).toEqual([road, old]);
  });

  it('schlägt die zuletzt genutzte bzw. die einzige passende vor', () => {
    const road = gear({ name: 'Straße' });
    const trail = gear({ name: 'Trail' });
    expect(suggestGearId('run', [road], [])).toBe(road.id);
    expect(suggestGearId('run', [road, trail], [])).toBeNull();
    const sessions = [
      session({ startedAt: at(1), gearId: road.id }),
      session({ startedAt: at(2), gearId: trail.id }),
    ];
    expect(suggestGearId('run', [road, trail], sessions)).toBe(trail.id);
    // Ausgemusterte wird nicht mehr vorgeschlagen
    const retired = { ...trail, archivedAt: BASE.createdAt };
    expect(suggestGearId('run', [road, retired], sessions)).toBe(road.id);
    expect(suggestGearId('ride', [road, trail], sessions)).toBeNull();
  });
});
