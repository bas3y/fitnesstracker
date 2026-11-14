import { lazy, Suspense, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { hideSplash } from '../brand/splash';
import { ensureSettings } from '../db/settings';
import { getBackupReminder } from '../domain/backupReminder';
import { useApplyTheme } from '../features/settings/theme';
import { TimerAlarm } from '../features/self/TimerAlarm';
import { useSettings } from '../features/settings/useSettings';
import { SupplementReminder } from '../features/supplements/SupplementReminder';
import { ActiveWorkoutBanner } from '../features/training/ActiveWorkoutBanner';
import { RestTimerAlarm } from '../features/training/RestTimer';
import { BottomNav } from './BottomNav';
import { ErrorBoundary } from './ErrorBoundary';
import { PageArtwork } from './PageArtwork';
import { SCROLL_ROOT_ATTRIBUTE } from './scrollRoot';
import { usePageTransition } from './usePageTransition';
import { useScrollMemory } from './useScrollMemory';
import { ToastHost } from './Toast';

// Abzeichen/Ziele berechnen braucht viel Logik: nicht im Hauptbundle
const CelebrationWatcher = lazy(() =>
  import('../features/motivation/CelebrationWatcher').then((module) => ({
    default: module.CelebrationWatcher,
  })),
);

const scrollRootProps = { [SCROLL_ROOT_ATTRIBUTE]: '' };

/**
 * App-Rahmen: oben der Scrollbereich (Hinweise + Seite), unten die Navigation außerhalb davon –
 * so kann sie nicht mitwandern (siehe `scrollRoot.ts`)
 */
export function Layout() {
  const settings = useSettings();
  useApplyTheme(settings?.theme, settings?.palette);

  useEffect(() => {
    void ensureSettings();
  }, []);

  const ready = settings !== undefined;
  useEffect(() => {
    if (ready) hideSplash();
  }, [ready]);

  const { pathname } = useLocation();
  const main = usePageTransition();
  useScrollMemory();
  const reminder = settings ? getBackupReminder(settings, new Date()) : null;

  return (
    <div className="flex h-dvh flex-col">
      <div
        {...scrollRootProps}
        // Keine eigene Stapelebene (kein `isolate`/`z-*`): Vollbild-Fenster der Seiten müssen über
        // der Navigation liegen; das Artwork (`z-index: -1`) liegt trotzdem hinter dem Inhalt.
        // `scroll-pt-16`: Hineinscrollen (Fokus, scrollIntoView) endet unter dem mitlaufenden Kopf
        className="relative min-h-0 flex-1 scroll-pt-16 overflow-y-auto overscroll-y-none"
      >
        {settings && <PageArtwork palette={settings.palette} />}
        {reminder && (
          <Link
            to="/settings/backup"
            role="status"
            className="block bg-warn-soft px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 text-center text-sm font-medium text-on-warn-soft"
          >
            {reminder.never
              ? 'Noch kein Backup erstellt'
              : `Letztes Backup vor ${reminder.days} Tagen`}{' '}
            – jetzt sichern
          </Link>
        )}
        <ActiveWorkoutBanner first={!reminder} />
        <main ref={main} className="pb-6">
          <ErrorBoundary variant="page" resetKey={pathname}>
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <RestTimerAlarm />
      <TimerAlarm />
      <SupplementReminder />
      <ToastHost />
      <Suspense fallback={null}>
        <CelebrationWatcher />
      </Suspense>
      <BottomNav />
    </div>
  );
}
