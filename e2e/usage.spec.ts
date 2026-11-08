import { expect, test, type Page } from '@playwright/test';
import {
  addExercise,
  confirmStart,
  dailyTile,
  dragTo,
  fillStepper,
  goOffline,
  openSettings,
} from './helpers';

const nav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

const pad = (n: number) => String(n).padStart(2, '0');
const localDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

test('Krafttraining nachtragen, Karten samt Inhalt ziehen, laufendes Workout bleibt (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/training');
  await goOffline(page, context);

  // Ein laufendes Workout bleibt vom Nachtragen unberührt
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Workout' })).toBeVisible();
  await nav(page, 'Training');

  await page.getByRole('link', { name: /^Nachtragen/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Training nachtragen' })).toBeVisible();
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  // Zukunft wird abgelehnt
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  await page.getByLabel('Datum').fill(localDate(tomorrow));
  await page.getByRole('button', { name: 'Weiter zu den Übungen' }).click();
  await expect(page.getByRole('alert')).toHaveText('Der Beginn liegt in der Zukunft.');

  await page.getByLabel('Datum').fill(localDate(yesterday));
  await page.getByLabel('Beginn').fill('18:00');
  await fillStepper(page.locator('form'), 'Dauer', '45');
  await page.getByRole('button', { name: 'Weiter zu den Übungen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Workout bearbeiten' })).toBeVisible();
  await expect(page.getByText('Ohne Übungen wird das Workout nicht gespeichert.')).toBeVisible();

  // Sätze sind direkt erledigt (kein Abhaken, kein Pausen-Timer)
  const bench = await addExercise(page, 'Bankdrücken (Langhantel)');
  await bench.getByRole('button', { name: /^Satz 1:/ }).click();
  await fillStepper(bench, 'Gewicht', '70');
  await fillStepper(bench, 'Wiederholungen', '8');
  await expect(bench.getByRole('button', { name: 'Satz 1: 70 kg × 8' })).toBeVisible();
  await expect(bench.getByRole('button', { name: 'Satz 1 abhaken' })).toHaveCount(0);
  await bench.getByRole('button', { name: '+ Satz' }).click();
  await expect(bench.getByRole('button', { name: /^Satz 2:/ })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await fillStepper(bench, 'Wiederholungen', '6');
  await expect(bench.getByRole('button', { name: 'Satz 2: 70 kg × 6' })).toBeVisible();
  // Zuklappen, damit die Zielkarte beim Umsortieren auf den Bildschirm passt
  await bench.getByRole('button', { name: 'Satz 2: 70 kg × 6' }).click();
  const pullUps = await addExercise(page, 'Klimmzüge');
  await pullUps.getByRole('button', { name: /^Satz 1:/ }).click();
  await fillStepper(pullUps, 'Wiederholungen', '10');
  await expect(page.getByRole('timer', { name: 'Pause' })).toHaveCount(0);

  // Beim Ziehen bleibt der Inhalt der Karte sichtbar
  const handle = page.getByRole('button', { name: 'Klimmzüge verschieben' });
  await handle.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  const from = (await handle.boundingBox())!;
  const x = from.x + from.width / 2;
  await page.mouse.move(x, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, from.y + from.height / 2 - 20, { steps: 3 });
  await expect(pullUps.getByRole('button', { name: '+ Satz' })).toBeVisible();
  await expect(pullUps.getByLabel('Wiederholungen', { exact: true })).toBeVisible();
  await expect(bench.getByRole('button', { name: 'Satz 2: 70 kg × 6' })).toBeVisible();
  await page.mouse.up();
  await dragTo(page, handle, bench);
  const cards = page.getByRole('list', { name: 'Übungen im Workout' }).locator(':scope > li');
  await expect(cards.first().getByRole('region')).toHaveAccessibleName('Klimmzüge');

  await page.getByRole('link', { name: 'Fertig' }).click();
  await expect(page.getByText('18:00 Uhr · Dauer 45 min')).toBeVisible();
  await expect(page.getByText('70 kg × 6')).toBeVisible();

  // Verlauf: das nachgetragene Training, das laufende bleibt
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Verlauf' })).toBeVisible();
  const history = page.getByRole('list', { name: 'Workouts' });
  await expect(history.getByRole('listitem')).toHaveCount(1);
  await expect(history).toContainText('Klimmzüge, Bankdrücken (Langhantel)');
  await expect(history).toContainText('3 Sätze');
  await expect(page.getByRole('status').filter({ hasText: 'Workout läuft' })).toBeVisible();

  // Leer gelassen = nicht gespeichert
  await page.getByRole('link', { name: 'Nachtragen' }).click();
  await page.getByRole('button', { name: 'Weiter zu den Übungen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Workout bearbeiten' })).toBeVisible();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Verlauf' })).toBeVisible();
  await expect(history.getByRole('listitem')).toHaveCount(1);

  // Nach dem Neuladen noch da
  await page.reload();
  await expect(history.getByRole('listitem')).toHaveCount(1);
});

