// Mit Dateiendungen importieren: vite.config.ts lädt diese Datei direkt (ohne Bundler)

/** Einzige Online-Adresse der App (Strichcode-Abfrage, Schritt 15c) */
export const OPEN_FOOD_FACTS_ORIGIN = 'https://world.openfoodfacts.org';

/**
 * Content-Security-Policy der App. Skripte nur aus der App selbst (Inline-Skripte nur per
 * Prüfsumme), Stile inline erlaubt (Ladebildschirm, `style`-Attribute in SVG/Recharts).
 * `frame-ancestors`, HSTS und `report-to` gehen nur als HTTP-Header (ab Schritt 23 per Hosting).
 */
export function contentSecurityPolicy(scriptHashes: readonly string[]): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", ...scriptHashes.map((hash) => `'sha256-${hash}'`)],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'media-src': ["'self'", 'blob:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", OPEN_FOOD_FACTS_ORIGIN],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'self'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}

/** Inhalte aller `<script>` ohne `src` (genau so, wie sie im HTML stehen) */
export function inlineScripts(html: string): string[] {
  const scripts: string[] = [];
  for (const [, attributes = '', content = ''] of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
  )) {
    if (!/\bsrc\s*=/i.test(attributes)) scripts.push(content);
  }
  return scripts;
}

export async function sha256Base64(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Setzt die Policy als `<meta>` direkt hinter `<meta charset>` (gilt erst ab dieser Stelle,
 * muss also vor allen Skripten stehen). Für den Build; im Entwicklungsserver fehlt sie, weil
 * Vite dort eigene Inline-Skripte einfügt.
 */
export async function withContentSecurityPolicy(html: string): Promise<string> {
  const hashes = await Promise.all(inlineScripts(html).map(sha256Base64));
  const meta = `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(hashes)}" />`;
  const charset = /<meta charset="[^"]*"\s*\/?>/i;
  if (!charset.test(html))
    throw new Error('index.html braucht <meta charset> am Anfang von <head>');
  return html.replace(charset, (tag) => `${tag}\n    ${meta}`);
}
