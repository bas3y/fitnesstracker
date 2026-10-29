import {
  formatClock,
  formatSetSummary,
  formatWeight,
  formatWorkoutDuration,
  fromDateTimeInput,
  moveItem,
  restRemainingSeconds,
  suggestSetValues,
  toDateInput,
  toTimeInput,
  workoutDurationSeconds,
} from './workout';

const set = (weight: number | null, reps: number | null, isWarmup = false) => ({
  weight,
  reps,
  durationSeconds: null,
  isWarmup,
});

describe('formatClock / formatWorkoutDuration', () => {
  it('formatiert Sekunden als Uhrzeit', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(45)).toBe('0:45');
    expect(formatClock(90.4)).toBe('1:30');
    expect(formatClock(3723)).toBe('1:02:03');
    expect(formatClock(-5)).toBe('0:00');
  });

  it('formatiert Workout-Dauern in Minuten/Stunden', () => {
    expect(formatWorkoutDuration(45 * 60)).toBe('45 min');
    expect(formatWorkoutDuration(65 * 60)).toBe('1 h 05 min');
  });
});

describe('workoutDurationSeconds / restRemainingSeconds', () => {
  const now = new Date('2026-10-29T10:30:00.000Z');

  it('nutzt das Ende oder – bei laufenden Workouts – jetzt', () => {
    const startedAt = '2026-10-29T10:00:00.000Z';
    expect(workoutDurationSeconds({ startedAt, endedAt: null }, now)).toBe(1800);
    expect(workoutDurationSeconds({ startedAt, endedAt: '2026-10-29T10:10:00.000Z' }, now)).toBe(
      600,
    );
  });

  it('rechnet die Pause über den Zeitstempel (läuft nach Neustart weiter)', () => {
    expect(restRemainingSeconds(null, now)).toBeNull();
    expect(restRemainingSeconds('2026-10-29T10:31:30.000Z', now)).toBe(90);
    expect(restRemainingSeconds('2026-10-29T10:30:00.400Z', now)).toBe(1);
    expect(restRemainingSeconds('2026-10-29T10:29:00.000Z', now)).toBe(0);
  });
});

describe('suggestSetValues', () => {
  it('übernimmt den vorigen Satz im Workout', () => {
    expect(
      suggestSetValues({
        previous: set(80, 8),
        lastTime: [set(100, 5)],
        index: 1,
        isBodyweight: false,
      }),
    ).toEqual({ weight: 80, reps: 8, durationSeconds: null });
  });

  it('nimmt sonst den passenden Arbeitssatz vom letzten Mal (ohne Aufwärmsätze)', () => {
    const lastTime = [set(40, 10, true), set(80, 8), set(82.5, 6)];
    expect(
      suggestSetValues({ previous: undefined, lastTime, index: 0, isBodyweight: false }),
    ).toEqual({ weight: 80, reps: 8, durationSeconds: null });
    expect(
      suggestSetValues({ previous: undefined, lastTime, index: 5, isBodyweight: false }),
    ).toEqual({ weight: 82.5, reps: 6, durationSeconds: null });
  });

  it('springt nach einem Aufwärmsatz auf den Arbeitssatz vom letzten Mal', () => {
    expect(
      suggestSetValues({
        previous: set(40, 10, true),
        lastTime: [set(80, 8)],
        index: 0,
        isBodyweight: false,
      }),
    ).toEqual({ weight: 80, reps: 8, durationSeconds: null });
  });

  it('startet leer bzw. mit 0 kg Zusatzgewicht bei Körpergewichtsübungen', () => {
    expect(
      suggestSetValues({ previous: undefined, lastTime: [], index: 0, isBodyweight: false }),
    ).toEqual({ weight: null, reps: null, durationSeconds: null });
    expect(
      suggestSetValues({ previous: undefined, lastTime: [], index: 0, isBodyweight: true }),
    ).toEqual({ weight: 0, reps: null, durationSeconds: null });
  });
});

describe('formatWeight / formatSetSummary', () => {
  const kg = { unit: 'kg' as const, isTimed: false, isBodyweight: false };
  const extras = { durationSeconds: null, rpe: null, rir: null };

  it('formatiert Gewichte mit Einheit und Vorzeichen', () => {
    expect(formatWeight(82.5, 'kg')).toBe('82,5 kg');
    expect(formatWeight(10, 'kg', true)).toBe('+10 kg');
    expect(formatWeight(-20, 'kg', true)).toBe('−20 kg');
    expect(formatWeight(0, 'kg', true)).toBe('0 kg');
    expect(formatWeight(102.0582, 'lb')).toBe('225 lb');
  });

  it('zeigt Gewicht × Wdh., optional mit RPE/RIR', () => {
    expect(formatSetSummary({ ...extras, weight: 80, reps: 8 }, kg)).toBe('80 kg × 8');
    expect(formatSetSummary({ ...extras, weight: null, reps: 12 }, kg)).toBe('12 Wdh.');
    expect(formatSetSummary({ ...extras, weight: 80, reps: null }, kg)).toBe('80 kg × –');
    expect(formatSetSummary({ ...extras, weight: 80, reps: 8, rpe: 8.5, rir: 1 }, kg)).toBe(
      '80 kg × 8 (RPE 8,5, RIR 1)',
    );
  });

  it('zeigt Körpergewichtsübungen ohne 0 kg und mit Zusatzgewicht/Unterstützung', () => {
    const bw = { ...kg, isBodyweight: true };
    expect(formatSetSummary({ ...extras, weight: 0, reps: 10 }, bw)).toBe('10 Wdh.');
    expect(formatSetSummary({ ...extras, weight: 10, reps: 5 }, bw)).toBe('+10 kg × 5');
    expect(formatSetSummary({ ...extras, weight: -15, reps: 8 }, bw)).toBe('−15 kg × 8');
  });

  it('zeigt bei Halteübungen die Dauer', () => {
    const hold = { ...kg, isTimed: true, isBodyweight: true };
    expect(formatSetSummary({ ...extras, weight: 0, reps: null, durationSeconds: 45 }, hold)).toBe(
      '0:45',
    );
    expect(formatSetSummary({ ...extras, weight: 5, reps: null, durationSeconds: 30 }, hold)).toBe(
      '+5 kg · 0:30',
    );
  });
});

describe('moveItem', () => {
  it('tauscht mit dem Nachbarn und bleibt am Rand unverändert', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'b', 'c']);
  });
});

describe('Datum/Uhrzeit-Eingaben', () => {
  it('wandelt lokale Eingaben hin und zurück', () => {
    const iso = fromDateTimeInput('2026-10-29', '07:45');
    expect(iso).not.toBeNull();
    expect(toDateInput(iso!)).toBe('2026-10-29');
    expect(toTimeInput(iso!)).toBe('07:45');
  });

  it('lehnt ungültige Eingaben ab', () => {
    expect(fromDateTimeInput('', '07:45')).toBeNull();
    expect(fromDateTimeInput('2026-10-29', '7 Uhr')).toBeNull();
  });
});
