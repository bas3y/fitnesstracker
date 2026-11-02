import { useEffect } from 'react';
import { showToast } from '../../components/toastStore';
import { dayKey } from '../../domain/daily';
import { formatDose, isDoseOverdue, supplementDay } from '../../domain/supplements';
import { useSettings } from '../settings/useSettings';
import { useNow } from '../training/useWorkouts';
import { showSystemNotification } from './notifications';
import { useSupplementOverview } from './useSupplements';

const STORAGE_KEY = 'supplementReminders';

/** Bereits erinnerte Einnahmen von heute; übersteht ein Neuladen, damit nichts doppelt kommt */
let memory: { date: string; ids: string[] } = { date: '', ids: [] };

function remindedIds(date: string): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as typeof memory | null;
    if (stored?.date === date && Array.isArray(stored.ids)) memory = stored;
  } catch {
    // Ohne Speicher (privater Modus) reicht der Stand im Arbeitsspeicher
  }
  return memory.date === date ? memory.ids : [];
}

function markReminded(date: string, ids: string[]) {
  memory = { date, ids: [...remindedIds(date), ...ids] };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // siehe oben
  }
}

/** Erinnert einmal je fälliger Einnahme, solange die App geöffnet ist (im Layout) */
export function SupplementReminder() {
  const settings = useSettings();
  if (!settings?.supplementRemindersEnabled) return null;
  return <ReminderWatcher notify={settings.supplementNotificationsEnabled} />;
}

function ReminderWatcher({ notify }: { notify: boolean }) {
  const overview = useSupplementOverview();
  // Nur als Takt: geprüft wird mit der aktuellen Zeit, sonst käme die Erinnerung beim
  // Workout-Start (neue Daten zwischen zwei Takten) erst eine Minute später
  const tick = useNow(true, 60_000);

  useEffect(() => {
    if (!overview) return;
    const now = new Date();
    const today = dayKey(now);
    const active = overview.items.filter(({ supplement }) => supplement.archivedAt === null);
    const reminded = new Set(remindedIds(today));
    const due = supplementDay(active, today, today, overview.trainingDays).filter(
      (entry) =>
        isDoseOverdue(entry, now) &&
        !reminded.has(entry.dose.id) &&
        // Erst später angelegt: keine Erinnerung an die schon verstrichene Uhrzeit
        entry.dueAt!.toISOString() >= entry.supplement.createdAt,
    );
    if (due.length === 0) return;
    markReminded(
      today,
      due.map((entry) => entry.dose.id),
    );
    const lines = due.map(
      ({ supplement, dose }) => `${supplement.name}: ${formatDose(dose, supplement.unit)}`,
    );
    const title = due.length === 1 ? 'Supplement fällig' : 'Supplements fällig';
    if (notify && document.visibilityState === 'hidden') {
      void showSystemNotification(title, lines.join('\n')).then(
        (shown) => shown || showToast({ variant: 'info', title, lines }),
      );
    } else {
      showToast({ variant: 'info', title, lines });
    }
  }, [overview, tick, notify]);

  return null;
}
