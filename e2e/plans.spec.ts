import { expect, test, type Page } from '@playwright/test';
import { fillStepper, goOffline, skipRest } from './helpers';

const openTraining = (page: Page) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText('Training').click();

test('Plan aus Vorlage → Workout starten → Sätze vorbefüllt, Rotation, Ersetzen (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/training');
  await goOffline(page, context);

  // Plan aus Vorlage wird automatisch aktiv
  await page.getByRole('link', { name: /Trainingspläne/ }).click();
  await page.getByRole('button', { name: /Push\/Pull\/Legs/ }).click();
  await expect(page.getByRole('heading', { name: 'Push/Pull/Legs', level: 1 })).toBeVisible();
  await expect(page.getByText('Aktiver Plan')).toBeVisible();

  // Vorschlag: erstes Training
  await openTraining(page);
  await expect(page.getByText('Erstes Training des Plans')).toBeVisible();
  await page.getByRole('button', { name: 'Push starten' }).click();
  await expect(page.getByRole('heading', { name: 'Push', level: 1 })).toBeVisible();

  // Sätze sind aus dem Plan vorbefüllt
  const bench = page.getByRole('region', { name: 'Bankdrücken (Langhantel)' });
  await expect(bench).toContainText('Ziel: 6–10 Wdh. · Pause 3:00');
  await expect(
    bench.getByRole('list', { name: 'Sätze Bankdrücken (Langhantel)' }).getByRole('listitem'),
  ).toHaveCount(4);
  await expect(bench.getByLabel('Wiederholungen', { exact: true })).toHaveValue('6');

  // Last wandert in die leeren Folgesätze
  await fillStepper(bench, 'Gewicht', '60');
  await fillStepper(bench, 'Wiederholungen', '10');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);
  await expect(bench.getByRole('button', { name: 'Satz 2: 60 kg × 6' })).toBeVisible();

  // Gerät belegt: ersetzen mit Alternative
  const press = page.getByRole('region', { name: 'Schulterdrücken stehend (Langhantel)' });
  await press.getByRole('button', { name: 'Ersetzen' }).click();
  const dialog = page.getByRole('dialog', { name: /ersetzen$/ });
  await expect(dialog.getByRole('list', { name: 'Vorschläge' }).getByRole('listitem')).toHaveCount(
    6,
  );
  await dialog.getByRole('searchbox', { name: 'Übung suchen' }).fill('Arnold Press');
  await dialog.getByRole('button', { name: /^Arnold Press/ }).click();
  await expect(press).toHaveCount(0);
  const arnold = page.getByRole('region', { name: 'Arnold Press' });
  await expect(
    arnold.getByRole('list', { name: 'Sätze Arnold Press' }).getByRole('listitem'),
  ).toHaveCount(3);

  // Überspringen
  const lateral = page.getByRole('region', { name: 'Seitheben (Kurzhantel)' });
  await lateral.getByRole('button', { name: 'Überspringen' }).click();
  await expect(lateral).toHaveCount(0);

  // Pausenzeit der Plan-Übung gilt (1:30 statt 3:00)
  const triceps = page.getByRole('region', { name: 'Trizepsdrücken am Kabel (Stange)' });
  await fillStepper(triceps, 'Gewicht', '30');
  await triceps.getByRole('button', { name: 'Satz abhaken' }).click();
  await expect(page.getByRole('timer', { name: 'Pause' })).toContainText(/1:[23]\d/);
  await skipRest(page);

  // Nach Neuladen läuft es weiter, Beenden führt zum nächsten Training
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Push', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).toHaveURL(/#\/training\/history\/[\w-]+$/);

  await openTraining(page);
  await expect(page.getByText('Letztes Mal: Push')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pull starten' })).toBeVisible();

  // Anderes Training wählen: Bankdrücken mit Overload-Vorschlag vorbefüllt
  await page.getByRole('button', { name: 'Anderes Training wählen' }).click();
  await page
    .getByRole('list', { name: 'Trainings des Plans' })
    .getByRole('button', { name: 'Push' })
    .click();
  const nextBench = page.getByRole('region', { name: 'Bankdrücken (Langhantel)' });
  await expect(nextBench.getByRole('button', { name: 'Satz 1: 62,5 kg × 6' })).toBeVisible();
  await expect(nextBench.getByRole('button', { name: 'Satz 4: 62,5 kg × 6' })).toBeVisible();

  // Verwerfen ändert die Rotation nicht; freies Training bleibt möglich
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Workout verwerfen' }).click();
  await expect(page.getByRole('button', { name: 'Pull starten' })).toBeVisible();
  await page.getByRole('button', { name: 'Freies Training' }).click();
  await expect(page.getByRole('heading', { name: 'Workout', level: 1 })).toBeVisible();
  await expect(page.getByText('Noch keine Übungen')).toBeVisible();
});

