import { offProductUrl, parseOffResponse, type OffResult } from '../../../domain/openFoodFacts';

const TIMEOUT_MS = 10_000;

export class OffRequestError extends Error {}

/**
 * Fragt ein Produkt bei Open Food Facts ab. Gesendet wird nur die Nummer (keine Cookies, kein
 * Referrer); der Service Worker cacht die Antwort nicht – gespeichert wird nur, was der Nutzer anlegt.
 */
export async function fetchOffProduct(code: string, signal?: AbortSignal): Promise<OffResult> {
  // Eigener Controller statt `AbortSignal.any`/`timeout` (ältere iOS-Versionen)
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);
  const forward = () => controller.abort();
  signal?.addEventListener('abort', forward);
  let response: Response;
  try {
    response = await fetch(offProductUrl(code), {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    throw new OffRequestError(
      timedOut
        ? 'Open Food Facts antwortet nicht. Später erneut versuchen.'
        : 'Keine Verbindung zu Open Food Facts.',
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forward);
  }
  // Unbekannte Produkte kommen als 404 mit `status: 0`
  if (response.status === 404) return { status: 'not-found' };
  if (!response.ok) {
    throw new OffRequestError(`Open Food Facts ist gerade nicht erreichbar (${response.status}).`);
  }
  try {
    return parseOffResponse(await response.json());
  } catch {
    throw new OffRequestError('Antwort von Open Food Facts nicht lesbar.');
  }
}