test('nur Protein erfassen: Ernährung, Kachel, Startseite und normaler Modus (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/settings/nutrition');
  await goOffline(page, context);

  await page.getByLabel('Nur Protein erfassen').click();
  await expect(page.getByLabel('Nur Protein erfassen')).toBeChecked();
  await expect(page.getByLabel('Kalorien (Ruhetag)', { exact: true })).toHaveCount(0);
  await fillStepper(page.locator('body'), 'Protein (Ruhetag)', '120');

  await nav(page, 'Alltag');
  await expect(dailyTile(page, 'Ernährung')).toContainText('0 von 120 g Protein');
  await dailyTile(page, 'Ernährung').click();
  await expect(page.getByRole('heading', { name: 'Frühstück' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Lebensmittel & Rezepte/ })).toHaveCount(0);
  await page.getByRole('button', { name: '+20 g Protein' }).click();
  await page.getByRole('button', { name: '+30 g Protein' }).click();
  const summary = page.getByTestId('nutrition-summary');
  await expect(summary).toContainText('50 von 120 g');
  await page.getByRole('button', { name: 'Rückgängig (−30 g)' }).click();
  await expect(summary).toContainText('20 von 120 g');
  await expect(page.getByLabel('Protein ohne Lebensmittel', { exact: true })).toHaveValue('20');
  await fillStepper(page.locator('body'), 'Protein ohne Lebensmittel', '45');
  await expect(summary).toContainText('45 von 120 g');
  await expect(page.getByText('Noch 75 g Protein', { exact: false })).toBeVisible();
  await expect(summary).not.toContainText('kcal');

  // Startseiten-Widget im Protein-Modus mit Buttons
  await nav(page, 'Dashboard');
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page.getByRole('button', { name: 'Ernährung hinzufügen' }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  const widget = page.locator('section').filter({ has: page.getByTestId('nutrition-summary') });
  await expect(widget).toContainText('45 von 120 g');
  await widget.getByRole('button', { name: '+10 g Protein' }).click();
  await expect(widget).toContainText('55 von 120 g');

  // Normaler Modus: Protein ohne Lebensmittel zählt weiter mit
  await openSettings(page, 'Ernährung');
  await page.getByLabel('Nur Protein erfassen').click();
  await expect(page.getByLabel('Nur Protein erfassen')).not.toBeChecked();
  await nav(page, 'Alltag');
  await expect(dailyTile(page, 'Ernährung')).toContainText('kcal');
  await dailyTile(page, 'Ernährung').click();
  await expect(page.getByRole('heading', { name: 'Frühstück' })).toBeVisible();
  await expect(summary).toContainText('55 von');
  await expect(page.getByText(/davon 55 g Protein ohne Lebensmittel/)).toBeVisible();
  await expect(page.getByLabel('Protein ohne Lebensmittel', { exact: true })).toHaveValue('55');

  await page.reload();
  await expect(page.getByLabel('Protein ohne Lebensmittel', { exact: true })).toHaveValue('55');
});

test('Willkommen beim ersten Öffnen, App weitergeben und Anleitung (offline)', async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        (window as unknown as { shared: ShareData }).shared = data;
      },
    });
  });
  await page.goto('./');
  await goOffline(page, context);

  const welcome = page.getByRole('region', { name: 'Willkommen!' });
  await expect(welcome).toContainText('nur auf diesem Gerät');
  await welcome.getByRole('link', { name: 'Installieren' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Installieren & weitergeben' }),
  ).toBeVisible();
  await expect(page.getByTestId('app-url')).toHaveText(new URL('./', page.url()).href);
  await expect(page.getByText('Android (Chrome)')).toBeVisible();
  await expect(page.getByText('iPhone (Safari)')).toBeVisible();
  await page.getByRole('button', { name: 'App weitergeben' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Link geteilt.' })).toBeVisible();
  const shared = await page.evaluate(() => (window as unknown as { shared: ShareData }).shared);
  expect(shared.url).toBe(new URL('./', page.url()).href);

  // Zurück zur Startseite, Hinweis schließen bleibt nach dem Neuladen
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await welcome.getByRole('button', { name: 'Los geht’s' }).click();
  await expect(welcome).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Heute' })).toBeVisible();
  await expect(welcome).toHaveCount(0);

  // Einstieg auch in den Einstellungen
  await nav(page, 'Einstellungen');
  await page.getByRole('link', { name: /^App weitergeben & installieren/ }).click();
  await expect(page.getByTestId('app-url')).toBeVisible();
});
