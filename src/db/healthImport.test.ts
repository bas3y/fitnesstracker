import { healthDay, planHealthImport } from '../domain/import/health';
import { DAILY_IMPORT_FIELDS } from './types';
import { getDailyLog, listDailyLogs, updateDailyLog } from './daily';
import { applyHealthImport } from './healthImport';
import { getSettings } from './settings';
import { resetDatabase } from './testUtils';

beforeEach(resetDatabase);

const TODAY = '2026-11-04';
const phases = { deep: 3600, light: 14_400, rem: 5400, awake: 600 };

async function importDays(days: ReturnType<typeof healthDay>[]) {
  const plan = planHealthImport(days, await listDailyLogs(), DAILY_IMPORT_FIELDS, TODAY);
  await applyHealthImport(plan.changes);
  return plan;
}

describe('Gesundheitsdaten importieren', () => {
  it('speichert Werte mit Herkunft, eigene Einträge bleiben', async () => {
    await updateDailyLog('2026-11-02', { steps: 4000, mood: 4 });
    await importDays([
      healthDay('2026-11-02', {
        steps: 9000,
        sleepSeconds: 25_200,
        sleepPhases: phases,
        restingHeartRate: 50,
      }),
    ]);
    expect(await getDailyLog('2026-11-02')).toMatchObject({
      steps: 4000,
      mood: 4,
      sleepSeconds: 25_200,
      sleepPhases: phases,
      restingHeartRate: 50,
      importedFields: ['sleep', 'restingHeartRate'],
    });
  });

  it('eigene Änderung macht einen importierten Wert zum eigenen, neue Schlafdauer verwirft Phasen', async () => {
    await importDays([
      healthDay('2026-11-02', { steps: 9000, sleepSeconds: 25_200, sleepPhases: phases }),
    ]);
    await updateDailyLog('2026-11-02', { sleepSeconds: 27_000 });
    expect(await getDailyLog('2026-11-02')).toMatchObject({
      steps: 9000,
      sleepSeconds: 27_000,
      sleepPhases: null,
      importedFields: ['steps'],
    });

    const plan = await importDays([
      healthDay('2026-11-02', { steps: 9500, sleepSeconds: 25_200, sleepPhases: phases }),
    ]);
    expect(plan.counts.sleep.kept).toBe(1);
    expect(await getDailyLog('2026-11-02')).toMatchObject({ steps: 9500, sleepSeconds: 27_000 });
  });

  it('das neueste importierte Gewicht wird zum Körpergewicht', async () => {
    await updateDailyLog('2026-10-01', { weightKg: 85 });
    await importDays([
      healthDay('2026-11-01', { weightKg: 81 }),
      healthDay('2026-11-03', { weightKg: 80.4 }),
    ]);
    expect((await getSettings())?.bodyWeightKg).toBe(80.4);
  });
});
