/**
 * Lädt die App neu. Wartet schon eine neue Version (Service Worker), wird sie zuerst aktiviert –
 * sonst käme nach dem Neuladen wieder der alte Stand aus dem Cache.
 */
export async function reloadApp(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    const waiting = registration?.waiting;
    if (waiting) {
      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 3000);
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.clearTimeout(timeout);
          resolve();
        });
        waiting.postMessage({ type: 'SKIP_WAITING' });
      });
    }
  } catch {
    // Ohne Service Worker einfach neu laden
  }
  window.location.reload();
}
