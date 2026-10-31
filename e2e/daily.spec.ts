import { expect, test, type Page } from '@playwright/test';
import { fillStepper, goOffline } from './helpers';

const openNav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

const card = (page: Page, name: string) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name, exact: true }) });

test('Tag erfassen, Verlauf, Ziele und Dashboard-Widget (offline)', async ({ page, context }) => {
  await page.goto('./');
  await goOffline(page, context);
  await page.reload();

  await openNav(page, 'Alltag');
  await expect(page.getByRole('heading', { name: 'Heute' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nächster Tag' })).toBeDisabled();

  // Schnell-Eingabe Wasser: schnelles Tippen darf nichts verlieren
  const water = card(page, 'Wasser');
  await water.getByRole('button', { name: '+250 ml' }).click();
  await water.getByRole('button', { name: '+250 ml' }).click();
  await water.getByRole('button', { name: '+500 ml' }).click();
  await expect(water.getByText('1000 von 2500 ml')).toBeVisible();
  await expect(water.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');

  await fillStepper(card(page, 'Schritte'), 'Schritte gesamt', '12000');
  await fillStepper(card(page, 'Schlaf'), 'Schlafdauer', '7,5');
  await page.getByRole('button', { name: 'Schlafqualität 4' }).click();
  await fillStepper(card(page, 'Gewicht'), 'Körpergewicht an diesem Tag', '79,5');
  await page.getByRole('button', { name: 'Stimmung 5' }).click();
  await page.getByRole('button', { name: 'Energie 3' }).click();

  // Nachtrag für gestern
  await page.getByRole('button', { name: 'Vorheriger Tag' }).click();
  await expect(page.getByRole('heading', { name: 'Gestern' })).toBeVisible();
  await expect(water.getByText('0 von 2500 ml')).toBeVisible();
  await fillStepper(card(page, 'Schritte'), 'Schritte gesamt', '8000');
  await fillStepper(card(page, 'Gewicht'), 'Körpergewicht an diesem Tag', '80');

  // Bleibt nach dem Neuladen erhalten
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Gestern' })).toBeVisible();
  await page.getByRole('button', { name: 'Nächster Tag' }).click();
  await expect(page.getByRole('heading', { name: 'Heute' })).toBeVisible();
  await expect(water.getByText('1000 von 2500 ml')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Schlafqualität 4' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Antippen derselben Bewertung nimmt sie zurück
  await page.getByRole('button', { name: 'Energie 3' }).click();
  await expect(page.getByRole('button', { name: 'Energie 3' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  // Neuestes Gewicht steht in den Einstellungen, Tagesziel lässt sich ändern
  await openNav(page, 'Einstellungen');
  await expect(page.getByLabel('Körpergewicht', { exact: true })).toHaveValue('79,5');
  await fillStepper(page.locator('body'), 'Wasser pro Tag', '2000');

  await openNav(page, 'Alltag');
  await expect(water.getByText('1000 von 2000 ml')).toBeVisible();

  // Verlauf (eigener Chunk mit Recharts, muss offline aus dem Precache kommen)
  await page.getByRole('link', { name: /^Verlauf/ }).click();
  await expect(page.getByTestId('daily-summary')).toHaveText('80 kg → 79,5 kg (−0,6 %)');
  await expect(page.getByRole('img', { name: 'Gewicht im Verlauf' })).toBeVisible();
  await page.getByRole('button', { name: 'Schritte' }).click();
  await expect(page.getByTestId('daily-summary')).toHaveText(
    'Ø 10000 Schritte · Ziel an 1 von 2 Tagen',
  );
  await page.getByRole('button', { name: 'Stimmung' }).click();
  await expect(page.getByTestId('daily-summary')).toHaveText('Ø 5 von 5');
  await page.getByRole('button', { name: 'Energie' }).click();
  await expect(page.getByText('Keine Einträge in diesem Zeitraum.')).toBeVisible();
  await page.getByRole('link', { name: '‹ Zurück' }).click();

  // Widget: bei bestehenden Nutzern unter „Weitere Widgets“
  await openNav(page, 'Dashboard');
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page.getByRole('button', { name: 'Heute hinzufügen' }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  const widget = card(page, 'Heute');
  await expect(widget.getByText('12000')).toBeVisible();
  await expect(widget.getByText('1000 ml')).toBeVisible();
  await expect(widget.getByText('7,5 h')).toBeVisible();
  await expect(widget.getByText('79,5 kg')).toBeVisible();
  await widget.getByRole('button', { name: '+250 ml' }).click();
  await expect(widget.getByText('1250 ml')).toBeVisible();
  await page.reload();
  await expect(card(page, 'Heute').getByText('1250 ml')).toBeVisible();
  await card(page, 'Heute').getByRole('link', { name: 'Eintragen' }).click();
  await expect(page.getByRole('heading', { name: 'Alltag' })).toBeVisible();
});

test('Körpermaße erfassen, ansehen und löschen (offline)', async ({ page, context }) => {
  await page.goto('./#/daily/measurements');
  await goOffline(page, context);
  await page.reload();

  await fillStepper(page.locator('body'), 'Taille', '90');
  await fillStepper(page.locator('body'), 'Arm', '38,5');
  await expect(page.getByTestId('measure-summary')).toHaveText(
    'Ab der zweiten Messung entsteht eine Kurve.',
  );

  await page.getByRole('button', { name: 'Vorheriger Tag' }).click();
  await expect(page.getByRole('heading', { name: 'Gestern' })).toBeVisible();
  await fillStepper(page.locator('body'), 'Taille', '91');

  const list = page.getByRole('list', { name: 'Messungen' });
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await expect(list.getByRole('listitem').first()).toContainText('Taille 90 cm, Arm 38,5 cm');
  await expect(page.getByTestId('measure-summary')).toHaveText('91 cm → 90 cm');

  // Andere Messstelle im Graphen
  await page.getByRole('group', { name: 'Körpermaß' }).getByRole('button', { name: 'Arm' }).click();
  await expect(page.getByRole('img', { name: 'Arm im Verlauf' })).toBeVisible();

  await page.reload();
  await expect(list.getByRole('listitem')).toHaveCount(2);

  // Löschen mit Rückfrage
  await list
    .getByRole('button', { name: /löschen$/ })
    .first()
    .click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list).toContainText('Taille 91 cm');
});
