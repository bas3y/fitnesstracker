// Daten für den Tageshinweis (ohne React), damit HomePage vorab prüfen kann, ob er etwas zeigt
import type { WorkoutSummary } from '../../db/workouts';
import type { DayKey, EnduranceSession, Settings } from '../../db/types';
import { dayHintKey, dayHintPhase, type DayHintTraining } from '../../domain/dayHints';
import { formatDistance, sessionEnd } from '../../domain/endurance';
import { ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import type { RecentRecords } from '../../domain/stats';
import { formatWorkoutDuration, workoutDurationSeconds } from '../../domain/workout';
import { sessionPath } from '../endurance/paths';
import { HISTORY_PATH } from '../training/paths';
declare global {
  interface Window {
    /** Nur E2E (`e2e/fixtures.ts`): Der Hinweis hängt von der Uhrzeit ab */
    __hideDayHint?: boolean;
  }
}

/** Ob das Widget gerade etwas zeigt (sonst `null`, damit kein leerer Platz entsteht) */
export function dayHintVisible(
  settings: Pick<Settings, 'dayHintDismissed'>,
  today: DayKey,
  now: Date,
  training: DayHintTraining | null,
): boolean {
  if (window.__hideDayHint) return false;
  const phase = dayHintPhase(now, training);
  return phase !== null && settings.dayHintDismissed !== dayHintKey(today, phase);
}

/** Zuletzt beendetes Training (Kraft oder Ausdauer) */
export function lastTraining(
  history: readonly WorkoutSummary[],
  endurance: readonly EnduranceSession[],
  records: readonly RecentRecords[],
  settings: Pick<Settings, 'distanceUnit'>,
  now: Date,
): DayHintTraining | null {
  const workout = history[0];
  const session = endurance[0];
  const workoutEnd = workout?.workout.endedAt ? new Date(workout.workout.endedAt) : null;
  const sessionEnds = session ? new Date(sessionEnd(session)) : null;
  if (workout && workoutEnd && (!sessionEnds || workoutEnd >= sessionEnds)) {
    const { workout: item, planDayName, setCount } = workout;
    return {
      name: planDayName ?? 'Training',
      endedAt: workoutEnd,
      summary: [
        formatWorkoutDuration(workoutDurationSeconds(item, now)),
        setCount === 1 ? '1 Satz' : `${setCount} Sätze`,
      ].join(' · '),
      records: [
        ...new Set(
          records.filter((row) => row.workoutId === item.id).map((row) => row.exercise.name),
        ),
      ],
      to: `${HISTORY_PATH}/${item.id}`,
    };
  }
  if (session && sessionEnds) {
    return {
      name: ENDURANCE_SPORT_LABELS[session.sport].name,
      endedAt: sessionEnds,
      summary: [
        formatWorkoutDuration(session.durationSeconds),
        session.distanceMeters
          ? formatDistance(session.distanceMeters, session.sport, settings.distanceUnit)
          : null,
      ]
        .filter(Boolean)
        .join(' · '),
      records: [],
      to: sessionPath(session.id),
    };
  }
  return null;
}
