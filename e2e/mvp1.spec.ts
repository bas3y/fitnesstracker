import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { confirmStart, fillStepper, goOffline, skipRest } from './helpers';

const BENCH = 'Bankdrücken (Langhantel)';

const openNav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

const weekTiles = (page: Page) =>
  page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Diese Woche' }) })
    .locator('dd');

async function finishWorkout(page: Page) {
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).toHaveURL(/#\/training\/history\/[\w-]+$/);
}

test.beforeEach(async ({ page }) => {
  // Teilen-Dialog abschalten, damit der Download-Fallback greift
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
  });
});

test('MVP 1 komplett: Plan, Training vom Dashboard, Statistik, CSV und Backup (offline)', async ({
  page,
  context,
}, testInfo) => {
  await page.goto('./');
  await goOffline(page, context);
  await page.reload();

  // Leeres Dashboard
  await expect(page.getByText('Nach deinem ersten Workout')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Workout starten' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Diese Woche' })).toHaveCount(0);

  // CSV gibt es erst nach dem ersten Workout
  await openNav(page, 'Einstellungen');
  await page.getByRole('button', { name: 'Workouts als CSV exportieren' }).click();
  await expect(page.getByRole('alert')).toContainText('Noch keine beendeten Workouts');

  // Plan aus Vorlage anlegen
  await openNav(page, 'Training');
  await page.getByRole('link', { name: /Trainingspläne/ }).click();
  await page.getByRole('link', { name: '+ Neuer Plan' }).click();
  await page.getByRole('button', { name: /Push\/Pull\/Legs/ }).click();
  await expect(page.getByText('Aktiver Plan')).toBeVisible();

  // Erstes Training direkt vom Dashboard
  await openNav(page, 'Dashboard');
  await expect(page.getByText('Erstes Training des Plans')).toBeVisible();
  await page.getByRole('button', { name: 'Push starten' }).click();
  await confirmStart(page);
  await expect(page.getByRole('heading', { name: 'Push', level: 1 })).toBeVisible();
  const bench = page.getByRole('region', { name: BENCH });
  await fillStepper(bench, 'Gewicht', '60');
  await fillStepper(bench, 'Wiederholungen', '10');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);
  await finishWorkout(page);

  // Dashboard zeigt das Training, der Vorschlag rückt weiter, noch kein Rekord
  await openNav(page, 'Dashboard');
  await expect(weekTiles(page)).toHaveText(['1', '1', '600']);
  await expect(page.getByRole('link', { name: /^Push/ })).toContainText('1 Satz');
  await expect(page.getByRole('button', { name: 'Pull starten' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Neueste Rekorde' })).toHaveCount(0);

  // Zweites Training: Auswahl über die Trainingsseite, Abstecher zum Dashboard
  await page.getByRole('link', { name: 'Anderes Training' }).click();
  await page.getByRole('button', { name: 'Anderes Training wählen' }).click();
  await page
    .getByRole('list', { name: 'Trainings des Plans' })
    .getByRole('button', { name: 'Push' })
    .click();
  await confirmStart(page);
  await fillStepper(bench, 'Gewicht', '62,5');
  await fillStepper(bench, 'Wiederholungen', '10');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Neuer Rekord' })).toBeVisible();
  await skipRest(page);

  await openNav(page, 'Dashboard');
  await page.getByRole('link', { name: 'Workout fortsetzen' }).click();
  await expect(page.getByRole('heading', { name: 'Push', level: 1 })).toBeVisible();
  await finishWorkout(page);

  // Dashboard nach dem Neuladen: Woche, Rekorde, Heatmap
  await openNav(page, 'Dashboard');
  await page.reload();
  await expect(weekTiles(page)).toHaveText(['2', '2', '1225']);
  const record = page.getByRole('link', { name: new RegExp(`^${BENCH.replace(/[()]/g, '\\$&')}`) });
  await expect(record).toContainText('Gewicht: 62,5 kg');
  await expect(record).toContainText('Geschätztes 1RM: 83,3 kg');
  await expect(record).toContainText('(+2)');

  const heatmap = page.getByTestId('heatmap');
  await expect(page.getByText('1 Trainingstag in den letzten 3 Monaten')).toBeVisible();
  await expect(heatmap.getByRole('button')).not.toHaveCount(0);
  await heatmap.getByRole('button', { name: /: 2 Sätze$/ }).click();
  await expect(page.getByRole('link', { name: 'Workout öffnen' })).toHaveCount(2);

  await record.click();
  await expect(page.getByRole('list', { name: `Rekorde ${BENCH}` })).toContainText(
    'Gewicht: 62,5 kg',
  );

  // Statistik (eigener Chunk, muss offline aus dem Precache kommen)
  await openNav(page, 'Statistik');
  await page.getByRole('link', { name: new RegExp(BENCH.replace(/[()]/g, '\\$&')) }).click();
  await expect(page.getByTestId('history-summary')).toHaveText('60 kg → 62,5 kg (+4,2 %)');

  // CSV-Export: eine Zeile je Satz
  await openNav(page, 'Einstellungen');
  const csvPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Workouts als CSV exportieren' }).click();
  const csv = await csvPromise;
  expect(csv.suggestedFilename()).toMatch(/^fitnesstracker-workouts-\d{4}-\d{2}-\d{2}\.csv$/);
  const csvPath = testInfo.outputPath('workouts.csv');
  await csv.saveAs(csvPath);
  const lines = (await readFile(csvPath, 'utf8')).trim().split('\r\n');
  expect(lines[0]).toContain('Datum;Uhrzeit;Training');
  expect(lines).toHaveLength(3);
  expect(lines[1]).toContain(`;Push;`);
  expect(lines[1]).toContain(`;${BENCH};1;nein;60;;10;`);
  expect(lines[2]).toContain(`;${BENCH};1;nein;62,5;;10;`);
  await expect(page.getByText('CSV-Datei wurde erstellt')).toBeVisible();
  await expect(page.getByText('Letztes Backup: noch nie')).toBeVisible();

  // Backup → Datenverlust → Import: Dashboard ist wieder vollständig
  const backupPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup exportieren' }).click();
  const backupPath = testInfo.outputPath('backup.json');
  await (await backupPromise).saveAs(backupPath);
  await expect(page.getByText('Letztes Backup: heute')).toBeVisible();

  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('fitnesstracker');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
  );
  await page.reload();
  await page.locator('input[type="file"]').setInputFiles(backupPath);
  await page.getByRole('button', { name: 'Importieren', exact: true }).click();
  await expect(page.getByText('Sicherung wurde importiert')).toBeVisible();

  await openNav(page, 'Dashboard');
  await expect(weekTiles(page)).toHaveText(['2', '2', '1225']);
  await expect(record).toContainText('Gewicht: 62,5 kg');
  await expect(page.getByRole('button', { name: 'Pull starten' })).toBeVisible();
});

test('Dashboard ohne Plan startet ein freies Workout (offline)', async ({ page, context }) => {
  await page.goto('./');
  await goOffline(page, context);

  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  await expect(page).toHaveURL(/#\/training\/workout$/);
});
