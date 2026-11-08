import { expect, test } from '@playwright/test';

test('Zurück stellt die Scrollhöhe wieder her, neue Seiten beginnen oben', async ({ page }) => {
  await page.goto('./#/training/exercises');
  const links = page.locator('a[href^="#/training/exercises/"]:not([href$="/new"])');
  await expect(links.nth(60)).toBeAttached();

  await page.evaluate(() => window.scrollTo(0, 2000));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1500);
  const before = await page.evaluate(() => window.scrollY);

  // Erste Übung, die gerade im Bild ist
  const index = await links.evaluateAll((elements) =>
    elements.findIndex((element) => {
      const box = element.getBoundingClientRect();
      return box.top > 120 && box.bottom < window.innerHeight - 120;
    }),
  );
  const name = (await links.nth(index).innerText()).split('\n')[0]!.trim();
  await links.nth(index).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  // Neue Seite beginnt oben
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Übungen' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before - 5);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(before + 5);
});

test('Datum und Beginn überlappen auch auf schmalen Handys nicht', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./#/training/history/new');
  const date = page.getByLabel('Datum');
  const time = page.getByLabel('Beginn');
  await expect(date).toBeVisible();
  const dateBox = (await date.boundingBox())!;
  const timeBox = (await time.boundingBox())!;
  expect(dateBox.x + dateBox.width).toBeLessThanOrEqual(timeBox.x);
  expect(timeBox.x + timeBox.width).toBeLessThanOrEqual(320);
});
