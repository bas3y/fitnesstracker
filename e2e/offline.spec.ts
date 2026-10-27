import { expect, test } from '@playwright/test';

test('Startseite lädt nach dem ersten Besuch auch offline', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Fitnesstracker' })).toBeVisible();

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Seite muss vom Service Worker kontrolliert sein, bevor offline geschaltet wird
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) {
    await page.reload();
  }

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Fitnesstracker' })).toBeVisible();
});

test('Manifest ist installierbar konfiguriert', async ({ request }) => {
  const response = await request.get('./manifest.webmanifest');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.name).toBe('Fitnesstracker');
  expect(manifest.display).toBe('standalone');
  const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === 'maskable')).toBe(
    true,
  );
});