test('eigenen Plan anlegen, bearbeiten, duplizieren und löschen (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/training/plans');
  await goOffline(page, context);

  await page.getByRole('button', { name: '+ Neuer Plan' }).click();
  const planName = page.getByLabel('Name des Plans');
  await planName.fill('Mein Split');
  await planName.press('Enter');
  await expect(page.getByRole('heading', { name: 'Mein Split', level: 1 })).toBeVisible();

  // Wochentage
  await page.getByRole('button', { name: 'Wochentage' }).click();
  await page.getByRole('link', { name: /Training 1/ }).click();
  const dayName = page.getByLabel('Name des Trainings');
  await dayName.fill('Brust');
  await dayName.press('Enter');
  const weekdays = page.getByRole('group', { name: 'Wochentage' });
  await weekdays.getByRole('button', { name: 'Mo' }).click();
  await weekdays.getByRole('button', { name: 'Do' }).click();

  // Übung mit eigenen Zielen
  await page.getByRole('button', { name: '+ Übung hinzufügen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Übung hinzufügen' });
  await dialog.getByRole('searchbox', { name: 'Übung suchen' }).fill('Bankdrücken (Langhantel)');
  await dialog.getByRole('button', { name: /^Bankdrücken \(Langhantel\)/ }).click();
  const row = page.getByRole('list', { name: 'Übungen im Training' }).getByRole('listitem');
  await fillStepper(row, 'Sätze', '5');
  await fillStepper(row, 'Wdh. bis', '6');
  await fillStepper(row, 'Wdh. von', '4');
  await fillStepper(row, 'Pause', '150');
  await expect(row).toContainText('5 × 4–6 · Pause 2:30');

  await page.getByRole('link', { name: 'Zurück' }).click();
  await expect(page.getByRole('link', { name: /Brust/ })).toContainText('Mo, Do · 1 Übung');

  // Nach Neuladen noch da, zweites Training ergänzen, Reihenfolge per Tastatur
  await page.reload();
  await page.getByRole('button', { name: '+ Training hinzufügen' }).click();
  await expect(page.getByRole('heading', { name: 'Training 2', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Zurück' }).click();
  await page.getByRole('button', { name: 'Reihenfolge ändern' }).click();
  const order = page.getByRole('list', { name: 'Reihenfolge der Trainings' });
  await order.getByRole('button', { name: 'Training 2 verschieben' }).press('ArrowUp');
  await expect(order.getByRole('listitem').first()).toContainText('Training 2');
  await page.getByRole('button', { name: 'Fertig' }).click();

  // Duplizieren: Kopie ist nicht aktiv, kann aber aktiv werden
  await page.getByRole('button', { name: 'Plan duplizieren' }).click();
  await expect(page.getByRole('heading', { name: 'Mein Split (Kopie)', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Als aktiven Plan wählen' }).click();
  await expect(page.getByText('Aktiver Plan')).toBeVisible();

  // Löschen
  await page.getByRole('button', { name: 'Plan löschen' }).click();
  await page.getByRole('button', { name: 'Löschen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Trainingspläne' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Kopie/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Mein Split/ })).toBeVisible();
});
