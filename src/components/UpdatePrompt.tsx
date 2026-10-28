import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-slate-800 p-3 text-sm text-white shadow-lg dark:bg-slate-700"
    >
      <span className="flex-1">Neue Version verfügbar</span>
      <button
        type="button"
        className="min-h-11 rounded-xl px-3 text-slate-300"
        onClick={() => setNeedRefresh(false)}
      >
        Später
      </button>
      <button
        type="button"
        className="min-h-11 rounded-xl bg-emerald-500 px-4 font-semibold text-slate-900"
        onClick={() => void updateServiceWorker(true)}
      >
        Neu laden
      </button>
    </div>
  );
}
