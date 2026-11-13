import { test as base, expect } from '@playwright/test';

export * from '@playwright/test';

declare global {
  interface Window {
    __reportCspViolation?: (text: string) => void;
    __hideDayHint?: boolean;
  }
}

/**
 * Wie `test` aus Playwright, aber jeder Test schlägt fehl, sobald die Content-Security-Policy
 * etwas blockiert (Skripte, Verbindungen, Bilder, `eval` …). Gilt für den Kontext des Tests,
 * nicht für selbst geöffnete Kontexte (`browser.newContext()`).
 */
export const test = base.extend<{ cspGuard: void; dayHint: boolean; dayHintGuard: void }>({
  /**
   * Der Tageshinweis der Startseite hängt von der Uhrzeit ab (morgens/abends) und nennt Namen von
   * Gewohnheiten usw. – in E2E deshalb aus, außer mit `test.use({ dayHint: true })`
   */
  dayHint: [false, { option: true }],
  dayHintGuard: [
    async ({ context, dayHint }, use) => {
      if (!dayHint) {
        await context.addInitScript(() => {
          window.__hideDayHint = true;
        });
      }
      await use();
    },
    { auto: true },
  ],
  cspGuard: [
    async ({ context }, use) => {
      const violations: string[] = [];
      await context.exposeBinding('__reportCspViolation', (_source, text: string) => {
        violations.push(text);
      });
      await context.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (event) => {
          window.__reportCspViolation?.(
            `${event.effectiveDirective} blockiert ${event.blockedURI || '(inline)'} in ${event.sourceFile}:${event.lineNumber}`,
          );
        });
      });
      context.on('console', (message) => {
        if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
      });
      await use();
      expect(violations, 'Verstöße gegen die Content-Security-Policy').toEqual([]);
    },
    { auto: true },
  ],
});
