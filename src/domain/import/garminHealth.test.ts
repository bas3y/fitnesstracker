import { describe, expect, it } from 'vitest';
import { GarminHealthCollector, isGarminHealthFile } from './garminHealth';

describe('isGarminHealthFile', () => {
  it('liest nur bekannte JSON-Dateien', () => {
    expect(
      isGarminHealthFile('DI_CONNECT/DI-Connect-Wellness/2026-07-01_2026-10-09_123_sleepData.json'),
    ).toBe(true);
    expect(isGarminHealthFile('DI_CONNECT/DI-Connect-Aggregator/UDSFile_2026-07-01.json')).toBe(
      true,
    );
    expect(isGarminHealthFile('DI_CONNECT/DI-Connect-User/user_profile.json')).toBe(false);
    expect(isGarminHealthFile('DI_CONNECT/x/sleepData.fit')).toBe(false);
  });
});

describe('GarminHealthCollector', () => {
  it('liest Schlaf, Tageswerte, HRV und Gewicht', () => {
    const collector = new GarminHealthCollector();
    collector.addJson(
      [
        {
          sleepStartTimestampGMT: '2026-10-01T21:30:00.0',
          sleepEndTimestampGMT: '2026-10-02T05:30:00.0',
          calendarDate: '2026-10-02',
          deepSleepSeconds: 3600,
          lightSleepSeconds: 16_200,
          remSleepSeconds: 6000,
          awakeSleepSeconds: 1200,
        },
        // Nicht bestätigte Nacht ohne Phasen
        { calendarDate: '2026-10-03', sleepWindowConfirmationType: 'UNCONFIRMED' },
      ],
      '2026-07-01_2026-10-09_123_sleepData.json',
    );
    collector.addJson(
      [
        { calendarDate: '2026-10-02', totalSteps: 11_234, restingHeartRate: 48, minHeartRate: 45 },
        {
          calendarDate: { date: 'Oct 3, 2026 12:00:00 AM' },
          totalSteps: 0,
          currentDayRestingHeartRate: 50,
        },
      ],
      'UDSFile_2026-07-01_2026-10-09.json',
    );
    collector.addJson(
      { hrvSummaries: [{ calendarDate: '2026-10-02', hrvSummary: { lastNightAvg: 62 } }] },
      'hrvStatus.json',
    );
    collector.addJson(
      [{ weight: { weight: 80_500 }, metaData: { calendarDate: '2026-10-02' } }],
      '123_userBioMetrics.json',
    );

    expect(collector.days()).toEqual([
      {
        date: '2026-10-02',
        steps: 11_234,
        sleepSeconds: 25_800,
        sleepPhases: { deep: 3600, light: 16_200, rem: 6000, awake: 1200 },
        weightKg: 80.5,
        restingHeartRate: 48,
        hrvMs: 62,
      },
      {
        date: '2026-10-03',
        steps: null,
        sleepSeconds: null,
        sleepPhases: null,
        weightKg: null,
        restingHeartRate: 50,
        hrvMs: null,
      },
    ]);
  });

  it('liest Gewicht nicht aus anderen Dateien', () => {
    const collector = new GarminHealthCollector();
    collector.addJson([{ calendarDate: '2026-10-02', weight: 80_000 }], 'UDSFile_1.json');
    expect(collector.days()).toEqual([]);
  });
});
