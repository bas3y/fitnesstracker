import { expect, test } from '@playwright/test';
import { goOffline, openSettings } from './helpers';

test.describe('mit Animationen', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('Ladebildschirm: Artwork der Palette, Schriftzug blendet ein', async ({ page }) => {
    await page.goto('./');
    const splash = page.locator('#splash');
    await expect(splash.locator('.splash-art svg')).toHaveCount(1);
    // Die App darunter scheint nicht durch (unten auf dem Handy war die Startseite zu sehen)
    await expect(page.locator('#root')).toBeHidden();
    // Kein Ring mehr, nur der Name (für Screenreader verborgen, deshalb per Selektor)
    await expect(splash.locator('.logo-ring')).toHaveCount(0);
    await expect(splash.locator('.splash-word svg[aria-label="Basey"]')).toBeAttached();
    // Standardpalette: dunkles Taupe
    await expect(splash).toHaveCSS('background-color', 'rgb(20, 17, 14)');
    const animations = await splash.evaluate((element) =>
      element.getAnimations({ subtree: true }).map((animation) => animation.constructor.name),
    );
    expect(animations.length).toBeGreaterThan(0);

    await expect(splash).toHaveCount(0, { timeout: 5000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Heute' })).toBeVisible();

    // Andere Palette: Ladebildschirm in ihren Farben
    await openSettings(page, 'Darstellung');
    await page
      .getByRole('radiogroup', { name: 'Farbpalette' })
      .getByRole('radio', { name: 'Grün' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'green');
    await page.reload();
    await expect(page.locator('#splash')).toHaveCSS('background-color', 'rgb(1, 36, 24)');
    await expect(
      page.locator('#splash .splash-art pattern, #splash .splash-art filter[id$="-sp0"]'),
    ).toHaveCount(1);
  });
});

test('Name, Logo-Auswahl und iPhone-Icon (offline)', async ({ page, context }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Basey');
  await expect(page.getByRole('region', { name: 'Willkommen bei Basey!' })).toBeVisible();
  await goOffline(page, context);

  await openSettings(page, 'Darstellung');
  const logos = page.getByRole('radiogroup', { name: 'App-Logo' });
  await expect(logos.getByRole('radio')).toHaveCount(2);
  await expect(logos.getByRole('radio', { name: 'Charcoal Satin' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await logos.getByRole('radio', { name: 'Taupe Silk' }).click();
  await expect(logos.getByRole('radio', { name: 'Taupe Silk' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  const icon = page.locator('link[rel="apple-touch-icon"]');
  await expect(icon).toHaveAttribute('href', /apple-touch-icon-taupe\.png$/);

  // Nach dem Neuladen wählt schon index.html Logo und Icon (vor der App)
  await page.reload();
  await expect(icon).toHaveAttribute('href', /apple-touch-icon-taupe\.png$/);
  await expect(
    page.getByRole('radiogroup', { name: 'App-Logo' }).getByRole('radio', { name: 'Taupe Silk' }),
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
