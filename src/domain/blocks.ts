import type {
  BlockAdjustment,
  BlockKind,
  DayKey,
  Plan,
  PlanBlock,
  WorkoutBlock,
} from '../db/types';
import { shiftDay } from './daily';
import { BLOCK_KIND_LABELS } from './labels';
import { daysBetween } from './periods';
import { roundTo } from './units';

/** Standardwerte je Blockart; im Plan je Block änderbar */
export const BLOCK_DEFAULTS: Record<BlockKind, BlockAdjustment> = {
  build: { setsPercent: 100, loadPercent: 100, repShift: 0, progression: true },
  deload: { setsPercent: 50, loadPercent: 90, repShift: 0, progression: false },
  peak: { setsPercent: 100, loadPercent: 105, repShift: -2, progression: false },
  test: { setsPercent: 35, loadPercent: 110, repShift: -7, progression: false },
};

export const BLOCK_DEFAULT_WEEKS: Record<BlockKind, number> = {
  build: 4,
  deload: 1,
  peak: 2,
  test: 1,
};

export const BLOCK_KIND_HINTS: Record<BlockKind, string> = {
  build: 'Normal trainieren, Overload wie gewohnt.',
  deload: 'Erholung: weniger Sätze, etwas weniger Gewicht.',
  peak: 'Intensität: weniger Wdh., mehr Gewicht.',
  test: 'Kurz und schwer: ein Satz mit wenigen Wdh.',
};

export interface BlockTemplate {
  key: string;
  name: string;
  blocks: ReadonlyArray<{ kind: BlockKind; weeks: number }>;
}

export const BLOCK_TEMPLATES: readonly BlockTemplate[] = [
  {
    key: '3-1',
    name: '3 Wochen Aufbau + 1 Woche Deload',
    blocks: [
      { kind: 'build', weeks: 3 },
      { kind: 'deload', weeks: 1 },
    ],
  },
  {
    key: '4-1',
    name: '4 Wochen Aufbau + 1 Woche Deload',
    blocks: [
      { kind: 'build', weeks: 4 },
      { kind: 'deload', weeks: 1 },
    ],
  },
  {
    key: 'peak',
    name: 'Aufbau → Peak → Deload (4 + 2 + 1)',
    blocks: [
      { kind: 'build', weeks: 4 },
      { kind: 'peak', weeks: 2 },
      { kind: 'deload', weeks: 1 },
    ],
  },
  {
    key: 'test',
    name: 'Aufbau → Peak → Test → Deload (4 + 2 + 1 + 1)',
    blocks: [
      { kind: 'build', weeks: 4 },
      { kind: 'peak', weeks: 2 },
      { kind: 'test', weeks: 1 },
      { kind: 'deload', weeks: 1 },
    ],
  },
];

export function newBlock(
  kind: BlockKind,
  weeks = BLOCK_DEFAULT_WEEKS[kind],
  id: string = crypto.randomUUID(),
): PlanBlock {
  return { id, kind, weeks, ...BLOCK_DEFAULTS[kind] };
}

export function blocksFromTemplate(template: BlockTemplate): PlanBlock[] {
  return template.blocks.map(({ kind, weeks }) => newBlock(kind, weeks));
}

/** Ändert die Werte nicht – dann ist die Vorbefüllung wie ohne Block */
export function isNeutralAdjustment(adjustment: BlockAdjustment): boolean {
  return (
    adjustment.setsPercent === 100 &&
    adjustment.loadPercent === 100 &&
    adjustment.repShift === 0 &&
    adjustment.progression
  );
}

export type BlockPhase =
  /** Startdatum liegt in der Zukunft */
  | 'upcoming'
  | 'running'
  /** Geplante Wochen sind vorbei – der Block läuft weiter, bis man wechselt */
  | 'ended';

export interface BlockStatus {
  block: PlanBlock;
  index: number;
  count: number;
  phase: BlockPhase;
  /** Woche im Block ab 1; läuft nach dem Ende weiter (z. B. Woche 5 von 4), `0` vor dem Start */
  week: number;
  startDate: DayKey;
  /** Letzter geplanter Tag des Blocks */
  endDate: DayKey;
  next: PlanBlock | null;
}

