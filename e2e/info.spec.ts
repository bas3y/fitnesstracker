import { expect, test } from './fixtures';
import { goOffline, openSettings } from './helpers';

// Seit 22e: Erklärungen stecken hinter dem „i“ und öffnen ein Blatt von unten
test('Info-Knopf öffnet die Erklärung als Blatt (offline)', async ({ page, context }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
  await goOffline(page, context);

  await openSettings(page, 'Training');
  const main = page.getByRole('main');
  // Der Erklärsatz steht nicht mehr auf der Seite
  await expect(main.getByText(/Herzfrequenzreserve/)).toHaveCount(0);

  const button = main.getByRole('button', { name: 'Info: Puls' });
  await button.click();
  const sheet = page.getByRole('dialog', { name: 'Puls' });
  await expect(sheet).toContainText('Herzfrequenzreserve (Karvonen)');
  // Am Handy unten angedockt
  const box = await sheet.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box).not.toBeNull();
  expect(Math.abs(box!.y + box!.height - viewport.height)).toBeLessThan(2);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(button).toBeFocused();

  // Schalter mit Info: der Schalter behält seinen Namen
  await main.getByRole('button', { name: 'Info: Pausen-Auswertung' }).click();
  await expect(page.getByRole('dialog', { name: 'Pausen-Auswertung' })).toContainText(
    'ohne Pausen-Timer',
  );
  await page.getByRole('button', { name: 'Schließen' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(main.getByRole('switch', { name: 'Pausen-Auswertung' })).not.toBeChecked();

  // Leer-Zustand: eine Zeile, Tipp hinter dem „i“, daneben tippen schließt
  await page.goto('./#/stats/goals');
  await expect(page.getByText('Noch keine Ziele.')).toBeVisible();
  await page.getByRole('button', { name: 'Info: Beispiele' }).click();
  const examples = page.getByRole('dialog', { name: 'Beispiele' });
  await expect(examples).toContainText('Bankdrücken 100 kg bis Dezember');
  await page.mouse.click(10, 10);
  await expect(examples).toHaveCount(0);
});

test('Export-Karte: Erklärung im Info-Blatt, Link zum Rückblick bleibt', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
  await page.goto('./#/settings/data');
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: 'PDF-Berichte im Rückblick' })).toBeVisible();
  await main.getByRole('button', { name: 'Info: Export' }).click();
  await expect(page.getByRole('dialog', { name: 'Export' })).toContainText(
    'CSV-Dateien lassen sich nicht wieder importieren',
  );
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#\/settings\/data$/);
});
