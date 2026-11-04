import { dayKey, shiftDay } from '../domain/daily';
import { db } from './database';
import {
  createEnduranceSession,
  createGear,
  deleteEnduranceSession,
  deleteGear,
  listEnduranceSessions,
  listGear,
  loadEnduranceSession,
  loadGear,
  setGearArchived,
  updateEnduranceSession,
  updateGear,
} from './endurance';
import { loadNutritionDay } from './nutrition';
import type { EnduranceSessionInput, GearInput } from './schemas';
import { loadTrainingDays } from './supplements';
import { resetDatabase } from './testUtils';

beforeEach(resetDatabase);

const START = '2026-11-03T17:00:00.000Z';
const RUN: EnduranceSessionInput = {
  sport: 'run',
  title: '',
  startedAt: START,
  durationSeconds: 1800,
  distanceMeters: 6000,
  avgHeartRate: 150,
  maxHeartRate: 172,
  elevationGainMeters: 40,
  calories: 400,
  rating: 4,
  notes: '',
  gearId: null,
  poolLengthMeters: null,
  laps: null,
  swimStroke: null,
  swolf: null,
};
const SHOE: GearInput = {
  name: 'Pegasus',
  sports: ['run'],
  initialDistanceMeters: 0,
  warnDistanceMeters: 700_000,
  notes: '',
};

describe('Ausdauer-Einheiten', () => {
  it('legt an, listet neueste zuerst und prüft die Eingaben', async () => {
    const first = await createEnduranceSession({ ...RUN, title: ' Morgenlauf ' });
    const second = await createEnduranceSession({ ...RUN, startedAt: '2026-11-04T06:00:00.000Z' });
    expect(first).toMatchObject({
      title: 'Morgenlauf',
      source: 'manual',
      importInfo: null,
      deletedAt: null,
    });
    expect((await listEnduranceSessions()).map((s) => s.id)).toEqual([second.id, first.id]);
    await expect(createEnduranceSession({ ...RUN, durationSeconds: 0 })).rejects.toThrow();
    await expect(
      createEnduranceSession({ ...RUN, avgHeartRate: 180, maxHeartRate: 170 }),
    ).rejects.toThrow();
    await expect(createEnduranceSession({ ...RUN, rating: 6 })).rejects.toThrow();
  });

  it('leert Felder, die zur Sportart nicht passen', async () => {
    const yoga = await createEnduranceSession({
      ...RUN,
      sport: 'mobility',
      gearId: 'g1',
      laps: 10,
    });
    expect(yoga).toMatchObject({
      distanceMeters: null,
      elevationGainMeters: null,
      gearId: null,
      laps: null,
      avgHeartRate: 150,
    });
    const run = await createEnduranceSession({ ...RUN, laps: 10, swolf: 40 });
    expect(run).toMatchObject({ laps: null, swolf: null, distanceMeters: 6000 });
  });

  it('Schwimmen: Distanz aus Bahnen × Bahnlänge, ohne Höhenmeter', async () => {
    const swim = await createEnduranceSession({
      ...RUN,
      sport: 'swim',
      distanceMeters: 500,
      poolLengthMeters: 25,
      laps: 40,
      swimStroke: 'freestyle',
      swolf: 38,
    });
    expect(swim).toMatchObject({
      distanceMeters: 1000,
      elevationGainMeters: null,
      swimStroke: 'freestyle',
      swolf: 38,
    });
    // Ohne Bahnen (Freiwasser) bleibt die eingegebene Distanz
    const open = await createEnduranceSession({ ...RUN, sport: 'swim', distanceMeters: 1500 });
    expect(open.distanceMeters).toBe(1500);
  });

  it('ändert und löscht weich', async () => {
    const session = await createEnduranceSession(RUN);
    await updateEnduranceSession(session.id, { ...RUN, distanceMeters: 7000, notes: 'Locker' });
    expect(await loadEnduranceSession(session.id)).toMatchObject({
      distanceMeters: 7000,
      notes: 'Locker',
      createdAt: session.createdAt,
    });
    await deleteEnduranceSession(session.id);
    expect(await loadEnduranceSession(session.id)).toBeNull();
    expect(await listEnduranceSessions()).toEqual([]);
    expect((await db.enduranceSessions.get(session.id))?.deletedAt).not.toBeNull();
  });

  it('merkt die Herkunft importierter Einheiten', async () => {
    const imported = await createEnduranceSession(RUN, {
      source: 'import',
      importInfo: { format: 'fit', fileName: 'lauf.fit', device: 'Garmin' },
    });
    expect(imported).toMatchObject({ source: 'import', importInfo: { format: 'fit' } });
  });
});

