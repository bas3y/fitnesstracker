import { useEffect, useState } from 'react';
import { showToast } from '../../components/toastStore';
import { finishTimer } from '../../db/timer';
import type { ActiveTimer } from '../../db/types';
import { TIMER_KIND_LABELS } from '../../domain/labels';
import { formatTimerDuration, timerState } from '../../domain/timer';
import { useSettings } from '../settings/useSettings';
import { playGong, vibrate } from '../training/restAlarm';

/** Spät bemerkte Wechsel (App war im Hintergrund) klingeln nicht nachträglich */
const LATE_MS = 3000;

async function finish(timer: ActiveTimer, ring: boolean) {
  const session = await finishTimer(timer.startedAt);
  if (ring) {
    playGong();
    vibrate();
  }
  if (session) {
    showToast({
      variant: 'info',
      title: `${TIMER_KIND_LABELS[session.kind].name} beendet`,
      lines: [`${formatTimerDuration(session.durationSeconds)} gespeichert`],
    });
  }
}

/**
 * Gong bei jedem Phasenwechsel und am Ende; speichert einen abgelaufenen Timer (im Layout
 * eingehängt, damit es auf jeder Seite klingelt und auch nach dem Neuladen gespeichert wird)
 */
export function TimerAlarm() {
  const settings = useSettings();
  const timer = settings?.activeTimer ?? null;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!timer || timer.pausedAt) return;
    const state = timerState(timer, new Date());
    if (state.finished) {
      void finish(timer, false);
      return;
    }
    const endsAt = state.phaseEndsAt!;
    const handle = setTimeout(
      () => {
        const ring = Date.now() - endsAt < LATE_MS;
        const next = timerState(timer, new Date());
        if (next.finished) {
          void finish(timer, ring);
          return;
        }
        if (ring) {
          // In die Pause: voller Gong; zurück in den Fokus: leiser
          playGong(next.phase.type === 'focus');
          vibrate();
        }
        setTick((value) => value + 1);
      },
      Math.max(0, endsAt - Date.now()) + 50,
    );
    return () => clearTimeout(handle);
  }, [timer, tick]);

  return null;
}
