import { readFile } from 'node:fs/promises';
import { expect, test, type Download, type Page } from '@playwright/test';
import { sampleFitRun } from '../src/test/importFiles';
import { confirmStart, fillStepper, goOffline, skipRest } from './helpers';

function localStart(daysAgo: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.getTime();
}

const fitOf = (start: number, speed: number) => ({
  name: `lauf-${start}.fit`,
  mimeType: 'application/octet-stream',
  buffer: Buffer.from(
    sampleFitRun({ start, step: 5, count: 361, speed, heartRate: (i) => 140 + (i % 20) }),
  ),
});

const openNav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

async function importRun(page: Page, start: number, speed: number) {
  // Erst wegnavigieren, sonst bleibt die Zusammenfassung des letzten Imports stehen
  await page.goto('./#/training');
  await page.goto('./#/training/import');
  await page
    .getByText('Dateien auswählen')
    .locator('input[type=file]')
    .setInputFiles([fitOf(start, speed)]);
  await page.getByRole('button', { name: '1 Einheit importieren' }).click();
  await expect(page.getByText(/Import abgeschlossen: 1 neu/)).toBeVisible();
}

/** Breite und Höhe aus dem PNG-Kopf */
async function pngSize(download: Download) {
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function saveImage(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Teilen-Bild' });
  await expect(dialog.getByRole('img', { name: /^Vorschau/ })).toBeVisible();
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Teilen oder speichern' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Bild gespeichert (Downloads).');
  return download;
}

test.beforeEach(async ({ page }) => {
  // Teilen-Dialog abschalten, damit der Download-Fallback greift
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
  });
});

