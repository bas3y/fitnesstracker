import type { DashboardWidget, WidgetSize } from '../db/types';

/** Mögliche Größen je Widget; die erste ist der Standard */
export const WIDGET_SIZE_OPTIONS: Record<DashboardWidget, readonly WidgetSize[]> = {
  quickActions: ['medium'],
  habits: ['large', 'medium', 'small'],
  todos: ['large', 'medium', 'small'],
  week: ['medium', 'large', 'small'],
  progress: ['large', 'small'],
  lastWorkout: ['medium'],
  records: ['large', 'medium'],
  activity: ['large'],
  nextTraining: ['large', 'medium'],
  daily: ['medium'],
  supplements: ['large', 'small'],
  nutrition: ['large', 'small'],
  endurance: ['large', 'small'],
  goals: ['large', 'small'],
  motivation: ['large', 'small'],
  steps: ['small', 'medium', 'large'],
  water: ['small', 'medium', 'large'],
  sleep: ['small', 'medium', 'large'],
};

const ORDER: readonly WidgetSize[] = ['small', 'medium', 'large'];

/** Größen zur Auswahl, klein nach groß */
export function sizeChoices(id: DashboardWidget): WidgetSize[] {
  return ORDER.filter((size) => WIDGET_SIZE_OPTIONS[id].includes(size));
}

/** Gespeicherte Größe, falls das Widget sie kann, sonst seine Standardgröße */
export function widgetSize(
  id: DashboardWidget,
  sizes: Partial<Record<DashboardWidget, WidgetSize>>,
): WidgetSize {
  const chosen = sizes[id];
  const options = WIDGET_SIZE_OPTIONS[id];
  return chosen && options.includes(chosen) ? chosen : options[0]!;
}
