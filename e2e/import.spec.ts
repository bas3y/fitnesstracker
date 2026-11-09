import { expect, test, type Page } from '@playwright/test';
import { createZip, sampleFitRun, sampleGpx } from '../src/test/importFiles';
import { fillStepper, goOffline } from './helpers';

const pad = (n: number) => String(n).padStart(2, '0');

/** Ortszeit wie im Browser (gleiche Zeitzone wie der Testrechner) */
function localStart(daysAgo: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return {
    time: date.getTime(),
    day: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
  };
}

const runOf = (start: number) => ({
  start,
  step: 5,
  count: 361,
  speed: 2.8,
  heartRate: (i: number) => 140 + (i % 20),
});

const fileOf = (name: string, data: Uint8Array | string) => ({
  name,
  mimeType: 'application/octet-stream',
  buffer: Buffer.from(data),
});

async function chooseFiles(page: Page, files: ReturnType<typeof fileOf>[]) {
  await page.getByText('Dateien auswählen').locator('input[type=file]').setInputFiles(files);
}

const tile = (page: Page, name: string) =>
  page
    .getByRole('list', { name: 'Aktivitäten' })
    .getByRole('link', { name: new RegExp(`^${name}`) });

test('Import: FIT, GPX und ZIP mit Vorschau, Ergänzen und Duplikaten (offline)', async ({
  page,
  context,
}) => {
  const body = page.locator('body');
  const morning = localStart(2, 6);
  // Heute (nicht gestern): Die Kachel zeigt die laufende Woche, montags wäre gestern Vorwoche
  const evening = localStart(0, 0);
  const fit = sampleFitRun(runOf(morning.time));
  const gpx = sampleGpx(runOf(evening.time), { name: 'Abendrunde' });

  await page.goto('./#/settings/training');
  await goOffline(page, context);
  await page.reload();
  await fillStepper(body, 'Max. Puls', '190');

  // Manuell erfasster Lauf, den der FIT-Import ergänzen soll
  await page.goto('./#/training/activity/run/new');
  await page.getByLabel('Titel (optional)').fill('Morgenlauf');
  await page.getByLabel('Datum').fill(morning.day);
  await page.getByLabel('Beginn').fill('06:00');
  const duration = page.getByRole('group', { name: 'Dauer' });
  await duration.getByLabel('Stunden').fill('');
  await duration.getByLabel('Minuten').fill('30');
  await duration.getByLabel('Sekunden').fill('');
  await fillStepper(body, 'Distanz', '5');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('link', { name: /^Morgenlauf/ })).toBeVisible();

  // Zur Import-Seite über die Aktivitätsseite
  await page.getByRole('link', { name: 'Importieren' }).click();
  await expect(page.getByRole('heading', { name: 'Einheiten importieren' })).toBeVisible();
  await page.getByText('Garmin Connect (einzelne Einheit)').click();
  await expect(page.getByText(/Zahnrad oben rechts/)).toBeVisible();

  const zip = await createZip([
    { name: 'activities/abend.gpx', data: gpx },
    { name: 'media/foto.jpg', data: 'x' },
  ]);
  await chooseFiles(page, [
    fileOf('activity_123.fit', fit),
    fileOf('abend.gpx', gpx),
    fileOf('strava.zip', zip),
    fileOf('notiz.txt', 'hallo'),
  ]);

  await expect(page.getByTestId('import-counts')).toHaveText(
    '1 neu · 1 ergänzt · 1 schon vorhanden',
  );
  const found = page.getByRole('list', { name: 'Gefundene Einheiten' }).getByRole('listitem');
  await expect(found).toHaveCount(2);
  await expect(found.first()).toContainText('Abendrunde');
  await expect(found.last()).toContainText('ergänzt deine Einheit');
  await expect(found.last()).toContainText('Garmin · activity_123.fit');
  await page.getByText('1 Datei nicht lesbar').click();
  await expect(page.getByRole('list', { name: 'Nicht lesbare Dateien' })).toContainText(
    'notiz.txt: Unbekanntes Format',
  );
  await page.getByRole('combobox', { name: 'Sportart: Abendrunde' }).selectOption('Wandern');
  await page.getByRole('button', { name: '2 Einheiten importieren' }).click();
  await expect(
    page.getByText('✓ Import abgeschlossen: 1 neu, 1 ergänzt, 1 übersprungen'),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Zur Trainingsübersicht' }).click();
  await expect(tile(page, 'Wandern')).toContainText('km');
  await page.reload();
  await expect(tile(page, 'Wandern')).toContainText('km');

  // Ergänzte Einheit: eigene Werte bleiben, Puls und Verlauf kommen dazu
  await tile(page, 'Laufen').click();
  await page.getByRole('link', { name: /^Morgenlauf/ }).click();
  await expect(page.getByText(/ergänzt aus Garmin · FIT/)).toBeVisible();
  const facts = page.getByTestId('session-facts');
  await expect(facts).toContainText('5 km');
  await expect(facts).toContainText('30:00');
  await expect(facts).toContainText('150 bpm');
  await expect(page.getByRole('img', { name: 'Streckenverlauf' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Pulsverlauf' })).toBeVisible();
  await expect(page.getByTestId('hr-zones')).toContainText('Z4 Schwelle');
  await expect(page.getByRole('heading', { name: 'Kilometer' })).toBeVisible();
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();

  // Neue Einheit mit gewählter Sportart
  await tile(page, 'Wandern').click();
  await page.getByRole('link', { name: /^Abendrunde/ }).click();
  await expect(page.getByText(/importiert · StravaGPX · GPX/)).toBeVisible();
  await expect(page.getByRole('img', { name: 'Höhenprofil' })).toBeVisible();

  // Zweiter Import derselben Dateien: alles schon vorhanden
  await page.goto('./#/training/import');
  await chooseFiles(page, [fileOf('activity_123.fit', fit), fileOf('abend.gpx', gpx)]);
  await expect(page.getByTestId('import-counts')).toHaveText('2 schon vorhanden');
  await expect(page.getByRole('button', { name: '0 Einheiten importieren' })).toBeDisabled();
  await page.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(page.getByText('Dateien auswählen')).toBeVisible();
});

test('Import: per Teilen übergebene Datei (Teilen-Ziel)', async ({ page, context }) => {
  const start = localStart(3, 7);
  await page.goto('./#/training');
  await goOffline(page, context);

  // Wie Android beim Teilen: POST an das Teilen-Ziel, der Service Worker leitet zur App weiter
  const response = await page.evaluate(
    async (bytes) => {
      const form = new FormData();
      form.append('files', new File([new Uint8Array(bytes)], 'geteilt.fit'));
      const result = await fetch('./share-target', { method: 'POST', body: form });
      return result.ok;
    },
    Array.from(sampleFitRun(runOf(start.time))),
  );
  expect(response).toBe(true);

  await page.goto('./#/training/import?shared=1');
  await expect(page.getByTestId('import-counts')).toHaveText('1 neu');
  await expect(page).toHaveURL(/#\/training\/import$/);
  await page.getByRole('button', { name: '1 Einheit importieren' }).click();
  await page.getByRole('link', { name: 'Einheit ansehen' }).click();
  await expect(page.getByText(/importiert · Garmin · FIT/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kilometer' })).toBeVisible();
});

test('Einstellungen: Info „Wo liegen meine Daten?“', async ({ page }) => {
  await page.goto('./#/settings/backup');
  await page.getByText('Wo liegen meine Daten?').click();
  await expect(page.getByText(/Privatmodus\/Inkognito/)).toBeVisible();
  await expect(page.getByText(/„Cookies und Websitedaten“/)).toBeVisible();
});
