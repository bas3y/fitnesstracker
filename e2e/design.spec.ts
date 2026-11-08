import { expect, test } from '@playwright/test';
import { goOffline } from './helpers';

test('Farbpalette und Dunkelmodus wählen, bleiben nach dem Neuladen (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/settings');
  await goOffline(page, context);
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-palette', 'green');

  const palettes = page.getByRole('radiogroup', { name: 'Farbpalette' });
  await expect(palettes.getByRole('radio')).toHaveCount(5);
  await expect(palettes.getByRole('radio', { name: 'Grün' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  const greenPage = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  await palettes.getByRole('radio', { name: 'Violett' }).click();
  await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Dunkel' }).click();
  await expect(root).toHaveAttribute('data-palette', 'violet');
  await expect(root).toHaveClass(/dark/);
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .not.toBe(greenPage);
  await expect(palettes.getByRole('radio', { name: 'Violett' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  // Statusleiste folgt der Hintergrundfarbe
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
      ),
    )
    .toBe(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));

  await page.reload();
  // Schon vor dem Laden der Einstellungen gesetzt (kein Aufblitzen)
  await expect(root).toHaveAttribute('data-palette', 'violet');
  await expect(root).toHaveClass(/dark/);
  await expect(
    page.getByRole('radiogroup', { name: 'Farbpalette' }).getByRole('radio', { name: 'Violett' }),
  ).toHaveAttribute('aria-checked', 'true');

  // Farbblock (Variante C) auf der Trainingsseite: im Dunkelmodus die helle Palettenfarbe
  await page.getByRole('navigation').getByRole('link', { name: 'Training' }).click();
  const start = page.getByRole('button', { name: 'Workout starten' });
  await expect(start).toBeVisible();
  const heroColor = await start.evaluate(
    (element) => getComputedStyle(element.closest('section')!).backgroundColor,
  );
  expect(heroColor).not.toBe(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
  );
});
