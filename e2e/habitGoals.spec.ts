import { expect, test, type Page } from '@playwright/test';
import { chooseIcon, fillStepper, goOffline } from './helpers';

const nav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

const allHabits = (page: Page) => page.getByRole('list', { name: 'Alle Gewohnheiten' });

async function addHabit(page: Page, name: string, fill: () => Promise<void>) {
  await page.getByRole('link', { name: '+ Neue Gewohnheit' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await fill();
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(allHabits(page).getByRole('link', { name: new RegExp(name) })).toBeVisible();
}

async function newGoal(page: Page, kind: string) {
  await page.getByRole('link', { name: '+ Neues Ziel' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Neues Ziel' })).toBeVisible();
  await page
    .getByRole('group', { name: 'Art des Ziels' })
    .getByRole('button', { name: kind })
    .click();
}

async function openGoals(page: Page) {
  await nav(page, 'Statistik');
  await page.getByRole('link', { name: 'Ziele', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ziele' })).toBeVisible();
}

test('Gewohnheits-Ziele (Menge, Serie, Obergrenze), eigenes Symbol und Rückblick (offline)', async ({
  page,
  context,
}) => {
  const body = page.locator('body');
  await page.goto('./#/daily/habits');
  await goOffline(page, context);
  await page.reload();

  await addHabit(page, 'Lesen', async () => {
    await page
      .getByRole('group', { name: 'Art' })
      .getByRole('button', { name: /^Zählen/ })
      .click();
    await fillStepper(body, 'Ziel pro Tag', '10');
    await page.getByLabel('Einheit', { exact: true }).fill('Seiten');
    await fillStepper(body, 'Pro Tipp', '5');
    await chooseIcon(page, 'Offenes Buch');
    await expect(page.getByRole('button', { name: /Symbol ändern/ })).toContainText('Offenes Buch');
  });
  await expect(allHabits(page).getByRole('link', { name: /Lesen/ })).toBeVisible();
  await addHabit(page, 'Rauchen', async () => {
    await page
      .getByRole('group', { name: 'Art' })
      .getByRole('button', { name: /^Aufhören/ })
      .click();
    await page.getByRole('button', { name: 'Reduzieren' }).click();
    await page.getByLabel('Einheit', { exact: true }).fill('Zigaretten');
  });

  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Lesen: 5 Seiten mehr' }).click();
  }
  await page.getByRole('button', { name: 'Rauchen: 1 Zigaretten mehr' }).click();
  await page.getByRole('button', { name: 'Rauchen: 1 Zigaretten mehr' }).click();
  await expect(page.getByText('2 von max. 5 Zigaretten')).toBeVisible();

  // Menge: 300 Seiten pro Monat
  await openGoals(page);
  await newGoal(page, 'Gewohnheit');
  await expect(page.getByLabel('Gewohnheit', { exact: true })).toHaveValue(/.+/);
  await page.getByLabel('Gewohnheit', { exact: true }).selectOption({ label: 'Lesen' });
  const form = page.locator('form');
  await expect(
    form.getByRole('group', { name: 'Kennzahl' }).getByRole('button', { name: 'Menge' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await fillStepper(form, 'Ziel', '300');
  await expect(page.getByTestId('goal-current')).toHaveText(
    'Im laufenden Zeitraum bisher: 10 Seiten',
  );
  await expect(page.getByLabel('Name (optional)')).toHaveAttribute(
    'placeholder',
    'Lesen: 300 Seiten pro Monat',
  );
  await page.getByRole('button', { name: 'Ziel anlegen' }).click();
  const reading = page.getByRole('link', { name: 'Ziel: Lesen: 300 Seiten pro Monat' });
  await expect(reading).toContainText('Diesen Monat: Bisher 10 Seiten · Ziel 300 Seiten');
  await expect(reading).toContainText('3 %');

  // Serie: 30 Tage am Stück (heute 2 von höchstens 5 = im Limit)
  await newGoal(page, 'Gewohnheit');
  await page.getByLabel('Gewohnheit', { exact: true }).selectOption({ label: 'Rauchen' });
  await expect(
    form.getByRole('group', { name: 'Kennzahl' }).getByRole('button', { name: 'Serie' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(form.getByRole('group', { name: 'Zeitraum' })).toHaveCount(0);
  await fillStepper(form, 'Ziel', '30');
  await page.getByRole('button', { name: 'Ziel anlegen' }).click();
  await expect(page.getByRole('link', { name: 'Ziel: Rauchen: 30 Tage am Stück' })).toContainText(
    'Jetzt 1 Tag am Stück · Ziel 30 Tage',
  );

  // Obergrenze: höchstens 20 pro Woche
  await newGoal(page, 'Gewohnheit');
  await page.getByLabel('Gewohnheit', { exact: true }).selectOption({ label: 'Rauchen' });
  await form
    .getByRole('group', { name: 'Kennzahl' })
    .getByRole('button', { name: 'Obergrenze' })
    .click();
  await form
    .getByRole('group', { name: 'Zeitraum' })
    .getByRole('button', { name: 'Woche' })
    .click();
  await fillStepper(form, 'Höchstens', '20');
  await page.getByRole('button', { name: 'Ziel anlegen' }).click();
  const limit = page.getByRole('link', {
    name: 'Ziel: Rauchen: höchstens 20 Zigaretten pro Woche',
  });
  await expect(limit).toContainText('Diese Woche: 2 Zigaretten · höchstens 20 Zigaretten');
  await expect(limit).toContainText('Noch 18 Zigaretten übrig');
  await expect(limit).toContainText('2 / 20');

  // Rückblick: Summen der Gewohnheiten und Rückfälle
  await nav(page, 'Statistik');
  await page
    .getByRole('group', { name: 'Bereich' })
    .getByRole('button', { name: 'Rückblick' })
    .click();
  const habitRows = page.getByLabel('Gewohnheiten im Vergleich');
  await expect(habitRows).toContainText('Lesen');
  await expect(habitRows).toContainText('10 Seiten');
  await expect(habitRows).toContainText('Rauchen (Rückfälle)');
  await expect(habitRows.getByLabel('Unterschied +2 Zigaretten')).toHaveClass(/text-danger/);

  await page.reload();
  await expect(habitRows).toContainText('10 Seiten');
});

test('Eigene Ziele mit Zahl und Ja/Nein: eintragen, Widget, abhaken, löschen (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await goOffline(page, context);
  await openGoals(page);

  await newGoal(page, 'Eigenes');
  await page.getByRole('button', { name: 'Ziel anlegen' }).click();
  await expect(page.getByRole('alert')).toHaveText('Bitte einen Namen eingeben');
  await page.getByLabel('Name', { exact: true }).fill('Spanisch');
  await chooseIcon(page, 'Globus');
  const form = page.locator('form');
  await fillStepper(form, 'Ziel', '50');
  await page.getByLabel('Einheit', { exact: true }).fill('Lektionen');
  await page.getByRole('button', { name: 'Ziel anlegen' }).click();

  const spanish = page.getByRole('link', { name: 'Ziel: Spanisch' });
  await expect(spanish).toContainText('Noch nichts eingetragen · Ziel 50 Lektionen');
  await page.getByRole('button', { name: '+1 Lektionen: Spanisch' }).click();
  await expect(spanish).toContainText('Bisher 1 Lektionen');
  await page.getByRole('button', { name: 'Menge eintragen: Spanisch' }).click();
  const dialog = page.getByRole('dialog', { name: 'Spanisch' });
  await fillStepper(dialog, 'Menge', '9');
  await dialog.getByRole('button', { name: 'Eintragen' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(spanish).toContainText('Bisher 10 Lektionen');
  await expect(spanish).toContainText('20 %');
  await page.getByRole('button', { name: 'Rückgängig: Spanisch' }).click();
  await expect(spanish).toContainText('Bisher 1 Lektionen');

  await newGoal(page, 'Eigenes');
  await page.getByLabel('Name', { exact: true }).fill('Führerschein machen');
  await page.getByRole('group', { name: 'Form' }).getByRole('button', { name: 'Ja/Nein' }).click();
  await page.getByRole('button', { name: 'Ziel anlegen' }).click();
  await expect(page.getByRole('link', { name: 'Ziel: Führerschein machen' })).toContainText(
    'Noch nicht erledigt',
  );

  // Startseite: im Widget eintragen und abhaken
  await nav(page, 'Dashboard');
  const welcome = page.getByRole('button', { name: 'Los geht’s' });
  if (await welcome.isVisible()) await welcome.click();
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page.getByRole('button', { name: 'Ziele hinzufügen' }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  const widget = page.getByTestId('goals-widget');
  await expect(widget.getByRole('link')).toHaveCount(2);
  await widget.getByRole('button', { name: '+1 Lektionen: Spanisch' }).click();
  await expect(widget).toContainText('Bisher 2 Lektionen');
  await widget.getByRole('button', { name: 'Erledigt: Führerschein machen' }).click();
  await expect(widget.getByRole('link')).toHaveCount(1);

  await openGoals(page);
  const done = page.getByRole('region', { name: 'Abgeschlossen' });
  await expect(done.getByRole('link', { name: 'Ziel: Führerschein machen' })).toContainText(
    '✓ Erreicht am',
  );
  await expect(
    page.getByRole('button', { name: 'Zurücknehmen: Führerschein machen' }),
  ).toBeVisible();
  await page.reload();
  await expect(spanish).toContainText('Bisher 2 Lektionen');

  // Löschen nimmt den Fortschritt mit
  await spanish.click();
  await expect(page.getByRole('button', { name: /Symbol ändern/ })).toContainText('Globus');
  await page.getByRole('button', { name: 'Ziel löschen' }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText('Der eingetragene Fortschritt wird mit gelöscht.');
  await confirm.getByRole('button', { name: 'Löschen' }).click();
  await expect(page.getByRole('link', { name: 'Ziel: Spanisch' })).toHaveCount(0);
});
