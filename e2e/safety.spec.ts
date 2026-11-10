import { expect, test } from '@playwright/test';
import { goOffline, openSettings } from './helpers';

test('Speicher-Info, Hinweise auf Willkommen und Weitergeben (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await goOffline(page, context);

  // Kein Dehnen am Seitenende (Android zog sonst die Navigation mit)
  const overscroll = await page.evaluate(
    () => getComputedStyle(document.documentElement).overscrollBehaviorY,
  );
  expect(overscroll).toBe('none');

  const welcome = page.getByRole('region', { name: 'Willkommen bei Basey!' });
  await expect(welcome).toContainText('Schon benutzt und alles leer?');
  await welcome.getByRole('link', { name: 'Backup wiederherstellen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Datensicherung' })).toBeVisible();

  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await openSettings(page, 'Export & Speicher');
  await expect(page.getByTestId('data-summary')).toHaveText(
    '0 (0 Workouts, 0 Ausdauer, 0 Alltagstage)',
  );
  const storage = page.getByRole('main');
  await expect(storage).toContainText('im Browser');
  await expect(storage).toContainText(/Datenbank \d+/);

  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await page
    .getByRole('main')
    .getByRole('link', { name: /App weitergeben/ })
    .click();
  await expect(page.getByRole('main')).toContainText(
    'Jede Person hat ihre eigenen Daten nur auf ihrem eigenen Handy.',
  );
});

test('Hinweis statt leerer App, wenn ein anderes Fenster die Datenbank aktualisiert', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'Heute' })).toBeVisible();

  // Zweites Fenster mit „neuerer App“: hebt die Datenbank-Version an
  const other = await context.newPage();
  await other.goto('./');
  await other.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const probe = indexedDB.open('fitnesstracker');
        probe.onsuccess = () => {
          const version = probe.result.version;
          probe.result.close();
          const request = indexedDB.open('fitnesstracker', version + 10);
          request.onsuccess = () => {
            request.result.close();
            resolve();
          };
          request.onerror = () => reject(request.error);
        };
        probe.onerror = () => reject(probe.error);
      }),
  );

  const notice = page.getByRole('alertdialog', { name: 'Neue Version geöffnet' });
  await expect(notice).toBeVisible();
  await expect(notice.getByRole('button', { name: 'Neu laden' })).toBeVisible();
});
