// @vitest-environment node
import {
  contentSecurityPolicy,
  inlineScripts,
  sha256Base64,
  withContentSecurityPolicy,
} from './csp';

const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <script>var a = 1;</script>
    <script type="module" crossorigin src="./assets/index.js"></script>
  </head>
  <body>
    <script>
      (function () {})();
    </script>
  </body>
</html>`;

describe('Content-Security-Policy', () => {
  it('erlaubt nur eigene Skripte, eigene Verbindungen und Open Food Facts', () => {
    const policy = contentSecurityPolicy(['abc=']);
    expect(policy).toContain("script-src 'self' 'sha256-abc='");
    expect(policy).toContain("connect-src 'self' https://world.openfoodfacts.org");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).not.toContain('unsafe-eval');
    expect(policy).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(policy).not.toMatch(/(^|\s)\*(\s|;|$)/);
  });

  it('findet nur Inline-Skripte, mit genau ihrem Inhalt', () => {
    expect(inlineScripts(html)).toEqual(['var a = 1;', '\n      (function () {})();\n    ']);
  });

  it('berechnet SHA-256 als Base64', async () => {
    expect(await sha256Base64('')).toBe('47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=');
  });

  it('setzt die Policy vor das erste Skript, mit den Prüfsummen aller Inline-Skripte', async () => {
    const result = await withContentSecurityPolicy(html);
    const metaAt = result.indexOf('http-equiv="Content-Security-Policy"');
    expect(metaAt).toBeGreaterThan(result.indexOf('<meta charset'));
    expect(metaAt).toBeLessThan(result.indexOf('<script'));
    for (const script of inlineScripts(html)) {
      expect(result).toContain(`'sha256-${await sha256Base64(script)}'`);
    }
    await expect(withContentSecurityPolicy('<html></html>')).rejects.toThrow('charset');
  });
});
