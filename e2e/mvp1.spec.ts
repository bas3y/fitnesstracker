import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { confirmStart, fillStepper, goOffline, openSettings, skipRest } from './helpers';

const BENCH = 'Bankdrücken (Langhantel)';

const openNav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

const weekTiles = (page: Page) =>
  page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Diese Woche' }) })
    .locator('dd');

const dashboardHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'Heute' });

/** Widgets, die nicht zum Standardaufbau gehören, über „Anpassen“ hinzufügen */
async function addWidgets(page: Page, names: string[]) {
  await openNav(page, 'Dashboard');
  await page.getByRole('button', { name: 'Anpassen' }).click();
  for (const name of names) {
    await page.getByRole('button', { name: `${name} hinzufügen` }).click();
  }
  await page.getByRole('button', { name: 'Fertig' }).click();
}

async function finishWorkout(page: Page) {
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).toHaveURL(/#\/training\/history\/[\w-]+$/);
}

/** Einfaches Workout mit einem Satz, danach zeigt die Seite das beendete Workout */
async function logWorkout(page: Page, weight: string) {
  await openNav(page, 'Training');
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  await page.getByRole('button', { name: '+ Übung hinzufügen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Übung hinzufügen' });
  await dialog.getByRole('searchbox', { name: 'Übung suchen' }).fill(BENCH);
  await dialog
    .getByRole('button', { name: /^Bankdrücken \(Langhantel\)/ })
    .first()
    .click();
  const bench = page.getByRole('region', { name: BENCH });
  await fillStepper(bench, 'Gewicht', weight);
  await fillStepper(bench, 'Wiederholungen', '10');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);
  await finishWorkout(page);
}

test.beforeEach(async ({ page }) => {
  // Teilen-Dialog abschalten, damit der Download-Fallback greift
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
  });
});

