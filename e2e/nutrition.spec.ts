import { expect, test, type Locator, type Page } from '@playwright/test';
import { confirmStart, dailyTile, fillStepper, goOffline, openSettings } from './helpers';

const openNav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

const card = (page: Page, name: string) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name, exact: true }) });

/** Lebensmittel in der offenen Auswahl suchen und antippen */
async function choose(picker: Locator, query: string, name: string) {
  await picker.getByRole('searchbox', { name: 'Lebensmittel suchen' }).fill(query);
  await picker
    .getByRole('list', { name: 'Suchergebnisse' })
    .getByText(name, { exact: true })
    .first()
    .click();
  await expect(picker.getByRole('heading', { name, exact: true })).toBeVisible();
}

async function addFood(picker: Locator, query: string, name: string, grams?: string) {
  await choose(picker, query, name);
  if (grams) {
    await picker
      .getByRole('group', { name: 'Einheit' })
      .getByRole('button', { name: 'Gramm' })
      .click();
    await fillStepper(picker, 'Menge', grams);
  }
  await picker.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(picker.getByRole('status')).toContainText(name);
}

test('Ernährung: Tag mit 3 Mahlzeiten offline erfassen, Summen, Wiederholen und Ziele', async ({
  page,
  context,
}) => {
  await page.goto('./#/daily/nutrition');
  await goOffline(page, context);
  await page.reload();
  const summary = page.getByTestId('nutrition-summary');
  await expect(summary).toContainText('0 von 2200 kcal');
  await expect(card(page, 'Übersicht')).toContainText('Ruhetag');

  // Frühstück: Gramm und Portion
  const breakfast = card(page, 'Frühstück');
  await breakfast.getByRole('button', { name: 'Frühstück: hinzufügen' }).click();
  const picker = page.getByRole('dialog');
  await addFood(picker, 'Haferflocken', 'Haferflocken', '60');
  await choose(picker, 'Magerquark', 'Magerquark');
  await expect(picker.getByTestId('amount-preview')).toHaveText(
    '168 kcal · P 30 g · KH 10 g · F 1 g',
  );
  await picker.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(picker.getByRole('status')).toHaveText('Hinzugefügt: Haferflocken, Magerquark');
  await picker.getByRole('button', { name: 'Fertig' }).click();
  await expect(breakfast).toContainText('395 kcal · P 38 g');
  await expect(breakfast.getByRole('button', { name: /^Haferflocken \d/ })).toContainText('60 g');

  // Mittagessen
  const lunch = card(page, 'Mittagessen');
  await lunch.getByRole('button', { name: 'Mittagessen: hinzufügen' }).click();
  await addFood(picker, 'Hähnchenbrust', 'Hähnchenbrust, roh', '200');
  await addFood(picker, 'Reis gekocht', 'Reis, weiß (gekocht)');
  await picker.getByRole('button', { name: 'Fertig' }).click();
  await expect(lunch).toContainText('500 kcal · P 50 g');

  // Abendessen: eigenes Lebensmittel direkt in der Auswahl anlegen
  const dinner = card(page, 'Abendessen');
  await dinner.getByRole('button', { name: 'Abendessen: hinzufügen' }).click();
  await picker.getByRole('searchbox', { name: 'Lebensmittel suchen' }).fill('Proteinriegel Test');
  await expect(picker.getByText('Keine Treffer für „Proteinriegel Test“.')).toBeVisible();
  await picker.getByRole('button', { name: '+ Eigenes Lebensmittel anlegen' }).click();
  await expect(picker.getByLabel('Name', { exact: true })).toHaveValue('Proteinriegel Test');
  await fillStepper(picker, 'Brennwert', '380');
  await fillStepper(picker, 'Protein', '30');
  await fillStepper(picker, 'Kohlenhydrate', '40');
  await fillStepper(picker, 'davon Zucker', '5');
  await fillStepper(picker, 'Fett', '15');
  await picker.getByRole('button', { name: '+ Portion' }).click();
  await picker.getByLabel('Portion (1)').fill('1 Riegel');
  await fillStepper(picker, 'Gewicht (1)', '50');
  await picker.getByRole('button', { name: 'Anlegen und auswählen' }).click();
  await expect(picker.getByRole('heading', { name: 'Proteinriegel Test' })).toBeVisible();
  await picker.getByRole('button', { name: 'Hinzufügen' }).click();
  await picker.getByRole('button', { name: 'Fertig' }).click();
  await expect(dinner.getByRole('button', { name: /^Proteinriegel Test \d/ })).toContainText(
    '1 Riegel (50 g) · 190 kcal · P 15 g',
  );

  // Summe: 227,4 + 167,5 + 240 + 260 + 190 kcal; 7,92 + 30 + 45 + 5,4 + 15 g Protein
  await expect(summary).toContainText('1085 von 2200 kcal');
  await expect(summary).toContainText('103 von 150 g');
  await page.reload();
  await expect(summary).toContainText('1085 von 2200 kcal');

  // Lieblingsmahlzeit speichern und gestern als Snack eintragen
  await breakfast.getByRole('button', { name: 'Frühstück: Lieblingsmahlzeiten' }).click();
  const saved = page.getByRole('dialog', { name: 'Lieblingsmahlzeiten' });
  await saved.getByLabel('Frühstück von diesem Tag speichern als').fill('Porridge');
  await saved.getByRole('button', { name: 'Speichern' }).click();
  await expect(saved.getByRole('list', { name: 'Gespeicherte Mahlzeiten' })).toContainText(
    'Haferflocken, Magerquark',
  );
  await saved.getByRole('button', { name: 'Fertig' }).click();

  await page.getByRole('button', { name: 'Vorheriger Tag' }).click();
  await expect(page.getByRole('heading', { name: 'Gestern' })).toBeVisible();
  const snacks = card(page, 'Snacks');
  await snacks.getByRole('button', { name: 'Snacks: Lieblingsmahlzeiten' }).click();
  await saved.getByRole('button', { name: /^Porridge \d/ }).click();
  const toast = page.getByRole('button', { name: /^Porridge eingetragen/ });
  await expect(toast).toBeVisible();
  await toast.click();
  await expect(snacks).toContainText('395 kcal · P 38 g');
  await expect(summary).toContainText('395 von 2200 kcal');

  // Heute: Snacks wie gestern
  await page.getByRole('button', { name: 'Nächster Tag' }).click();
  await expect(page.getByRole('heading', { name: 'Heute' })).toBeVisible();
  await snacks.getByRole('button', { name: 'Snacks: wie gestern' }).click();
  await page.getByRole('button', { name: /^Snacks wie am Vortag/ }).click();
  await expect(snacks.getByRole('list', { name: 'Snacks' }).getByRole('listitem')).toHaveCount(2);
  await expect(summary).toContainText('1480 von 2200 kcal');

  // Menge ändern und Eintrag entfernen
  await breakfast.getByRole('button', { name: /^Haferflocken \d/ }).click();
  const entry = page.getByRole('dialog', { name: 'Haferflocken' });
  await fillStepper(entry, 'Menge', '80');
  await expect(entry.getByTestId('amount-preview')).toContainText('303 kcal');
  await entry.getByRole('button', { name: 'Fertig' }).click();
  await expect(breakfast).toContainText('471 kcal · P 41 g');
  await dinner.getByRole('button', { name: 'Proteinriegel Test entfernen' }).click();
  await expect(dinner.getByText('Noch nichts eingetragen.')).toBeVisible();

  // Ziel für Ruhetage ändern
  await openSettings(page, 'Ernährung');
  const goals = page.getByRole('main');
  await fillStepper(goals, 'Kalorien (Ruhetag)', '2000');
  await expect(goals.getByLabel('Kalorien (Ruhetag)', { exact: true })).toHaveValue('2000');

  // Kachel auf der Alltag-Übersicht, Startseite mit Widget und Schnellzugriff
  await openNav(page, 'Alltag');
  await expect(dailyTile(page, 'Ernährung')).toContainText('1366 von 2000 kcal');
  await openNav(page, 'Dashboard');
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page.getByRole('button', { name: 'Ernährung hinzufügen' }).click();
  await page
    .getByRole('group', { name: 'Buttons im Schnellzugriff' })
    .getByRole('button', { name: /Mahlzeit/ })
    .click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(card(page, 'Ernährung')).toContainText('1366 von 2000 kcal');
  await page
    .getByRole('list', { name: 'Schnellzugriff' })
    .getByRole('link', { name: /Mahlzeit/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Ernährung', level: 1 })).toBeVisible();

  // Mit Workout gilt der Tag als Trainingstag
  await openNav(page, 'Training');
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  await openNav(page, 'Alltag');
  await expect(dailyTile(page, 'Ernährung')).toContainText('1366 von 2500 kcal');
  await dailyTile(page, 'Ernährung').click();
  const daily = card(page, 'Übersicht');
  await expect(daily).toContainText('Trainingstag');
  await expect(daily.getByTestId('nutrition-summary')).toContainText('1366 von 2500 kcal');
});

test('Lebensmittel und Rezepte: anlegen, Favorit, ausblenden (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/daily/foods');
  await goOffline(page, context);
  await page.reload();
  const body = page.locator('body');

  // Eigenes Lebensmittel
  await page.getByRole('link', { name: '+ Lebensmittel' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Mein Skyr');
  await page.getByLabel('Kategorie').selectOption({ label: 'Milch & Käse' });
  await fillStepper(body, 'Brennwert', '63');
  await fillStepper(body, 'Protein', '11');
  await fillStepper(body, 'Kohlenhydrate', '4');
  await fillStepper(body, 'davon Zucker', '4');
  await fillStepper(body, 'Fett', '0,2');
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByRole('heading', { name: 'Mein Skyr', level: 1 })).toBeVisible();
  await expect(card(page, 'Nährwerte')).toContainText('63 kcal');

  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  await fillStepper(body, 'Brennwert', '65');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(card(page, 'Nährwerte')).toContainText('65 kcal');

  // Rezept mit Gewicht nach dem Kochen
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await page.getByRole('link', { name: '+ Rezept' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Overnight Oats');
  await page.getByRole('button', { name: '+ Zutat' }).click();
  const picker = page.getByRole('dialog');
  await addFood(picker, 'Haferflocken', 'Haferflocken', '50');
  await choose(picker, 'Mein Skyr', 'Mein Skyr');
  await fillStepper(picker, 'Menge', '150');
  await picker.getByRole('button', { name: 'Hinzufügen' }).click();
  await picker.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByLabel('Mein Skyr', { exact: true })).toHaveValue('150');
  await page.getByLabel('Gewicht nach dem Kochen angeben').check();
  await fillStepper(body, 'Gewicht nach dem Kochen', '250');
  // 189,5 + 97,5 kcal auf 250 g
  const preview = page.getByTestId('recipe-preview');
  await expect(preview).toContainText('Pro 100 g115 kcal · P 9,2 g');
  await expect(preview).toContainText('Pro Portion (250 g)287 kcal · P 23 g');
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByRole('heading', { name: 'Overnight Oats', level: 1 })).toBeVisible();
  await expect(card(page, 'Nährwerte')).toContainText('1 Portion (250 g)');
  await expect(card(page, 'Zutaten')).toContainText('Haferflocken50 g');
  await page.getByRole('button', { name: '☆ Als Favorit markieren' }).click();
  await expect(page.getByRole('button', { name: '★ Favorit' })).toBeVisible();

  // Mitgeliefertes Lebensmittel ausblenden
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Lebensmittel suchen' }).fill('Banane');
  await page
    .getByRole('link', { name: /^Banane/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'Banane', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Ausblenden' }).click();
  await expect(page.getByText('Ausgeblendet: erscheint nicht in der Auswahl.')).toBeVisible();

  // In der Auswahl: Rezept unter Favoriten, Banane fehlt
  await page.goto('./#/daily/nutrition');
  await card(page, 'Snacks').getByRole('button', { name: 'Snacks: hinzufügen' }).click();
  await expect(picker.getByRole('list', { name: 'Favoriten' })).toContainText('Overnight Oats');
  await picker.getByRole('searchbox', { name: 'Lebensmittel suchen' }).fill('Banane');
  await expect(picker.getByText('Kochbanane', { exact: true })).toBeVisible();
  await expect(picker.getByText('Banane', { exact: true })).toHaveCount(0);
  await picker.getByRole('searchbox', { name: 'Lebensmittel suchen' }).fill('');
  await picker
    .getByRole('list', { name: 'Favoriten' })
    .getByText('Overnight Oats', { exact: true })
    .click();
  await picker.getByRole('button', { name: 'Hinzufügen' }).click();
  await picker.getByRole('button', { name: 'Fertig' }).click();
  await expect(card(page, 'Snacks')).toContainText('1 Portion (250 g) · 287 kcal · P 23 g');
});
