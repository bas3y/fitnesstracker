import type { BrowserContext, Page } from '@playwright/test';

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
