import { expect, test, type Page } from '@playwright/test';
import { dailyTile, fillStepper, goOffline } from './helpers';

const openNav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

const card = (page: Page, name: string) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name, exact: true }) });

async function addTodo(page: Page, title: string, priority?: string, day?: string) {
  const todos = card(page, 'To-dos');
  await todos.getByLabel('Neue Aufgabe').fill(title);
  if (priority) await todos.getByRole('button', { name: priority, exact: true }).click();
  if (day) await todos.getByRole('button', { name: day, exact: true }).click();
  await todos.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await expect(todos.getByLabel('Neue Aufgabe')).toHaveValue('');
}

test('To-dos: Priorität, Übertrag, Bearbeiten und Liste (offline)', async ({ page, context }) => {
  // Schnelleingabe steht als Widget auf der Startseite
  await page.goto('./');
  await goOffline(page, context);
  await page.reload();

  const todos = card(page, 'To-dos');
  const open = todos.getByRole('list', { name: 'Offene Aufgaben' });
  await expect(todos.getByText('Keine offenen Aufgaben.')).toBeVisible();

  // Hohe Priorität steht oben, „Morgen“ erscheint noch nicht
  await addTodo(page, 'Einkaufen');
  await addTodo(page, 'Steuererklärung', 'Hoch');
  await addTodo(page, 'Zahnarzt anrufen', 'Niedrig', 'Morgen');
  await expect(open.getByRole('checkbox')).toHaveCount(2);
  await expect(open.getByRole('listitem').first()).toContainText('Steuererklärung');
  await expect(open.getByRole('listitem').first()).toContainText('Hoch');
  await expect(todos.getByRole('link', { name: /Alle Aufgaben \(1 geplant\)/ })).toBeVisible();

  // Auf gestern verschoben: wandert in den heutigen Tag, mit Hinweis
  await todos.getByRole('button', { name: 'Bearbeiten: Einkaufen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Aufgabe bearbeiten' });
  const yesterday = await page.evaluate(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toLocaleDateString('sv-SE');
  });
  await dialog.getByLabel('Datum wählen').fill(yesterday);
  await dialog.getByLabel('Aufgabe', { exact: true }).fill('Wocheneinkauf');
  await dialog.getByRole('button', { name: 'Speichern' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(open.getByRole('listitem').last()).toContainText('Wocheneinkauf');
  await expect(open.getByRole('listitem').last()).toContainText('seit gestern');

  // Abhaken: wandert unter „heute erledigt“
  await open.getByRole('checkbox', { name: 'Steuererklärung' }).click();
  await expect(open.getByRole('checkbox')).toHaveCount(1);
  await todos.getByRole('button', { name: '1 heute erledigt' }).click();
  await expect(
    todos.getByRole('list', { name: 'Heute erledigt' }).getByRole('checkbox'),
  ).toHaveAttribute('aria-checked', 'true');

  await page.reload();
  await expect(open.getByRole('checkbox')).toHaveCount(1);

  // Gesamtliste: Heute, Geplant, Erledigt; Erledigte entfernen
  await todos.getByRole('link', { name: /Alle Aufgaben/ }).click();
  await expect(page.getByRole('heading', { name: 'To-dos', level: 1 })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Geplant' })).toContainText('Zahnarzt anrufen');
  await expect(page.getByRole('list', { name: 'Erledigt' })).toContainText('Steuererklärung');
  await page.getByRole('button', { name: 'Erledigte entfernen' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Entfernen' }).click();
  await expect(page.getByRole('list', { name: 'Erledigt' })).toHaveCount(0);

  // Löschen im Bearbeiten-Dialog
  await page.getByRole('button', { name: 'Bearbeiten: Zahnarzt anrufen' }).click();
  await page.getByRole('button', { name: 'Aufgabe löschen' }).click();
  await expect(page.getByRole('list', { name: 'Geplant' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fitnesstracker', level: 1 })).toBeVisible();

  // Kachel auf der Alltag-Übersicht
  await openNav(page, 'Alltag');
  await expect(dailyTile(page, 'To-dos')).toContainText('1 offen');
  await dailyTile(page, 'To-dos').click();
  await expect(page.getByRole('list', { name: 'Heute' })).toContainText('Wocheneinkauf');
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Alltag', level: 1 })).toBeVisible();
});

test('Startseite: Schnellzugriff, Gewohnheiten und To-dos als Widgets (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await goOffline(page, context);
  await page.reload();

  const quick = page.getByRole('list', { name: 'Schnellzugriff' });
  await expect(card(page, 'Gewohnheiten').getByText('Noch keine Gewohnheiten.')).toBeVisible();

  // To-do über den Schnellzugriff
  await quick.getByRole('button', { name: /To-do/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Neue Aufgabe' });
  await dialog.getByLabel('Neue Aufgabe').fill('Wäsche');
  await dialog.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(card(page, 'To-dos').getByRole('checkbox', { name: 'Wäsche' })).toBeVisible();

  // Wasser mit Hinweis, Gewicht im Fenster
  await quick.getByRole('button', { name: /Wasser/ }).click();
  await expect(page.getByRole('status').filter({ hasText: '+250 ml Wasser' })).toContainText(
    '250 von 2500 ml',
  );
  await quick.getByRole('button', { name: /Gewicht/ }).click();
  const weight = page.getByRole('dialog', { name: 'Gewicht heute' });
  await fillStepper(weight, 'Körpergewicht heute', '81,5');
  await expect(weight.getByLabel('Körpergewicht heute', { exact: true })).toHaveValue('81,5');
  await weight.getByRole('button', { name: 'Fertig' }).click();

  // Training ohne laufendes Workout führt zur Trainingsseite
  await quick.getByRole('link', { name: /Training/ }).click();
  await expect(page.getByRole('heading', { name: 'Training', level: 1 })).toBeVisible();

  // Werte kommen unter Alltag → Körper & Befinden an
  await openNav(page, 'Alltag');
  await dailyTile(page, 'Körper & Befinden').click();
  await expect(card(page, 'Wasser').getByText('250 von 2500 ml')).toBeVisible();
  await expect(page.getByLabel('Körpergewicht an diesem Tag', { exact: true })).toHaveValue('81,5');

  // Gewohnheit direkt auf der Startseite abhaken
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await dailyTile(page, 'Gewohnheiten').click();
  await page.getByRole('link', { name: '+ Neue Gewohnheit' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Dehnen');
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await openNav(page, 'Dashboard');
  const habits = card(page, 'Gewohnheiten');
  await habits.getByRole('checkbox', { name: 'Dehnen' }).click();
  await expect(habits.getByText('1 von 1 erledigt')).toBeVisible();
  await page.reload();
  await expect(card(page, 'Gewohnheiten').getByText('1 von 1 erledigt')).toBeVisible();
});
