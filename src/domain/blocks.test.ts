import type { Plan } from '../db/types';
import {
  BLOCK_DEFAULTS,
  BLOCK_TEMPLATES,
  blocksFromTemplate,
  blockSetCount,
  blockStatus,
  formatAdjustment,
  formatBlockWeek,
  isNeutralAdjustment,
  newBlock,
  nextBlockIndex,
  scaleLevel,
  scaleWeight,
  shiftRepRange,
  workoutBlockFor,
} from './blocks';

type BlockPlan = Pick<Plan, 'blocks' | 'blockProgress' | 'blockAdjust'>;

const plan = (index: number, startDate: string, blockAdjust = true): BlockPlan => ({
  blocks: [newBlock('build', 3, 'a'), newBlock('deload', 1, 'b')],
  blockProgress: { index, startDate },
  blockAdjust,
});

describe('blockStatus', () => {
  it('zählt die Wochen ab dem Beginn des Blocks', () => {
    const p = plan(0, '2026-11-02');
    expect(blockStatus(p, '2026-11-02')).toMatchObject({ week: 1, phase: 'running' });
    expect(blockStatus(p, '2026-11-08')).toMatchObject({ week: 1, phase: 'running' });
    expect(blockStatus(p, '2026-11-09')).toMatchObject({ week: 2, phase: 'running' });
    expect(blockStatus(p, '2026-11-22')).toMatchObject({
      week: 3,
      phase: 'running',
      endDate: '2026-11-22',
    });
  });

  it('meldet das Ende und läuft danach weiter', () => {
    const status = blockStatus(plan(0, '2026-11-02'), '2026-11-23');
    expect(status).toMatchObject({ week: 4, phase: 'ended' });
    expect(status?.next?.kind).toBe('deload');
    expect(blockStatus(plan(1, '2026-11-23'), '2026-12-01')).toMatchObject({
      phase: 'ended',
      next: null,
    });
  });

  it('kennt Blöcke, die erst beginnen', () => {
    expect(blockStatus(plan(0, '2026-11-10'), '2026-11-07')).toMatchObject({
      phase: 'upcoming',
      week: 0,
    });
  });

  it('ist ohne Blöcke oder Fortschritt leer und hält den Index in der Abfolge', () => {
    expect(blockStatus({ ...plan(0, '2026-11-02'), blockProgress: null }, '2026-11-07')).toBeNull();
    expect(blockStatus({ blocks: [], blockProgress: null }, '2026-11-07')).toBeNull();
    expect(blockStatus(plan(5, '2026-11-02'), '2026-11-07')?.index).toBe(1);
  });
});

describe('workoutBlockFor', () => {
  it('übernimmt Block und Woche, angepasst nur bei abweichenden Werten', () => {
    expect(workoutBlockFor(plan(1, '2026-11-02'), '2026-11-04')).toEqual({
      kind: 'deload',
      index: 1,
      week: 1,
      weeks: 1,
      ...BLOCK_DEFAULTS.deload,
      adjusted: true,
    });
    expect(workoutBlockFor(plan(0, '2026-11-02'), '2026-11-04')?.adjusted).toBe(false);
  });

  it('passt bei ausgeschaltetem Anpassen nichts an', () => {
    expect(workoutBlockFor(plan(1, '2026-11-02', false), '2026-11-04')).toMatchObject({
      kind: 'deload',
      adjusted: false,
    });
  });

  it('gilt nicht vor dem Beginn', () => {
    expect(workoutBlockFor(plan(0, '2026-11-10'), '2026-11-07')).toBeNull();
  });
});

describe('Anpassungen', () => {
  it('rechnet Sätze, Wdh.-Bereich, Gewicht und Stufen um', () => {
    expect(blockSetCount(3, 50)).toBe(2);
    expect(blockSetCount(4, 50)).toBe(2);
    expect(blockSetCount(3, 35)).toBe(1);
    expect(blockSetCount(1, 10)).toBe(1);
    expect(shiftRepRange({ min: 8, max: 12 }, -2)).toEqual({ min: 6, max: 10 });
    expect(shiftRepRange({ min: 3, max: 5 }, -7)).toEqual({ min: 1, max: 1 });
    expect(scaleWeight(100, 90, 2.5)).toBe(90);
    expect(scaleWeight(62.5, 90, 2.5)).toBe(57.5);
    expect(scaleWeight(61, 100, 2.5)).toBe(61);
    expect(scaleWeight(2.5, 50, 2.5)).toBe(2.5);
    expect(scaleWeight(null, 90, 2.5)).toBeNull();
    expect(scaleWeight(-20, 90, 2.5)).toBe(-20);
    expect(scaleWeight(0, 110, 2.5)).toBe(0);
    expect(scaleLevel(10, 90)).toBe(9);
    expect(scaleLevel(1, 50)).toBe(1);
    expect(scaleLevel(null, 90)).toBeNull();
  });

  it('beschreibt Abweichungen', () => {
    expect(formatAdjustment(BLOCK_DEFAULTS.build)).toBe('wie gewohnt');
    expect(formatAdjustment(BLOCK_DEFAULTS.deload)).toBe(
      '50 % Sätze · 90 % Gewicht · ohne Overload',
    );
    expect(formatAdjustment(BLOCK_DEFAULTS.peak)).toBe('105 % Gewicht · Wdh. −2 · ohne Overload');
    expect(formatAdjustment({ ...BLOCK_DEFAULTS.build, repShift: 2 })).toBe('Wdh. +2');
    expect(isNeutralAdjustment(BLOCK_DEFAULTS.build)).toBe(true);
    expect(isNeutralAdjustment(BLOCK_DEFAULTS.test)).toBe(false);
    expect(formatBlockWeek({ kind: 'build', week: 2, weeks: 4 })).toBe('Aufbau · Woche 2 von 4');
  });
});

describe('Vorlagen und Abfolge', () => {
  it('legt Blöcke mit Standardwerten und eigenen IDs an', () => {
    const blocks = blocksFromTemplate(BLOCK_TEMPLATES[0]!);
    expect(blocks.map(({ kind, weeks }) => [kind, weeks])).toEqual([
      ['build', 3],
      ['deload', 1],
    ]);
    expect(blocks[1]).toMatchObject(BLOCK_DEFAULTS.deload);
    expect(new Set(blocks.map((block) => block.id)).size).toBe(2);
  });

  it('beginnt nach dem letzten Block von vorn', () => {
    expect(nextBlockIndex({ index: 0, count: 2 })).toBe(1);
    expect(nextBlockIndex({ index: 1, count: 2 })).toBe(0);
  });
});
