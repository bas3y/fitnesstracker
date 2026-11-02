import { db } from './database';
import {
  ensureSettings,
  getSettings,
  SETTINGS_ID,
  updateSettings,
  updateSettingsFrom,
} from './settings';
import { resetDatabase } from './testUtils';

beforeEach(resetDatabase);

describe('settings', () => {
  it('ensureSettings legt genau einen Datensatz mit Standardwerten an', async () => {
    const [a, b] = await Promise.all([ensureSettings(), ensureSettings()]);
    expect(a).toEqual(b);
    expect(a.id).toBe(SETTINGS_ID);
    expect(a.weightUnit).toBe('kg');
    expect(a.theme).toBe('system');
    expect(await db.settings.count()).toBe(1);
  });

  it('updateSettings legt bei Bedarf an und speichert Änderungen', async () => {
    await updateSettings({ name: 'Alex', weightUnit: 'lb' });
    const settings = await getSettings();
    expect(settings?.name).toBe('Alex');
    expect(settings?.weightUnit).toBe('lb');
    expect(settings?.distanceUnit).toBe('km');
  });

  it('updateSettingsFrom verliert bei gleichzeitigen Änderungen nichts', async () => {
    await updateSettings({ dashboardWidgets: ['quickActions', 'habits', 'todos'] });
    const remove = (id: string) =>
      updateSettingsFrom(({ dashboardWidgets }) => ({
        dashboardWidgets: dashboardWidgets.filter((widget) => widget !== id),
      }));
    await Promise.all([remove('habits'), remove('todos')]);
    expect((await getSettings())?.dashboardWidgets).toEqual(['quickActions']);
  });
});
