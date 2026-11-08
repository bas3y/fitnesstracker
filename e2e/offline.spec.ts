import { expect, test } from '@playwright/test';
import { goOffline } from './helpers';

test('Startseite lädt nach dem ersten Besuch auch offline', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'Heute' })).toBeVisible();

  await goOffline(page, context);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Heute' })).toBeVisible();
});

test('Bottom-Navigation funktioniert offline', async ({ page, context }) => {
  await page.goto('./');
  await goOffline(page, context);
  await page.reload();

  const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
  for (const label of ['Training', 'Alltag', 'Statistik', 'Einstellungen', 'Dashboard']) {
    await nav.getByRole('link', { name: label }).click();
    const heading = label === 'Dashboard' ? 'Heute' : label;
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
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
