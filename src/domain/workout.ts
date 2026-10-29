import type { WeightUnit, Workout, WorkoutSet } from '../db/types';
import { formatDecimal } from './format';
import { kgToDisplay, roundTo } from './units';

/** Uhr-Format: `0:45`, `12:05`, `1:02:03` */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Workout-Dauer: `45 min`, `1 h 05 min` */
export function formatWorkoutDuration(totalSeconds: number): string {
  const minutes = Math.max(0, Math.round(totalSeconds / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

export function workoutDurationSeconds(workout: Pick<Workout, 'startedAt' | 'endedAt'>, now: Date) {
  const end = workout.endedAt ? Date.parse(workout.endedAt) : now.getTime();
  return Math.max(0, (end - Date.parse(workout.startedAt)) / 1000);
}

/** Verbleibende Pausenzeit in ganzen Sekunden (aufgerundet), `null` ohne Timer */
export function restRemainingSeconds(restEndsAt: string | null, now: Date): number | null {
  if (!restEndsAt) return null;
  return Math.max(0, Math.ceil((Date.parse(restEndsAt) - now.getTime()) / 1000));
}

type SetFields = Pick<WorkoutSet, 'weight' | 'level' | 'reps' | 'durationSeconds' | 'isWarmup'>;

/**
 * Startwerte für einen neuen Satz: Werte des vorigen Satzes dieser Übung im Workout,
 * sonst der passende Arbeitssatz vom letzten Mal, sonst leer (Körpergewicht: 0 kg Zusatzgewicht).
 */
export function suggestSetValues({
  previous,
  lastTime,
  index,
  isBodyweight,
}: {
  previous: SetFields | undefined;
  lastTime: SetFields[];
  /** Position des neuen Satzes unter den Arbeitssätzen dieser Übung */
  index: number;
  isBodyweight: boolean;
}): Pick<WorkoutSet, 'weight' | 'level' | 'reps' | 'durationSeconds'> {
  const lastWorking = lastTime.filter((set) => !set.isWarmup);
  const source =
    previous && !previous.isWarmup
      ? previous
      : (lastWorking[index] ?? lastWorking.at(-1) ?? previous);
  if (!source) {
    return { weight: isBodyweight ? 0 : null, level: null, reps: null, durationSeconds: null };
  }
  const { weight, level, reps, durationSeconds } = source;
  return { weight, level, reps, durationSeconds };
}

export function formatWeight(kg: number, unit: WeightUnit, signed = false): string {
  const value = roundTo(kgToDisplay(kg, unit), 2);
  const text = `${formatDecimal(Math.abs(value), 2)} ${unit}`;
  if (value < 0) return `−${text}`;
  return signed && value > 0 ? `+${text}` : text;
}

/** Kurzform eines Satzes, z. B. `80 kg × 8`, `Stufe 7 × 10`, `+10 kg × 5`, `0:45`, `+5 kg · 0:30` */
export function formatSetSummary(
  set: Pick<WorkoutSet, 'weight' | 'level' | 'reps' | 'durationSeconds' | 'rpe' | 'rir'>,
  { unit, isTimed, isBodyweight }: { unit: WeightUnit; isTimed: boolean; isBodyweight: boolean },
): string {
  const hasWeight = set.weight !== null && !(isBodyweight && set.weight === 0);
  const weight =
    set.level !== null
      ? `Stufe ${formatDecimal(set.level, 1)}`
      : hasWeight
        ? formatWeight(set.weight!, unit, isBodyweight)
        : null;
  let text: string;
  if (isTimed) {
    const duration = set.durationSeconds === null ? '–' : formatClock(set.durationSeconds);
    text = weight ? `${weight} · ${duration}` : duration;
  } else {
    const reps = set.reps === null ? '–' : String(set.reps);
    text = weight ? `${weight} × ${reps}` : `${reps} Wdh.`;
  }
  const extras = [
    set.rpe !== null && `RPE ${formatDecimal(set.rpe, 1)}`,
    set.rir !== null && `RIR ${set.rir}`,
  ].filter(Boolean);
  return extras.length ? `${text} (${extras.join(', ')})` : text;
}

/** Verschiebt ein Element um eine Position; gibt die neue Reihenfolge zurück (unverändert am Rand) */
export function moveItem<T>(items: readonly T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  const result = [...items];
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return result;
  [result[index], result[target]] = [result[target]!, result[index]!];
  return result;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Lokales Datum für `<input type="date">` */
export function toDateInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Lokale Uhrzeit für `<input type="time">` */
export function toTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Lokales Datum + Uhrzeit → ISO-Zeitstempel, `null` bei ungültiger Eingabe */
export function fromDateTimeInput(date: string, time: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match || !timeMatch) return null;
  const [, y, mo, d] = match.map(Number);
  const [, h, mi] = timeMatch.map(Number);
  const result = new Date(y!, mo! - 1, d!, h!, mi!);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

export function formatWorkoutDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
