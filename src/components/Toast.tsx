import { useEffect, useSyncExternalStore } from 'react';
import { TrophyIcon } from './icons';
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
      className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]"
    >
      {toast && (
        <button
          type="button"
          aria-label={`${toast.title}: ${toast.lines.join(', ')} – schließen`}
          className="pointer-events-auto mx-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-amber-500 px-4 py-3 text-left text-amber-950 shadow-lg"
          onClick={() => hideToast()}
        >
          <TrophyIcon className="mt-0.5 h-6 w-6 shrink-0" />
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
