import { expect, test, type Page } from '@playwright/test';
import { addExercise, confirmStart, fillStepper, goOffline, skipRest } from './helpers';

const BENCH = 'Bankdrücken (Langhantel)';

const nav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

const toast = (page: Page) => page.getByRole('button', { name: /– schließen$/ });

const slow = expect.configure({ timeout: 10_000 });
test.describe.configure({ timeout: 60_000 });

async function logWorkout(page: Page) {
  await nav(page, 'Training');
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  const bench = await addExercise(page, BENCH);
  await fillStepper(bench, 'Gewicht', '60');
  await fillStepper(bench, 'Wiederholungen', '10');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).toHaveURL(/#\/training\/history\/[\w-]+$/);
}

async function openAchievements(page: Page) {
  await nav(page, 'Statistik');
  await page.getByRole('link', { name: '🏆 Erfolge' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Erfolge' })).toBeVisible();
}

test('Serien, Abzeichen und Erfolgs-Hinweise (offline)', async ({ page, context }) => {
  await page.goto('./');
  await goOffline(page, context);
  await page.reload();
  await page.getByRole('button', { name: 'Los geht’s' }).click();

  // Widget hinzufügen: noch keine Serie
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page.getByRole('button', { name: 'Serien & Abzeichen hinzufügen' }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  const widget = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Serien & Abzeichen' }) });
  await expect(widget).toContainText('Gerade keine laufende Serie');

  // Leere Erfolge-Seite: alles gesperrt
  await openAchievements(page);
  await expect(page.getByText('Noch keine Serien.')).toBeVisible();
  await expect(page.getByText('0 von', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Krafttraining: gesperrt' })).toBeVisible();

  // Erstes Training → Hinweis mit Abzeichen (nach dem stillen ersten Abgleich)
  await logWorkout(page);
  await slow(toast(page)).toContainText('Neues Abzeichen!');
  await slow(toast(page)).toContainText('🏋️ Krafttraining: Erstes Krafttraining');
  await toast(page).click();
  await slow(toast(page)).toHaveCount(0);

  // Ein Training reicht fürs Wochenziel 2 noch nicht; Ziel auf 1 senken → Serie läuft
  await openAchievements(page);
  await expect(page.getByText('Noch keine Serien.')).toBeVisible();
  await fillStepper(page.locator('main'), 'Trainings pro Woche', '1');
  const streaks = page.getByRole('list', { name: 'Serien' });
  const training = streaks.getByRole('listitem').filter({ hasText: 'Training' });
  await expect(training).toContainText('Diese Woche geschafft');
  await expect(training).toContainText('Ziel 1× pro Woche');
  await expect(training).toContainText('1Woche');

  // Abzeichen ansehen
  await page.getByRole('button', { name: 'Krafttraining: Stufe 1 von 6' }).click();
  const dialog = page.getByRole('dialog', { name: '🏋️ Krafttraining' });
  await expect(dialog).toContainText('Bisher: 1');
  await expect(dialog).toContainText('Nächste Stufe: 10 Krafttrainings');
  const today = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  await expect(
    dialog.getByRole('list', { name: 'Stufen' }).getByRole('listitem').first(),
  ).toContainText(today);
  await dialog.getByRole('button', { name: 'Fertig' }).click();
  await expect(dialog).toHaveCount(0);

  // Journal schreiben → Serie, eigenes Ziel abhaken → Hinweis „Geschafft!“
  await page.goto('./#/daily/journal');
  await page.getByLabel('Wie war dein Tag?').fill('Guter Tag');
  await page.getByLabel('Wie war dein Tag?').blur();
  await expect(page.getByText('Gespeichert', { exact: true })).toBeVisible();
  await slow(toast(page)).toContainText('📓 Journal: Erster Eintrag');
  await toast(page).click();

  await page.goto('./#/stats/goals/new');
  await page
    .getByRole('group', { name: 'Art des Ziels' })
    .getByRole('button', { name: 'Eigenes' })
    .click();
  await page.getByLabel('Name', { exact: true }).fill('Führerschein');
  await page.getByRole('group', { name: 'Form' }).getByRole('button', { name: 'Ja/Nein' }).click();
  await page.getByRole('button', { name: 'Ziel anlegen' }).click();
  await page.getByRole('button', { name: 'Erledigt: Führerschein' }).click();
  await slow(toast(page)).toContainText('Geschafft!');
  await slow(toast(page)).toContainText('🎯 Führerschein');
  await slow(toast(page)).toContainText('🎯 Ziele: Erstes Ziel erreicht');

  // Startseite nach dem Neuladen: Serien im Widget, kein erneuter Hinweis
  await nav(page, 'Dashboard');
  await page.reload();
  await expect(widget.getByRole('list', { name: 'Laufende Serien' })).toContainText('Training');
  await expect(widget.getByRole('list', { name: 'Laufende Serien' })).toContainText('Journal');
  await expect(widget.getByTestId('next-badge')).toContainText('Nächstes Abzeichen');
  await page.waitForTimeout(2500);
  await slow(toast(page)).toHaveCount(0);

  await widget.getByRole('link', { name: 'Alle Erfolge ›' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Erfolge' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ziele: Stufe 1 von 4' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Journal: Stufe 1 von 5' })).toBeVisible();
  await page.getByRole('link', { name: 'Zurück' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Fitnesstracker' })).toBeVisible();
});
