import { describe, expect, it } from 'vitest';
import { DASHBOARD_WIDGETS } from '../db/types';
import { DASHBOARD_WIDGET_LABELS } from './labels';
import {
  filterWidgets,
  sizeChoices,
  WIDGET_FIELDS,
  WIDGET_GRID_COLUMNS,
  WIDGET_GROUP_OF,
  WIDGET_SIZE_OPTIONS,
  widgetSize,
  widgetSpan,
} from './widgets';

describe('widgetSpan (Feldraster)', () => {
  it('Handy hoch: klein halbe Zeile, mittel und groß ganze Zeile', () => {
    const columns = WIDGET_GRID_COLUMNS.base;
    expect(widgetSpan('small', columns)).toBe(1);
    expect(widgetSpan('medium', columns)).toBe(columns);
    expect(widgetSpan('large', columns)).toBe(columns);
  });

  it('ab sm/lg: mittel = Handybreite, groß = doppelt so breit', () => {
    for (const columns of [WIDGET_GRID_COLUMNS.sm, WIDGET_GRID_COLUMNS.lg]) {
      expect(widgetSpan('small', columns)).toBe(1);
      expect(widgetSpan('medium', columns)).toBe(2);
      expect(widgetSpan('large', columns)).toBe(4);
    }
  });

  it('nie breiter als die Zeile und nie unter einem Feld', () => {
    expect(widgetSpan('large', 3)).toBe(3);
    expect(widgetSpan('small', 0)).toBe(1);
    expect(Object.values(WIDGET_FIELDS).every((fields) => fields >= 1)).toBe(true);
  });
});

describe('widgetSize', () => {
  it('nimmt ohne Auswahl die Standardgröße', () => {
    expect(widgetSize('steps', {})).toBe('small');
    expect(widgetSize('habits', {})).toBe('large');
    expect(widgetSize('week', {})).toBe('medium');
  });

  it('nimmt die gespeicherte Größe, wenn das Widget sie kann', () => {
    expect(widgetSize('habits', { habits: 'small' })).toBe('small');
    expect(widgetSize('activity', { activity: 'small' })).toBe('large');
  });

  it('jedes Widget hat mindestens eine Größe', () => {
    for (const id of DASHBOARD_WIDGETS) expect(WIDGET_SIZE_OPTIONS[id].length).toBeGreaterThan(0);
  });
});

describe('sizeChoices', () => {
  it('sortiert klein nach groß', () => {
    expect(sizeChoices('week')).toEqual(['small', 'medium', 'large']);
    expect(sizeChoices('goals')).toEqual(['small', 'large']);
    expect(sizeChoices('activity')).toEqual(['large']);
  });
});

describe('filterWidgets', () => {
  const names = Object.fromEntries(
    DASHBOARD_WIDGETS.map((id) => [id, DASHBOARD_WIDGET_LABELS[id].name]),
  ) as Record<(typeof DASHBOARD_WIDGETS)[number], string>;

  it('ordnet jedes Widget einem Bereich zu', () => {
    expect(Object.keys(WIDGET_GROUP_OF).sort()).toEqual([...DASHBOARD_WIDGETS].sort());
  });

  it('filtert nach Bereich und Suche (Umlaute egal), Reihenfolge bleibt', () => {
    expect(
      filterWidgets(['goals', 'water', 'week', 'motivation'], names, 'motivation', ''),
    ).toEqual(['goals', 'motivation']);
    expect(filterWidgets(['steps', 'nextTraining', 'water'], names, null, 'naechstes')).toEqual([
      'nextTraining',
    ]);
    expect(filterWidgets(['water', 'week'], names, 'training', 'wasser')).toEqual([]);
    expect(filterWidgets(['water', 'week'], names, null, '  ')).toEqual(['water', 'week']);
  });
});
