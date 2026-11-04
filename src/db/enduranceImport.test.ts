import { readImportFiles } from '../domain/import/readFiles';
import { sampleFitRun, sampleGpx } from '../test/importFiles';
import { createBackup, parseBackup, restoreBackup } from './backup';
import { db } from './database';
import {
  createEnduranceSession,
  createGear,
  deleteEnduranceSession,
  listEnduranceSessions,
  loadEnduranceSession,
  loadEnduranceTrack,
} from './endurance';
import { applyEnduranceImport, planEnduranceImport, type ImportChoice } from './enduranceImport';
import { resetDatabase } from './testUtils';

beforeEach(resetDatabase);

const run = (start: string, speed = 2.8) => ({
  start: Date.parse(start),
  step: 5,
  count: 361,
  speed,
  heartRate: () => 150,
});

async function candidatesFrom(...files: File[]) {
  const { candidates, problems } = await readImportFiles(files);
  expect(problems).toEqual([]);
  return candidates;
}

const fitFile = (start: string, speed?: number) =>
  new File([sampleFitRun(run(start, speed)) as BlobPart], `${start}.fit`);

async function importAll(files: File[]) {
  const planned = await planEnduranceImport(await candidatesFrom(...files));
  const choices: ImportChoice[] = planned.map((item) => ({
    planned: item,
    sport: item.candidate.session.sport,
  }));
  return { planned, summary: await applyEnduranceImport(choices) };
}

