import { expect, test } from '@playwright/test';
import { goOffline } from './helpers';

test('Übungen und Lebensmittel sind offline durchsuchbar', async ({ page, context }) => {
  await page.goto('./');
  await goOffline(page, context);

  await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText('Training').click();
  await page.getByRole('link', { name: /Übungen/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Übungen' })).toBeVisible();
  await expect(page.getByText(/^\d{3} Übungen$/)).toBeVisible();

  const exerciseSearch = page.getByRole('searchbox', { name: 'Übung suchen' });
  const exerciseList = page.getByRole('list', { name: 'Übungsliste' });
  for (const query of ['Bankdrücken', 'bankdrucken']) {
    await exerciseSearch.fill(query);
    await expect(exerciseList.getByRole('listitem').first()).toContainText(
      'Bankdrücken (Langhantel)',
    );
  }
  await exerciseSearch.fill('xyzxyz');
  await expect(page.getByText('Keine passenden Übungen.')).toBeVisible();
  await exerciseSearch.fill('');

  await page.goto('./#/daily/nutrition');
  await page.getByRole('link', { name: /Lebensmittel/ }).click();
  const foodSearch = page.getByRole('searchbox', { name: 'Lebensmittel suchen' });
  await foodSearch.fill('Haferflocken');
  const oats = page.getByRole('list', { name: 'Suchergebnisse' }).getByRole('listitem').first();
  await expect(oats).toContainText('Haferflocken');
  await expect(oats).toContainText(/\d+ kcal/);
});

test('Über & Lizenzen nennt die Datenquellen', async ({ page }) => {
  await page.goto('./#/settings');
  await page.getByRole('link', { name: /Über & Lizenzen/ }).click();
  await expect(page.getByText('free-exercise-db')).toBeVisible();
  await expect(page.getByText('USDA FoodData Central')).toBeVisible();
});
