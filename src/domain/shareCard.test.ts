import type { EnduranceSession, WorkoutSet } from '../db/types';
import {
  enduranceShareContent,
  MAX_SHARE_LINES,
  shareFileName,
  workoutShareContent,
} from './shareCard';

const STARTED = new Date(2026, 10, 4, 7, 30).toISOString();

const run: EnduranceSession = {
  id: 'run',
  createdAt: STARTED,
  updatedAt: STARTED,
  deletedAt: null,
  sport: 'run',
  title: 'Morgenlauf',
  startedAt: STARTED,
  durationSeconds: 1500,
  distanceMeters: 5000,
  avgHeartRate: 150,
  maxHeartRate: null,
  elevationGainMeters: 42,
  calories: 400,
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
};

function set(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: crypto.randomUUID(),
    createdAt: STARTED,
    updatedAt: STARTED,
    deletedAt: null,
    workoutId: 'w',
    workoutExerciseId: 'we',
    order: 0,
    weight: 80,
    reps: 8,
    durationSeconds: null,
    rpe: null,
    rir: null,
    isWarmup: false,
    restSeconds: null,
    completedAt: STARTED,
    level: null,
    eccentricWeight: null,
    eccentricLevel: null,
    ...overrides,
  };
}

describe('Teilen-Bild', () => {
  it('zeigt bei Ausdauer Distanz, Zeit, Pace, Höhenmeter und Bestzeiten', () => {
    const route: [number, number][] = [
      [52.5, 13.4],
      [52.51, 13.41],
    ];
    const content = enduranceShareContent(
      run,
      route,
      [
        { meters: 1000, seconds: 280, isBest: false },
        { meters: 5000, seconds: 1500, isBest: true },
      ],
      'km',
    );
    expect(content.title).toBe('Morgenlauf');
    expect(content.stats).toEqual([
      { label: 'Distanz', value: '5 km' },
      { label: 'Zeit', value: '25:00' },
      { label: 'Pace', value: '5:00 /km' },
      { label: 'Höhenmeter', value: '42 m' },
    ]);
    expect(content.route).toBe(route);
    expect(content.badge).toBe('Bestzeit 5 km 25:00');
  });

  it('kommt ohne Strecke und Distanz aus', () => {
    const content = enduranceShareContent(
      { ...run, sport: 'mobility', title: '', distanceMeters: null, elevationGainMeters: null },
      [],
      [],
      'km',
    );
    expect(content.title).toBe('Mobility & Yoga');
    expect(content.route).toBeNull();
    expect(content.badge).toBeNull();
    expect(content.stats.map((stat) => stat.label)).toEqual(['Zeit', 'Puls Ø', 'Kalorien']);
  });

  it('fasst ein Workout mit bestem Satz je Übung zusammen', () => {
    const bench = { name: 'Bankdrücken', isTimed: false, equipment: 'barbell' as const };
    const content = workoutShareContent({
      title: 'Push',
      startedAt: STARTED,
      durationSeconds: 3600,
      items: [
        {
          exercise: bench,
          sets: [set({ isWarmup: true, weight: 40 }), set(), set({ weight: 85, reps: 6 })],
        },
      ],
      recordCount: 2,
      bodyWeightKg: null,
      unit: 'kg',
    });
    expect(content.title).toBe('Push');
    expect(content.stats).toEqual([
      { label: 'Dauer', value: '1 h 00 min' },
      { label: 'Übungen', value: '1' },
      { label: 'Sätze', value: '2' },
      { label: 'Volumen', value: '1150 kg' },
    ]);
    expect(content.lines).toEqual(['Bankdrücken: 85 kg × 6']);
    expect(content.badge).toBe('2 Rekorde');
  });

  it('kürzt lange Übungslisten', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      exercise: { name: `Übung ${i + 1}`, isTimed: false, equipment: 'barbell' as const },
      sets: [set()],
    }));
    const content = workoutShareContent({
      title: null,
      startedAt: STARTED,
      durationSeconds: 1800,
      items,
      recordCount: 0,
      bodyWeightKg: null,
      unit: 'kg',
    });
    expect(content.title).toBe('Krafttraining');
    expect(content.lines).toHaveLength(MAX_SHARE_LINES);
    expect(content.lines.at(-1)).toBe('+ 4 weitere Übungen');
    expect(content.badge).toBeNull();
  });

  it('benennt die Datei nach Tag und Format', () => {
    expect(shareFileName(STARTED, 'story')).toBe('fitnesstracker-2026-11-04.png');
    expect(shareFileName(STARTED, 'sticker')).toBe('fitnesstracker-2026-11-04-sticker.png');
  });
});
