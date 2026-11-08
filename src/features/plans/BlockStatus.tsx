import { primaryButton, secondaryButton } from '../../components/buttons';
import { startPlanBlock, stopPlanBlocks } from '../../db/plans';
import type { DayKey, Plan } from '../../db/types';
import {
  blockStatus,
  formatAdjustment,
  formatBlockWeek,
  isNeutralAdjustment,
  type BlockStatus,
} from '../../domain/blocks';
import { BLOCK_KIND_LABELS } from '../../domain/labels';
import { formatDayKey } from '../../domain/stats';

const HINT = 'text-sm text-muted';

/** z. B. „Sätze: 50 % Sätze · 90 % Gewicht“ bzw. Hinweis, dass nur angezeigt wird */
function adjustmentText(
  plan: Pick<Plan, 'blockAdjust'>,
  block: BlockStatus['block'],
): string | null {
  if (isNeutralAdjustment(block)) return null;
  return plan.blockAdjust
    ? `Sätze angepasst: ${formatAdjustment(block)}`
    : 'Sätze wie gewohnt (Anpassen ist aus)';
}

/**
 * Aktueller Trainingsblock eines Plans mit Woche; nach dem Ende Hinweis mit Übergang zum nächsten
 * Block bzw. Wiederholen oder Beenden. Ohne laufende Blöcke unsichtbar.
 */
export function BlockStatusPanel({ plan, today }: { plan: Plan; today: DayKey }) {
  const status = blockStatus(plan, today);
  if (!status) return null;
  const { block, phase, next } = status;
  const label = BLOCK_KIND_LABELS[block.kind];
  const adjustment = adjustmentText(plan, block);

  if (phase === 'upcoming') {
    return (
      <p className={`${HINT} mb-2`} data-testid="block-status">
        {label} beginnt am {formatDayKey(status.startDate)}.
      </p>
    );
  }
  if (phase === 'running') {
    return (
      <div className="mb-2" data-testid="block-status">
        <p className="font-semibold text-primary-text">
          {formatBlockWeek({ ...block, week: status.week })}
        </p>
        {adjustment && <p className={HINT}>{adjustment}</p>}
      </div>
    );
  }
  return (
    <div
      className="mb-3 rounded-xl border border-warn/50 bg-warn-soft p-3"
      data-testid="block-status"
    >
      <p className="font-semibold">{label} ist geschafft!</p>
      <p className="mb-3 text-sm text-muted">
        Geplant bis {formatDayKey(status.endDate)}. Bis du wechselst, läuft {label} weiter
        {plan.blockAdjust && !isNeutralAdjustment(block) ? ` (${formatAdjustment(block)})` : ''}.
      </p>
      <div className="flex flex-col gap-2">
        {next ? (
          <>
            <button
              type="button"
              className={primaryButton}
              onClick={() => void startPlanBlock(plan.id, status.index + 1, today)}
            >
              Weiter mit {BLOCK_KIND_LABELS[next.kind]}
            </button>
            <button
              type="button"
              className={secondaryButton}
              onClick={() => void startPlanBlock(plan.id, status.index, today)}
            >
              {label} wiederholen
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={primaryButton}
              onClick={() => void startPlanBlock(plan.id, 0, today)}
            >
              Abfolge wiederholen
            </button>
            <button
              type="button"
              className={secondaryButton}
              onClick={() => void stopPlanBlocks(plan.id)}
            >
              Ohne Blöcke weiter
            </button>
          </>
        )}
      </div>
    </div>
  );
}
