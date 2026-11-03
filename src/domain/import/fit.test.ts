import { encodeFit, fitTime, sampleFitRun } from '../../test/importFiles';
import { decodeFitMessages, fitSport, isFit, parseFit } from './fit';
import { ImportFileError } from './types';

const START = Date.parse('2026-10-01T06:00:00Z');
const run = {
  start: START,
  step: 5,
  count: 361,
  speed: 2.8,
  heartRate: (i: number) => 120 + (i % 40),
};

describe('FIT', () => {
  it('liest Zusammenfassung, Verlauf, Runden und Hersteller', () => {
    const [activity] = parseFit(sampleFitRun(run));
    expect(activity).toMatchObject({
      format: 'fit',
      device: 'Garmin',
      sport: 'run',
      startTime: START,
      timerSeconds: 1800,
      elapsedSeconds: 1800,
      distanceMeters: 5040,
      calories: 400,
      avgHeartRate: 150,
      maxHeartRate: 170,
      elevationGainMeters: 12,
    });
    expect(activity!.points).toHaveLength(361);
    expect(activity!.points[1]).toMatchObject({
      time: START + 5000,
      heartRate: 121,
      altitude: 40,
      distance: 14,
    });
    expect(activity!.points[0]!.lat).toBeCloseTo(52.5, 5);
    expect(activity!.points[0]!.lon).toBeCloseTo(13.4, 5);
    expect(activity!.laps).toEqual([
      {
        startSeconds: 0,
        durationSeconds: 1800,
        distanceMeters: 5040,
        avgHeartRate: 150,
        maxHeartRate: 170,
      },
    ]);
  });

  it('erkennt FIT am Inhalt', () => {
    expect(isFit(sampleFitRun(run))).toBe(true);
    expect(isFit(new TextEncoder().encode('<gpx></gpx>'))).toBe(false);
  });

  it('liest Big Endian, ungültige Werte und komprimierte Zeitstempel', () => {
    const base = fitTime(START);
    const bytes = encodeFit(
      [
        {
          num: 20,
          fields: [
            { num: 253, type: 'uint32', value: base },
            { num: 3, type: 'uint8', value: null },
            { num: 2, type: 'uint16', value: null },
          ],
        },
        // Versatz 3 → base + 3 (bzw. mit Überlauf der unteren 5 Bit)
        {
          num: 20,
          fields: [{ num: 3, type: 'uint8', value: 140 }],
          compressedOffset: (base + 3) & 0x1f,
        },
      ],
      { bigEndian: true },
    );
    const records = decodeFitMessages(bytes).filter((message) => message.num === 20);
    expect(records[0]!.fields.get(3)).toBeNull();
    expect(records[0]!.fields.get(2)).toBeNull();
    expect(records[1]!.fields.get(253)).toBe(base + 3);
    expect(records[1]!.fields.get(3)).toBe(140);
  });

  it('nimmt ohne Zusammenfassung den Verlauf', () => {
    const bytes = encodeFit([
      { num: 20, fields: [{ num: 253, type: 'uint32', value: fitTime(START) }] },
      { num: 20, fields: [{ num: 253, type: 'uint32', value: fitTime(START + 60_000) }] },
    ]);
    const [activity] = parseFit(bytes);
    expect(activity).toMatchObject({ startTime: START, sport: 'other', timerSeconds: null });
    expect(activity!.points).toHaveLength(2);
  });

  it('liest abgeschnittene Dateien, soweit möglich', () => {
    const bytes = sampleFitRun(run);
    const [activity] = parseFit(bytes.slice(0, 2000));
    expect(activity!.points.length).toBeGreaterThan(10);
    expect(activity!.points.length).toBeLessThan(361);
  });

  it('lehnt andere FIT-Dateien und Fremdes ab', () => {
    const course = encodeFit([{ num: 0, fields: [{ num: 0, type: 'enum', value: 6 }] }]);
    expect(() => parseFit(course)).toThrow(ImportFileError);
    expect(() => parseFit(new Uint8Array([1, 2, 3]))).toThrow('Keine FIT-Datei');
    expect(() => parseFit(encodeFit([]))).toThrow('keine Einheit');
  });

  it('bildet Sportarten ab', () => {
    expect(fitSport(1, 0)).toBe('run');
    expect(fitSport(2, 7)).toBe('ride');
    expect(fitSport(21, null)).toBe('ride');
    expect(fitSport(5, 17)).toBe('swim');
    expect(fitSport(11, null)).toBe('hike');
    expect(fitSport(17, null)).toBe('hike');
    expect(fitSport(10, 43)).toBe('mobility');
    expect(fitSport(10, 20)).toBe('other');
    expect(fitSport(null, null)).toBe('other');
    const [yoga] = parseFit(sampleFitRun(run, { sport: 10, subSport: 43 }));
    expect(yoga!.sport).toBe('mobility');
  });
});
