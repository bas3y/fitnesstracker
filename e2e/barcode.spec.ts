import { expect, test, type Page } from '@playwright/test';
import { fillStepper, goOffline } from './helpers';

const CODE = '4006381333931';
const UNKNOWN = '96385074';
const OFF_URL = 'https://world.openfoodfacts.org/**';

const SKYR = {
  code: CODE,
  status: 1,
  product: {
    product_name_de: 'Skyr natur',
    brands: 'Milbona',
    categories_tags: ['en:dairies'],
    serving_quantity: 150,
    serving_quantity_unit: 'g',
    nutriments: {
      'energy-kcal_100g': 63,
      proteins_100g: 11,
      carbohydrates_100g: 4,
      sugars_100g: 4,
      fat_100g: 0.2,
    },
  },
};

async function enterCode(page: Page, code: string) {
  await page.getByLabel('Strichcode-Nummer').fill(code);
  await page.getByRole('button', { name: 'Übernehmen' }).click();
}

test('Strichcode: online bei Open Food Facts suchen, speichern und offline wiederfinden', async ({
  page,
  context,
}) => {
  const requests: Array<{ url: string; cookie: string | undefined }> = [];
  await page.route(OFF_URL, async (route) => {
    requests.push({ url: route.request().url(), cookie: route.request().headers().cookie });
    await route.fulfill({ json: SKYR });
  });

  await page.goto('./#/daily/foods');
  await page.getByRole('link', { name: 'Strichcode scannen' }).click();
  await expect(page.getByRole('heading', { name: 'Strichcode scannen' })).toBeVisible();

  // Prüfziffer falsch → Hinweis, keine Anfrage
  await enterCode(page, '4006381333932');
  await expect(page.getByText(/Ungültige Nummer/)).toBeVisible();
  await enterCode(page, CODE);

  await expect(
    page.getByText('Werte von Open Food Facts – bitte mit der Verpackung'),
  ).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Skyr natur (Milbona)');
  await expect(page.getByLabel('Strichcode (optional)')).toHaveValue(CODE);
  await fillStepper(page.locator('form'), 'Brennwert', '64');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(page.getByRole('heading', { name: 'Skyr natur (Milbona)' })).toBeVisible();
  await expect(page.getByText('Milch & Käse · Werte von Open Food Facts')).toBeVisible();
  await expect(page.getByText('Strichcode 4 006381 333931')).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0]!.url).toContain(`/api/v2/product/${CODE}.json?fields=`);
  expect(requests[0]!.cookie).toBeUndefined();

  // Offline: gespeicherter Strichcode wird ohne Anfrage gefunden
  await goOffline(page, context);
  await page.goto('./#/daily/nutrition');
  await page.getByRole('button', { name: 'Frühstück: hinzufügen' }).click();
  const picker = page.getByRole('dialog');
  await expect(picker.getByText(/Ohne Internet nur gespeicherte Strichcodes/)).toBeVisible();
  await picker.getByRole('button', { name: 'Strichcode scannen' }).click();
  await enterCode(page, CODE);
  await expect(picker.getByRole('heading', { name: 'Skyr natur (Milbona)' })).toBeVisible();
  await picker.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(picker.getByRole('status')).toContainText('Hinzugefügt: Skyr natur (Milbona)');

  // Offline unbekannt: Open Food Facts ausgegraut, selbst eintragen
  await picker.getByRole('button', { name: 'Strichcode scannen' }).click();
  await enterCode(page, UNKNOWN);
  await expect(picker.getByText(/noch nicht gespeichert/)).toBeVisible();
  await expect(picker.getByRole('button', { name: 'Nur mit Internet' })).toBeDisabled();
  await picker.getByRole('button', { name: 'Selbst eintragen' }).click();
  await expect(picker.getByLabel('Strichcode (optional)')).toHaveValue(UNKNOWN);
  await picker.getByLabel('Name', { exact: true }).fill('Riegel Testmarke');
  await fillStepper(picker, 'Brennwert', '420');
  await picker.getByRole('button', { name: 'Speichern und auswählen' }).click();
  await expect(picker.getByRole('heading', { name: 'Riegel Testmarke' })).toBeVisible();
  await picker.getByRole('button', { name: 'Zurück' }).click();

  // Suche über die Nummer
  await picker.getByRole('searchbox', { name: 'Lebensmittel suchen' }).fill(CODE);
  await expect(picker.getByRole('list', { name: 'Suchergebnisse' })).toContainText('Skyr natur');
  await picker.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByRole('button', { name: /^Skyr natur \(Milbona\) \d/ })).toBeVisible();
  expect(requests).toHaveLength(1);

  // Zurück online: unbekannter Strichcode wird jetzt abgefragt
  await context.setOffline(false);
  await page.goto('./#/daily/foods/scan');
  await enterCode(page, '0036000291452');
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Skyr natur (Milbona)');
  expect(requests).toHaveLength(2);
});

test('Strichcode: nicht gefunden und Fehler bei Open Food Facts', async ({ page }) => {
  let fail = true;
  await page.route(OFF_URL, (route) =>
    fail
      ? route.fulfill({ status: 503, body: 'down' })
      : route.fulfill({ status: 404, json: { status: 0, status_verbose: 'product not found' } }),
  );
  await page.goto('./#/daily/foods/scan');
  await enterCode(page, CODE);
  await expect(page.getByText('Open Food Facts ist gerade nicht erreichbar (503).')).toBeVisible();

  fail = false;
  await page.getByRole('button', { name: 'Bei Open Food Facts suchen' }).click();
  await expect(page.getByText(/Bei Open Food Facts nicht gefunden/)).toBeVisible();
  await expect(page.getByLabel('Strichcode (optional)')).toHaveValue(CODE);
  await page.getByLabel('Name', { exact: true }).fill('Hausmarke Skyr');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: 'Hausmarke Skyr' })).toBeVisible();
  await expect(page.getByText('Werte von Open Food Facts')).toHaveCount(0);
});
