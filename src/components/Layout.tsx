import { useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ensureSettings } from '../db/settings';
import { getBackupReminder } from '../domain/backupReminder';
import { useApplyTheme } from '../features/settings/theme';
import { useSettings } from '../features/settings/useSettings';
import { BottomNav } from './BottomNav';

export function Layout() {
  const settings = useSettings();
  useApplyTheme(settings?.theme);

  useEffect(() => {
    void ensureSettings();
  }, []);

  const reminder = settings ? getBackupReminder(settings, new Date()) : null;

  return (
    <div className="min-h-dvh pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {reminder && (
        <Link
          to="/settings"
          role="status"
          className="block bg-amber-100 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 text-center text-sm font-medium text-amber-900 dark:bg-amber-900/60 dark:text-amber-100"
        >
          {reminder.never
            ? 'Noch kein Backup erstellt'
            : `Letztes Backup vor ${reminder.days} Tagen`}{' '}
          – jetzt sichern
        </Link>
      )}
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
