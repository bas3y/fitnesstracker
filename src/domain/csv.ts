import type { WeightUnit, Workout, WorkoutSet } from '../db/types';
import { formatDecimal } from './format';
import { kgToDisplay } from './units';
import { toDateInput, toTimeInput, workoutDurationSeconds } from './workout';

// Semikolon, Dezimalkomma und BOM: So öffnet ein deutsches Excel die Datei direkt richtig
const SEPARATOR = ';';
const BOM = '﻿';
const LINE_END = '\r\n';

/** Tabellenprogramme führen Text mit diesen Anfängen sonst als Formel aus */
const FORMULA_START = /^[=+\-@\t\r]/;

function textCell(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

function numberCell(value: number | null): string {
  return value === null ? '' : formatDecimal(value, 2);
}

export type CsvSet = Pick<
  WorkoutSet,
  | 'weight'
  | 'level'
  | 'eccentricWeight'
  | 'eccentricLevel'
  | 'reps'
  | 'durationSeconds'
  | 'rpe'
  | 'rir'
  | 'isWarmup'
  | 'completedAt'
>;

export interface CsvWorkout {
  workout: Pick<Workout, 'id' | 'startedAt' | 'endedAt' | 'notes'>;
  planDayName: string | null;
}

export interface CsvSession {
  workoutId: string;
  exercise: { name: string };
  /** In der Reihenfolge des Abhakens */
  sets: CsvSet[];
}

/** Eine Zeile je Satz, ältestes Workout zuerst, Übungen in der Reihenfolge des Trainings */
export function workoutsToCsv(
  workouts: CsvWorkout[],
  sessions: CsvSession[],
  unit: WeightUnit,
): string {
  const weight = (kg: number | null) => numberCell(kg === null ? null : kgToDisplay(kg, unit));
  const header = [
    'Datum',
    'Uhrzeit',
    'Training',
    'Dauer (min)',
    'Übung',
    'Satz',
    'Aufwärmsatz',
    `Gewicht (${unit})`,
    'Stufe',
    'Wdh.',
    'Dauer (s)',
    `Negativ-Gewicht (${unit})`,
    'Negativ-Stufe',
    'RPE',
    'RIR',
    'Notiz',
  ];
  const firstDone = (session: CsvSession) => session.sets[0]?.completedAt ?? '';
  const chronological = [...workouts].sort((a, b) =>
    a.workout.startedAt.localeCompare(b.workout.startedAt),
  );

  const rows = chronological.flatMap(({ workout, planDayName }) => {
    const minutes = Math.round(workoutDurationSeconds(workout, new Date()) / 60);
    return sessions
      .filter((session) => session.workoutId === workout.id)
      .sort((a, b) => firstDone(a).localeCompare(firstDone(b)))
      .flatMap(({ exercise, sets }) =>
        sets.map((set, index) => [
          toDateInput(workout.startedAt),
          toTimeInput(workout.startedAt),
          textCell(planDayName ?? ''),
          numberCell(minutes),
          textCell(exercise.name),
          numberCell(index + 1),
          set.isWarmup ? 'ja' : 'nein',
          weight(set.weight),
          numberCell(set.level),
          numberCell(set.reps),
          numberCell(set.durationSeconds),
          weight(set.eccentricWeight),
          numberCell(set.eccentricLevel),
          numberCell(set.rpe),
          numberCell(set.rir),
          textCell(workout.notes),
        ]),
      );
  });

  return BOM + [header, ...rows].map((row) => row.join(SEPARATOR) + LINE_END).join('');
}
