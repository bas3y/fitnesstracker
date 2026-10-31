import { goalPercent } from '../../domain/daily';

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
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
    >
      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
    </div>
  );
}
