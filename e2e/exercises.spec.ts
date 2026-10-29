import { expect, test } from '@playwright/test';
import { goOffline } from './helpers';

test('Übungen verwalten: eigene Übung, Favorit, Ausblenden, Löschen (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/training/exercises');
  await goOffline(page, context);
  const list = page.getByRole('list', { name: 'Übungsliste' });
  await expect(list.getByRole('listitem').first()).toBeVisible();

  // Eigene Übung anlegen
  await page.getByRole('link', { name: '+ Eigene Übung' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Hip Thrust Maschine');
  await page.getByLabel('Equipment').selectOption('machine');
  await page
    .getByRole('group', { name: 'Hauptmuskeln' })
    .getByRole('button', { name: 'Gesäß' })
    .click();
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Hip Thrust Maschine' })).toBeVisible();
  await expect(page.getByText('Eigene Übung', { exact: true })).toBeVisible();

  // Bearbeiten
  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Hip Thrust (Maschine)');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Hip Thrust (Maschine)' }),
  ).toBeVisible();
  await page.getByLabel('Eigene Notiz').fill('Polster Stufe 2');
  await page.getByRole('button', { name: 'Als Favorit markieren' }).click();
  await expect(page.getByRole('button', { name: 'Favorit entfernen' })).toBeVisible();

  // In der Liste: Filter „Eigene“, Favorit steht oben
  await page.getByRole('link', { name: 'Zurück' }).click();
  await expect(list.getByRole('listitem').first()).toContainText('Hip Thrust (Maschine)');
  await page.getByRole('button', { name: 'Eigene', exact: true }).click();
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await page.getByRole('button', { name: 'Eigene', exact: true }).click();

  // Mitgelieferte Übung ausblenden und wieder einblenden
  const search = page.getByRole('searchbox', { name: 'Übung suchen' });
  await search.fill('Bankdrücken (Langhantel)');
  await list.getByRole('link', { name: /^Bankdrücken \(Langhantel\)/ }).click();
  await expect(page.getByText('Mitgeliefert', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Löschen' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ausblenden' }).click();
  await expect(page.getByRole('button', { name: 'Wieder einblenden' })).toBeVisible();
  await page.getByRole('link', { name: 'Zurück' }).click();
  await expect(search).toHaveValue('Bankdrücken (Langhantel)');
  await expect(list.getByRole('link', { name: /^Bankdrücken \(Langhantel\)/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Filter' }).click();
  await page.getByLabel('Ausgeblendete anzeigen').check();
  await expect(list.getByRole('link', { name: /^Bankdrücken \(Langhantel\)/ })).toContainText(
    'Ausgeblendet',
  );

  // Nach Neuladen sind alle Änderungen noch da
  await page.reload();
  await page.getByRole('button', { name: 'Favorit: Hip Thrust (Maschine)' }).waitFor();
  await expect(
    page.getByRole('button', { name: 'Favorit: Hip Thrust (Maschine)' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await list.getByRole('link', { name: /Hip Thrust \(Maschine\)/ }).click();
  await expect(page.getByLabel('Eigene Notiz')).toHaveValue('Polster Stufe 2');

  // Eigene Übung löschen
  await page.getByRole('button', { name: 'Löschen' }).click();
  await page.getByRole('button', { name: 'Endgültig löschen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Übungen' })).toBeVisible();
  await search.fill('Hip Thrust (Maschine)');
  await expect(list.getByRole('link', { name: /Hip Thrust \(Maschine\)/ })).toHaveCount(0);
});
