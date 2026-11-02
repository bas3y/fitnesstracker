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

/** Griff per Maus auf die Mitte der Zielzeile ziehen */
export async function dragTo(page: Page, handle: Locator, target: Locator): Promise<void> {
  // Mittig, damit die fixierte Navigation den Griff nicht verdeckt
  await handle.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  const from = (await handle.boundingBox())!;
  const x = from.x + from.width / 2;
  await page.mouse.move(x, from.y + from.height / 2);
  await page.mouse.down();
  // Beim Ziehen kann das Layout zusammenklappen, Griff und Ziel also erst danach messen
  const start = from.y + from.height / 2 + 2;
  await page.mouse.move(x, start);
  const current = (await handle.boundingBox())!;
  const to = (await target.boundingBox())!;
  // Die Zeile bewegt sich um die Strecke des Zeigers, ihre Mitte muss über die Mitte des Ziels
  const goal = to.y + to.height * (to.y > current.y ? 0.75 : 0.25);
  await page.mouse.move(x, start + goal - (current.y + current.height / 2), { steps: 10 });
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
