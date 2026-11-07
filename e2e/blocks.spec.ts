import { expect, test, type Page } from '@playwright/test';
import { confirmStart, fillStepper, goOffline, skipRest } from './helpers';

const BENCH = 'Bankdrücken (Langhantel)';

const openNav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

async function openBlocks(page: Page) {
  await openNav(page, 'Training');
  await page.getByRole('link', { name: /Trainingspläne/ }).click();
  await page.getByRole('link', { name: /^Push\/Pull\/Legs/ }).click();
  await page.getByRole('link', { name: /^Trainingsblöcke/ }).click();
  await expect(page.getByRole('heading', { name: 'Trainingsblöcke', level: 1 })).toBeVisible();
}

async function startPush(page: Page) {
  await openNav(page, 'Training');
  await page.getByRole('button', { name: 'Anderes Training wählen' }).click();
  await page
    .getByRole('list', { name: 'Trainings des Plans' })
    .getByRole('button', { name: 'Push' })
    .click();
}

async function finish(page: Page) {
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).toHaveURL(/#\/training\/history\/[\w-]+$/);
}

/** Lokales Datum `YYYY-MM-DD` vor `days` Tagen */
const daysAgo = (days: number) => {
  const date = new Date(Date.now() - days * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

test('Trainingsblöcke: Vorlage → Aufbau → Deload mit angepassten Sätzen → Ende → Wiederholen (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/training');
  await goOffline(page, context);

  // Plan aus Vorlage, noch ohne Blöcke
  await page.getByRole('link', { name: /Trainingspläne/ }).click();
  await page.getByRole('link', { name: '+ Neuer Plan' }).click();
  await page.getByRole('button', { name: /Push\/Pull\/Legs/ }).click();
  await expect(page.getByRole('link', { name: /^Trainingsblöcke/ })).toContainText(
    'Keine – z. B. 3 Wochen Aufbau + 1 Woche Deload',
  );

  // Blöcke aus Vorlage starten heute mit Aufbau
  await page.getByRole('link', { name: /^Trainingsblöcke/ }).click();
  await page.getByRole('button', { name: '3 Wochen Aufbau + 1 Woche Deload' }).click();
  await expect(page.getByTestId('block-status')).toHaveText('Aufbau · Woche 1 von 3');
  const sequence = page.getByRole('list', { name: 'Blöcke' });
  await expect(sequence.getByRole('listitem')).toHaveCount(2);
  await expect(sequence).toContainText('2. Deload · 1 Woche');
  await expect(sequence).toContainText('50 % Sätze · 90 % Gewicht · ohne Overload');

  // Aufbau: Block auf der Trainingsseite und im Workout, Sätze wie gewohnt
  await openNav(page, 'Training');
  await expect(page.getByTestId('block-status')).toHaveText('Aufbau · Woche 1 von 3');
  await page.getByRole('button', { name: 'Push starten' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Aufbau · Woche 1 von 3');
  await confirmStart(page);
  await expect(page.getByTestId('workout-block')).toHaveText('Aufbau · Woche 1 von 3');
  const bench = page.getByRole('region', { name: BENCH });
  await expect(
    bench.getByRole('list', { name: `Sätze ${BENCH}` }).getByRole('listitem'),
  ).toHaveCount(4);
  await fillStepper(bench, 'Gewicht', '100');
  await fillStepper(bench, 'Wiederholungen', '10');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);
  await finish(page);

  // Zum Deload wechseln und den Block anpassen (80 % Gewicht)
  await openBlocks(page);
  await page.getByLabel('Block', { exact: true }).selectOption({ label: '2. Deload (1 Woche)' });
  const status = page.getByTestId('block-status');
  await expect(status).toContainText('Deload · Woche 1 von 1');
  await expect(status).toContainText('Sätze angepasst: 50 % Sätze · 90 % Gewicht · ohne Overload');
  await sequence.getByRole('button', { name: /^2\. Deload · 1 Woche/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Block: Deload' });
  await fillStepper(dialog, 'Gewicht', '80');
  await expect(dialog.getByRole('button', { name: 'Standard für Deload' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Fertig' }).click();
  await expect(sequence).toContainText('50 % Sätze · 80 % Gewicht · ohne Overload');

  // Deload: halbe Sätze, 80 % vom letzten Training, kein Overload-Vorschlag
  await startPush(page);
  await expect(page.getByRole('alertdialog')).toContainText(
    'Deload · Woche 1 von 1 · 50 % Sätze · 80 % Gewicht · ohne Overload',
  );
  await confirmStart(page);
  await expect(page.getByTestId('workout-block')).toContainText('Sätze angepasst');
  const deloadBench = page.getByRole('region', { name: BENCH });
  await expect(
    deloadBench.getByRole('list', { name: `Sätze ${BENCH}` }).getByRole('listitem'),
  ).toHaveCount(2);
  await expect(deloadBench.getByLabel('Gewicht', { exact: true })).toHaveValue('80');
  await expect(deloadBench.getByLabel('Wiederholungen', { exact: true })).toHaveValue('10');
  await expect(deloadBench.getByText('Vorschlag:')).toHaveCount(0);
  await deloadBench.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);
  await finish(page);

  // Block im Verlauf und in der Statistik sichtbar
  await expect(page.getByText('Deload · Woche 1 von 1 · 50 % Sätze')).toBeVisible();
  await openNav(page, 'Training');
  await page.getByRole('link', { name: /^Verlauf/ }).click();
  await expect(page.getByRole('list', { name: 'Workouts' })).toContainText(
    'Deload · Woche 1 von 1',
  );
  await openNav(page, 'Statistik');
  await expect(page.getByRole('heading', { name: 'Statistik', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: /Bankdrücken \(Langhantel\)/ }).click();
  await expect(page.getByTestId('block-legend')).toBeVisible();

  // Anpassen aus: Block wird nur angezeigt
  await openBlocks(page);
  const adjust = page.getByLabel('Sätze automatisch an den Block anpassen');
  await adjust.click();
  await expect(adjust).not.toBeChecked();
  await expect(page.getByText('Aus: Der Block wird nur angezeigt')).toBeVisible();
  await expect(page.getByTestId('block-status')).toContainText(
    'Sätze wie gewohnt (Anpassen ist aus)',
  );

  // Ende des letzten Blocks: Hinweis mit Wiederholen
  await page.getByLabel('Beginn des Blocks').fill(daysAgo(10));
  await expect(page.getByTestId('block-status')).toContainText('Deload ist geschafft!');
  await openNav(page, 'Training');
  const ended = page.getByTestId('block-status');
  await expect(ended).toContainText('Deload ist geschafft!');
  await expect(ended.getByRole('button', { name: 'Ohne Blöcke weiter' })).toBeVisible();
  await ended.getByRole('button', { name: 'Abfolge wiederholen' }).click();
  await expect(page.getByTestId('block-status')).toHaveText('Aufbau · Woche 1 von 3');

  // Nach Neuladen bleibt alles
  await page.reload();
  await expect(page.getByTestId('block-status')).toHaveText('Aufbau · Woche 1 von 3');
});
