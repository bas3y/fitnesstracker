import { expect, test, type Page } from '@playwright/test';
import { goOffline } from './helpers';

test.beforeEach(async ({ page }) => {
  // Teilen-Dialog abschalten, damit der Download-Fallback greift
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
  });
});

/** Unterseite der Einstellungen über die Übersicht öffnen */
async function openSection(page: Page, section: string) {
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByText('Einstellungen')
    .click();
  await page.getByRole('main').getByRole('link', { name: section }).click();
  await expect(page.getByRole('heading', { level: 1, name: section })).toBeVisible();
}

test('Einstellungen überstehen Backup, Löschen der DB und Import (offline)', async ({
  page,
  context,
}, testInfo) => {
  await page.goto('./#/settings/profile');
  await goOffline(page, context);

  const name = page.getByLabel('Name', { exact: true });
  await name.fill('Testperson');
  await name.blur();
  await page.getByRole('button', { name: 'lb', exact: true }).click();
  await openSection(page, 'Darstellung');
  await page.getByRole('button', { name: 'Dunkel' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  // Übersicht zeigt Name und Einheiten
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByText('Einstellungen')
    .click();
  await expect(page.getByRole('link', { name: /^Testperson/ })).toContainText('lb und km');

  await openSection(page, 'Datensicherung');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup exportieren' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^basey-backup-\d{4}-\d{2}-\d{2}\.json$/);
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
  await expect(page.getByText('Letztes Backup: noch nie')).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(backupPath);
  await expect(page.getByText('Ersetzt alle Daten auf diesem Gerät.')).toBeVisible();
  await expect(page.getByText('Einstellungen: 1')).toBeVisible();
  await page.getByRole('button', { name: 'Importieren', exact: true }).click();

  await expect(page.getByText('Sicherung wurde importiert')).toBeVisible();
  await expect(page.getByText('Letztes Backup: heute')).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await openSection(page, 'Profil & Einheiten');
  await expect(name).toHaveValue('Testperson');
  await expect(page.getByRole('button', { name: 'lb', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('Ungültige Datei wird beim Import abgelehnt', async ({ page }) => {
  await page.goto('./#/settings/backup');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'falsch.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"app":"etwas-anderes"}'),
  });
  await expect(page.getByRole('alert')).toContainText('Keine Basey-Sicherung');
});
