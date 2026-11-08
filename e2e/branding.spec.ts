import { expect, test } from '@playwright/test';
import { goOffline, openSettings } from './helpers';

test.describe('mit Animationen', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('Ladebildschirm mit Basey-Logo dreht ein und verschwindet', async ({ page }) => {
    await page.goto('./');
    const splash = page.locator('#splash');
    await expect(splash.locator('.splash-logo .logo-ring')).toHaveCount(1);
    await expect(splash.locator('.splash-logo .logo-ball')).toHaveCount(1);
    // Für Screenreader verborgen (`aria-hidden`), deshalb per Selektor
    await expect(splash.locator('.splash-word svg[aria-label="Basey"]')).toBeAttached();
    const animations = await splash.evaluate((element) =>
      element.getAnimations({ subtree: true }).map((animation) => animation.constructor.name),
    );
    expect(animations.length).toBeGreaterThan(0);

    await expect(splash).toHaveCount(0, { timeout: 5000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Heute' })).toBeVisible();
  });
});

test('Name, Logo-Auswahl und iPhone-Icon (offline)', async ({ page, context }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Basey');
  await expect(page.getByRole('region', { name: 'Willkommen bei Basey!' })).toBeVisible();
  await goOffline(page, context);

  await openSettings(page, 'Darstellung');
  const logos = page.getByRole('radiogroup', { name: 'App-Logo' });
  await expect(logos.getByRole('radio')).toHaveCount(4);
  await expect(logos.getByRole('radio', { name: 'Charcoal Satin' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await logos.getByRole('radio', { name: 'Stone Grip' }).click();
  await expect(logos.getByRole('radio', { name: 'Stone Grip' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  const icon = page.locator('link[rel="apple-touch-icon"]');
  await expect(icon).toHaveAttribute('href', /apple-touch-icon-stone\.png$/);

  // Nach dem Neuladen wählt schon index.html Logo und Icon (vor der App)
  await page.reload();
  await expect(icon).toHaveAttribute('href', /apple-touch-icon-stone\.png$/);
  await expect(
    page.getByRole('radiogroup', { name: 'App-Logo' }).getByRole('radio', { name: 'Stone Grip' }),
  ).toHaveAttribute('aria-checked', 'true');
  const iconFile = await page.evaluate(
    async (href) => (await fetch(href)).ok,
    (await icon.getAttribute('href')) ?? '',
  );
  expect(iconFile).toBe(true);

  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await page.getByRole('main').getByRole('link', { name: /Über/ }).click();
  await expect(page.getByRole('main').getByRole('img', { name: 'Basey' })).toBeVisible();
});
