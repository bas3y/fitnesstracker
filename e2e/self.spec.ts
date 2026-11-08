import { expect, test, type Page } from '@playwright/test';
import { fillStepper, goOffline } from './helpers';

const selfRow = (page: Page, name: string) =>
  page
    .getByRole('list', { name: 'Persönliche Entwicklung' })
    .getByRole('link', { name: new RegExp(`^${name}`) });

test('Journal mit eigener Frage, Wochenreflexion und Suche (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/daily');
  await goOffline(page, context);
  await page.reload();

  await expect(selfRow(page, 'Journal')).toContainText('Heute noch nichts geschrieben');
  await selfRow(page, 'Journal').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Journal' })).toBeVisible();

  await page.getByLabel('Wie war dein Tag?').fill('Langer Lauf am Fluss');
  await page.getByLabel('Dankbar für 1').fill('Grüner Tee');
  await expect(page.getByText('Gespeichert', { exact: true })).toBeVisible();

  // Eigene Frage über „Anpassen“
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await expect(page.getByText('Noch keine eigenen Fragen.')).toBeVisible();
  await page.getByRole('button', { name: 'Frage hinzufügen' }).click();
  await expect(page.getByText('Bitte eine Frage eingeben')).toBeVisible();
  await page.getByLabel('Neue Frage').fill('Was habe ich gelernt?');
  await page.getByRole('button', { name: 'Frage hinzufügen' }).click();
  await page.getByRole('button', { name: '+ Worauf freue ich mich morgen?' }).click();
  const prompts = page.getByRole('list', { name: 'Eigene Fragen' });
  await expect(prompts.getByRole('listitem')).toHaveCount(2);
  await page.getByRole('button', { name: 'Worauf freue ich mich morgen? entfernen' }).click();
  await expect(prompts.getByRole('listitem')).toHaveCount(1);
  await page.getByRole('button', { name: 'Fertig' }).click();

  // Freitext blieb erhalten, eigene Frage ist da
  await expect(page.getByLabel('Wie war dein Tag?')).toHaveValue('Langer Lauf am Fluss');
  await page.getByLabel('Was habe ich gelernt?').fill('Spanisch geübt');
  await expect(page.getByText('Gespeichert', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Was habe ich gelernt?')).toHaveValue('Spanisch geübt');
  await expect(page.getByLabel('Dankbar für 1')).toHaveValue('Grüner Tee');

  // Wochenreflexion
  await page.getByRole('link', { name: /^Wochenreflexion/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Wochenreflexion' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Diese Woche/ })).toBeVisible();
  await page.getByRole('button', { name: 'Wie war die Woche? 4' }).click();
  await page.getByLabel('Was lief diese Woche gut?').fill('Drei Trainings geschafft');
  await expect(page.getByText('Gespeichert', { exact: true })).toBeVisible();
  // Vorige Woche ist leer, zurück zur aktuellen
  await page.getByRole('button', { name: 'Vorherige Woche' }).click();
  await expect(page.getByLabel('Was lief diese Woche gut?')).toHaveValue('');
  await page.getByRole('button', { name: 'Nächste Woche' }).click();
  await expect(page.getByLabel('Was lief diese Woche gut?')).toHaveValue(
    'Drei Trainings geschafft',
  );
  await expect(page.getByRole('button', { name: 'Nächste Woche' })).toBeDisabled();

  // Zurück zum Journal (Herkunft), dann Suche
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await page.getByRole('link', { name: /^Alle Einträge/ }).click();
  const entries = page.getByRole('list', { name: 'Einträge' });
  await expect(entries.getByRole('listitem')).toHaveCount(2);
  await page.getByRole('searchbox', { name: 'Journal durchsuchen' }).fill('gruener tee');
  await expect(entries.getByRole('listitem')).toHaveCount(1);
  await expect(entries).toContainText('Langer Lauf am Fluss');
  await page.getByRole('searchbox', { name: 'Journal durchsuchen' }).fill('Trainings');
  await expect(entries).toContainText('Bewertung 4/5');
  await page.getByRole('searchbox', { name: 'Journal durchsuchen' }).fill('Urlaub');
  await expect(page.getByText('Keine Einträge gefunden.')).toBeVisible();

  // Stand auf der Alltag-Übersicht
  await page.goto('./#/daily');
  await expect(selfRow(page, 'Journal')).toContainText('Geschrieben · 1× dankbar');
  await expect(selfRow(page, 'Wochenreflexion')).toContainText('1 von 3 Fragen');
});

test('Lesen: Buch, Seiten mit Gewohnheit, Notiz, beenden, Ziel (offline)', async ({
  page,
  context,
}) => {
  const body = page.locator('body');
  await page.goto('./#/daily/habits');
  await goOffline(page, context);
  await page.reload();

  // Zähl-Gewohnheit zum Verknüpfen
  await page.getByRole('link', { name: '+ Neue Gewohnheit' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Lesen');
  await page
    .getByRole('group', { name: 'Art' })
    .getByRole('button', { name: /^Zählen/ })
    .click();
  await fillStepper(body, 'Ziel pro Tag', '100');
  await page.getByLabel('Einheit', { exact: true }).fill('Seiten');
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(
    page.getByRole('list', { name: 'Alle Gewohnheiten' }).getByRole('link', { name: /Lesen/ }),
  ).toBeVisible();

  await page.goto('./#/daily');
  await expect(selfRow(page, 'Lesen')).toContainText('Bücher, Seiten, Notizen');
  await selfRow(page, 'Lesen').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Lesen' })).toBeVisible();
  await page.getByLabel('Seiten zählen auch bei').selectOption({ label: 'Lesen (Seiten)' });

  // Buch anlegen (mit Fehler ohne Titel)
  await page.getByRole('link', { name: '+ Buch hinzufügen' }).click();
  await page.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(page.getByRole('alert')).toHaveText('Bitte einen Titel eingeben');
  await page.getByLabel('Titel').fill('Atomic Habits');
  await page.getByLabel('Autor (optional)').fill('James Clear');
  await fillStepper(body, 'Seitenzahl (optional)', '100');
  await page.getByRole('button', { name: 'Hinzufügen' }).click();

  const current = page.getByRole('list', { name: 'Lese ich gerade' });
  await expect(current).toContainText('Atomic Habits');
  await expect(current).toContainText('Seite 0 von 100 (0 %)');

  await page.getByRole('button', { name: 'Seiten eintragen: Atomic Habits – James Clear' }).click();
  const dialog = page.getByRole('alertdialog');
  await fillStepper(dialog, 'Gelesen bis Seite', '40');
  await expect(dialog).toContainText('+40 Seiten');
  await dialog.getByRole('button', { name: 'Eintragen' }).click();
  await expect(current).toContainText('Seite 40 von 100 (40 %)');
  await expect(page.getByText('40 Seiten').first()).toBeVisible();

  // Zählt bei der Gewohnheit mit
  await page.goto('./#/daily/habits');
  await expect(page.getByText('40 von 100 Seiten').first()).toBeVisible();

  // Buch öffnen: Notiz, Rest lesen → beendet
  await page.goto('./#/daily/reading');
  await current.getByRole('link', { name: /Atomic Habits/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Atomic Habits' })).toBeVisible();
  await page.getByLabel('Neue Notiz').fill('Kleine Gewohnheiten, große Wirkung');
  await page.getByLabel('Seite (optional)').fill('12');
  await page.getByRole('button', { name: 'Notiz speichern' }).click();
  await expect(page.getByRole('list', { name: 'Notizen' })).toContainText('S. 12');

  await page.getByRole('button', { name: 'Seiten eintragen' }).click();
  await dialog.getByRole('button', { name: 'Seiten gelesen' }).click();
  await fillStepper(dialog, 'Seiten gelesen', '60');
  await dialog.getByRole('button', { name: 'Eintragen' }).click();
  await expect(page.getByText('Buch gelesen!')).toBeVisible();
  await expect(page.getByTestId('book-status')).toContainText('Gelesen');
  await page.getByRole('button', { name: 'Bewertung 5' }).click();
  await expect(page.getByRole('button', { name: 'Bewertung 5' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Eintrag löschen zieht bei der Gewohnheit wieder ab
  const logs = page.getByRole('list', { name: 'Gelesene Seiten' });
  await expect(logs.getByRole('listitem')).toHaveCount(2);
  await logs.getByRole('button', { name: /60 Seiten löschen/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click();
  await expect(logs.getByRole('listitem')).toHaveCount(1);
  await page.goto('./#/daily/habits');
  await expect(page.getByText('40 von 100 Seiten').first()).toBeVisible();

  // Wieder 60 Seiten → Buch bleibt gelesen; Ziel „Gelesene Seiten“
  await page.goto('./#/daily/reading');
  await expect(page.getByRole('heading', { name: 'Gelesen (1)' })).toBeVisible();
  await page.getByRole('link', { name: /^Atomic Habits/ }).click();
  await page.getByRole('button', { name: 'Wieder auf „Lese ich“' }).click();
  await page.getByRole('button', { name: 'Seiten eintragen' }).click();
  await fillStepper(dialog, 'Gelesen bis Seite', '100');
  await dialog.getByRole('button', { name: 'Eintragen' }).click();
  await expect(page.getByTestId('book-status')).toContainText('Gelesen');

  await page.goto('./#/stats/goals/new');
  await page
    .getByRole('group', { name: 'Art des Ziels' })
    .getByRole('button', { name: 'Menge' })
    .click();
  await page.getByLabel('Was zählt').selectOption({ label: 'Gelesene Seiten' });
  const form = page.locator('form');
  await fillStepper(form, 'Ziel', '500');
  await expect(page.getByTestId('goal-current')).toHaveText(
    'Im laufenden Zeitraum bisher: 100 Seiten',
  );
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByText('500 Seiten pro Monat')).toBeVisible();

  // Alles übersteht das Neuladen
  await page.goto('./#/daily');
  await expect(selfRow(page, 'Lesen')).toContainText('Heute 100 Seiten');
  await page.reload();
  await expect(selfRow(page, 'Lesen')).toContainText('Heute 100 Seiten');
});
