import { expect, test } from '@playwright/test';
import { addExercise, fillStepper, goOffline, skipRest } from './helpers';

test('Vorschlag, PR-Toast, Exzentrik und PR-Markierung in der Historie (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/training');
  await goOffline(page, context);

  // Erstes Training = Ausgangswert, kein Rekord
  await page.getByRole('button', { name: 'Workout starten' }).click();
  const bench = await addExercise(page, 'Bankdrücken (Langhantel)');
  await fillStepper(bench, 'Gewicht', '60');
  await fillStepper(bench, 'Wiederholungen', '10');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);
  await expect(page.getByRole('status').filter({ hasText: 'Neuer Rekord' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).toHaveURL(/#\/training\/history\/[\w-]+$/);

  // Zweites Training: Overload-Vorschlag übernehmen, dann schwerer → PR-Toast
  await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText('Training').click();
  await page.getByRole('button', { name: 'Workout starten' }).click();
  const nextBench = await addExercise(page, 'Bankdrücken (Langhantel)');
  await expect(nextBench).toContainText('Vorschlag: 60 kg × 11 (+1 Wdh.)');
  await nextBench.getByRole('button', { name: 'Vorschlag übernehmen' }).click();
  await expect(nextBench.getByLabel('Wiederholungen', { exact: true })).toHaveValue('11');
  await fillStepper(nextBench, 'Gewicht', '62,5');
  await nextBench.getByRole('button', { name: 'Satz abhaken' }).click();

  const toast = page.getByRole('status').filter({ hasText: 'Neuer Rekord' });
  await expect(toast).toContainText('Neuer Rekord: Bankdrücken (Langhantel)');
  await expect(toast).toContainText('Gewicht: 62,5 kg');
  await expect(toast).toContainText('Geschätztes 1RM: 85,4 kg');
  await expect(
    nextBench.getByRole('button', { name: 'Satz 1: 62,5 kg × 11 (Rekord)' }),
  ).toBeVisible();
  await toast.getByRole('button').click();
  await expect(toast).toHaveCount(0);
  await skipRest(page);

  // Exzentrik an der Maschine
  const legPress = await addExercise(page, 'Beinpresse');
  await fillStepper(legPress, 'Gewicht', '100');
  await fillStepper(legPress, 'Wiederholungen', '10');
  await legPress.getByRole('button', { name: 'Exzentrik' }).click();
  await fillStepper(legPress, 'Negativ-Gewicht', '120');
  await legPress.getByRole('button', { name: 'Satz abhaken' }).click();
  await expect(
    legPress.getByRole('button', { name: 'Satz 1: 100 kg (neg. 120 kg) × 10' }),
  ).toBeVisible();
  await skipRest(page);

  // Detailseite: Rekorde der Übung und Markierung am Satz
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  const records = page.getByRole('list', { name: 'Rekorde Bankdrücken (Langhantel)' });
  await expect(records).toContainText('Gewicht: 62,5 kg');
  await expect(records).toContainText('Volumen (Einheit): 688 kg');
  await expect(page.getByRole('img', { name: 'Rekord' })).toHaveCount(1);
  await expect(page.getByText('100 kg (neg. 120 kg) × 10')).toBeVisible();

  // Nach Neuladen in der Historie markiert
  await page.reload();
  await page.getByRole('link', { name: 'Zurück' }).click();
  const history = page.getByRole('list', { name: 'Workouts' });
  await expect(history.getByRole('listitem').first()).toContainText('Rekorde');
  await expect(history.getByRole('listitem').nth(1)).not.toContainText('Rekord');
});
