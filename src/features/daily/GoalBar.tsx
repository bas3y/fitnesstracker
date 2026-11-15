import type { CSSProperties } from 'react';
import { useJustReached } from '../../components/motion';
import { goalPercent } from '../../domain/daily';

/** Funken am Ende des Balkens: Richtung je Funke (px) */
const SPARKS = [
  [14, -14],
  [6, -20],
  [20, -2],
  [-4, -16],
  [16, 10],
] as const;

/** Ziel gerade erreicht: Balken leuchtet einmal auf, kleine Funken (22d, F2) */
export function GoalSparks() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className="anim-glow absolute inset-0 rounded-full bg-mark" />
      {SPARKS.map(([x, y]) => (
        <span
          key={`${x}:${y}`}
          className="anim-spark absolute top-1/2 right-0 -mt-[3px] h-1.5 w-1.5 rounded-full bg-mark"
          style={{ '--spark-x': `${x}px`, '--spark-y': `${y}px` } as CSSProperties}
        />
      ))}
    </span>
  );
}

export function GoalBar({
  label,
  value,
  goal,
}: {
  label: string;
  value: number | null;
  goal: number;
}) {
  const percent = goalPercent(value, goal);
  const celebrating = useJustReached(percent >= 100);
  return (
    <div className="relative">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 overflow-hidden rounded-full bg-subtle-strong"
      >
        <div className="bar-fill h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      {celebrating && <GoalSparks />}
    </div>
  );
}
