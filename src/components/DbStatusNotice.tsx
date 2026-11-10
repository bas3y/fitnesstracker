import { useEffect, useState, useSyncExternalStore } from 'react';
import { hideSplash } from '../brand/splash';
import { getDbState, subscribeDbState, type DbStatus } from '../db/dbStatus';
import { primaryButton } from './buttons';
import { reloadApp } from './reloadApp';

const TEXTS: Record<Exclude<DbStatus, 'ok'>, { title: string; text: string }> = {
  blocked: {
    title: 'Update wartet',
    text: 'Basey ist noch in einem anderen Fenster geöffnet (Browser-Tab oder installierte App) und verhindert das Update der Daten. Bitte die anderen Fenster schließen – danach geht es hier von selbst weiter. Deine Daten bleiben erhalten.',
  },
  outdated: {
    title: 'Neue Version geöffnet',
    text: 'Basey wurde in einem anderen Fenster auf eine neue Version aktualisiert. Bitte neu laden, damit hier alle Daten wieder erscheinen. Deine Daten bleiben erhalten.',
  },
  error: {
    title: 'Daten konnten nicht geöffnet werden',
    text: 'Der Speicher der App lässt sich gerade nicht öffnen (z. B. Speicher voll oder privater Modus). Bitte neu laden; hilft das nicht, Speicherplatz freigeben.',
  },
};

/** Hinweis statt leerer App, wenn die Datenbank blockiert, veraltet oder nicht zu öffnen ist */
export function DbStatusNotice() {
  const { status, error } = useSyncExternalStore(subscribeDbState, getDbState);
  // „Blockiert“ löst sich oft nach Sekundenbruchteilen von selbst: erst kurz warten
  const [shownBlocked, setShownBlocked] = useState(false);

  useEffect(() => {
    if (status !== 'blocked') return;
    const timer = window.setTimeout(() => setShownBlocked(true), 1500);
    return () => {
      window.clearTimeout(timer);
      setShownBlocked(false);
    };
  }, [status]);

  const visible = status !== 'ok' && (status !== 'blocked' || shownBlocked);
  useEffect(() => {
    if (visible) hideSplash();
  }, [visible]);

  if (status === 'ok' || !visible) return null;
  const { title, text } = TEXTS[status];
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="db-status-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-scrim p-6"
    >
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-surface p-5 text-fg">
        <h1 id="db-status-title" className="text-xl font-bold">
          {title}
        </h1>
        <p className="text-sm text-muted">{text}</p>
        {error && <p className="text-xs break-words text-faint">{error}</p>}
        <button type="button" className={primaryButton} onClick={() => void reloadApp()}>
          Neu laden
        </button>
      </div>
    </div>
  );
}
