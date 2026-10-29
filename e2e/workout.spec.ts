import { expect, test, type Locator, type Page } from '@playwright/test';
import { goOffline } from './helpers';

async function addExercise(page: Page, name: string) {
  await page.getByRole('button', { name: '+ Übung hinzufügen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Übung hinzufügen' });
  await dialog.getByRole('searchbox', { name: 'Übung suchen' }).fill(name);
  await dialog
    .getByRole('button', { name: new RegExp(`^${name.replace(/[()]/g, '\\$&')}`) })
    .first()
    .click();
  await expect(dialog).toHaveCount(0);
  return page.getByRole('region', { name });
}

async function fillStepper(card: Locator, label: string, value: string) {
  const input = card.getByLabel(label, { exact: true });
  await input.fill(value);
  await input.press('Enter');
}

async function skipRest(page: Page) {
  const timer = page.getByRole('timer', { name: 'Pause' });
  await expect(timer).toBeVisible();
  await timer.getByRole('button', { name: 'Überspringen' }).click();
  await expect(timer).toHaveCount(0);
}

test('komplettes Workout offline loggen, neu laden, in der Historie finden', async ({
  page,
  context,
}) => {
  await page.goto('./#/training');
  await goOffline(page, context);

  // Starten
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Workout' })).toBeVisible();

  // Langhantel-Übung: Gewicht + Wdh., abhaken → Pausen-Timer
  const bench = await addExercise(page, 'Bankdrücken (Langhantel)');
  await expect(bench.getByText('Letztes Mal: noch nicht trainiert')).toBeVisible();
  await fillStepper(bench, 'Gewicht', '60');
  await fillStepper(bench, 'Wiederholungen', '10');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await expect(bench.getByRole('button', { name: 'Satz 1 abhaken' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('timer', { name: 'Pause' })).toContainText(/1:(29|30)/);
  await skipRest(page);

  // Zweiter Satz übernimmt die Werte, +2,5 kg, Aufwärmsatz davor
  await bench.getByRole('button', { name: '+ Satz' }).click();
  await expect(bench.getByLabel('Gewicht', { exact: true })).toHaveValue('60');
  await bench.getByRole('button', { name: 'Gewicht erhöhen' }).click();
  await expect(bench.getByLabel('Gewicht', { exact: true })).toHaveValue('62,5');
  await bench.getByRole('button', { name: 'Satz 2 abhaken' }).click();
  await skipRest(page);

  // Körpergewicht: Zusatzgewicht statt Gewicht
  const pullUps = await addExercise(page, 'Klimmzüge');
  await expect(pullUps.getByLabel('Zusatzgewicht', { exact: true })).toHaveValue('0');
  await fillStepper(pullUps, 'Wiederholungen', '8');
  await pullUps.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);

  // Halteübung: Dauer statt Wiederholungen
  const plank = await addExercise(page, 'Unterarmstütz (Plank)');
  await expect(plank.getByLabel('Wiederholungen', { exact: true })).toHaveCount(0);
  await fillStepper(plank, 'Dauer', '45');
  await plank.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);

  // Reihenfolge ändern: Plank nach oben
  await plank.getByRole('button', { name: 'Unterarmstütz (Plank) nach oben' }).click();
  const regions = page.getByRole('region');
  await expect(regions.nth(1)).toHaveAccessibleName('Unterarmstütz (Plank)');
  await expect(regions.nth(2)).toHaveAccessibleName('Klimmzüge');

  // Neu laden (offline) → Workout läuft weiter, Sätze sind gespeichert
  await page.reload();
  await expect(bench.getByRole('button', { name: 'Satz 1: 60 kg × 10' })).toBeVisible();
  await expect(bench.getByRole('button', { name: 'Satz 2: 62,5 kg × 10' })).toBeVisible();
  await expect(pullUps.getByRole('button', { name: 'Satz 1: 8 Wdh.' })).toBeVisible();
  await expect(plank.getByRole('button', { name: 'Satz 1: 0:45' })).toBeVisible();

  // Banner auf anderen Seiten führt zurück
  await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText('Dashboard').click();
  await page.getByRole('status').filter({ hasText: 'Workout läuft' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Workout' })).toBeVisible();

  // Beenden mit Notiz
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await expect(page.getByText('4 Sätze abgehakt.')).toBeVisible();
  await page.getByLabel('Notiz (optional)').fill('Starker Tag');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).toHaveURL(/#\/training\/history\/[\w-]+$/);
  await expect(page.getByText('Starker Tag')).toBeVisible();
  await expect(page.getByText('62,5 kg × 10')).toBeVisible();

  // Nach Neuladen in der Historie
  await page.reload();
  await page.getByRole('link', { name: 'Zurück' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Verlauf' })).toBeVisible();
  const history = page.getByRole('list', { name: 'Workouts' });
  await expect(history.getByRole('listitem')).toHaveCount(1);
  await expect(history).toContainText('Bankdrücken (Langhantel), Unterarmstütz (Plank), Klimmzüge');
  await expect(history).toContainText('4 Sätze');

  // Nachträglich bearbeiten: Satz hinzufügen, Notiz ändern
  await history.getByRole('link').first().click();
  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  const editBench = page.getByRole('region', { name: 'Bankdrücken (Langhantel)' });
  await editBench.getByRole('button', { name: '+ Satz' }).click();
  await fillStepper(editBench, 'Wiederholungen', '6');
  await page.getByLabel('Notiz', { exact: true }).fill('Starker Tag, 3. Satz nachgetragen');
  await page.getByLabel('Notiz', { exact: true }).blur();
  await page.getByRole('link', { name: 'Fertig' }).click();
  await expect(page.getByText('Starker Tag, 3. Satz nachgetragen')).toBeVisible();
  await expect(page.getByText('62,5 kg × 6')).toBeVisible();

  // „Letztes Mal“ im nächsten Workout, dann verwerfen
  await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText('Training').click();
  await page.getByRole('button', { name: 'Workout starten' }).click();
  const nextBench = await addExercise(page, 'Bankdrücken (Langhantel)');
  await expect(nextBench).toContainText(
    /Letztes Mal \(.+\): 60 kg × 10 · 62,5 kg × 10 · 62,5 kg × 6/,
  );
  await expect(nextBench.getByLabel('Gewicht', { exact: true })).toHaveValue('60');
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Workout verwerfen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Training' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Workout starten' })).toBeVisible();

  // Workout aus der Historie löschen
  await page.getByRole('link', { name: /Verlauf/ }).click();
  await history.getByRole('link').first().click();
  await page.getByRole('button', { name: 'Löschen' }).click();
  await page.getByRole('button', { name: 'Endgültig löschen' }).click();
  await expect(page.getByText('Noch keine Workouts beendet.')).toBeVisible();
});
