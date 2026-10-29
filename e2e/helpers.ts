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

export async function skipRest(page: Page) {
  const timer = page.getByRole('timer', { name: 'Pause' });
  await expect(timer).toBeVisible();
  await timer.getByRole('button', { name: 'Überspringen' }).click();
  await expect(timer).toHaveCount(0);
}
