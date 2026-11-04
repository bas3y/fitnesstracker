import { describe, expect, it } from 'vitest';
import { createZip, sampleAppleHealthXml } from '../../test/importFiles';
import { readHealthFiles } from './readHealthFiles';

const at = (day: number, hour: number) => new Date(2026, 9, day, hour).getTime();
const file = (name: string, data: Uint8Array | string) =>
  new File([typeof data === 'string' ? data : new Uint8Array(data)], name);

const appleXml = sampleAppleHealthXml([
  { type: 'HKQuantityTypeIdentifierStepCount', start: at(1, 9), value: 5000 },
  {
    type: 'HKQuantityTypeIdentifierRestingHeartRate',
    start: at(2, 0),
    value: 51,
    unit: 'count/min',
  },
]);

const garminSleep = JSON.stringify([
  {
    calendarDate: '2026-10-02',
    deepSleepSeconds: 3600,
    lightSleepSeconds: 18_000,
    remSleepSeconds: 5400,
    awakeSleepSeconds: 0,
  },
]);

describe('readHealthFiles', () => {
  it('liest Apple-export.zip, Garmin-ZIP und meldet Unbekanntes', async () => {
    const progress: (number | null)[] = [];
    const apple = await createZip([
      { name: 'apple_health_export/export.xml', data: appleXml },
      { name: 'apple_health_export/export_cda.xml', data: '<x/>' },
      { name: 'apple_health_export/workout-routes/route_1.gpx', data: '<gpx/>' },
    ]);
    const garmin = await createZip([
      { name: 'DI_CONNECT/DI-Connect-Wellness/2026_123_sleepData.json', data: garminSleep },
      { name: 'DI_CONNECT/DI-Connect-Wellness/2026_123_kaputt_sleepData.json', data: '{' },
      { name: 'DI_CONNECT/DI-Connect-Fitness/activities.json', data: '[]' },
    ]);
    const other = await createZip([{ name: 'foto.jpg', data: 'x' }]);

    const result = await readHealthFiles(
      [
        file('export.zip', apple),
        file('garmin.zip', garmin),
        file('fotos.zip', other),
        file('notiz.txt', 'hallo'),
      ],
      (percent) => progress.push(percent),
    );

    expect(result.sources).toEqual(['garmin', 'apple']);
    expect(
      result.days.map((day) => [day.date, day.steps, day.sleepSeconds, day.restingHeartRate]),
    ).toEqual([
      ['2026-10-01', 5000, null, null],
      ['2026-10-02', null, 27_000, 51],
    ]);
    expect(result.problems).toEqual([
      { fileName: '2026_123_kaputt_sleepData.json', message: 'Keine gültige JSON-Datei' },
      {
        fileName: 'fotos.zip',
        message: 'Keine Gesundheitsdaten gefunden (erwartet: Apple-Health- oder Garmin-Export)',
      },
      {
        fileName: 'notiz.txt',
        message: 'Unbekanntes Format (erwartet: Apple-Health-Export oder Garmin-Datenexport)',
      },
    ]);
    expect(progress.length).toBeGreaterThan(0);
  });

  it('liest export.xml und einzelne Garmin-JSON auch ungepackt', async () => {
    const result = await readHealthFiles([
      file('export.xml', appleXml),
      file('2026_123_sleepData.json', garminSleep),
    ]);
    expect(result.sources).toEqual(['garmin', 'apple']);
    expect(result.days).toHaveLength(2);
    expect(result.problems).toEqual([]);
  });
});
