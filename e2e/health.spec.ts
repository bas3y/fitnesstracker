import { expect, test, type Page } from '@playwright/test';
import { createZip, sampleAppleHealthXml, type HealthRecordInput } from '../src/test/importFiles';
import { fillStepper, goOffline } from './helpers';

const pad = (n: number) => String(n).padStart(2, '0');

/** Ortszeit wie im Browser (gleiche Zeitzone wie der Testrechner) */
function localTime(daysAgo: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

function localDay(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const fileOf = (name: string, data: Uint8Array | string) => ({
  name,
  mimeType: 'application/octet-stream',
  buffer: Buffer.from(data),
});

const sleep = (value: string, start: number, end: number): HealthRecordInput => ({
  type: 'HKCategoryTypeIdentifierSleepAnalysis',
  start,
  end,
  value: `HKCategoryValueSleepAnalysis${value}`,
});

const steps = (start: number, value: number, source: string): HealthRecordInput => ({
  type: 'HKQuantityTypeIdentifierStepCount',
  start,
  end: start + 600_000,
  value,
  source,
});

async function chooseExport(page: Page, files: ReturnType<typeof fileOf>[]) {
  await page.getByText('Export auswählen').locator('input[type=file]').setInputFiles(files);
}

const values = (page: Page) => page.getByRole('list', { name: 'Gefundene Werte' });

test('Gesundheitsdaten: Apple Health + Garmin importieren, eigene Werte bleiben (offline)', async ({
  page,
  context,
}) => {
  const body = page.locator('body');
  const yesterday = localDay(1);
  const twoDaysAgo = localDay(2);

  const appleXml = sampleAppleHealthXml([
    // Gestern: iPhone und Uhr zählen dieselben Schritte → höchste Quelle zählt
    steps(localTime(1, 9), 5000, 'iPhone'),
    steps(localTime(1, 12), 3000, 'iPhone'),
    steps(localTime(1, 9), 8500, 'Apple Watch'),
    // Vorgestern: eigener Eintrag bleibt
    steps(localTime(2, 10), 7000, 'iPhone'),
    // Nacht auf gestern mit Phasen
    sleep('AsleepCore', localTime(2, 23), localTime(1, 1)),
    sleep('AsleepDeep', localTime(1, 1), localTime(1, 2)),
    sleep('AsleepREM', localTime(1, 2), localTime(1, 3, 30)),
    sleep('Awake', localTime(1, 3, 30), localTime(1, 3, 40)),
    sleep('AsleepCore', localTime(1, 3, 40), localTime(1, 6, 30)),
    {
      type: 'HKQuantityTypeIdentifierRestingHeartRate',
      start: localTime(1, 0),
      value: 52,
      unit: 'count/min',
    },
    {
      type: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
      start: localTime(1, 4),
      value: 47,
      unit: 'ms',
    },
    { type: 'HKQuantityTypeIdentifierBodyMass', start: localTime(1, 7), value: 79.4, unit: 'kg' },
  ]);
  const apple = await createZip([{ name: 'apple_health_export/export.xml', data: appleXml }]);
  const garmin = await createZip([
    {
      name: 'DI_CONNECT/DI-Connect-Wellness/2026_123_sleepData.json',
      data: JSON.stringify([
        {
          calendarDate: twoDaysAgo,
          deepSleepSeconds: 5400,
          lightSleepSeconds: 14_400,
          remSleepSeconds: 6000,
          awakeSleepSeconds: 600,
        },
      ]),
    },
  ]);

  await page.goto(`./#/daily/body?date=${twoDaysAgo}`);
  await goOffline(page, context);
  await page.reload();
  await fillStepper(body, 'Schritte gesamt', '4000');
  await expect(page.getByText('4000 von 10000')).toBeVisible();

  // Einstieg über Körper & Befinden
  await page.getByRole('link', { name: /^Gesundheitsdaten importieren/ }).click();
  await expect(page.getByRole('heading', { name: 'Gesundheitsdaten importieren' })).toBeVisible();
  await page.getByText('Apple Health (iPhone)').click();
  await expect(page.getByText(/Alle Gesundheitsdaten exportieren/)).toBeVisible();

  await chooseExport(page, [
    fileOf('export.zip', apple),
    fileOf('garmin.zip', garmin),
    fileOf('notiz.txt', 'hallo'),
  ]);

  await expect(page.getByTestId('health-summary')).toContainText('aus Garmin und Apple Health');
  const stepsRow = values(page).getByRole('listitem').filter({ hasText: 'Schritte' });
  await expect(stepsRow).toContainText('Schritte · 2 Tage');
  await expect(stepsRow).toContainText('1 neu · 1 eigener Eintrag bleibt');
  await expect(values(page).getByRole('listitem').filter({ hasText: 'Schlaf' })).toContainText(
    'Schlaf · 2 Tage',
  );
  await page.getByText('1 Datei nicht lesbar').click();
  await expect(page.getByRole('list', { name: 'Nicht lesbare Dateien' })).toContainText(
    'notiz.txt: Unbekanntes Format',
  );
  await values(page).getByRole('checkbox', { name: 'Gewicht' }).uncheck();
  await page.getByRole('button', { name: '2 Tage übernehmen' }).click();
  await expect(page.getByText('✓ Import abgeschlossen: 2 Tage aktualisiert')).toBeVisible();

  // „Zurück“ führt zum gewählten Tag
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`date=${twoDaysAgo}`));
  await expect(page.getByLabel('Schritte gesamt', { exact: true })).toHaveValue('4000');
  await expect(page.getByRole('list', { name: 'Schlafphasen' })).toContainText(
    'Tiefschlaf 1 h 30 min',
  );

  // Gestern: alles aus dem Import außer Gewicht
  await page.goto(`./#/daily/body?date=${yesterday}`);
  await expect(page.getByTestId('imported-fields')).toContainText(
    'Aus dem Import: Schritte, Schlaf, Ruhepuls, HRV',
  );
  await expect(page.getByText('8500 von 10000')).toBeVisible();
  await expect(page.getByLabel('Schlafdauer', { exact: true })).toHaveValue('7,33');
  await expect(page.getByRole('list', { name: 'Schlafphasen' })).toContainText('REM 1 h 30 min');
  await expect(page.getByLabel('Ruhepuls', { exact: true })).toHaveValue('52');
  await expect(page.getByLabel('HRV', { exact: true })).toHaveValue('47');
  await expect(page.getByLabel('Körpergewicht an diesem Tag', { exact: true })).toHaveValue('');

  // Eigene Änderung: gilt danach nicht mehr als importiert
  await fillStepper(body, 'Ruhepuls', '55');
  await expect(page.getByTestId('imported-fields')).toContainText(
    'Aus dem Import: Schritte, Schlaf, HRV',
  );
  await page.reload();
  await expect(page.getByLabel('Ruhepuls', { exact: true })).toHaveValue('55');

  // Zweiter Import: Ruhepuls bleibt, nur das Gewicht ist noch neu
  await page.goto('./#/daily/import');
  await chooseExport(page, [fileOf('export.zip', apple), fileOf('garmin.zip', garmin)]);
  await expect(values(page).getByRole('listitem').filter({ hasText: 'Ruhepuls' })).toContainText(
    '1 eigener Eintrag bleibt',
  );
  await expect(values(page).getByRole('listitem').filter({ hasText: 'Schlaf' })).toContainText(
    '2 unverändert',
  );
  await values(page).getByRole('checkbox', { name: 'Gewicht' }).uncheck();
  await expect(page.getByRole('button', { name: 'Nichts Neues zu übernehmen' })).toBeDisabled();
  await values(page).getByRole('checkbox', { name: 'Gewicht' }).check();
  await page.getByRole('button', { name: '1 Tag übernehmen' }).click();
  await page.getByRole('link', { name: 'Verlauf ansehen' }).click();

  // Verlauf: neue Kennzahlen und Ø-Schlafphasen
  const metrics = page.getByRole('group', { name: 'Kennzahl' });
  await metrics.getByRole('button', { name: 'HRV' }).click();
  await expect(page.getByTestId('daily-summary')).toHaveText('Ø 47 ms');
  await metrics.getByRole('button', { name: 'Schlaf', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Ø Schlafphasen pro Nacht' })).toBeVisible();
  await metrics.getByRole('button', { name: 'Gewicht' }).click();
  await expect(page.getByTestId('daily-summary')).toContainText('79,4 kg');
});
