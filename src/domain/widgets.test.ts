import { describe, expect, it } from 'vitest';
import { DASHBOARD_WIDGETS } from '../db/types';
import { sizeChoices, WIDGET_SIZE_OPTIONS, widgetSize } from './widgets';

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
