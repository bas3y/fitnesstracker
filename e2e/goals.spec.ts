import { expect, test, type Page } from '@playwright/test';
import { confirmStart, fillStepper, goOffline, skipRest } from './helpers';

const nav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

/** Workout mit einem Satz Bankdrücken beenden */
async function logBench(page: Page, weight: string, reps: string) {
  await nav(page, 'Training');
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  await page.getByRole('button', { name: '+ Übung hinzufügen' }).click();
  const picker = page.getByRole('dialog', { name: 'Übung hinzufügen' });
  await picker.getByRole('searchbox', { name: 'Übung suchen' }).fill('Bankdrücken (Langhantel)');
  await picker
    .getByRole('button', { name: /^Bankdrücken \(Langhantel\)/ })
    .first()
    .click();
  const bench = page.getByRole('region', { name: 'Bankdrücken (Langhantel)' });
  await fillStepper(bench, 'Gewicht', weight);
  await fillStepper(bench, 'Wiederholungen', reps);
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).toHaveURL(/#\/training\/history\/[\w-]+$/);
}

test('Ziele anlegen, Fortschritt sehen, auf der Startseite zeigen, erreichen und löschen (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await goOffline(page, context);
  await logBench(page, '80', '5');

  await nav(page, 'Statistik');
  await page.getByRole('link', { name: /^Ziele/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ziele' })).toBeVisible();
  await expect(page.getByText('Noch keine Ziele.')).toBeVisible();

  // Kraftziel: 100 kg für 5 Wiederholungen
  await page.getByRole('link', { name: '+ Neues Ziel' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Neues Ziel' })).toBeVisible();
  await page.getByRole('button', { name: 'Ziel anlegen' }).click();
  await expect(page.getByRole('alert')).toHaveText('Bitte eine Übung wählen');
  await page.getByRole('button', { name: 'Übung wählen' }).click();
  const picker = page.getByRole('dialog', { name: 'Übung auswählen' });
  await picker.getByRole('searchbox', { name: 'Übung suchen' }).fill('Bankdrücken (Langhantel)');
  await picker
    .getByRole('button', { name: /^Bankdrücken \(Langhantel\)/ })
    .first()
    .click();
  await expect(page.getByRole('button', { name: /^Bankdrücken \(Langhantel\)/ })).toBeVisible();
  const form = page.locator('form');
  await fillStepper(form, 'Ziel', '100');
  await fillStepper(form, 'Wiederholungen je Satz (mindestens)', '5');
  await expect(page.getByTestId('goal-current')).toHaveText('Bisher bester Wert: 80 kg');
  await expect(page.getByLabel('Name (optional)')).toHaveAttribute(
    'placeholder',
    'Bankdrücken (Langhantel): 100 kg × 5',
  );
  await page.getByRole('button', { name: 'Ziel anlegen' }).click();

  const strengthName = 'Bankdrücken (Langhantel): 100 kg × 5';
  await expect(page.getByRole('heading', { level: 1, name: 'Ziele' })).toBeVisible();
  const strengthGoal = page.getByRole('link', { name: `Ziel: ${strengthName}` });
  await expect(strengthGoal).toContainText('Jetzt 80 kg · Ziel 100 kg');
  await expect(page.getByRole('progressbar', { name: strengthName })).toHaveAttribute(
    'aria-valuenow',
    '80',
  );

  // Mengen-Ziel: 3 Trainings pro Woche
  await page.getByRole('link', { name: '+ Neues Ziel' }).click();
  await page
    .getByRole('group', { name: 'Art des Ziels' })
    .getByRole('button', { name: 'Menge' })
    .click();
  await expect(page.getByLabel('Was zählt')).toHaveValue('trainings');
  await page
    .getByRole('group', { name: 'Zeitraum' })
    .getByRole('button', { name: 'Woche' })
    .click();
  await fillStepper(page.locator('form'), 'Ziel', '3');
  await expect(page.getByTestId('goal-current')).toHaveText(
    'Im laufenden Zeitraum bisher: 1 Training',
  );
  await page.getByRole('button', { name: 'Ziel anlegen' }).click();
  const weekly = page.getByRole('link', { name: 'Ziel: 3 Trainings pro Woche' });
  await expect(weekly).toContainText('Diese Woche: Bisher 1 Training · Ziel 3 Trainings');
  await expect(weekly).toContainText('33 %');

  // Startseite: Widget „Ziele“ hinzufügen
  await nav(page, 'Dashboard');
  const welcome = page.getByRole('button', { name: 'Los geht’s' });
  if (await welcome.isVisible()) await welcome.click();
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page.getByRole('button', { name: 'Ziele hinzufügen' }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  const widget = page.getByTestId('goals-widget');
  await expect(widget.getByRole('link')).toHaveCount(2);
  await expect(widget).toContainText(strengthName);

  // Ziel vom Widget aus ändern: 80 kg sind schon geschafft
  await widget.getByRole('link', { name: `Ziel: ${strengthName}` }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ziel bearbeiten' })).toBeVisible();
  await fillStepper(page.locator('form'), 'Ziel', '80');
  await expect(page.getByTestId('goal-current')).toContainText('Ziel schon am');
  await page.getByRole('button', { name: 'Speichern' }).click();
  const done = page.getByRole('region', { name: 'Abgeschlossen' });
  await expect(
    done.getByRole('link', { name: /^Ziel: Bankdrücken \(Langhantel\): 80 kg × 5/ }),
  ).toContainText('✓ Erreicht am');

  // Löschen
  await page.getByRole('link', { name: 'Ziel: 3 Trainings pro Woche' }).click();
  await page.getByRole('button', { name: 'Ziel löschen' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ziele' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ziel: 3 Trainings pro Woche' })).toHaveCount(0);

  await page.reload();
  await expect(done.getByRole('link')).toHaveCount(1);
});

test('Rückblick: Woche, Monat und Jahr mit Vergleich zum Vorzeitraum (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await goOffline(page, context);
  await logBench(page, '60', '10');

  await nav(page, 'Statistik');
  await page
    .getByRole('group', { name: 'Bereich' })
    .getByRole('button', { name: 'Rückblick' })
    .click();
  await expect(page).toHaveURL(/view=review/);

  const monthName = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  await expect(page.getByTestId('review-period')).toHaveText(monthName);
  await expect(page.getByTestId('review-compare')).toContainText(
    'Bis heute, verglichen mit Vormonat bis zum gleichen Tag',
  );
  const rows = page.getByLabel('Training im Vergleich');
  await expect(rows).toContainText('Krafttrainings');
  await expect(rows.getByLabel('Unterschied +1').first()).toBeVisible();
  await expect(rows).toContainText('600 kg');
  await expect(page.getByRole('button', { name: 'Nächster Zeitraum' })).toBeDisabled();

  // Woche: zurückblättern zeigt eine leere Woche, vor geht wieder bis heute
  await page
    .getByRole('group', { name: 'Zeitraum' })
    .getByRole('button', { name: 'Woche' })
    .click();
  await expect(page.getByTestId('review-period')).toHaveText(/^KW \d+: /);
  await page.getByRole('button', { name: 'Vorheriger Zeitraum' }).click();
  await page.getByRole('button', { name: 'Vorheriger Zeitraum' }).click();
  await expect(page.getByText('Keine Einträge in diesem Zeitraum.')).toBeVisible();
  await expect(page.getByTestId('review-compare')).toContainText('Verglichen mit Vorwoche');
  await page.getByRole('button', { name: 'Nächster Zeitraum' }).click();
  await page.getByRole('button', { name: 'Nächster Zeitraum' }).click();
  await expect(page.getByRole('button', { name: 'Nächster Zeitraum' })).toBeDisabled();
  await expect(rows).toContainText('Krafttrainings');

  // Jahr; die Auswahl steht in der URL und übersteht das Neuladen
  await page.getByRole('group', { name: 'Zeitraum' }).getByRole('button', { name: 'Jahr' }).click();
  await expect(page.getByTestId('review-period')).toHaveText(String(new Date().getFullYear()));
  await page.reload();
  await expect(page.getByTestId('review-period')).toHaveText(String(new Date().getFullYear()));
  await expect(rows).toContainText('Arbeitssätze');
});
