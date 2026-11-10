import { useState } from 'react';
import { useBackTo } from '../../components/backNavigation';
import { primaryButton } from '../../components/buttons';
import { Card, Page } from '../../components/Page';
import { SETTINGS_PATH } from './paths';
import { appUrl, isInstalledApp, shareAppLink } from './shareApp';

const HINT = 'text-sm text-muted';

const STATUS_TEXT = {
  shared: 'Link geteilt.',
  copied: 'Link kopiert – jetzt z. B. in einer Nachricht einfügen.',
  failed: 'Kopieren hat nicht geklappt. Den Link oben markieren und kopieren.',
} as const;

/** Link weitergeben, Installationsanleitung, Hinweis auf Backups */
export function ShareAppPage() {
  const backTo = useBackTo(SETTINGS_PATH);
  const url = appUrl();
  const [status, setStatus] = useState<keyof typeof STATUS_TEXT | null>(null);

  return (
    <Page title="Installieren & weitergeben" backTo={backTo}>
      <Card title="Link teilen">
        <p className={`mb-3 ${HINT}`}>
          Wer den Link öffnet, bekommt eine eigene, leere App. Deine Daten bleiben auf deinem Gerät
          und werden nicht mitgeschickt.
        </p>
        <p className={`mb-3 ${HINT}`}>
          Jede Person hat ihre eigenen Daten nur auf ihrem eigenen Handy. Es gibt keine Verbindung
          zwischen den Geräten: Was andere eintragen, siehst du nicht, und umgekehrt.
        </p>
        <p
          data-testid="app-url"
          className="mb-3 rounded-xl bg-subtle px-3 py-2 font-mono text-sm break-all select-all"
        >
          {url}
        </p>
        <button
          type="button"
          className={primaryButton}
          onClick={async () => {
            const result = await shareAppLink(url);
            setStatus(result === 'cancelled' ? null : result);
          }}
        >
          App weitergeben
        </button>
        {status && (
          <p
            role={status === 'failed' ? 'alert' : 'status'}
            className="mt-3 text-sm text-primary-text"
          >
            {STATUS_TEXT[status]}
          </p>
        )}
      </Card>
      <InstallGuide />
    </Page>
  );
}

function InstallGuide() {
  const installed = isInstalledApp();
  return (
    <Card title="Installieren">
      {installed && (
        <p className="mb-3 text-sm font-medium text-primary-text">
          ✓ Auf diesem Gerät läuft die installierte App.
        </p>
      )}
      <p className={`mb-3 ${HINT}`}>
        Einmal mit Internet öffnen und zum Startbildschirm hinzufügen, danach läuft die App auch im
        Flugmodus.
      </p>
      <h3 className="font-semibold">Android (Chrome)</h3>
      <ol className="mb-3 list-decimal pl-5 text-sm">
        <li>Link in Chrome öffnen.</li>
        <li>Menü ⋮ → „App installieren“ (bzw. „Zum Startbildschirm hinzufügen“).</li>
      </ol>
      <h3 className="font-semibold">iPhone (Safari)</h3>
      <ol className="mb-3 list-decimal pl-5 text-sm">
        <li>Link in Safari öffnen (nicht in einer anderen App).</li>
        <li>Teilen-Symbol → „Zum Home-Bildschirm“.</li>
        <li>Ab dann nur die App vom Home-Bildschirm nutzen: Sie hat einen eigenen Speicher.</li>
      </ol>
      <h3 className="font-semibold">Wichtig: Backups</h3>
      <p className="text-sm">
        Alle Daten liegen nur auf dem Gerät, ohne Konto und ohne Server. Regelmäßig unter
        Einstellungen → Datensicherung „Backup exportieren“ und die Datei außerhalb des Handys
        ablegen. Nie im Privat- oder Inkognito-Modus nutzen.
      </p>
    </Card>
  );
}
