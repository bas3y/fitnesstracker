import { lazy, Suspense, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ensureSettings } from '../db/settings';
import { getBackupReminder } from '../domain/backupReminder';
import { useApplyTheme } from '../features/settings/theme';
import { TimerAlarm } from '../features/self/TimerAlarm';
import { useSettings } from '../features/settings/useSettings';
import { SupplementReminder } from '../features/supplements/SupplementReminder';
import { ActiveWorkoutBanner } from '../features/training/ActiveWorkoutBanner';
import { RestTimerAlarm } from '../features/training/RestTimer';
import { BottomNav } from './BottomNav';
import { ToastHost } from './Toast';

// Abzeichen/Ziele berechnen braucht viel Logik: nicht im Hauptbundle
const CelebrationWatcher = lazy(() =>
  import('../features/motivation/CelebrationWatcher').then((module) => ({
    default: module.CelebrationWatcher,
  })),
);

export function Layout() {
  const settings = useSettings();
  useApplyTheme(settings?.theme, settings?.palette);

  useEffect(() => {
    void ensureSettings();
  }, []);

  const reminder = settings ? getBackupReminder(settings, new Date()) : null;

  return (
    <div className="min-h-dvh pb-[calc(5rem+env(safe-area-inset-bottom))]">
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
      <RestTimerAlarm />
      <TimerAlarm />
      <SupplementReminder />
      <ToastHost />
      <Suspense fallback={null}>
        <CelebrationWatcher />
      </Suspense>
      <main>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
