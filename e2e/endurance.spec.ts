import { expect, test, type Page } from '@playwright/test';
import { dragTo, fillStepper, goOffline } from './helpers';

const openNav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

const tiles = (page: Page) => page.getByRole('list', { name: 'Aktivitäten' }).getByRole('link');
const tile = (page: Page, name: string) =>
  page
    .getByRole('list', { name: 'Aktivitäten' })
    .getByRole('link', { name: new RegExp(`^${name}`) });

function todayInput(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

async function fillDuration(page: Page, minutes: string) {
  const duration = page.getByRole('group', { name: 'Dauer' });
  await duration.getByLabel('Stunden').fill('');
  await duration.getByLabel('Minuten').fill(minutes);
  await duration.getByLabel('Sekunden').fill('');
}

test('Ausdauer: Kacheln, Einheiten erfassen, Ausrüstung und Anpassen (offline)', async ({
  page,
  context,
}) => {
  const body = page.locator('body');
  await page.goto('./#/training');
  await goOffline(page, context);
  await page.reload();

  // Übersicht: Krafttraining oben, darunter sechs Aktivitäten
  await expect(page.getByRole('heading', { name: 'Krafttraining', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Workout starten' })).toBeVisible();
  await expect(tiles(page)).toHaveCount(6);
  await expect(tile(page, 'Laufen')).toContainText('Diese Woche noch nichts');

  // Laufschuh anlegen, der kurz vor der Warnschwelle steht
  await tile(page, 'Laufen').click();
  await expect(page.getByRole('heading', { name: 'Laufen', exact: true })).toBeVisible();
  await expect(page.getByText(/^Noch keine Einheit/)).toBeVisible();
  await page.getByRole('link', { name: /^Ausrüstung/ }).click();
  await page.getByRole('link', { name: '+ Neue Ausrüstung' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Pegasus');
  await fillStepper(body, 'Bisherige Strecke', '695');
  await expect(page.getByLabel('Warnung ab', { exact: true })).toHaveValue('700');
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByRole('link', { name: /^Pegasus/ })).toContainText('695 km');
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();

  // Lauf erfassen: Pace wird live berechnet, der einzige Schuh ist vorausgewählt
  await page.getByRole('link', { name: '+ Einheit erfassen' }).click();
  await page.getByLabel('Titel (optional)').fill('Morgenlauf');
  await page.getByLabel('Datum').fill(todayInput());
  await page.getByLabel('Beginn').fill('07:00');
  await fillDuration(page, '25');
  await fillStepper(body, 'Distanz', '5');
  await expect(page.getByTestId('pace-preview')).toHaveText('Pace: 5:00 /km');
  await expect(page.getByLabel('Ausrüstung')).toHaveValue(/.+/);
  await expect(page.getByLabel('Ausrüstung').locator('option:checked')).toHaveText('Pegasus');
  await fillStepper(body, 'Puls Ø', '150');
  await page.getByRole('button', { name: 'Bewertung 4' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();

  const run = page.getByRole('link', { name: /^Morgenlauf/ });
  await expect(run).toContainText('5 km · 25:00 · 5:00 /km');
  await expect(page.getByTestId('activity-summary')).toContainText('5 km');
  await expect(page.getByRole('link', { name: /Pegasus hat 700 km/ })).toBeVisible();
  await page.reload();
  await expect(run).toBeVisible();

  // Detail und Bearbeiten
  await run.click();
  const facts = page.getByTestId('session-facts');
  await expect(facts).toContainText('5:00 /km');
  await expect(facts).toContainText('150 bpm');
  await expect(facts).toContainText('4 von 5');
  await expect(page.getByRole('link', { name: 'Pegasus' })).toBeVisible();
  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  await fillStepper(body, 'Distanz', '10');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(facts).toContainText('10 km');
  await expect(facts).toContainText('2:30 /km');

  // Schuh: Kilometerstand und Warnung
  await page.getByRole('link', { name: 'Pegasus' }).click();
  await expect(page.getByTestId('gear-distance')).toHaveText('705 km');
  await expect(page.getByText(/Warnschwelle von 700 km erreicht/)).toBeVisible();
  await page.getByRole('button', { name: 'Ausmustern' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Ausgemustert' })).toBeVisible();
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(facts).toBeVisible();
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(page.getByRole('link', { name: /Pegasus hat/ })).toHaveCount(0);

  // Schwimmen: Distanz aus Bahnen × Bahnlänge
  await openNav(page, 'Training');
  await tile(page, 'Schwimmen').click();
  await page.getByRole('link', { name: '+ Einheit erfassen' }).click();
  await page.getByLabel('Datum').fill(todayInput());
  await fillDuration(page, '20');
  await expect(page.getByLabel('Bahnlänge', { exact: true })).toHaveValue('25');
  await fillStepper(body, 'Bahnen', '40');
  await expect(page.getByTestId('lap-distance')).toHaveText('Distanz: 1000 m');
  await expect(page.getByTestId('pace-preview')).toHaveText('Pace: 2:00 /100 m');
  await page.getByRole('group', { name: 'Stil' }).getByRole('button', { name: 'Kraul' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('link', { name: /^Schwimmen/ })).toContainText(
    '1000 m · 20:00 · 2:00 /100 m',
  );

  // Wochenstand auf den Kacheln
  await openNav(page, 'Training');
  await expect(tile(page, 'Laufen')).toContainText('10 km diese Woche');
  await expect(tile(page, 'Laufen')).toContainText('1 Einheit');
  await expect(tile(page, 'Schwimmen')).toContainText('1000 m diese Woche');

  // Anpassen: Sonstiges ausblenden, Schwimmen nach oben ziehen, Sonstiges wieder hinzufügen
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page.getByRole('button', { name: 'Sonstiges ausblenden' }).click();
  await dragTo(
    page,
    page.getByRole('button', { name: 'Schwimmen verschieben' }),
    page.getByRole('list', { name: 'Kacheln' }).locator(':scope > li').first(),
  );
  await expect(page.getByRole('button', { name: /verschieben$/ }).first()).toHaveAccessibleName(
    'Schwimmen verschieben',
  );
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(tiles(page)).toHaveCount(5);
  await expect(tiles(page).first()).toHaveAccessibleName(/^Schwimmen/);
  await page.reload();
  await expect(tiles(page)).toHaveCount(5);
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page.getByRole('button', { name: 'Sonstiges hinzufügen' }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(tiles(page)).toHaveCount(6);
  await expect(tiles(page).last()).toHaveAccessibleName(/^Sonstiges/);

  // Löschen
  await tile(page, 'Laufen').click();
  await run.click();
  await page.getByRole('button', { name: 'Einheit löschen' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click();
  await expect(page.getByText(/^Noch keine Einheit/)).toBeVisible();
});

test('Ausdauer über den Schnellzugriff erfassen, zählt als Trainingstag (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await goOffline(page, context);
  await page.reload();

  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page
    .getByRole('group', { name: 'Buttons im Schnellzugriff' })
    .getByRole('button', { name: /Ausdauer/ })
    .click();
  await page.getByRole('button', { name: 'Fertig' }).click();

  await page
    .getByRole('list', { name: 'Schnellzugriff' })
    .getByRole('button', { name: /Ausdauer/ })
    .click();
  await page
    .getByRole('dialog', { name: 'Ausdauer erfassen' })
    .getByRole('link', { name: /Radfahren/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Radfahren erfassen' })).toBeVisible();
  await page.getByLabel('Datum').fill(todayInput());
  await page.getByLabel('Beginn').fill('00:00');
  await fillDuration(page, '60');
  await expect(page.getByRole('group', { name: 'Dauer' }).getByLabel('Minuten')).toHaveValue('59');
  await page.getByRole('group', { name: 'Dauer' }).getByLabel('Stunden').fill('1');
  await page.getByRole('group', { name: 'Dauer' }).getByLabel('Minuten').fill('');
  await fillStepper(page.locator('body'), 'Distanz', '30');
  await expect(page.getByTestId('pace-preview')).toHaveText('Geschwindigkeit: 30 km/h');
  await page.getByRole('button', { name: 'Speichern' }).click();

  // Zurück auf der Startseite mit Hinweis
  await expect(page.getByRole('status').filter({ hasText: 'Radfahren gespeichert' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Schnellzugriff' })).toBeVisible();

  // Ernährung: heute gilt das Trainingstag-Ziel
  await openNav(page, 'Alltag');
  await page
    .getByRole('list', { name: 'Bereiche' })
    .getByRole('link', { name: /^Ernährung/ })
    .click();
  await expect(page.getByText(/^Trainingstag/)).toBeVisible();
});
