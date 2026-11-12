// Bewusst ohne `./fixtures`: Hier werden Verstöße absichtlich ausgelöst
import { expect, test } from '@playwright/test';

test('Content-Security-Policy blockiert eingeschleuste Skripte, Handler und fremde Adressen', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /Heute|Hallo/ })).toBeVisible();

  const result = await page.evaluate(async () => {
    const violations: string[] = [];
    document.addEventListener('securitypolicyviolation', (event) =>
      violations.push(event.effectiveDirective),
    );
    const flags = window as unknown as Record<string, boolean>;

    const script = document.createElement('script');
    script.textContent = 'window.injected = true;';
    document.body.append(script);

    // Typischer XSS-Weg: Event-Handler im eingeschleusten HTML
    // (`page.evaluate` selbst ist von der Policy ausgenommen, `eval` lässt sich so nicht prüfen)
    const holder = document.createElement('div');
    // nosemgrep: absichtlich eingeschleust, die Policy muss es blockieren
    holder.innerHTML = '<img src="data:," onerror="window.handler = true">';
    document.body.append(holder);

    let fetchBlocked = false;
    try {
      await fetch('https://example.com/');
    } catch {
      fetchBlocked = true;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      injected: flags.injected === true,
      handler: flags.handler === true,
      fetchBlocked,
      violations,
    };
  });

  expect(result).toMatchObject({
    injected: false,
    handler: false,
    fetchBlocked: true,
  });
  expect(result.violations).toEqual(
    expect.arrayContaining(['script-src-elem', 'script-src-attr', 'connect-src']),
  );
});
