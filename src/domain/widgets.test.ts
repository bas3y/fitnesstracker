import { describe, expect, it } from 'vitest';
import { DASHBOARD_WIDGETS } from '../db/types';
import { DASHBOARD_WIDGET_LABELS } from './labels';
import {
  filterWidgets,
  sizeChoices,
  WIDGET_GROUP_OF,
  WIDGET_SIZE_OPTIONS,
  widgetSize,
} from './widgets';

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
