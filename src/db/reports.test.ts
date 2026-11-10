import { dayKey } from '../domain/daily';
import { updateDailyLog } from './daily';
import { createGoal } from './goals';
import { loadPeriodReport } from './reports';
import { emptyGoalInput } from './schemas';
import { updateSettings } from './settings';
import { resetDatabase } from './testUtils';

beforeEach(resetDatabase);

describe('loadPeriodReport', () => {
  it('ohne Ziele ist `goals` leer (null), Einheiten aus den Einstellungen', async () => {
    const today = dayKey(new Date());
    await updateSettings({ weightUnit: 'lb', proteinOnly: true });
    const report = await loadPeriodReport('month', today, today);
    expect(report.goals).toBeNull();
    expect(report.units).toEqual({ weightUnit: 'lb', distanceUnit: 'km', proteinOnly: true });
    expect(report.range.from <= today && today <= report.range.to).toBe(true);
  });

  it('erreichte Ziele im Zeitraum mit Namen', async () => {
    const today = dayKey(new Date());
    await createGoal({
      ...emptyGoalInput('bodyWeight', today),
      startValue: 90,
      target: 85,
    });
    await updateDailyLog(today, { weightKg: 84 });

    const report = await loadPeriodReport('month', today, today);
    expect(report.goals).toHaveLength(1);
    expect(report.goals![0]!.on).toBe(today);
    expect(report.goals![0]!.name).toContain('85');
    expect(report.input.logs.map((log) => log.date)).toContain(today);
  });
});
