import type { SleepPhases } from '../../db/types';
import { SLEEP_PHASE_LABELS, SLEEP_PHASES } from '../../domain/daily';
import { formatWorkoutDuration } from '../../domain/workout';

// Feste Kategoriefarben, unabhängig von der Palette
const COLORS: Record<keyof SleepPhases, string> = {
  deep: 'bg-indigo-700 dark:bg-indigo-500',
  light: 'bg-sky-400',
  rem: 'bg-violet-400',
  awake: 'bg-amber-400',
};

/** Anteile der Schlafphasen als Balken mit Legende */
export function SleepPhasesBar({
  phases,
  label = 'Schlafphasen',
}: {
  phases: SleepPhases;
  label?: string;
}) {
  const total = SLEEP_PHASES.reduce((sum, phase) => sum + phases[phase], 0);
  if (total === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-subtle-strong" aria-hidden>
        {SLEEP_PHASES.map((phase) => (
          <div
            key={phase}
            className={COLORS[phase]}
            style={{ width: `${(phases[phase] / total) * 100}%` }}
          />
        ))}
      </div>
      <ul aria-label={label} className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        {SLEEP_PHASES.map((phase) => (
          <li key={phase} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${COLORS[phase]}`} aria-hidden />
            <span>
              {SLEEP_PHASE_LABELS[phase]}{' '}
              <span className="tabular-nums text-muted">
                {formatWorkoutDuration(phases[phase])}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
