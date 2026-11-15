import { useEffect, useSyncExternalStore } from 'react';
import { Icon, TrophyIcon } from './icons';
import { getToast, hideToast, subscribeToast } from './toastStore';

const VISIBLE_MS = 5000;

/** Im Layout eingehängt; Antippen schließt den Hinweis */
export function ToastHost() {
  const toast = useSyncExternalStore(subscribeToast, getToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => hideToast(toast.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-0 right-0 left-(--nav-left) z-40 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]"
    >
      {toast && (
        <button
          key={toast.id}
          type="button"
          aria-label={`${toast.title}: ${toast.lines.join(', ')} – schließen`}
          className={`anim-slide-down pointer-events-auto mx-auto flex w-full max-w-md items-start gap-3 rounded-2xl px-4 py-3 text-left shadow-lg ${
            toast.variant === 'info' ? 'bg-fg text-surface' : 'bg-hero text-on-hero'
          }`}
          onClick={() => hideToast()}
        >
          {toast.variant === 'badge' ? (
            // Neues Abzeichen: dreht sich herein, dann streicht ein Glanz darüber (22d, M2)
            <span
              aria-hidden="true"
              className="anim-badge relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-star text-amber-950"
            >
              <Icon name="medal" className="h-5 w-5" />
              <span className="anim-shine absolute inset-y-0 left-0 w-1/3 bg-white/60 opacity-0 motion-safe:opacity-100" />
            </span>
          ) : (
            toast.variant !== 'info' && (
              // Rekord: Pokal ploppt nach dem Einblenden auf (22d, T3)
              <TrophyIcon className="anim-pop-late mt-0.5 h-6 w-6 shrink-0" />
            )
          )}
          <span className="min-w-0">
            <span className="block font-bold">{toast.title}</span>
            {toast.lines.map((line) => (
              <span key={line} className="block text-sm">
                {line}
              </span>
            ))}
          </span>
        </button>
      )}
    </div>
  );
}
