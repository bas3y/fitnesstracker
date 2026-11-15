import type { Page, TestInfo } from '@playwright/test';
import { expect, test } from './fixtures';
import { addExercise, confirmStart, fillStepper, goOffline, skipRest } from './helpers';

/**
 * Große und quer gehaltene Bildschirme (Schritt 22c). Läuft nur in den Projekten `android-quer`
 * (Handy quer: Leiste unten flach), `tablet` (Leiste unten, Raster, Liste mit Detail, Fenster mittig)
 * und `desktop` (zusätzlich Seitenleiste links), siehe `playwright.config.ts`.
 */
type Screen = 'quer' | 'tablet' | 'desktop';

function screenOf(info: TestInfo): Screen {
  if (info.project.name === 'desktop') return 'desktop';
  if (info.project.name === 'tablet') return 'tablet';
  return 'quer';
}

/** Liste mit Detail und Auswahlfenster mittig ab 64 rem */
const large = (screen: Screen) => screen !== 'quer';

function nav(page: Page) {
  return page.getByRole('navigation', { name: 'Hauptnavigation' });
}

test('Navigation sitzt je nach Bildschirm unten oder links und bleibt bedienbar', async ({
  page,
  context,
}, info) => {
  const screen = screenOf(info);
  await page.goto('./#/');
  await goOffline(page, context);
  const viewport = page.viewportSize()!;
  const box = (await nav(page).boundingBox())!;

  if (screen === 'desktop') {
    // Seitenleiste links über die ganze Höhe, Namen sichtbar, Inhalt rechts daneben
    expect(box.x).toBe(0);
    expect(Math.round(box.height)).toBe(viewport.height);
    expect(Math.round(box.width)).toBe(240);
    await expect(nav(page).getByText('Einstellungen')).toBeVisible();
    const heading = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
    expect(heading.x).toBeGreaterThanOrEqual(box.width);
    // Einstellungen unten abgesetzt
    const settings = (await nav(page).getByRole('link', { name: 'Einstellungen' }).boundingBox())!;
    expect(settings.y).toBeGreaterThan(viewport.height / 2);
  } else {
    // Leiste unten über die ganze Breite
    expect(Math.round(box.y + box.height)).toBe(viewport.height);
    expect(Math.round(box.width)).toBe(viewport.width);
    if (screen === 'quer') {
      // Flach, nur Symbole (Name nur für Screenreader)
      expect(box.height).toBeLessThan(50);
      const label = (await nav(page).getByText('Training').boundingBox())!;
      expect(label.width).toBeLessThanOrEqual(1);
      const link = (await nav(page).getByRole('link', { name: 'Training' }).boundingBox())!;
      expect(link.height).toBeGreaterThanOrEqual(44);
    } else {
      expect(box.height).toBeGreaterThanOrEqual(56);
      await expect(nav(page).getByText('Training')).toBeVisible();
    }
  }

  await nav(page).getByRole('link', { name: 'Training' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Training' })).toBeVisible();
  await expect(nav(page).getByRole('link', { name: 'Training' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  // Kacheln: 3 (quer) bzw. 4 je Zeile
  const tiles = page.getByRole('list', { name: 'Krafttraining' }).getByRole('listitem');
  const tops = await tiles.evaluateAll((items) =>
    items.map((item) => Math.round(item.getBoundingClientRect().top)),
  );
  expect(tops.filter((top) => top === tops[0])).toHaveLength(screen === 'quer' ? 3 : 4);

  // Das Dokument scrollt nie, nur der Inhaltsbereich
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
});

test('Startseite: Widgets im Feldraster (4 bzw. 6 Felder je Zeile)', async ({ page }, info) => {
  const screen = screenOf(info);
  await page.goto('./#/');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
  const widget = page.locator('[data-widget]').first();
  await expect(widget).toBeVisible();
  const columns = await widget.evaluate(
    (element) => getComputedStyle(element.parentElement!).gridTemplateColumns.split(' ').length,
  );
  expect(columns).toBe(screen === 'quer' ? 4 : 6);

  // Anpassen: gleiches Raster, Größe ändern wirkt sofort auf die Breite
  await page.getByRole('button', { name: 'Anpassen' }).click();
  const editor = page.getByRole('list', { name: 'Widgets', exact: true });
  const editorColumns = await editor.evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
  );
  expect(editorColumns).toBe(columns);
  await page.getByRole('button', { name: 'Fertig' }).click();
});

test('Workout quer/groß: Auswahl als Fenster, Pausen-Timer neben der Navigation, Liste mit Detail', async ({
  page,
  context,
}, info) => {
  const screen = screenOf(info);
  await page.goto('./#/training');
  await goOffline(page, context);
  const viewport = page.viewportSize()!;

  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Workout' })).toBeVisible();

  // Übungsauswahl: ab Tablet quer großes Fenster mittig, sonst ganzer Bildschirm; Escape schließt
  await page.getByRole('button', { name: '+ Übung hinzufügen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Übung hinzufügen' });
  await expect(dialog).toBeVisible();
  const dialogBox = (await dialog.boundingBox())!;
  if (large(screen)) {
    expect(dialogBox.width).toBeLessThanOrEqual(42 * 16 + 1);
    expect(Math.abs(dialogBox.x + dialogBox.width / 2 - viewport.width / 2)).toBeLessThan(2);
    expect(dialogBox.y).toBeGreaterThan(0);
  } else {
    expect(Math.round(dialogBox.width)).toBe(viewport.width);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  const bench = await addExercise(page, 'Bankdrücken (Langhantel)');
  await fillStepper(bench, 'Gewicht', '60');
  await fillStepper(bench, 'Wiederholungen', '10');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();

  // Pausen-Timer: direkt über der Leiste unten bzw. rechts der Seitenleiste
  const timer = page.getByRole('timer', { name: 'Pause' });
  await expect(timer).toBeVisible();
  const timerBox = (await timer.boundingBox())!;
  const navBox = (await nav(page).boundingBox())!;
  if (screen === 'desktop') {
    expect(Math.round(timerBox.x)).toBe(Math.round(navBox.width));
    expect(Math.round(timerBox.y + timerBox.height)).toBe(viewport.height);
  } else {
    expect(Math.round(timerBox.y + timerBox.height)).toBe(Math.round(navBox.y));
  }
  await skipRest(page);

  await page.getByRole('button', { name: 'Workout beenden' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page).toHaveURL(/#\/training\/history\/[\w-]+$/);
  const benchHeading = page.getByRole('heading', { level: 2, name: 'Bankdrücken (Langhantel)' });
  await expect(benchHeading).toBeVisible();

  const list = page.getByTestId('split-list');
  if (!large(screen)) {
    await expect(list).toHaveCount(0);
    return;
  }
  // Liste links mit markiertem Workout, Detail rechts ohne eigenes „Zurück“
  await expect(list.getByRole('heading', { level: 1, name: 'Verlauf' })).toBeVisible();
  const row = list.getByRole('list', { name: 'Workouts' }).getByRole('link').first();
  await expect(row).toHaveAttribute('aria-current', 'page');
  const detail = page.getByTestId('split-detail');
  await expect(detail.getByRole('link', { name: 'Zurück' })).toHaveCount(0);
  expect((await detail.boundingBox())!.x).toBeGreaterThan((await list.boundingBox())!.x);

  // Ohne Auswahl: Hinweis rechts; Antippen zeigt das Workout wieder daneben
  await list.getByRole('link', { name: 'Zurück' }).click();
  await page.getByRole('link', { name: /^Verlauf/ }).click();
  await expect(detail).toContainText('Workout auswählen');
  await row.click();
  await expect(detail.getByRole('heading', { name: 'Bankdrücken (Langhantel)' })).toBeVisible();
});

test('Übungen: Liste mit Detail daneben bzw. eigene Seite', async ({ page }, info) => {
  const screen = screenOf(info);
  await page.goto('./#/training/exercises');
  await page.getByRole('searchbox', { name: 'Übung suchen' }).fill('Klimmzüge');
  await page
    .getByRole('link', { name: /^Klimmzüge/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: /^Klimmzüge/ })).toBeVisible();
  if (large(screen)) {
    // Liste und Suche bleiben stehen
    await expect(page.getByRole('heading', { level: 1, name: 'Übungen' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Übung suchen' })).toHaveValue('Klimmzüge');
    // Mitlaufender Kopf erst nach dem Scrollen
    await expect(page.getByTestId('compact-header')).toHaveCount(0);
  } else {
    await expect(page.getByRole('heading', { level: 1, name: 'Übungen' })).toHaveCount(0);
  }
});

test('Info-Blatt: ab großer Breite mittig, sonst unten', async ({ page }, info) => {
  const screen = screenOf(info);
  await page.goto('./#/settings/training');
  await page.getByRole('main').getByRole('button', { name: 'Info: Puls' }).click();
  const sheet = page.getByRole('dialog', { name: 'Puls' });
  await expect(sheet).toBeVisible();
  const box = (await sheet.boundingBox())!;
  const viewport = page.viewportSize()!;
  const bottomGap = viewport.height - (box.y + box.height);
  if (large(screen)) {
    expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(2);
    expect(bottomGap).toBeGreaterThan(40);
  } else {
    expect(bottomGap).toBeLessThan(2);
  }
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
});

test('Manifest erlaubt Querformat', async ({ page }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await page.request.get(new URL(href!, page.url()).href)).json();
  expect(manifest.orientation).toBe('any');
});
