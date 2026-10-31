import { expect, test, type Page } from '@playwright/test';
import { dragTo, fillStepper, goOffline } from './helpers';

const card = (page: Page, name: string) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name, exact: true }) });

const checkbox = (page: Page, name: string) => page.getByRole('checkbox', { name, exact: true });

async function addHabit(page: Page, name: string, fill?: () => Promise<void>) {
  await page.getByRole('link', { name: '+ Neue Gewohnheit' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await fill?.();
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();
}

test('Gewohnheiten anlegen, abhaken, Streak und Kalender (offline)', async ({ page, context }) => {
  await page.goto('./#/daily');
  await goOffline(page, context);
  await page.reload();

  // Ohne Gewohnheiten keine Checkliste
  await expect(page.getByRole('heading', { name: 'Heute' })).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0);

  await page.getByRole('link', { name: /^Gewohnheiten/ }).click();
  await expect(page.getByText('Noch keine Gewohnheiten.')).toBeVisible();

  await addHabit(page, 'Meditieren', async () => {
    await page
      .getByRole('group', { name: 'Gruppe' })
      .getByRole('button', { name: 'Morgen' })
      .click();
    await page.getByRole('button', { name: 'Symbol 🧘' }).click();
  });
  await addHabit(page, 'Laufen gehen', async () => {
    await page
      .getByRole('group', { name: 'Häufigkeit' })
      .getByRole('button', { name: 'Pro Woche' })
      .click();
    await fillStepper(page.locator('body'), 'Mal pro Woche', '2');
  });
  await addHabit(page, 'Lesen', async () => {
    await page
      .getByRole('group', { name: 'Gruppe' })
      .getByRole('button', { name: 'Abend' })
      .click();
  });

  // Wochentage: Pflichtfeld, und die Gewohnheit steht nur an diesem Tag an
  await page.getByRole('link', { name: '+ Neue Gewohnheit' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Nur heute fällig');
  await page
    .getByRole('group', { name: 'Häufigkeit' })
    .getByRole('button', { name: 'Wochentage' })
    .click();
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByRole('alert')).toHaveText('Mindestens einen Wochentag wählen');
  const weekday = await page.evaluate(() =>
    new Date().toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2),
  );
  await page
    .getByRole('group', { name: 'Wochentage' })
    .getByRole('button', { name: weekday })
    .click();
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByRole('link', { name: /Nur heute fällig/ })).toBeVisible();

  // Reihenfolge ändern
  const list = page.getByRole('list', { name: 'Gewohnheiten' });
  await dragTo(
    page,
    list.getByRole('button', { name: 'Lesen verschieben' }),
    list.getByRole('listitem').first(),
  );
  await expect(list.getByRole('listitem').first()).toContainText('Lesen');

  // Checklisten je Gruppe
  await page.getByRole('link', { name: '‹ Zurück' }).click();
  const morning = card(page, 'Morgenroutine');
  await expect(morning.getByText('0 von 1 erledigt')).toBeVisible();
  await expect(card(page, 'Abendroutine').getByRole('checkbox')).toHaveCount(1);
  await expect(card(page, 'Gewohnheiten').getByRole('checkbox')).toHaveCount(2);

  await checkbox(page, 'Meditieren').click();
  await expect(checkbox(page, 'Meditieren')).toHaveAttribute('aria-checked', 'true');
  await expect(morning.getByText('1 von 1 erledigt')).toBeVisible();
  await expect(morning.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await expect(morning.getByText('🔥 1 Tag')).toBeVisible();

  await checkbox(page, 'Laufen gehen').click();
  await expect(page.getByText('1 von 2 diese Woche')).toBeVisible();

  // Abhaken wieder zurücknehmen
  await checkbox(page, 'Lesen').click();
  await checkbox(page, 'Lesen').click();
  await expect(checkbox(page, 'Lesen')).toHaveAttribute('aria-checked', 'false');

  // Nachtrag für gestern verlängert den Streak; die Wochentags-Gewohnheit steht gestern nicht an
  await page.getByRole('button', { name: 'Vorheriger Tag' }).click();
  await expect(page.getByRole('heading', { name: 'Gestern' })).toBeVisible();
  await expect(checkbox(page, 'Nur heute fällig')).toHaveCount(0);
  await expect(checkbox(page, 'Meditieren')).toHaveAttribute('aria-checked', 'false');
  await checkbox(page, 'Meditieren').click();
  await expect(morning.getByText('🔥 2 Tage')).toBeVisible();

  // Bleibt nach dem Neuladen erhalten
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Gestern' })).toBeVisible();
  await expect(checkbox(page, 'Meditieren')).toHaveAttribute('aria-checked', 'true');

  // Detailseite über die Zeile; „Zurück“ führt zum gewählten Tag
  await page.getByRole('link', { name: 'Details: Meditieren' }).click();
  await expect(page.getByRole('heading', { name: '🧘 Meditieren' })).toBeVisible();
  const stats = page.getByTestId('habit-stats');
  await expect(stats).toContainText('Aktuell');
  await expect(stats.getByRole('definition').first()).toHaveText('2 Tage');

  // Kalender: Heute antippen nimmt den Tag zurück, der Streak bleibt bei 1
  const calendar = page.getByRole('group', { name: 'Kalender' });
  const todayLabel = await page.evaluate(() => {
    const date = new Date();
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
  const today = calendar.getByRole('button', { name: new RegExp(todayLabel) });
  await expect(today).toHaveAttribute('aria-pressed', 'true');
  await today.click();
  await expect(today).toHaveAttribute('aria-pressed', 'false');
  await expect(stats.getByRole('definition').first()).toHaveText('1 Tag');
  await today.click();
  await expect(stats.getByRole('definition').first()).toHaveText('2 Tage');

  await expect(page.getByRole('button', { name: 'Nächster Monat' })).toBeDisabled();
  await page.getByRole('button', { name: 'Vorheriger Monat' }).click();
  await expect(page.getByRole('button', { name: 'Nächster Monat' })).toBeEnabled();
  await page.getByRole('button', { name: 'Nächster Monat' }).click();
  await expect(today).toBeVisible();

  await page.getByRole('link', { name: '‹ Zurück' }).click();
  await expect(page.getByRole('heading', { name: 'Gestern' })).toBeVisible();

  // Bearbeiten: Umbenennen und in eine andere Gruppe verschieben
  await page.getByRole('link', { name: 'Details: Meditieren' }).click();
  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Atemübung');
  await page.getByRole('group', { name: 'Gruppe' }).getByRole('button', { name: 'Abend' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: '🧘 Atemübung' })).toBeVisible();
  await expect(stats.getByRole('definition').first()).toHaveText('2 Tage');

  // Löschen mit Rückfrage
  await page.getByRole('button', { name: 'Gewohnheit löschen' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click();
  await expect(page.getByRole('heading', { name: 'Gewohnheiten' })).toBeVisible();
  await expect(list.getByRole('listitem')).toHaveCount(3);

  await list.getByRole('button', { name: 'Lesen löschen' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await page.reload();
  await expect(list.getByRole('listitem')).toHaveCount(2);
});
