import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { hideSplash } from '../brand/splash';
import { primaryButton, secondaryButton } from './buttons';
import { reloadApp } from './reloadApp';

interface Props {
  children: ReactNode;
  /** Ändert sich der Wert (z. B. Pfad), wird es erneut versucht */
  resetKey?: string;
  /** `page` = nur der Seiteninhalt (Navigation bleibt), `app` = ganzer Bildschirm */
  variant?: 'page' | 'app';
}

interface State {
  error: Error | null;
}

/** Fängt Renderfehler ab: Hinweis mit „Neu laden“ statt weißer Seite */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('Anzeigefehler', error, info.componentStack);
  }

  componentDidUpdate(previous: Props): void {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return <ErrorScreen error={error} variant={this.props.variant ?? 'app'} />;
  }
}

function ErrorScreen({ error, variant }: { error: Error; variant: 'page' | 'app' }) {
  useEffect(() => hideSplash(), []);
  // Nach einer neuen Version fehlen manchmal alte Teile der App: dann hilft Neuladen sicher
  const chunk =
    /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
      error.message,
    );

  return (
    <div
      role="alert"
      className={
        variant === 'app'
          ? 'flex min-h-dvh items-center justify-center bg-page p-6 text-fg'
          : 'px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6'
      }
    >
      <div className="mx-auto max-w-md space-y-4 rounded-2xl bg-surface p-5">
        <h1 className="text-xl font-bold">Hier ist etwas schiefgelaufen</h1>
        <p className="text-sm text-muted">
          {chunk
            ? 'Ein Teil der App konnte nicht geladen werden, vermutlich wegen einer neuen Version.'
            : 'Diese Ansicht konnte nicht angezeigt werden.'}{' '}
          Deine Daten sind weiterhin auf dem Gerät gespeichert.
        </p>
        <div className="flex flex-col gap-2">
          <button type="button" className={primaryButton} onClick={() => void reloadApp()}>
            Neu laden
          </button>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => {
              window.location.hash = '#/';
              window.location.reload();
            }}
          >
            Zur Startseite
          </button>
        </div>
        <details className="text-xs text-faint">
          <summary className="cursor-pointer">Technische Details</summary>
          <p className="mt-2 break-words">{error.message || error.name}</p>
        </details>
      </div>
    </div>
  );
}
