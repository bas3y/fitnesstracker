import { expect, test, type Page } from '@playwright/test';
import { confirmStart, dailyTile, fillStepper, goOffline } from './helpers';

const openNav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

const card = (page: Page, name: string) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name, exact: true }) });

async function addSupplement(page: Page, name: string, fill: () => Promise<void>) {
  await page.getByRole('link', { name: '+ Neues Supplement' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await fill();
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByRole('link', { name: new RegExp(`^💊 ${name}`) })).toBeVisible();
}

test('Supplements: anlegen, abhaken, Bestand, Trainingstage, Erinnerung und Widget (offline)', async ({
  page,
  context,
}) => {
  const body = page.locator('body');
  await page.goto('./#/daily/supplements');
  await goOffline(page, context);
  await page.reload();
  await expect(page.getByText(/^Noch keine Supplements/)).toBeVisible();

  await addSupplement(page, 'Kreatin', async () => {
    await page.getByLabel('Einheit', { exact: true }).fill('g');
    await fillStepper(body, 'Menge (1)', '5');
    await page.getByLabel('Uhrzeit (1)').fill('08:00');
    await page.getByLabel('Bestand erfassen').check();
    await fillStepper(body, 'Aktueller Bestand', '12');
    await fillStepper(body, 'Packungsgröße', '500');
  });
  await addSupplement(page, 'Pre-Workout', async () => {
    await page.getByLabel('Einheit', { exact: true }).fill('g');
    await fillStepper(body, 'Menge (1)', '10');
    await page
      .getByRole('group', { name: 'Zeitpunkt (1)' })
      .getByRole('button', { name: 'Vor dem Training' })
      .click();
    await page
      .getByRole('group', { name: 'Rhythmus' })
      .getByRole('button', { name: 'Trainingstage' })
      .click();
    await page
      .getByRole('group', { name: 'Training' })
      .getByRole('button', { name: 'Kraft' })
      .click();
  });
  await expect(page.getByRole('link', { name: /^💊 Pre-Workout/ })).toContainText(
    'Trainingstage (Kraft) · Vor dem Training',
  );

  // Ohne Training ist das Pre-Workout nur vorab abhakbar; Bestand reicht 12 g / 5 g = 2 Tage
  const intakes = card(page, 'Einnahmen');
  await expect(intakes.getByText('0 von 1 genommen')).toBeVisible();
  await expect(intakes.getByRole('list', { name: 'Einnahmen: Trainingstage' })).toContainText(
    'Pre-Workout',
  );
  await expect(intakes.getByRole('link', { name: /Kreatin: Reicht noch 2 Tage/ })).toBeVisible();

  // Abhaken zieht vom Bestand ab und übersteht ein Neuladen
  await intakes.getByRole('checkbox', { name: 'Kreatin' }).click();
  await expect(intakes.getByText('1 von 1 genommen')).toBeVisible();
  await expect(intakes.getByRole('link', { name: /Kreatin: Reicht noch 1 Tag$/ })).toBeVisible();
  await page.reload();
  await expect(intakes.getByRole('checkbox', { name: 'Kreatin' })).toHaveAttribute(
    'aria-checked',
    'true',
  );

  // Neue Packung
  await intakes.getByRole('link', { name: /Kreatin: Reicht noch/ }).click();
  const stock = page.getByTestId('supplement-stock');
  await expect(stock).toHaveText('7 g · Reicht noch 1 Tag');
  await page.getByRole('button', { name: 'Neue Packung (+500 g)' }).click();
  await expect(stock).toHaveText('507 g · Reicht noch 101 Tage');
  await page.getByRole('link', { name: '‹ Zurück' }).click();
  await expect(page.getByRole('heading', { name: 'Supplements', level: 1 })).toBeVisible();
  await expect(intakes.getByRole('list', { name: 'Niedriger Bestand' })).toHaveCount(0);

  // Workout gestartet → Erinnerung, Pre-Workout ist jetzt fällig
  await openNav(page, 'Training');
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  const reminder = page.getByRole('button', {
    name: 'Supplement fällig: Pre-Workout: 10 g · Vor dem Training – schließen',
  });
  await expect(reminder).toBeVisible();
  await reminder.click();

  await openNav(page, 'Alltag');
  await expect(dailyTile(page, 'Supplements')).toContainText('1 von 2');
  await dailyTile(page, 'Supplements').click();
  const daily = card(page, 'Einnahmen');
  await expect(daily.getByText('1 von 2 genommen')).toBeVisible();
  await daily.getByRole('checkbox', { name: 'Pre-Workout' }).click();
  await expect(daily.getByText('2 von 2 genommen')).toBeVisible();
  // Gestern: nur Kreatin fällig, kein Training
  await page.getByRole('button', { name: 'Vorheriger Tag' }).click();
  await expect(daily.getByText('0 von 1 genommen')).toBeVisible();
  await expect(daily.getByRole('checkbox', { name: 'Pre-Workout' })).toHaveCount(0);
  await page.getByRole('link', { name: '‹ Zurück' }).click();
  await expect(page.getByRole('heading', { name: 'Gestern' })).toBeVisible();
  await expect(dailyTile(page, 'Supplements')).toContainText('0 von 1');

  // Widget und Schnellzugriff auf der Startseite
  await openNav(page, 'Dashboard');
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page.getByRole('button', { name: 'Supplements hinzufügen' }).click();
  await page
    .getByRole('group', { name: 'Buttons im Schnellzugriff' })
    .getByRole('button', { name: /Supplements/ })
    .click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(card(page, 'Supplements').getByText('2 von 2 genommen')).toBeVisible();
  await page
    .getByRole('list', { name: 'Schnellzugriff' })
    .getByRole('link', { name: /Supplements/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Supplements', level: 1 })).toBeVisible();

  // Warnschwelle in den Einstellungen
  await openNav(page, 'Einstellungen');
  const settings = card(page, 'Supplements');
  await fillStepper(settings, 'Warnung ab Restbestand für', '14');
  await expect(settings.getByLabel('Warnung ab Restbestand für', { exact: true })).toHaveValue(
    '14',
  );
  await page.reload();
  await expect(settings.getByLabel('Warnung ab Restbestand für', { exact: true })).toHaveValue(
    '14',
  );
  await expect(settings).toContainText('keine echten Push-Nachrichten');
});

test('Supplements aus einer Gewohnheit übernehmen (offline)', async ({ page, context }) => {
  const body = page.locator('body');
  await page.goto('./#/daily/habits');
  await goOffline(page, context);
  await page.reload();

  await page.getByRole('link', { name: '+ Neue Gewohnheit' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Vitamin D');
  await page
    .getByRole('group', { name: 'Art' })
    .getByRole('button', { name: /^Zählen/ })
    .click();
  await fillStepper(body, 'Ziel pro Tag', '1');
  await page.getByLabel('Einheit', { exact: true }).fill('Tabletten');
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await page.getByRole('checkbox', { name: 'Vitamin D' }).click();
  await expect(card(page, 'Gewohnheiten').getByText('1 von 1 erledigt')).toBeVisible();

  await page.getByRole('link', { name: '‹ Zurück' }).click();
  await dailyTile(page, 'Supplements').click();
  await page.getByRole('button', { name: 'Aus Gewohnheit übernehmen' }).click();
  await page
    .getByRole('dialog', { name: 'Aus Gewohnheit übernehmen' })
    .getByRole('button', { name: /Vitamin D/ })
    .click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Übernehmen' }).click();
  const toast = page.getByRole('button', { name: /^1 Supplement übernommen: Vitamin D/ });
  await expect(toast).toBeVisible();
  await toast.click();

  // Heutige Einnahme ist mit übernommen, die Gewohnheit ist archiviert
  await expect(page.getByRole('link', { name: /^💊 Vitamin D/ })).toContainText(
    'Täglich · Morgens',
  );
  await expect(
    card(page, 'Einnahmen').getByRole('checkbox', { name: 'Vitamin D' }),
  ).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: 'Aus Gewohnheit übernehmen' })).toHaveCount(0);
  await page.getByRole('link', { name: '‹ Zurück' }).click();
  await expect(dailyTile(page, 'Gewohnheiten')).toContainText('Noch keine');
  await expect(dailyTile(page, 'Supplements')).toContainText('1 von 1');
});
