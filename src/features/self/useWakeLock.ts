import { useEffect } from 'react';

/**
 * Hält den Bildschirm an, solange `active` (z. B. damit der Gong am Ende klingelt). Der Browser
 * gibt die Sperre beim Wechsel in den Hintergrund frei; beim Zurückkehren wird sie erneuert.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = () => {
      if (document.visibilityState !== 'visible') return;
      navigator.wakeLock
        .request('screen')
        .then((lock) => {
          if (cancelled) void lock.release();
          else sentinel = lock;
        })
        .catch(() => undefined);
    };
    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', request);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
