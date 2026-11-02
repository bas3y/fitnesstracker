import { expect, test, type Page } from '@playwright/test';
import { dailyTile, fillStepper, goOffline } from './helpers';

const openNav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

const card = (page: Page, name: string) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name, exact: true }) });

test('Tag erfassen, Verlauf, Ziele und Dashboard-Widget (offline)', async ({ page, context }) => {
  await page.goto('./');
  await goOffline(page, context);
  await page.reload();

  await openNav(page, 'Alltag');
  await expect(dailyTile(page, 'Körper & Befinden')).toContainText('Noch nichts eingetragen');
  await dailyTile(page, 'Körper & Befinden').click();
  await expect(page.getByRole('heading', { name: 'Körper & Befinden', level: 1 })).toBeVisible();
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
  // Nach dem Abschicken steht der gespeicherte Wert im Feld; Neuladen bräche das Schreiben sonst ab
  await expect(page.getByLabel('Körpergewicht an diesem Tag', { exact: true })).toHaveValue('80');

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
  await expect(dailyTile(page, 'Körper & Befinden')).toContainText('Wasser 1000 ml');
  await expect(dailyTile(page, 'Körper & Befinden')).toContainText('Schlaf 7,5 h');
  await dailyTile(page, 'Körper & Befinden').click();
  await expect(water.getByText('1000 von 2000 ml')).toBeVisible();
  await page.getByRole('link', { name: '‹ Zurück' }).click();

  // Verlauf als eigene Seite (eigener Chunk mit Recharts, offline aus dem Precache)
  await dailyTile(page, 'Verlauf').click();
  await expect(page.getByRole('heading', { name: 'Verlauf', level: 1 })).toBeVisible();
  const history = page.locator('main');
  const metric = (name: string) =>
    history.getByRole('group', { name: 'Kennzahl' }).getByRole('button', { name, exact: true });
  await expect(history.getByTestId('daily-summary')).toHaveText('80 kg → 79,5 kg (−0,6 %)');
  await expect(page.getByRole('img', { name: 'Gewicht im Verlauf' })).toBeVisible();
  await metric('Schritte').click();
  await expect(history.getByTestId('daily-summary')).toHaveText(
    'Ø 10000 Schritte · Ziel an 1 von 2 Tagen',
  );
  await metric('Stimmung').click();
  await expect(history.getByTestId('daily-summary')).toHaveText('Ø 5 von 5');
  await metric('Energie').click();
  await expect(history.getByText('Keine Einträge in diesem Zeitraum.')).toBeVisible();
  // Zeitraum steht in der URL und übersteht das Neuladen
  await history.getByRole('button', { name: '4 Wo.' }).click();
  await page.reload();
  await expect(history.getByRole('button', { name: '4 Wo.' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('link', { name: '‹ Zurück' }).click();
  await expect(page.getByRole('heading', { name: 'Alltag', level: 1 })).toBeVisible();

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
  await expect(page.getByRole('heading', { name: 'Körper & Befinden', level: 1 })).toBeVisible();
  // Von der Startseite aus führt „Zurück“ dorthin
  await page.getByRole('link', { name: '‹ Zurück' }).click();
  await expect(page.getByRole('heading', { name: 'Fitnesstracker', level: 1 })).toBeVisible();
});

test('Übersicht → Unterseite → zurück mit gewähltem Tag (offline)', async ({ page, context }) => {
  await page.goto('./');
  await goOffline(page, context);
  await page.reload();

  await openNav(page, 'Alltag');
  const tiles = page.getByRole('list', { name: 'Bereiche' }).getByRole('link');
  await expect(tiles).toHaveCount(6);
  await expect(dailyTile(page, 'Gewohnheiten')).toContainText('Noch keine');
  await expect(dailyTile(page, 'To-dos')).toContainText('Keine offen');
  await expect(dailyTile(page, 'Ernährung')).toContainText('0 von 2200 kcal');
  await expect(dailyTile(page, 'Supplements')).toContainText('Noch keine');

  // Gestern wählen: Kacheln und Unterseiten zeigen diesen Tag
  await page.getByRole('button', { name: 'Vorheriger Tag' }).click();
  await expect(page.getByRole('heading', { name: 'Gestern' })).toBeVisible();
  await expect(dailyTile(page, 'To-dos')).toContainText('Nichts erledigt');

  const pages = [
    { tile: 'Körper & Befinden', title: 'Körper & Befinden', withDay: true },
    { tile: 'Ernährung', title: 'Ernährung', withDay: true },
    { tile: 'Gewohnheiten', title: 'Gewohnheiten', withDay: false },
    { tile: 'Supplements', title: 'Supplements', withDay: false },
    { tile: 'To-dos', title: 'To-dos', withDay: false },
    { tile: 'Verlauf', title: 'Verlauf', withDay: false },
  ];
  for (const { tile, title, withDay } of pages) {
    await dailyTile(page, tile).click();
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    // Ohne Einträge zeigen Gewohnheiten/Supplements keine Tagauswahl
    if (withDay) await expect(page.getByRole('heading', { name: 'Gestern' })).toBeVisible();
    await page.getByRole('link', { name: '‹ Zurück' }).click();
    await expect(page.getByRole('heading', { name: 'Alltag', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gestern' })).toBeVisible();
  }

  // Auf der Unterseite den Tag wechseln: zurück zur Übersicht mit diesem Tag
  await dailyTile(page, 'Körper & Befinden').click();
  await page.getByRole('button', { name: 'Nächster Tag' }).click();
  await expect(page.getByRole('heading', { name: 'Heute' })).toBeVisible();
  await card(page, 'Wasser').getByRole('button', { name: '+500 ml' }).click();
  await expect(card(page, 'Wasser').getByText('500 von 2500 ml')).toBeVisible();
  // Körpermaße hängen unter Körper & Befinden
  await page.getByRole('link', { name: /^Körpermaße/ }).click();
  await expect(page.getByRole('heading', { name: 'Körpermaße', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: '‹ Zurück' }).click();
  await expect(page.getByRole('heading', { name: 'Körper & Befinden', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: '‹ Zurück' }).click();
  await expect(page.getByRole('heading', { name: 'Heute' })).toBeVisible();
  await expect(dailyTile(page, 'Körper & Befinden')).toContainText('Wasser 500 ml');
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