describe('Import von Einheiten', () => {
  it('speichert Einheit und Verlauf getrennt', async () => {
    const { summary } = await importAll([fitFile('2026-10-01T06:00:00Z')]);
    expect(summary).toMatchObject({ created: 1, merged: 0, skipped: 0 });
    const [session] = await listEnduranceSessions();
    expect(session).toMatchObject({
      sport: 'run',
      startedAt: '2026-10-01T06:00:00.000Z',
      durationSeconds: 1800,
      distanceMeters: 5040,
      avgHeartRate: 150,
      source: 'import',
      importInfo: { format: 'fit', fileName: '2026-10-01T06:00:00Z.fit', device: 'Garmin' },
      gearId: null,
    });
    const track = await loadEnduranceTrack(session!.id);
    expect(track!.time).toHaveLength(361);
    expect(track!.route.length).toBeGreaterThanOrEqual(2);
    expect(track!.laps).toHaveLength(1);

    // Löschen der Einheit entfernt auch den Verlauf
    await deleteEnduranceSession(session!.id);
    expect(await loadEnduranceTrack(session!.id)).toBeNull();
  });

  it('übernimmt die gewählte Sportart', async () => {
    const planned = await planEnduranceImport(
      await candidatesFrom(fitFile('2026-10-01T06:00:00Z')),
    );
    await applyEnduranceImport([{ planned: planned[0]!, sport: 'hike' }]);
    expect((await listEnduranceSessions())[0]).toMatchObject({ sport: 'hike' });
  });

  it('überspringt Duplikate, auch beim zweiten Import', async () => {
    const files = [fitFile('2026-10-01T06:00:00Z')];
    await importAll(files);
    const gpx = new File([sampleGpx(run('2026-10-01T06:00:30Z'))], 'strava.gpx');
    const { planned, summary } = await importAll([...files, gpx]);
    expect(planned.map((item) => item.status)).toEqual(['duplicate', 'duplicate']);
    expect(summary).toMatchObject({ created: 0, merged: 0, skipped: 2 });
    expect(await db.enduranceTracks.count()).toBe(1);
  });

  it('ergänzt eine manuell erfasste Einheit, ohne Eingetragenes zu überschreiben', async () => {
    const manual = await createEnduranceSession({
      sport: 'run',
      title: 'Mein Lauf',
      startedAt: '2026-10-01T06:01:00.000Z',
      durationSeconds: 1850,
      distanceMeters: 5000,
      avgHeartRate: null,
      maxHeartRate: null,
      elevationGainMeters: null,
      calories: null,
      rating: 5,
      notes: 'gut',
      gearId: null,
      poolLengthMeters: null,
      laps: null,
      swimStroke: null,
      swolf: null,
    });
    const { planned, summary } = await importAll([fitFile('2026-10-01T06:00:00Z')]);
    expect(planned[0]).toMatchObject({ status: 'merge', matchId: manual.id });
    expect(summary).toMatchObject({ created: 0, merged: 1, skipped: 0 });
    expect(await loadEnduranceSession(manual.id)).toMatchObject({
      title: 'Mein Lauf',
      startedAt: '2026-10-01T06:01:00.000Z',
      durationSeconds: 1850,
      distanceMeters: 5000,
      avgHeartRate: 150,
      maxHeartRate: 170,
      calories: 400,
      rating: 5,
      notes: 'gut',
      source: 'manual',
      importInfo: { format: 'fit' },
    });
    expect(await loadEnduranceTrack(manual.id)).not.toBeNull();

    // Ein weiterer Import derselben Einheit ändert nichts mehr
    const again = await importAll([fitFile('2026-10-01T06:00:00Z')]);
    expect(again.summary).toMatchObject({ created: 0, merged: 0, skipped: 1 });
  });

  it('ordnet Ausrüstung nur Einheiten nach ihrer Anlage zu', async () => {
    const shoe = await createGear({
      name: 'Pegasus',
      sports: ['run'],
      initialDistanceMeters: 0,
      warnDistanceMeters: null,
      notes: '',
    });
    await db.gear.update(shoe.id, { createdAt: '2026-10-15T00:00:00.000Z' });
    await importAll([fitFile('2026-10-01T06:00:00Z'), fitFile('2026-10-20T06:00:00Z')]);
    const sessions = await listEnduranceSessions();
    expect(sessions.map((session) => [session.startedAt.slice(0, 10), session.gearId])).toEqual([
      ['2026-10-20', shoe.id],
      ['2026-10-01', null],
    ]);
  });

  it('sichert Verläufe im Backup', async () => {
    await importAll([fitFile('2026-10-01T06:00:00Z')]);
    const backup = await createBackup();
    expect(backup.tables.enduranceTracks).toHaveLength(1);
    const parsed = parseBackup(JSON.parse(JSON.stringify(backup)));
    expect(parsed.ok).toBe(true);
    await resetDatabase();
    if (parsed.ok) await restoreBackup(parsed.backup);
    const [session] = await listEnduranceSessions();
    expect((await loadEnduranceTrack(session!.id))!.time).toHaveLength(361);
  });

  it('speichert Bestzeiten und Pulsverteilung an der Einheit', async () => {
    await importAll([fitFile('2026-10-01T06:00:00Z')]);
    const [session] = await listEnduranceSessions();
    // 2,8 m/s: 1 km in 357 s, 5 km in 1786 s; 360 Abstände à 5 s mit Puls 150
    expect(session!.trackSummary).toEqual({
      bestEfforts: [
        { meters: 1000, seconds: 357 },
        { meters: 5000, seconds: 1786 },
      ],
      heartRateSeconds: [[150, 1800]],
    });
  });

  it('meldet neue Bestzeiten erst gegenüber früheren Einheiten', async () => {
    const first = await importAll([fitFile('2026-10-01T06:00:00Z')]);
    expect(first.summary.records).toEqual([]);
    const slower = await importAll([fitFile('2026-10-03T06:00:00Z', 2.5)]);
    expect(slower.summary.records).toEqual([]);
    const faster = await importAll([fitFile('2026-10-05T06:00:00Z', 3.2)]);
    expect(faster.summary.records.map(({ meters, seconds }) => [meters, seconds])).toEqual([
      [1000, 313],
      [5000, 1563],
    ]);
    expect(faster.summary.records[0]!.sessionId).toBe(faster.summary.sessionIds[0]);
  });

  it('ergänzt die Zusammenfassung beim Ergänzen und nach einer älteren Sicherung', async () => {
    const manual = await createEnduranceSession({
      sport: 'run',
      title: '',
      startedAt: '2026-10-01T06:00:00.000Z',
      durationSeconds: 1800,
      distanceMeters: null,
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
    });
    expect(manual.trackSummary).toBeNull();
    await importAll([fitFile('2026-10-01T06:00:00Z')]);
    const merged = await loadEnduranceSession(manual.id);
    expect(merged!.trackSummary!.bestEfforts).toHaveLength(2);

    // Sicherung aus DB-Version 19 kennt das Feld nicht
    const backup = JSON.parse(JSON.stringify(await createBackup()));
    backup.dbVersion = 19;
    for (const session of backup.tables.enduranceSessions) delete session.trackSummary;
    const parsed = parseBackup(backup);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) await restoreBackup(parsed.backup);
    expect((await loadEnduranceSession(manual.id))!.trackSummary).toEqual(merged!.trackSummary);
  });
});
