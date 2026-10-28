import { expect, test } from '@playwright/test';
import { goOffline } from './helpers';

test.beforeEach(async ({ page }) => {
  // Teilen-Dialog abschalten, damit der Download-Fallback greift
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
  });
});

test('Einstellungen überstehen Backup, Löschen der DB und Import (offline)', async ({
  page,
  context,
}, testInfo) => {
  await page.goto('./#/settings');
  await goOffline(page, context);

  const name = page.getByLabel('Name', { exact: true });
  await name.fill('Testperson');
  await name.blur();
  await page.getByRole('button', { name: 'lb', exact: true }).click();
  await page.getByRole('button', { name: 'Dunkel' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup exportieren' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^fitnesstracker-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = testInfo.outputPath('backup.json');
  await download.saveAs(backupPath);
  await expect(page.getByText('Letztes Backup: heute')).toBeVisible();

  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('fitnesstracker');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
  );
  await page.reload();
  await expect(name).toHaveValue('');
  await expect(page.getByRole('button', { name: 'kg', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.locator('input[type="file"]').setInputFiles(backupPath);
  await expect(page.getByText('Ersetzt alle Daten auf diesem Gerät.')).toBeVisible();
  await expect(page.getByText('Einstellungen: 1')).toBeVisible();
  await page.getByRole('button', { name: 'Importieren', exact: true }).click();

  await expect(page.getByText('Sicherung wurde importiert')).toBeVisible();
  await expect(name).toHaveValue('Testperson');
  await expect(page.getByRole('button', { name: 'lb', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByText('Letztes Backup: heute')).toBeVisible();
});

test('Ungültige Datei wird beim Import abgelehnt', async ({ page }) => {
  await page.goto('./#/settings');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'falsch.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"app":"etwas-anderes"}'),
  });
  await expect(page.getByRole('alert')).toContainText('Keine Fitnesstracker-Sicherung');
});