test('Ausdauer: Bestzeiten, Teilen-Bild, Statistik, Widget und Kalorien (offline)', async ({
  page,
  context,
}) => {
  const body = page.locator('body');
  await page.goto('./#/settings');
  await goOffline(page, context);
  await page.reload();
  await fillStepper(body, 'Max. Puls', '190');
  const addBurned = page.getByRole('checkbox', { name: 'Verbrannte Kalorien zum Ziel addieren' });
  await addBurned.click();
  await expect(addBurned).toBeChecked();

  // Erster Lauf: noch kein Rekord; zweiter, schnellerer Lauf: neue Bestzeiten
  await importRun(page, localStart(3, 7), 2.8);
  await expect(page.getByText('Neue Bestzeit')).toHaveCount(0);
  await importRun(page, localStart(0, 0), 3.2);
  const toast = page.getByRole('status').filter({ hasText: 'Neue Bestzeiten' });
  await expect(toast).toContainText('Laufen 1 km: 5:13');
  await expect(toast).toContainText('Laufen 5 km: 26:03');

  // Detailseite: Bestzeiten mit Pokal, Teilen-Bild als Story und Sticker
  await page.getByRole('link', { name: 'Einheit ansehen' }).click();
  const efforts = page.getByRole('list', { name: 'Bestzeiten in dieser Einheit' });
  await expect(efforts.getByRole('listitem')).toHaveCount(2);
  await expect(efforts.getByRole('img', { name: 'Bestzeit' })).toHaveCount(2);
  await page.getByRole('button', { name: 'Teilen-Bild' }).click();
  const story = await saveImage(page);
  expect(story.suggestedFilename()).toMatch(/^fitnesstracker-\d{4}-\d{2}-\d{2}\.png$/);
  expect(await pngSize(story)).toEqual({ width: 1080, height: 1920 });
  const dialog = page.getByRole('dialog', { name: 'Teilen-Bild' });
  await dialog.getByRole('button', { name: 'Sticker' }).click();
  await expect(dialog.getByRole('img', { name: 'Vorschau Sticker' })).toBeVisible();
  const sticker = await saveImage(page);
  expect(sticker.suggestedFilename()).toMatch(/-sticker\.png$/);
  // Strecke, Kopf, Kennzahlen und Bestzeit-Zeile
  expect(await pngSize(sticker)).toEqual({ width: 1080, height: 1110 });
  await dialog.getByRole('button', { name: 'Fertig' }).click();
  await expect(dialog).toHaveCount(0);

  // Aktivitätsseite: Bestzeiten über alle Läufe, Link zur Statistik
  await page.goto('./#/training/activity/run');
  const bests = page.getByRole('list', { name: 'Bestzeiten Laufen' });
  await expect(bests).toContainText('5 km');
  await expect(bests).toContainText('26:03');
  await page.getByRole('link', { name: /Pace-Entwicklung, Pulszonen/ }).click();

  // Statistik „Ausdauer“ mit gewählter Sportart
  await expect(page).toHaveURL(/view=endurance/);
  await expect(
    page.getByRole('group', { name: 'Bereich' }).getByRole('button', { name: 'Ausdauer' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Sportart')).toHaveValue('run');
  const totals = page.getByTestId('endurance-totals');
  await expect(totals).toContainText('Einheiten');
  await expect(totals.locator('dd').first()).toHaveText('2');
  await expect(page.getByRole('img', { name: 'Strecke pro Woche' })).toBeVisible();
  await page
    .getByRole('group', { name: 'Kennzahl pro Woche' })
    .getByRole('button', { name: 'Dauer' })
    .click();
  await expect(page.getByRole('img', { name: 'Dauer pro Woche' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Pace-Entwicklung Laufen' })).toBeVisible();
  await expect(page.getByTestId('hr-zones')).toContainText('Z4 Schwelle');
  await expect(page.getByText('Aus 2 Einheiten mit Pulsverlauf.')).toBeVisible();
  await expect(page.getByRole('button', { name: /30 min Ausdauer$/ })).toHaveCount(2);
  // Ohne Sportart: Hinweis statt Pace
  await page.getByLabel('Sportart').selectOption('');
  await expect(page.getByText(/Wähle oben eine Sportart/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bestzeiten Laufen' })).toBeVisible();
  // Kraft bleibt erreichbar
  await page.getByRole('group', { name: 'Bereich' }).getByRole('button', { name: 'Kraft' }).click();
  await expect(page.getByText(/Noch keine beendeten Trainings/)).toBeVisible();

  // Startseite: Widget „Ausdauer“, „Diese Woche“ und Trainingstage kennen die Läufe
  await openNav(page, 'Dashboard');
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page.getByRole('button', { name: 'Ausdauer hinzufügen' }).click();
  await page.getByRole('button', { name: 'Trainingstage hinzufügen' }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  const week = page.getByRole('list', { name: 'Ausdauer diese Woche' });
  await expect(week).toContainText('Laufen');
  await expect(page.getByTestId('week-endurance')).toContainText('Laufen');
  await page
    .getByRole('button', { name: /30 min Ausdauer$/ })
    .last()
    .click();
  await page.getByRole('link', { name: 'Laufen öffnen' }).click();
  await expect(page.getByRole('list', { name: 'Bestzeiten in dieser Einheit' })).toBeVisible();

  // Ernährung: verbrannte Kalorien erhöhen das Ziel
  await page.goto('./#/daily/nutrition');
  await expect(page.getByTestId('burned-kcal')).toHaveText(
    'Beim Training verbrannt: 400 kcal (im Ziel enthalten)',
  );
  await expect(page.getByTestId('nutrition-summary')).toContainText('von 2900 kcal');
});

test('Krafttraining: Teilen-Bild eines Workouts (offline)', async ({ page, context }) => {
  await page.goto('./');
  await goOffline(page, context);
  await openNav(page, 'Training');
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  await page.getByRole('button', { name: '+ Übung hinzufügen' }).click();
  const picker = page.getByRole('dialog', { name: 'Übung hinzufügen' });
  await picker.getByRole('searchbox', { name: 'Übung suchen' }).fill('Bankdrücken (Langhantel)');
  await picker
    .getByRole('button', { name: /^Bankdrücken \(Langhantel\)/ })
    .first()
    .click();
  const bench = page.getByRole('region', { name: 'Bankdrücken (Langhantel)' });
  await fillStepper(bench, 'Gewicht', '60');
  await fillStepper(bench, 'Wiederholungen', '10');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).toHaveURL(/#\/training\/history\/[\w-]+$/);

  await page.getByRole('button', { name: 'Teilen-Bild' }).click();
  expect(await pngSize(await saveImage(page))).toEqual({ width: 1080, height: 1920 });
  const dialog = page.getByRole('dialog', { name: 'Teilen-Bild' });
  await dialog.getByRole('button', { name: 'Sticker' }).click();
  // Übungsliste, Kopf und Kennzahlen, ohne Rekord-Zeile
  expect(await pngSize(await saveImage(page))).toEqual({ width: 1080, height: 1030 });
});
