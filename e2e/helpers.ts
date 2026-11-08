import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test';

/** Wartet, bis der Service Worker die Seite kontrolliert, und schaltet dann offline */
export async function goOffline(page: Page, context: BrowserContext): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) {
    await page.reload();
  }
  await context.setOffline(true);
}

/** Rückfrage vor dem Start eines Trainings bestätigen */
export async function confirmStart(page: Page): Promise<void> {
  await page.getByRole('alertdialog').getByRole('button', { name: 'Starten' }).click();
}

/** Zeile am Griff per Maus auf die Position der Zielzeile ziehen */
export async function dragTo(page: Page, handle: Locator, target: Locator): Promise<void> {
  // Mittig, damit die fixierte Navigation den Griff nicht verdeckt
  await handle.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  const from = (await handle.boundingBox())!;
  const x = from.x + from.width / 2;
  const start = from.y + from.height / 2;
  const row = (await handle.locator('xpath=ancestor::li[@data-sort-id][1]').boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(x, start);
  await page.mouse.down();
  // Die Zeile bewegt sich um die Strecke des Zeigers; getauscht wird, sobald ihre Kante die Mitte
  // des Ziels überquert (nach oben die Oberkante, nach unten die Unterkante)
  const delta =
    to.y > row.y ? to.y + to.height * 0.75 - (row.y + row.height) : to.y + to.height * 0.25 - row.y;
  await page.mouse.move(x, start + delta, { steps: 10 });
  await page.mouse.up();
}

/** Übung im laufenden Workout per Picker hinzufügen; gibt die Karte der Übung zurück */
export async function addExercise(page: Page, name: string) {
  await page.getByRole('button', { name: '+ Übung hinzufügen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Übung hinzufügen' });
  await dialog.getByRole('searchbox', { name: 'Übung suchen' }).fill(name);
  await dialog
    .getByRole('button', { name: new RegExp(`^${name.replace(/[()]/g, '\\$&')}`) })
    .first()
    .click();
  await expect(dialog).toHaveCount(0);
  return page.getByRole('region', { name });
}

export async function fillStepper(card: Locator, label: string, value: string) {
  const input = card.getByLabel(label, { exact: true });
  await input.fill(value);
  await input.press('Enter');
}

/** Kachel auf der Alltag-Übersicht (Name steht vor dem Tagesstand) */
export function dailyTile(page: Page, name: string): Locator {
  return page
    .getByRole('list', { name: 'Bereiche' })
    .getByRole('link', { name: new RegExp(`^${name}`) });
}

export async function skipRest(page: Page) {
  const timer = page.getByRole('timer', { name: 'Pause' });
  await expect(timer).toBeVisible();
  await timer.getByRole('button', { name: 'Überspringen' }).click();
  await expect(timer).toHaveCount(0);
}

/** Symbol im Formular wählen (Fenster „Symbol wählen“) */
export async function chooseIcon(page: Page, label: string) {
  await page.getByRole('button', { name: /Symbol ändern/ }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: `Symbol ${label}`, exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
