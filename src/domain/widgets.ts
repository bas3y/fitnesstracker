import type { DashboardWidget, WidgetSize } from '../db/types';
import { normalizeSearchText } from './search';

/** Bereiche zum Filtern in „Weitere Widgets“ (Nachtrag 22b) */
export const WIDGET_GROUPS = ['training', 'daily', 'motivation'] as const;
export type WidgetGroup = (typeof WIDGET_GROUPS)[number];

export const WIDGET_GROUP_LABELS: Record<WidgetGroup, string> = {
  training: 'Training',
  daily: 'Alltag',
  motivation: 'Ziele & Erfolge',
};

export const WIDGET_GROUP_OF: Record<DashboardWidget, WidgetGroup> = {
  quickActions: 'daily',
  habits: 'daily',
  todos: 'daily',
  week: 'training',
  progress: 'training',
  lastWorkout: 'training',
  records: 'training',
  activity: 'training',
  nextTraining: 'training',
  daily: 'daily',
  supplements: 'daily',
  nutrition: 'daily',
  endurance: 'training',
  goals: 'motivation',
  motivation: 'motivation',
  steps: 'daily',
  water: 'daily',
  sleep: 'daily',
  dayHint: 'daily',
};

/** Widgets eines Bereichs (`null` = alle), deren Name die Suche enthält (Umlaute egal) */
export function filterWidgets(
  widgets: readonly DashboardWidget[],
  names: Record<DashboardWidget, string>,
  group: WidgetGroup | null,
  query: string,
): DashboardWidget[] {
  const needle = normalizeSearchText(query);
  return widgets.filter(
    (id) =>
      (group === null || WIDGET_GROUP_OF[id] === group) &&
      (needle === '' || normalizeSearchText(names[id]).includes(needle)),
  );
}

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
  dayHint: ['medium'],
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
