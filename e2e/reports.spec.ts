import { readFile } from 'node:fs/promises';
import { expect, test, type Download, type Page } from '@playwright/test';
import { sampleFitRun } from '../src/test/importFiles';
import { confirmStart, fillStepper, goOffline, skipRest } from './helpers';

const BENCH = 'Bankdrücken (Langhantel)';

const openNav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

/** Inhalt als Latin-1 (wie im PDF), Umlaute bleiben lesbar */
async function pdfContent(download: Download): Promise<string> {
  const bytes = await readFile((await download.path())!);
  return bytes.toString('latin1');
}

async function exportFile(page: Page, button: string, scope = page.locator('body')) {
  const download = page.waitForEvent('download');
  await scope.getByRole('button', { name: button }).click();
  return download;
}

test.beforeEach(async ({ page }) => {
  // Teilen-Dialog abschalten, damit der Download-Fallback greift
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
  });
});

test('Berichte und Einzel-Exporte als PDF und CSV (offline)', async ({ page, context }) => {
  await page.goto('./');
  await goOffline(page, context);
  await page.reload();

  // Ein Krafttraining …
  await openNav(page, 'Training');
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  await page.getByRole('button', { name: '+ Übung hinzufügen' }).click();
  const picker = page.getByRole('dialog', { name: 'Übung hinzufügen' });
  await picker.getByRole('searchbox', { name: 'Übung suchen' }).fill(BENCH);
  await picker
    .getByRole('button', { name: /^Bankdrücken \(Langhantel\)/ })
    .first()
    .click();
  const bench = page.getByRole('region', { name: BENCH });
  await fillStepper(bench, 'Gewicht', '60');
  await fillStepper(bench, 'Wiederholungen', '10');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);
  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).toHaveURL(/#\/training\/history\/[\w-]+$/);

  // … und ein importierter Lauf von heute
  await page.goto('./#/training/import');
  const start = new Date(Date.now() - 60 * 60 * 1000);
  await page
    .getByText('Dateien auswählen')
    .locator('input[type=file]')
    .setInputFiles([
      {
        name: 'lauf.fit',
        mimeType: 'application/octet-stream',
        buffer: Buffer.from(
          sampleFitRun({
            start: start.getTime(),
            step: 5,
            count: 361,
            speed: 3,
            heartRate: () => 150,
          }),
        ),
      },
    ]);
  await page.getByRole('button', { name: '1 Einheit importieren' }).click();
  await expect(page.getByText(/Import abgeschlossen: 1 neu/)).toBeVisible();

  // Monatsbericht aus dem Rückblick
  await page.goto('./#/stats?view=review');
  const month = await exportFile(page, 'Monatsbericht als PDF');
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  expect(month.suggestedFilename()).toBe(`basey-bericht-${monthKey}.pdf`);
  await expect(page.getByRole('status').filter({ hasText: 'PDF wurde erstellt' })).toBeVisible();
  const monthPdf = await pdfContent(month);
  expect(monthPdf.startsWith('%PDF-1.4')).toBe(true);
  expect(monthPdf.trimEnd().endsWith('%%EOF')).toBe(true);
  expect(monthPdf).toContain('(Monatsbericht) Tj');
  expect(monthPdf).toContain('(Krafttraining im Detail) Tj');
  expect(monthPdf).toContain('(Bankdrücken \\(Langhantel\\)) Tj');
  expect(monthPdf).toContain('(Ausdauer im Detail) Tj');

  // Jahresbericht
  await page.getByRole('group', { name: 'Zeitraum' }).getByRole('button', { name: 'Jahr' }).click();
  const year = await exportFile(page, 'Jahresbericht als PDF');
  expect(year.suggestedFilename()).toBe(`basey-bericht-${new Date().getFullYear()}.pdf`);
  expect(await pdfContent(year)).toContain('(Trainings je Monat) Tj');

  // Übungsstatistik: PDF und CSV
  await openNav(page, 'Statistik');
  await page.getByRole('group', { name: 'Bereich' }).getByRole('button', { name: 'Kraft' }).click();
  await page.getByRole('link', { name: /Bankdrücken \(Langhantel\)/ }).click();
  const exportCard = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Exportieren' }),
  });
  const exercisePdf = await exportFile(page, 'Als PDF', exportCard);
  expect(exercisePdf.suggestedFilename()).toMatch(
    /^basey-bankdruecken-langhantel-\d{4}-\d{2}-\d{2}\.pdf$/,
  );
  const exerciseText = await pdfContent(exercisePdf);
  expect(exerciseText).toContain('(Übungsstatistik) Tj');
  expect(exerciseText).toContain('(60 kg × 10) Tj');
  const exerciseCsv = await exportFile(page, 'Als CSV (Tabelle)', exportCard);
  expect(exerciseCsv.suggestedFilename()).toMatch(/^basey-bankdruecken-langhantel-.*\.csv$/);
  const csvLines = (await readFile((await exerciseCsv.path())!, 'utf8')).trim().split('\r\n');
  expect(csvLines).toHaveLength(2);
  expect(csvLines[1]).toContain(';Bankdrücken (Langhantel);1;nein;60;;10;');

  // Ausdauer-Statistik Laufen: PDF und CSV
  await page.goto('./#/stats?view=endurance&sport=run');
  const runPdf = await exportFile(page, 'Als PDF', exportCard);
  expect(runPdf.suggestedFilename()).toMatch(/^basey-ausdauer-laufen-\d{4}-\d{2}-\d{2}\.pdf$/);
  const runText = await pdfContent(runPdf);
  expect(runText).toContain('(Ausdauer-Statistik) Tj');
  expect(runText).toContain('(150 bpm) Tj');
  const runCsv = await exportFile(page, 'Als CSV (Tabelle)', exportCard);
  const runLines = (await readFile((await runCsv.path())!, 'utf8')).trim().split('\r\n');
  expect(runLines).toHaveLength(2);
  expect(runLines[1]).toContain(';Laufen;');
});
