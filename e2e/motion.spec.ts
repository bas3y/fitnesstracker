import { expect, test, type Page } from './fixtures';
import { addExercise, confirmStart, fillStepper, goOffline, openSettings } from './helpers';

// Schritt 22d: Animationen nur mit Bewegung (sonst läuft die ganze Suite mit „reduzieren“)
test.use({ reducedMotion: 'no-preference' });

async function start(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
}

test('Kacheln, Wasser, To-dos animieren; Schalter „Animationen“ schaltet ab (offline)', async ({
  page,
  context,
}) => {
  await start(page);
  await goOffline(page, context);

  // Widgets erscheinen nacheinander, im Anpassen-Modus wackeln sie
  await expect(page.locator('.anim-stagger > [data-widget]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await expect(page.locator('li.anim-wiggle').first()).toBeVisible();
  await page.getByRole('button', { name: 'Wasser hinzufügen' }).click();
  // Wackelnde Kacheln sind für Playwright nie „stabil“ (für den Finger sind ±0,6° kein Problem)
  await page
    .getByRole('group', { name: 'Größe: Wasser' })
    .getByRole('button', { name: 'Groß' })
    .click({ force: true });
  await expect(
    page.getByRole('group', { name: 'Größe: Wasser' }).getByRole('button', { name: 'Groß' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('li.anim-wiggle')).toHaveCount(0);

  // +250 ml: Betrag schwebt auf, Wert zählt hoch, Balken bekommt eine Welle
  const widget = page.locator('[data-widget="water"]');
  await widget.getByTestId('day-peek').getByRole('button', { name: '+250 ml' }).click();
  await expect(widget.locator('.anim-float-up')).toHaveText('+250 ml');
  await expect(widget.locator('.anim-wave')).toHaveCount(1);
  await expect(widget.getByText('0,25 l', { exact: true })).toBeVisible();
  await expect(widget.locator('.anim-float-up')).toHaveCount(0);

  // To-do: rutscht rein, gleitet nach dem Abhaken aus „Heute“ und landet unter „Erledigt“
  await page.goto('./#/daily/todos');
  await page.getByLabel('Neue Aufgabe').fill('Einkaufen');
  await page.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  const todayList = page.getByRole('list', { name: 'Heute' });
  await expect(todayList.locator('li.anim-slide-in')).toContainText('Einkaufen');
  await todayList.getByRole('checkbox', { name: 'Einkaufen' }).click();
  await expect(todayList.locator('li.anim-leave')).toContainText('Einkaufen');
  await expect(page.getByRole('list', { name: 'Erledigt' })).toContainText('Einkaufen');
  await expect(todayList).toHaveCount(0);

  // Schalter aus: gilt sofort und nach dem Neuladen schon vor dem ersten Rendern
  await openSettings(page, 'Darstellung');
  const toggle = page.getByRole('switch', { name: 'Animationen' });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(page.getByRole('switch', { name: 'Animationen' })).not.toBeChecked();

  await page.goto('./');
  await widget.getByTestId('day-peek').getByRole('button', { name: '+250 ml' }).click();
  await expect(widget.getByText('0,5 l', { exact: true })).toBeVisible();
  await expect(widget.locator('.anim-float-up')).toHaveCount(0);
  await expect(widget.locator('.anim-wave')).toHaveCount(0);
});

test('Training: Satz leuchtet, Pause läuft als Linie ab, Zusammenfassung baut sich auf (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/training');
  await goOffline(page, context);
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);

  const bench = await addExercise(page, 'Bankdrücken (Langhantel)');
  await fillStepper(bench, 'Gewicht', '60');
  await fillStepper(bench, 'Wiederholungen', '10');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await expect(bench.locator('li.anim-flash')).toHaveCount(1);

  // Linie startet voll und wird kürzer, +15 s ändert die Länge der Pause
  const line = page.getByRole('timer', { name: 'Pause' }).getByTestId('rest-progress');
  const share = () => line.evaluate((element: HTMLElement) => parseFloat(element.style.scale));
  await expect.poll(share).toBeGreaterThan(0.9);
  await expect.poll(share, { timeout: 5000 }).toBeLessThan(1);
  await page.getByRole('button', { name: 'Pause 15 Sekunden länger' }).click();
  await expect.poll(share).toBeGreaterThan(0.9);
  await page.getByRole('button', { name: 'Überspringen' }).click();

  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.locator('.anim-stagger')).toContainText('Bankdrücken (Langhantel)');
});