test('MVP 1 komplett: Plan, Training, Dashboard, Statistik, CSV und Backup (offline)', async ({
  page,
  context,
}, testInfo) => {
  await page.goto('./');
  await goOffline(page, context);
  await page.reload();

  // Leeres Dashboard: Trainings-Widgets erscheinen erst mit Daten, kein Trainingsstart
  await expect(page.getByRole('heading', { name: 'Schnellzugriff' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Workout starten' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Diese Woche' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Trainingsfortschritt' })).toHaveCount(0);
  await addWidgets(page, ['Letztes Workout', 'Neue Rekorde', 'Trainingstage']);
  // „Diese Woche“ groß: mit Workouts, Sätzen und Volumen
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page
    .getByRole('group', { name: 'Größe: Diese Woche' })
    .getByRole('button', { name: 'Groß' })
    .click();
  await page.getByRole('button', { name: 'Fertig' }).click();

  // CSV gibt es erst nach dem ersten Workout
  await openSettings(page, 'Export & Speicher');
  await page.getByRole('button', { name: 'Workouts als CSV exportieren' }).click();
  await expect(page.getByRole('alert')).toContainText('Noch keine beendeten Workouts');

  // Plan aus Vorlage, erstes Training über die Trainingsseite
  await openNav(page, 'Training');
  await page.getByRole('link', { name: /Trainingspläne/ }).click();
  await page.getByRole('link', { name: '+ Neuer Plan' }).click();
  await page.getByRole('button', { name: /Push\/Pull\/Legs/ }).click();
  await expect(page.getByText('Aktiver Plan')).toBeVisible();

  await openNav(page, 'Training');
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

  // Dashboard zeigt das Training, noch kein Rekord
  await openNav(page, 'Dashboard');
  await expect(weekTiles(page)).toHaveText(['1', '1', '600']);
  await expect(page.getByRole('link', { name: /^Push/ })).toContainText('1 Satz');
  await expect(page.getByRole('heading', { name: 'Neue Rekorde' })).toHaveCount(0);

  // Zweites Training, Abstecher zum Dashboard, Fortsetzen über den Hinweis
  await openNav(page, 'Training');
  await expect(page.getByRole('button', { name: 'Pull starten' })).toBeVisible();
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
  await page.getByRole('status').filter({ hasText: 'Workout läuft' }).click();
  await expect(page.getByRole('heading', { name: 'Push', level: 1 })).toBeVisible();
  await finishWorkout(page);

  // Dashboard nach dem Neuladen: Woche, Erfolge, Heatmap
  await openNav(page, 'Dashboard');
  await page.reload();
  await expect(weekTiles(page)).toHaveText(['2', '2', '1225']);
  const record = page.getByRole('link', { name: /^Bankdrücken \(Langhantel\)/ });
  await expect(record).toContainText('Gewicht: 62,5 kg');
  await expect(record).toContainText('Geschätztes 1RM: 83,3 kg');
  await expect(record).toContainText('(+2)');
  // Trainingsfortschritt: Kraft braucht 4 Einheiten, 2 Workouts, 4 Rekorde im Monat
  await expect(page.getByTestId('training-progress').getByRole('definition')).toHaveText([
    '–',
    '2',
    '4',
  ]);

  const heatmap = page.getByTestId('heatmap');
  await expect(page.getByText('1 Trainingstag in den letzten 3 Monaten')).toBeVisible();
  await heatmap.getByRole('button', { name: /: 2 Sätze$/ }).click();
  await expect(page.getByRole('link', { name: 'Workout öffnen' })).toHaveCount(2);

  await record.click();
  await expect(page.getByRole('list', { name: `Rekorde ${BENCH}` })).toContainText(
    'Gewicht: 62,5 kg',
  );

  // Statistik (eigener Chunk, muss offline aus dem Precache kommen)
  await openNav(page, 'Statistik');
  await page.getByRole('link', { name: /Bankdrücken \(Langhantel\)/ }).click();
  await expect(page.getByTestId('history-summary')).toHaveText('60 kg → 62,5 kg (+4,2 %)');

  // CSV-Export: eine Zeile je Satz
  await openSettings(page, 'Export & Speicher');
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
  await openSettings(page, 'Datensicherung');
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
  await openNav(page, 'Training');
  await expect(page.getByRole('button', { name: 'Pull starten' })).toBeVisible();
});

test('Zurück führt dorthin, woher man kam (offline)', async ({ page, context }) => {
  await page.goto('./');
  await goOffline(page, context);
  await logWorkout(page, '60');
  await addWidgets(page, ['Letztes Workout', 'Trainingstage']);

  // Vom Dashboard über Bearbeiten und wieder zurück zum Dashboard
  await page.getByRole('link', { name: /^Bankdrücken \(Langhantel\)/ }).click();
  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  await expect(page.getByRole('heading', { name: 'Workout bearbeiten' })).toBeVisible();
  await page.getByRole('link', { name: 'Fertig' }).click();
  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Bearbeiten' })).toBeVisible();
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(dashboardHeading(page)).toBeVisible();

  // Heatmap auf dem Dashboard
  await page
    .getByTestId('heatmap')
    .getByRole('button', { name: /: 1 Satz$/ })
    .click();
  await page.getByRole('link', { name: 'Workout öffnen' }).click();
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(dashboardHeading(page)).toBeVisible();

  // Heatmap in der Statistik: Filter bleiben erhalten
  await openNav(page, 'Statistik');
  await page.getByRole('button', { name: '4 Wo.' }).click();
  await page
    .getByTestId('heatmap')
    .getByRole('button', { name: /: 1 Satz$/ })
    .click();
  await page.getByRole('link', { name: 'Workout öffnen' }).click();
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(page.getByRole('button', { name: '4 Wo.' })).toHaveAttribute('aria-pressed', 'true');

  // Über den Verlauf bleibt es beim Verlauf
  await openNav(page, 'Training');
  await page.getByRole('link', { name: /^Verlauf/ }).click();
  await page.getByRole('list', { name: 'Workouts' }).getByRole('link').first().click();
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Verlauf' })).toBeVisible();

  // Laufendes Workout vom Dashboard aus öffnen
  await openNav(page, 'Training');
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  await openNav(page, 'Dashboard');
  await page.getByRole('status').filter({ hasText: 'Workout läuft' }).click();
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(dashboardHeading(page)).toBeVisible();
});

test('Dashboard anpassen: Widgets ziehen, entfernen und hinzufügen (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await goOffline(page, context);
  await logWorkout(page, '60');
  await logWorkout(page, '62,5');
  await openNav(page, 'Dashboard');
  await page.getByRole('button', { name: 'Los geht’s' }).click();

  const headings = page.getByRole('main').getByRole('heading', { level: 2 });
  await expect(headings).toHaveText([
    'Schnellzugriff',
    'Gewohnheiten',
    'To-dos',
    'Diese Woche',
    'Trainingsfortschritt',
  ]);

  await page.getByRole('button', { name: 'Anpassen' }).click();
  const list = page.getByRole('list', { name: 'Widgets', exact: true });
  // Nur die Zeilen, nicht die Listen in den Vorschauen
  const widgets = list.locator(':scope > li');
  await expect(widgets).toHaveCount(5);

  // Vorschau ist nicht antippbar
  await expect(list.locator('[inert]')).toHaveCount(5);

  // Buttons im Schnellzugriff wählen
  const quickPicker = page.getByRole('group', { name: 'Buttons im Schnellzugriff' });
  await quickPicker.getByRole('button', { name: /Schritte/ }).click();
  await expect(quickPicker.getByRole('button', { name: /Schritte/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await quickPicker.getByRole('button', { name: /To-do/ }).click();
  await expect(quickPicker.getByRole('button', { name: /To-do/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  // Ziehen samt Inhalt: Trainingsfortschritt an den oberen Rand ziehen und halten, bis die Seite
  // hochgescrollt ist und das Widget oben steht
  const handle = page.getByRole('button', { name: 'Trainingsfortschritt verschieben' });
  await handle.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  const from = (await handle.boundingBox())!;
  const x = from.x + from.width / 2;
  await page.mouse.move(x, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, 10, { steps: 10 });
  await expect(list.locator(':scope > li[data-sort-id="progress"]')).toHaveCSS('order', '0');
  await expect(
    list.locator(':scope > li[data-sort-id="progress"]').getByTestId('training-progress'),
  ).toBeVisible();
  await page.mouse.up();
  await expect(page.getByRole('button', { name: /verschieben$/ }).first()).toHaveAccessibleName(
    'Trainingsfortschritt verschieben',
  );

  // Entfernen und hinzufügen
  await page.getByRole('button', { name: 'Gewohnheiten entfernen' }).click();
  await expect(widgets).toHaveCount(4);
  await page.getByRole('button', { name: 'Nächstes Training hinzufügen' }).click();
  await expect(widgets).toHaveCount(5);
  await expect(page.getByRole('list', { name: 'Weitere Widgets' }).getByRole('button')).toHaveCount(
    13,
  );
  // Größe wählen: To-dos klein (nur der Wert), Schnellzugriff hat nur eine Größe
  const todoSize = page.getByRole('group', { name: 'Größe: To-dos' });
  await todoSize.getByRole('button', { name: 'Klein' }).click();
  await expect(todoSize.getByRole('button', { name: 'Klein' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('group', { name: 'Größe: Schnellzugriff' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Fertig' }).click();

  // Bleibt nach dem Neuladen erhalten
  await page.reload();
  await expect(headings.first()).toHaveText('Trainingsfortschritt');
  await expect(page.getByRole('link', { name: 'To-dos: 0, Nichts offen' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gewohnheiten' })).toHaveCount(0);
  const quick = page.getByRole('list', { name: 'Schnellzugriff' });
  await expect(quick.getByRole('listitem')).toHaveText([
    /Training/,
    /Wasser/,
    /Gewicht/,
    /Schritte/,
  ]);

  // Trainingsstart als Widget: Zurück führt zum Dashboard
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  await expect(page).toHaveURL(/#\/training\/workout$/);
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(dashboardHeading(page)).toBeVisible();

  // Alles entfernen
  await page.getByRole('button', { name: 'Anpassen' }).click();
  for (const name of [
    'Trainingsfortschritt',
    'Schnellzugriff',
    'To-dos',
    'Diese Woche',
    'Nächstes Training',
  ]) {
    await page.getByRole('button', { name: `${name} entfernen` }).click();
  }
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByText('Keine Widgets ausgewählt.')).toBeVisible();
});
