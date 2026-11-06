import { nowIso } from './repository';

describe('nowIso', () => {
  afterEach(() => vi.useRealTimers());

  it('zählt in derselben Millisekunde weiter und folgt größeren Uhrsprüngen', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-05T10:00:00.000Z'));
    expect([nowIso(), nowIso(), nowIso()]).toEqual([
      '2026-11-05T10:00:00.000Z',
      '2026-11-05T10:00:00.001Z',
      '2026-11-05T10:00:00.002Z',
    ]);
    vi.setSystemTime(new Date('2026-11-05T10:00:00.010Z'));
    expect(nowIso()).toBe('2026-11-05T10:00:00.010Z');
    vi.setSystemTime(new Date('2026-11-01T08:00:00.000Z'));
    expect(nowIso()).toBe('2026-11-01T08:00:00.000Z');
  });

  it('bleibt aufsteigend, wenn viele Aufrufe der Uhr davonlaufen', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-06T10:00:00.000Z'));
    const burst = Array.from({ length: 500 }, () => nowIso());
    vi.setSystemTime(new Date('2026-11-06T10:00:00.100Z'));
    const after = nowIso();
    expect(after > burst.at(-1)!).toBe(true);
    expect(new Set(burst).size).toBe(500);
  });
});
