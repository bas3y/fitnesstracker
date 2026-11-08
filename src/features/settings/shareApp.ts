/** Adresse der App ohne Seite und Daten (`#/…`), z. B. `https://…github.io/fitnesstracker/` */
export function appUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

export const SHARE_APP_TEXT =
  'Basey – Fitness & Lifestyle: Training, Ernährung und Alltag. Läuft ohne Internet, deine Daten bleiben auf deinem Handy.';

export type ShareLinkResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Teilen-Dialog des Handys, sonst Link in die Zwischenablage */
export async function shareAppLink(url = appUrl()): Promise<ShareLinkResult> {
  const data = { title: 'Basey', text: SHARE_APP_TEXT, url };
  if (navigator.share && (navigator.canShare?.(data) ?? true)) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // sonst kopieren
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** Läuft als installierte App (Startbildschirm) statt im Browser-Tab */
export function isInstalledApp(): boolean {
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  return standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
}
