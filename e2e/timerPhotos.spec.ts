import { expect, test, type Page } from '@playwright/test';
import { fillStepper, goOffline } from './helpers';

const selfRow = (page: Page, name: string) =>
  page
    .getByRole('list', { name: 'Persönliche Entwicklung' })
    .getByRole('link', { name: new RegExp(`^${name}`) });

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

test('Timer: Fokus mit Runden, Meditation mit Gewohnheit, Nachtragen, Ziel (offline)', async ({
  page,
  context,
}) => {
  const body = page.locator('body');
  await page.clock.install();
  await page.goto('./#/daily/habits');
  await goOffline(page, context);
  await page.reload();

  // Abhak-Gewohnheit zum Verknüpfen
  await page.getByRole('link', { name: '+ Neue Gewohnheit' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Meditieren');
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByText('0 von 1 erledigt')).toBeVisible();

  await page.goto('./#/daily');
  await expect(selfRow(page, 'Fokus & Meditation')).toContainText(
    'Pomodoro und Meditation mit Gong',
  );
  await selfRow(page, 'Fokus & Meditation').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Fokus & Meditation' })).toBeVisible();
  await expect(page.getByText('Noch keine Sitzung.')).toBeVisible();

  // Fokus: 2 Runden à 1 min mit 1 min Pause
  await fillStepper(body, 'Fokuszeit', '1');
  await fillStepper(body, 'Pause', '1');
  await fillStepper(body, 'Runden', '2');
  await expect(page.getByText(/Insgesamt 3 min/)).toBeVisible();
  await page.getByRole('button', { name: 'Fokus starten' }).click();

  // Läuft auch nach dem Neuladen weiter
  const running = page.getByRole('region', { name: 'Timer läuft' });
  await expect(running).toContainText('Runde 1 von 2');
  await page.reload();
  await expect(running).toContainText('Runde 1 von 2');

  await page.getByRole('button', { name: 'Anhalten' }).click();
  await expect(running).toContainText('angehalten');
  await page.clock.fastForward('05:00');
  await expect(running).toContainText('Runde 1 von 2');
  await page.getByRole('button', { name: 'Fortsetzen' }).click();
  await page.clock.fastForward('01:05');
  await expect(running).toContainText('danach Runde 2 von 2');
  await page.getByRole('button', { name: 'Pause überspringen' }).click();
  await expect(running).toContainText('Runde 2 von 2');
  await page.clock.fastForward('01:05');

  await expect(page.getByText('Fokus beendet')).toBeVisible();
  await expect(running).toHaveCount(0);
  const sessions = page.getByRole('list', { name: 'Sitzungen heute' });
  await expect(sessions).toContainText('Fokus · 2 min');
  await expect(sessions).toContainText('2 Runden');

  // Notiz
  await sessions.getByRole('button', { name: 'Notiz: Fokus 2 min' }).click();
  await page.getByLabel('Wie war die Sitzung?').fill('Konzentriert');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(sessions).toContainText('Konzentriert');

  // Meditation zählt bei der Gewohnheit; vorzeitig beenden und speichern
  await page.getByLabel('Meditation zählt bei').selectOption({ label: 'Meditieren' });
  await page
    .getByRole('group', { name: 'Art' })
    .getByRole('button', { name: /Meditation/ })
    .click();
  await page.getByRole('button', { name: '5 min', exact: true }).click();
  await page.getByRole('button', { name: 'Meditation starten' }).click();
  await expect(running).toContainText('Meditation');
  await page.clock.fastForward('02:00');
  await running.getByRole('button', { name: 'Beenden' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: '2 min speichern' }).click();
  await expect(sessions).toContainText('Meditation · 2 min');
  await expect(page.getByText('Meditation heute').locator('..')).toContainText('2 min');

  await page.goto('./#/daily/habits');
  await expect(page.getByText('1 von 1 erledigt')).toBeVisible();

  // Nachtragen, Löschen nimmt den Haken zurück
  await page.goto('./#/daily/timer');
  await page.getByRole('button', { name: 'Sitzung nachtragen' }).click();
  const addDialog = page.getByRole('dialog', { name: 'Sitzung nachtragen' });
  await fillStepper(addDialog, 'Dauer', '20');
  await addDialog.getByRole('button', { name: 'Speichern' }).click();
  await expect(sessions).toContainText('nachgetragen');
  await expect(sessions.getByRole('listitem')).toHaveCount(3);
  await sessions.getByRole('button', { name: 'Meditation 2 min löschen' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click();
  await expect(sessions.getByRole('listitem')).toHaveCount(2);
  await page.goto('./#/daily/habits');
  // Nachgetragene Meditation hält den Haken
  await expect(page.getByText('1 von 1 erledigt')).toBeVisible();

  // Ziel „Meditationsminuten“
  await page.goto('./#/stats/goals/new');
  await page
    .getByRole('group', { name: 'Art des Ziels' })
    .getByRole('button', { name: 'Menge' })
    .click();
  await page.getByLabel('Was zählt').selectOption({ label: 'Meditationsminuten' });
  const form = page.locator('form');
  await fillStepper(form, 'Ziel', '300');
  await expect(page.getByTestId('goal-current')).toHaveText('Im laufenden Zeitraum bisher: 20 min');
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByText('300 min Meditation pro Monat')).toBeVisible();

  // Stand auf der Übersicht, übersteht das Neuladen
  await page.goto('./#/daily');
  await expect(selfRow(page, 'Fokus & Meditation')).toContainText(
    'Heute: Fokus 2 min · Meditation 20 min',
  );
  await page.reload();
  await expect(selfRow(page, 'Fokus & Meditation')).toContainText('Meditation 20 min');
});

/** PNG im Browser zeichnen (groß genug, dass verkleinert wird) */
async function samplePhoto(page: Page, color: string, width = 2000, height = 3000) {
  const base64 = await page.evaluate(
    async ({ color, width, height }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d')!;
      context.fillStyle = color;
      context.fillRect(0, 0, width, height);
      context.fillStyle = '#fff';
      context.fillRect(width / 4, height / 4, width / 2, height / 2);
      return canvas.toDataURL('image/png').split(',')[1]!;
    },
    { color, width, height },
  );
  return {
    name: `foto-${color}.png`,
    mimeType: 'image/png',
    buffer: Buffer.from(base64, 'base64'),
  };
}

test.describe('Fortschrittsfotos', () => {
  test.beforeEach(async ({ page }) => {
    // Teilen-Dialog abschalten, damit beim Backup der Download greift
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    });
  });

  test('aufnehmen, filtern, vergleichen, ändern, löschen, Backup mit Fotos (offline)', async ({
    page,
    context,
  }, testInfo) => {
    const today = new Date();
    const earlier = new Date(today);
    earlier.setDate(today.getDate() - 30);

    await page.goto('./#/daily');
    await goOffline(page, context);
    await page.reload();
    await expect(selfRow(page, 'Fortschrittsfotos')).toContainText('Vorher/Nachher vergleichen');
    await selfRow(page, 'Fortschrittsfotos').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Fortschrittsfotos' })).toBeVisible();
    await expect(page.getByText('Noch keine Fotos.', { exact: false })).toBeVisible();

    const input = page.getByLabel('+ Foto hinzufügen');
    const dialog = page.getByRole('dialog', { name: 'Foto speichern' });

    // Vor 30 Tagen von vorne
    await input.setInputFiles(await samplePhoto(page, '#0a7'));
    await expect(dialog).toContainText('1067 × 1600 px');
    await dialog.getByLabel('Tag').fill(dayKey(earlier));
    await dialog.getByLabel('Notiz (optional)').fill('Start');
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog).toHaveCount(0);

    // Heute von vorne und von der Seite (Querformat bleibt Querformat)
    await input.setInputFiles(await samplePhoto(page, '#07a'));
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await input.setInputFiles(await samplePhoto(page, '#a70', 3000, 2000));
    await expect(dialog).toContainText('1600 × 1067 px');
    await dialog
      .getByRole('group', { name: 'Ansicht' })
      .getByRole('button', { name: 'Seite' })
      .click();
    await dialog.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.getByRole('region', { name: 'Heute' }).getByRole('link')).toHaveCount(2);
    await expect(page.getByTestId('photo-storage')).toContainText('3 Fotos belegen');
    // Vorschauen sind geladen
    await expect(page.getByRole('img', { name: /^Foto Vorne/ }).first()).toHaveJSProperty(
      'complete',
      true,
    );

    // Filter nach Ansicht
    const filter = page.getByRole('group', { name: 'Ansicht' });
    await filter.getByRole('button', { name: 'Seite' }).click();
    await expect(page.getByRole('img', { name: /^Foto / })).toHaveCount(1);
    await filter.getByRole('button', { name: 'Hinten' }).click();
    await expect(page.getByText('Keine Fotos mit der Ansicht „Hinten“.')).toBeVisible();
    await filter.getByRole('button', { name: 'Vorne' }).click();
    await expect(page.getByRole('img', { name: /^Foto / })).toHaveCount(2);

    // Vergleich: ältestes und neuestes Foto von vorne
    await page.getByRole('link', { name: 'Vergleichen' }).click();
    await expect(page.getByTestId('photo-gap')).toHaveText('30 Tage später');
    await expect(page.getByRole('region', { name: 'Vorher' }).getByRole('img')).toBeVisible();
    await page.getByRole('button', { name: 'Seiten tauschen' }).click();
    await expect(page.getByTestId('photo-gap')).toHaveText('30 Tage später');
    await page.getByRole('link', { name: 'Zurück', exact: true }).click();
    await expect(filter.getByRole('button', { name: 'Vorne' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // Detail: Angaben ändern, dann löschen
    await filter.getByRole('button', { name: 'Alle' }).click();
    await page.getByRole('link', { name: /^Foto Seite/ }).click();
    await page.getByRole('button', { name: 'Angaben ändern' }).click();
    await page
      .getByRole('group', { name: 'Ansicht' })
      .getByRole('button', { name: 'Hinten' })
      .click();
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hinten');
    await page.getByRole('button', { name: 'Foto löschen' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Fortschrittsfotos' })).toBeVisible();
    await expect(page.getByTestId('photo-storage')).toContainText('2 Fotos belegen');

    // Backup mit Fotos, Datenbank löschen, wiederherstellen
    await page.goto('./#/settings');
    await page.getByLabel('Fortschrittsfotos einschließen').check();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Backup exportieren' }).click();
    const backupPath = testInfo.outputPath('backup.json');
    await (await downloadPromise).saveAs(backupPath);

    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase('fitnesstracker');
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
    );
    await page.reload();
    await page.locator('input[type="file"][accept*="json"]').setInputFiles(backupPath);
    // Wie bei allen Tabellen zählt der gelöschte Datensatz mit, Bilddaten gibt es nur für zwei
    await expect(page.getByText('Fortschrittsfotos: 3')).toBeVisible();
    await expect(page.getByText('Bilddaten der Fotos: 4')).toBeVisible();
    await expect(page.getByText('auch die Fotos')).toBeVisible();
    await page.getByRole('button', { name: 'Importieren', exact: true }).click();
    await expect(page.getByText('Sicherung wurde importiert')).toBeVisible();

    await page.goto('./#/daily/photos');
    await expect(page.getByTestId('photo-storage')).toContainText('2 Fotos belegen');
    await page
      .getByRole('link', { name: /^Foto Vorne/ })
      .last()
      .click();
    await expect(page.locator('main').getByText('Start', { exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: /^Foto Vorne/ })).toHaveJSProperty(
      'naturalWidth',
      1067,
    );
  });
});