describe('Ausrüstung', () => {
  it('legt an, ändert, mustert aus und sortiert alphabetisch', async () => {
    const shoe = await createGear(SHOE);
    await createGear({ ...SHOE, name: 'Adidas' });
    expect(shoe).toMatchObject({ name: 'Pegasus', archivedAt: null });
    expect((await listGear()).map((item) => item.name)).toEqual(['Adidas', 'Pegasus']);
    await expect(createGear({ ...SHOE, sports: [] })).rejects.toThrow();
    await expect(createGear({ ...SHOE, name: ' ' })).rejects.toThrow();

    await updateGear(shoe.id, { ...SHOE, initialDistanceMeters: 120_000 });
    await setGearArchived(shoe.id, true);
    expect(await loadGear(shoe.id)).toMatchObject({ initialDistanceMeters: 120_000 });
    expect((await loadGear(shoe.id))?.archivedAt).not.toBeNull();
    await setGearArchived(shoe.id, false);
    expect((await loadGear(shoe.id))?.archivedAt).toBeNull();
  });

  it('Löschen entfernt die Zuordnung, die Einheiten bleiben', async () => {
    const shoe = await createGear(SHOE);
    const session = await createEnduranceSession({ ...RUN, gearId: shoe.id });
    await deleteGear(shoe.id);
    expect(await loadGear(shoe.id)).toBeNull();
    expect(await loadEnduranceSession(session.id)).toMatchObject({ gearId: null });
  });
});

describe('Trainingstage mit Ausdauer-Einheiten', () => {
  it('Einheit zählt als Ausdauer mit Ende = Beginn + Dauer, Mobility nur als Training', async () => {
    await createEnduranceSession(RUN);
    const key = dayKey(new Date(START));
    expect((await loadTrainingDays()).get(key)).toEqual({
      strength: false,
      endurance: true,
      startedAt: START,
      endedAt: '2026-11-03T17:30:00.000Z',
    });

    const yogaStart = '2026-11-05T07:00:00.000Z';
    await createEnduranceSession({ ...RUN, sport: 'mobility', startedAt: yogaStart });
    expect((await loadTrainingDays()).get(dayKey(new Date(yogaStart)))).toMatchObject({
      strength: false,
      endurance: false,
    });
  });

  it('mehrere Trainings am Tag: erster Beginn, Ende des letzten', async () => {
    await createEnduranceSession({ ...RUN, startedAt: '2026-11-03T16:00:00.000Z' });
    await createEnduranceSession({
      ...RUN,
      sport: 'mobility',
      startedAt: '2026-11-03T15:00:00.000Z',
      durationSeconds: 600,
    });
    expect((await loadTrainingDays()).get(dayKey(new Date(START)))).toEqual({
      strength: false,
      endurance: true,
      startedAt: '2026-11-03T15:00:00.000Z',
      endedAt: '2026-11-03T16:30:00.000Z',
    });
  });

  it('zählt für die Ernährungsziele als Trainingstag', async () => {
    const key = dayKey(new Date(START));
    expect((await loadNutritionDay(key)).isTrainingDay).toBe(false);
    await createEnduranceSession(RUN);
    expect((await loadNutritionDay(key)).isTrainingDay).toBe(true);
  });

  it('summiert die verbrannten Kalorien des Tages', async () => {
    const key = dayKey(new Date(START));
    await createEnduranceSession({ ...RUN, calories: 450 });
    await createEnduranceSession({ ...RUN, calories: null });
    const other = await createEnduranceSession({ ...RUN, calories: 300 });
    expect((await loadNutritionDay(key)).burnedKcal).toBe(750);
    await deleteEnduranceSession(other.id);
    expect((await loadNutritionDay(key)).burnedKcal).toBe(450);
    expect((await loadNutritionDay(shiftDay(key, 1))).burnedKcal).toBe(0);
  });
});