/** Aktueller Block des Plans; `null` ohne Blöcke oder wenn sie nicht laufen */
export function blockStatus(
  plan: Pick<Plan, 'blocks' | 'blockProgress'>,
  today: DayKey,
): BlockStatus | null {
  const { blocks, blockProgress } = plan;
  if (!blockProgress || blocks.length === 0) return null;
  const index = Math.min(blockProgress.index, blocks.length - 1);
  const block = blocks[index]!;
  const { startDate } = blockProgress;
  const endDate = shiftDay(startDate, block.weeks * 7 - 1);
  const upcoming = today < startDate;
  const week = upcoming ? 0 : Math.floor((daysBetween(startDate, today) - 1) / 7) + 1;
  return {
    block,
    index,
    count: blocks.length,
    phase: upcoming ? 'upcoming' : today > endDate ? 'ended' : 'running',
    week,
    startDate,
    endDate,
    next: blocks[index + 1] ?? null,
  };
}

/** Block für ein heute gestartetes Training; `null` ohne laufenden Block */
export function workoutBlockFor(
  plan: Pick<Plan, 'blocks' | 'blockProgress' | 'blockAdjust'>,
  today: DayKey,
): WorkoutBlock | null {
  const status = blockStatus(plan, today);
  if (!status || status.phase === 'upcoming') return null;
  const { kind, weeks, setsPercent, loadPercent, repShift, progression } = status.block;
  return {
    kind,
    index: status.index,
    week: status.week,
    weeks,
    setsPercent,
    loadPercent,
    repShift,
    progression,
    adjusted: plan.blockAdjust && !isNeutralAdjustment(status.block),
  };
}

/** z. B. `Aufbau · Woche 2 von 4` */
export function formatBlockWeek(block: { kind: BlockKind; week: number; weeks: number }): string {
  return `${BLOCK_KIND_LABELS[block.kind]} · Woche ${block.week} von ${block.weeks}`;
}

export function formatWeeks(weeks: number): string {
  return weeks === 1 ? '1 Woche' : `${weeks} Wochen`;
}

const signed = (value: number) => (value > 0 ? `+${value}` : `−${Math.abs(value)}`);

/** Abweichungen vom normalen Training, z. B. `50 % Sätze · 90 % Gewicht · ohne Overload` */
export function formatAdjustment(adjustment: BlockAdjustment): string {
  const parts = [
    adjustment.setsPercent !== 100 && `${adjustment.setsPercent} % Sätze`,
    adjustment.loadPercent !== 100 && `${adjustment.loadPercent} % Gewicht`,
    adjustment.repShift !== 0 && `Wdh. ${signed(adjustment.repShift)}`,
    !adjustment.progression && 'ohne Overload',
  ].filter((part): part is string => !!part);
  return parts.length > 0 ? parts.join(' · ') : 'wie gewohnt';
}

/** Arbeitssätze im Block, mindestens 1 */
export function blockSetCount(count: number, setsPercent: number): number {
  return Math.max(1, Math.round((count * setsPercent) / 100));
}

/** Wdh.-Bereich im Block, Untergrenze mindestens 1 */
export function shiftRepRange(
  range: { min: number; max: number },
  shift: number,
): { min: number; max: number } {
  return { min: Math.max(1, range.min + shift), max: Math.max(1, range.max + shift) };
}

/**
 * Last im Block, gerundet auf den Gewichtssprung (2,5 kg bzw. 5 lb). Kein Gewicht, 0 und
 * Unterstützung (negativ) bei Körpergewichtsübungen bleiben unverändert.
 */
export function scaleWeight(weight: number | null, percent: number, stepKg: number): number | null {
  if (weight === null || weight <= 0 || percent === 100) return weight;
  const scaled = Math.round((weight * percent) / 100 / stepKg) * stepKg;
  return roundTo(Math.max(stepKg, scaled), 4);
}

export function scaleLevel(level: number | null, percent: number): number | null {
  if (level === null || level <= 0 || percent === 100) return level;
  return Math.max(1, Math.round((level * percent) / 100));
}

/** Nächster Block bzw. Neustart am Ende der Abfolge */
export function nextBlockIndex(status: Pick<BlockStatus, 'index' | 'count'>): number {
  return status.index + 1 < status.count ? status.index + 1 : 0;
}
