import { createZip, gzip, sampleFitRun, sampleGpx } from '../../test/importFiles';
import { readImportFiles } from './readFiles';

const START = Date.parse('2026-10-01T06:00:00Z');
const run = { start: START, step: 5, count: 121, speed: 3, heartRate: () => 150 };

const file = (data: Uint8Array | string, name: string) => new File([data as BlobPart], name);

describe('readImportFiles', () => {
  it('liest FIT, GPX und TCX unabhängig von der Endung', async () => {
    const result = await readImportFiles([
      file(sampleFitRun(run), 'activity'),
      file(sampleGpx({ ...run, start: START + 86_400_000 }), 'lauf.gpx'),
    ]);
    expect(result.problems).toEqual([]);
    expect(result.fileCount).toBe(2);
    expect(result.candidates.map((candidate) => candidate.importInfo)).toEqual([
      { format: 'fit', fileName: 'activity', device: 'Garmin' },
      { format: 'gpx', fileName: 'lauf.gpx', device: 'StravaGPX' },
    ]);
  });

  it('entpackt ZIPs, auch verschachtelt, und .gz wie im Strava-Export', async () => {
    const inner = await createZip([
      { name: 'UploadedFiles/1_ACTIVITY.fit', data: sampleFitRun(run) },
    ]);
    const outer = await createZip([
      {
        name: 'activities/123.gpx.gz',
        data: await gzip(new TextEncoder().encode(sampleGpx({ ...run, start: START + 1e8 }))),
      },
      { name: 'DI_CONNECT/Part1.zip', data: inner, store: true },
      { name: 'media/foto.jpg', data: 'kein Bild' },
      { name: 'profile.csv', data: 'a;b' },
      { name: '__MACOSX/activities/._123.gpx.gz', data: 'Müll' },
    ]);
    const progress: number[] = [];
    const result = await readImportFiles([file(outer, 'export.zip')], (count) =>
      progress.push(count),
    );
    expect(result.problems).toEqual([]);
    expect(result.candidates.map((candidate) => candidate.importInfo.fileName)).toEqual([
      '123.gpx',
      '1_ACTIVITY.fit',
    ]);
    expect(progress).toEqual([1, 2]);
  });

  it('meldet Probleme je Datei, ohne den Rest abzubrechen', async () => {
    const zip = await createZip([{ name: 'notiz.txt', data: 'hallo' }]);
    const result = await readImportFiles([
      file('hallo', 'notiz.txt'),
      file(zip, 'leer.zip'),
      file('<gpx><trk>', 'kaputt.gpx'),
      file(sampleFitRun(run), 'ok.fit'),
    ]);
    expect(result.candidates).toHaveLength(1);
    expect(result.problems).toEqual([
      { fileName: 'notiz.txt', message: expect.stringContaining('Unbekanntes Format') },
      {
        fileName: 'leer.zip',
        message: expect.stringContaining('Keine FIT-, GPX- oder TCX-Dateien'),
      },
      { fileName: 'kaputt.gpx', message: expect.stringContaining('kein gültiges XML') },
    ]);
  });
});
