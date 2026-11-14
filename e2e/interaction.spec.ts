import { expect, test, type Page } from './fixtures';
import { goOffline, setScrollTop } from './helpers';

const nav = (page: Page) => page.getByRole('navigation', { name: 'Hauptnavigation' });

async function start(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
}

test('Navigation zeigt den Bereich, Leiste bleibt unten, Artwork im Kopf (offline)', async ({
  page,
  context,
}) => {
  await start(page);
  await goOffline(page, context);

  // Artwork der Palette leicht hinter dem Kopf
  const artwork = page.locator('.page-artwork img');
  await expect(artwork).toHaveAttribute('src', /splash-basey\.webp$/);
  await expect
    .poll(() => artwork.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);

  await expect(nav(page).getByRole('link', { name: 'Heute' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.goto('./#/training/plans');
  await expect(page.getByRole('heading', { level: 1, name: 'Trainingspläne' })).toBeVisible();
  // Auch auf Unterseiten ist der Bereich markiert
  await expect(nav(page).getByRole('link', { name: 'Training' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(nav(page).getByRole('link', { name: 'Heute' })).not.toHaveAttribute(
    'aria-current',
    'page',
  );

  // Nur der Inhaltsbereich scrollt, die Leiste bleibt am unteren Rand
  await page.goto('./#/training/exercises');
  await expect(page.locator('a[href^="#/training/exercises/"]').nth(40)).toBeAttached();
  await setScrollTop(page, 100_000);
  const viewport = page.viewportSize()!;
  const box = (await nav(page).boundingBox())!;
  expect(Math.abs(box.y + box.height - viewport.height)).toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(
      () => document.scrollingElement!.scrollHeight <= document.scrollingElement!.clientHeight,
    ),
  ).toBe(true);
});

test('Mitlaufender Kopf mit Anpassen-Stift beim Scrollen (offline)', async ({ page, context }) => {
  await start(page);
  await goOffline(page, context);
  const compact = page.getByTestId('compact-header');
  await expect(compact).toHaveCount(0);

  // Anpassen-Modus ist lang (Vorschau aller Widgets)
  await page.getByRole('button', { name: 'Anpassen' }).click();
  await expect(page.getByRole('button', { name: 'Fertig' })).toHaveCount(1);
  await setScrollTop(page, 100_000);
  await expect(compact).toBeVisible();
  await expect(compact).toContainText('Heute');
  // Der Stift ist nur einmal bedienbar: im mitlaufenden Kopf
  await expect(page.getByRole('button', { name: 'Fertig' })).toHaveCount(1);
  await compact.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByRole('button', { name: 'Anpassen' })).toHaveCount(1);

  // Unterseite: mitlaufender Kopf mit Zurück
  await page.goto('./#/training/exercises');
  await expect(page.locator('a[href^="#/training/exercises/"]').nth(40)).toBeAttached();
  await expect(compact).toHaveCount(0);
  await setScrollTop(page, 2000);
  await expect(compact).toContainText('Übungen');
  await setScrollTop(page, 0);
  await expect(compact).toHaveCount(0);
});

test('Wasser-Balken antippen und für gestern nachtragen (offline)', async ({ page, context }) => {
  await start(page);
  await goOffline(page, context);

  await page.getByRole('button', { name: 'Anpassen' }).click();
  await page.getByRole('button', { name: 'Wasser hinzufügen' }).click();
  await page
    .getByRole('group', { name: 'Größe: Wasser' })
    .getByRole('button', { name: 'Groß' })
    .click();
  await page.getByRole('button', { name: 'Fertig' }).click();

  const widget = page.locator('[data-widget="water"]');
  const bars = widget.getByRole('list', { name: 'Wasser der letzten 7 Tage' }).getByRole('button');
  await expect(bars).toHaveCount(7);
  const peek = widget.getByTestId('day-peek');
  // Startet auf heute
  await expect(bars.nth(6)).toHaveAttribute('aria-pressed', 'true');
  await expect(peek).toContainText('Heute');
  await expect(peek).toContainText('nichts eingetragen');

  await bars.nth(5).click();
  await expect(bars.nth(5)).toHaveAttribute('aria-pressed', 'true');
  await expect(peek).toContainText('Gestern');
  await peek.getByRole('button', { name: '+250 ml' }).click();
  await expect(peek).toContainText('0,25 l von 2,5 l · noch 2,25 l');
  // Heute bleibt unverändert
  await expect(widget).toContainText('–');
  await expect(peek.getByRole('link', { name: 'Ändern' })).toHaveAttribute(
    'href',
    /#\/daily\/body\?date=\d{4}-\d{2}-\d{2}$/,
  );

  // Mit der Tastatur zurück zu heute
  await bars.nth(5).press('ArrowRight');
  await expect(bars.nth(6)).toBeFocused();
  await expect(peek).toContainText('Heute');
});

test.describe('Tageshinweis', () => {
  test.use({ dayHint: true });

  test('abends Tagesbilanz, wegtippen hält bis zur nächsten Tageszeit (offline)', async ({
    page,
    context,
  }) => {
    await page.clock.install({ time: new Date('2026-11-13T20:00:00') });
    await start(page);
    await goOffline(page, context);

    const hint = page.getByTestId('day-hint');
    await expect(hint.getByRole('heading', { name: 'Deine Tagesbilanz' })).toBeVisible();
    await expect(hint).toContainText('Heute noch keine Mahlzeit eingetragen.');
    await expect(hint).toContainText('Wasser: noch 2,5 l bis zum Ziel.');
    await expect(hint.getByRole('link', { name: 'Zur Ernährung' })).toHaveAttribute(
      'href',
      '#/daily/nutrition',
    );
    // Steht ganz oben
    await expect(page.locator('[data-widget]').first()).toHaveAttribute('data-widget', 'dayHint');

    await hint.getByRole('button', { name: 'Tageshinweis ausblenden' }).click();
    await expect(hint).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Heute' })).toBeVisible();
    await expect(page.locator('[data-widget]').first()).not.toHaveAttribute(
      'data-widget',
      'dayHint',
    );
  });
});

test('Anpassen: Widgets filtern, kleine nebeneinander und seitlich tauschen (offline)', async ({
  page,
  context,
}) => {
  await start(page);
  await goOffline(page, context);
  await page.getByRole('button', { name: 'Anpassen' }).click();

  const more = page.getByRole('list', { name: 'Weitere Widgets' });
  const bereich = page.getByRole('group', { name: 'Bereich' });
  await bereich.getByRole('button', { name: 'Ziele & Erfolge' }).click();
  await expect(more.getByRole('button')).toHaveText([/Ziele/, /Serien & Abzeichen/]);
  await bereich.getByRole('button', { name: 'Alle' }).click();
  await page.getByLabel('Widgets suchen').fill('wass');
  await expect(more.getByRole('button')).toHaveText([/Wasser/]);
  await more.getByRole('button', { name: 'Wasser hinzufügen' }).click();
  await expect(page.getByText('Kein Widget gefunden.')).toBeVisible();
  await page.getByLabel('Widgets suchen').fill('');
  await more.getByRole('button', { name: 'Schritte hinzufügen' }).click();

  // Wasser und Schritte klein: schon beim Bearbeiten nebeneinander
  for (const name of ['Wasser', 'Schritte']) {
    await page
      .getByRole('group', { name: `Größe: ${name}` })
      .getByRole('button', { name: 'Klein' })
      .click();
  }
  const list = page.getByRole('list', { name: 'Widgets', exact: true });
  const water = list.locator(':scope > li[data-sort-id="water"]');
  const steps = list.locator(':scope > li[data-sort-id="steps"]');
  await steps.scrollIntoViewIfNeeded();
  const waterBox = (await water.boundingBox())!;
  const stepsBox = (await steps.boundingBox())!;
  expect(Math.abs(waterBox.y - stepsBox.y)).toBeLessThan(2);
  expect(stepsBox.x).toBeGreaterThan(waterBox.x + waterBox.width - 1);

  // Schritte seitlich auf den Platz von Wasser ziehen
  const handle = page.getByRole('button', { name: 'Schritte verschieben' });
  const from = (await handle.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(waterBox.x + waterBox.width / 2, waterBox.y + waterBox.height / 2, {
    steps: 10,
  });
  await page.mouse.up();
  await expect
    .poll(async () => (await steps.boundingBox())!.x)
    .toBeLessThan((await water.boundingBox())!.x);

  // Auf der Startseite in derselben Reihenfolge nebeneinander
  await page.getByRole('button', { name: 'Fertig' }).click();
  const small = page.locator('[data-widget="steps"], [data-widget="water"]');
  await expect(small).toHaveCount(2);
  await expect(small.first()).toHaveAttribute('data-widget', 'steps');
  const a = (await small.first().boundingBox())!;
  const b = (await small.last().boundingBox())!;
  expect(Math.abs(a.y - b.y)).toBeLessThan(2);
});
