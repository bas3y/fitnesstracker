import { daysSince, getBackupReminder } from './backupReminder';

const now = new Date('2026-10-28T12:00:00.000Z');

describe('daysSince', () => {
  it('zählt volle Tage', () => {
    expect(daysSince('2026-10-28T08:00:00.000Z', now)).toBe(0);
    expect(daysSince('2026-10-27T12:00:00.000Z', now)).toBe(1);
    expect(daysSince('2026-10-21T13:00:00.000Z', now)).toBe(6);
  });

  it('liefert nie negative Werte', () => {
    expect(daysSince('2026-11-01T00:00:00.000Z', now)).toBe(0);
  });
});

describe('getBackupReminder', () => {
  const createdAt = '2026-01-01T00:00:00.000Z';

  it('erinnert erst ab 7 Tagen nach dem letzten Backup', () => {
    expect(getBackupReminder({ lastBackupAt: '2026-10-22T12:00:00.000Z', createdAt }, now)).toBe(
      null,
    );
    expect(getBackupReminder({ lastBackupAt: '2026-10-21T12:00:00.000Z', createdAt }, now)).toEqual(
      { days: 7, never: false },
    );
  });

  it('zählt ohne Backup ab der ersten Nutzung', () => {
    expect(
      getBackupReminder({ lastBackupAt: null, createdAt: '2026-10-25T00:00:00.000Z' }, now),
    ).toBe(null);
    expect(
      getBackupReminder({ lastBackupAt: null, createdAt: '2026-10-01T12:00:00.000Z' }, now),
    ).toEqual({ days: 27, never: true });
  });
});
