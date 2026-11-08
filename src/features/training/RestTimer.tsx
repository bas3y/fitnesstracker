import { useEffect, useRef } from 'react';
import { adjustRest, setRestEndsAt } from '../../db/workouts';
import type { Workout } from '../../db/types';
import { formatClock, restRemainingSeconds } from '../../domain/workout';
import { useSettings } from '../settings/useSettings';
import { playBeep, vibrate } from './restAlarm';
import { useActiveWorkout, useNow } from './useWorkouts';

/** Wie lange „Pause vorbei“ nach Ablauf sichtbar bleibt */
const EXPIRED_VISIBLE_MS = 60_000;

/**
 * Signal am Ende der Pause (unsichtbar, im Layout eingehängt, damit es auf jeder Seite klingelt).
 * Nach einem Neustart wird ein längst abgelaufener Timer nicht nachträglich gemeldet.
 */
export function RestTimerAlarm() {
  const workout = useActiveWorkout();
  const settings = useSettings();
  const firedFor = useRef<string | null>(null);
  const restEndsAt = workout?.restEndsAt ?? null;
  const sound = settings?.restTimerSound ?? true;
  const vibration = settings?.restTimerVibrate ?? true;

  useEffect(() => {
    if (!restEndsAt || firedFor.current === restEndsAt) return;
    const delay = Date.parse(restEndsAt) - Date.now();
    if (delay < -3000) return;
    const timer = setTimeout(
      () => {
        firedFor.current = restEndsAt;
        if (sound) playBeep();
        if (vibration) vibrate();
      },
      Math.max(0, delay),
    );
    return () => clearTimeout(timer);
  }, [restEndsAt, sound, vibration]);

  return null;
}

/** Pausenanzeige über der Bottom-Navigation */
export function RestTimerBar({ workout }: { workout: Workout }) {
  const now = useNow(workout.restEndsAt !== null, 250);
  const remaining = restRemainingSeconds(workout.restEndsAt, now);
  if (remaining === null || !workout.restEndsAt) return null;
  if (now.getTime() - Date.parse(workout.restEndsAt) > EXPIRED_VISIBLE_MS) return null;

  const done = remaining === 0;
  const smallButton =
    'min-h-11 rounded-xl px-3 text-sm font-semibold bg-current/15 active:bg-current/25';
  return (
    <div
      role="timer"
      aria-label="Pause"
      data-bottom-bar
      className={`fixed inset-x-0 bottom-[calc(3.5rem+1px+env(safe-area-inset-bottom))] z-20 ${
        done ? 'bg-mark text-surface' : 'bg-hero text-on-hero'
      }`}
    >
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-2">
        <div className="mr-auto">
          <span className="block text-xs font-medium uppercase opacity-80">Pause</span>
          <span className="block text-2xl font-bold tabular-nums">
            {done ? 'Vorbei' : formatClock(remaining)}
          </span>
        </div>
        {!done && (
          <>
            <button
              type="button"
              className={smallButton}
              aria-label="Pause 15 Sekunden kürzer"
              onClick={() => void adjustRest(workout.id, -15)}
            >
              −15
            </button>
            <button
              type="button"
              className={smallButton}
              aria-label="Pause 15 Sekunden länger"
              onClick={() => void adjustRest(workout.id, 15)}
            >
              +15
            </button>
          </>
        )}
        <button
          type="button"
          className={smallButton}
          onClick={() => void setRestEndsAt(workout.id, null)}
        >
          {done ? 'OK' : 'Überspringen'}
        </button>
      </div>
    </div>
  );
}
