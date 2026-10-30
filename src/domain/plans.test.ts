import { formatPlanTarget, formatRepRange, formatWeekdays, suggestPlanDay } from './plans';

const day = (id: string, weekdays: number[] = []) => ({ id, weekdays });
const MONDAY = 1;
const TUESDAY = 2;
const THURSDAY = 4;

describe('formatWeekdays', () => {
  it('zeigt Wochentage von Montag bis Sonntag, unabhängig von der Reihenfolge', () => {
    expect(formatWeekdays([0, 3, 1])).toBe('Mo, Mi, So');
    expect(formatWeekdays([])).toBe('');
  });
});

describe('formatPlanTarget', () => {
  const target = { targetSets: 3, repMin: 8, repMax: 12, targetDurationSeconds: 45 };

  it('zeigt Sätze und Wdh.-Bereich', () => {
    expect(formatPlanTarget(target, false)).toBe('3 × 8–12');
    expect(formatPlanTarget({ ...target, repMin: 5, repMax: 5 }, false)).toBe('3 × 5');
    expect(formatRepRange({ repMin: 6, repMax: 10 })).toBe('6–10');
  });

  it('zeigt bei Halteübungen die Dauer', () => {
    expect(formatPlanTarget(target, true)).toBe('3 × 0:45');
    expect(formatPlanTarget({ ...target, targetDurationSeconds: null }, true)).toBe('3 × –');
  });
});

describe('suggestPlanDay', () => {
  const rotation = [day('a'), day('b'), day('c')];

  it('schlägt ohne Tage nichts vor', () => {
    expect(
      suggestPlanDay({ days: [], schedule: 'rotation', lastDayId: null, weekday: MONDAY }),
    ).toBeNull();
  });

  it('beginnt die Rotation mit dem ersten Training', () => {
    expect(
      suggestPlanDay({ days: rotation, schedule: 'rotation', lastDayId: null, weekday: MONDAY }),
    ).toEqual({ day: rotation[0], reason: 'start', lastDay: null });
  });

  it('nimmt das Training nach dem letzten und beginnt am Ende von vorn', () => {
    const next = (lastDayId: string) =>
      suggestPlanDay({ days: rotation, schedule: 'rotation', lastDayId, weekday: MONDAY });
    expect(next('a')).toEqual({ day: rotation[1], reason: 'rotation', lastDay: rotation[0] });
    expect(next('c')?.day.id).toBe('a');
  });

  it('startet von vorn, wenn das letzte Training nicht mehr im Plan ist', () => {
    expect(
      suggestPlanDay({ days: rotation, schedule: 'rotation', lastDayId: 'x', weekday: MONDAY }),
    ).toMatchObject({ day: rotation[0], reason: 'start', lastDay: null });
  });

  const weekly = [day('mo', [MONDAY]), day('do', [THURSDAY])];

  it('schlägt im Wochenplan das heute geplante Training vor', () => {
    expect(
      suggestPlanDay({ days: weekly, schedule: 'weekdays', lastDayId: 'mo', weekday: THURSDAY }),
    ).toMatchObject({ day: weekly[1], reason: 'today' });
  });

  it('nimmt an freien Tagen das nächste Training (zum Nachholen)', () => {
    expect(
      suggestPlanDay({ days: weekly, schedule: 'weekdays', lastDayId: 'mo', weekday: TUESDAY }),
    ).toMatchObject({ day: weekly[1], reason: 'offSchedule' });
  });

  it('schlägt ein heute schon absolviertes Training nicht erneut vor', () => {
    expect(
      suggestPlanDay({
        days: weekly,
        schedule: 'weekdays',
        lastDayId: 'mo',
        weekday: MONDAY,
        trainedTodayIds: ['mo'],
      }),
    ).toMatchObject({ day: weekly[1], reason: 'offSchedule' });
  });

  it('behandelt einen Wochenplan ohne Wochentage wie eine Rotation', () => {
    expect(
      suggestPlanDay({ days: rotation, schedule: 'weekdays', lastDayId: 'a', weekday: MONDAY }),
    ).toMatchObject({ day: rotation[1], reason: 'rotation' });
  });
});
