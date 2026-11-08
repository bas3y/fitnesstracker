import type { LogoVariant } from '../brand/logo';
import type { IconName } from '../components/iconPaths';

/** ISO-8601-Zeitstempel, z. B. `2026-10-28T09:15:00.000Z` */
export type Timestamp = string;

export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Soft-Delete: `null` = aktiv */
  deletedAt: Timestamp | null;
}

export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'km' | 'mi';
export type ThemePreference = 'system' | 'light' | 'dark';
/** Farbpaletten (seit DB-Version 29, `basey` seit 32), Farben in `src/index.css` */
export const COLOR_PALETTES = ['basey', 'green', 'red', 'blue', 'graphite', 'violet'] as const;
export type ColorPalette = (typeof COLOR_PALETTES)[number];

export interface Settings extends BaseEntity {
  name: string;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  bodyWeightKg: number | null;
  theme: ThemePreference;
  /** Farbpalette (seit DB-Version 29) */
  palette: ColorPalette;
  /** Variante des Basey-Logos in der App und beim Start (seit DB-Version 32) */
  logoVariant: LogoVariant;
  lastBackupAt: Timestamp | null;
  /** Stand der mitgelieferten Daten (`0` = noch nicht eingespielt) */
  seedVersion: number;
  /** Aus = nach dem Abhaken startet kein Timer, auch nicht mit der Pausenzeit eines Plans */
  restTimerEnabled: boolean;
  /** Standard-Pausenzeit nach einem abgehakten Satz */
  restTimerSeconds: number;
  restTimerSound: boolean;
  restTimerVibrate: boolean;
  /** Erweiterter Modus: Auswirkung der Satzpausen in der Statistik anzeigen */
  restAnalysisEnabled: boolean;
  /** Plan, aus dem das heutige Training vorgeschlagen wird */
  activePlanId: string | null;
  /** Sichtbare Widgets auf dem Dashboard, in Anzeigereihenfolge */
  dashboardWidgets: DashboardWidget[];
  /** Gewählte Größe je Widget (seit DB-Version 31); fehlt = Standardgröße */
  widgetSizes: Partial<Record<DashboardWidget, WidgetSize>>;
  /** Buttons im Widget „Schnellzugriff“, in Anzeigereihenfolge */
  quickActions: QuickAction[];
  // Tagesziele
  stepsGoal: number;
  waterGoalMl: number;
  sleepGoalSeconds: number;
  // Supplements
  /** Warnung, wenn der Bestand nur noch so viele Tage reicht */
  supplementLowStockDays: number;
  /** Hinweis in der App, wenn eine Einnahme fällig ist */
  supplementRemindersEnabled: boolean;
  /** Zusätzlich Mitteilung des Systems, solange die App im Hintergrund noch läuft */
  supplementNotificationsEnabled: boolean;
  /** Tagesziele Ernährung, getrennt nach Trainings- und Ruhetag */
  nutritionGoals: NutritionGoals;
  /** Kalorien der Ausdauer-Einheiten erhöhen das kcal-Ziel des Tages */
  addBurnedCalories: boolean;
  /** Ernährung nur als Protein-Menge erfassen (ohne Lebensmittel und Kalorien, seit DB-Version 21) */
  proteinOnly: boolean;
  /** Willkommens-Hinweis auf der Startseite gesehen (seit DB-Version 21) */
  welcomeDismissed: boolean;
  /** Sichtbare Aktivitäts-Kacheln auf der Trainingsseite, in Anzeigereihenfolge */
  trainingTiles: EnduranceSport[];
  /** Für die Pulszonen; `null` = nicht eingetragen */
  maxHeartRate: number | null;
  /** Mit Ruhepuls werden die Zonen nach Karvonen (Herzfrequenzreserve) berechnet */
  restingHeartRate: number | null;
  /** Zähl-Gewohnheit, die gelesene Seiten automatisch mitzählt (seit DB-Version 25) */
  readingHabitId: string | null;
  // Seit DB-Version 26
  /** Zuletzt gewählte Einstellungen des Fokus-/Meditations-Timers */
  timerPresets: TimerPresets;
  /** Laufender Timer (höchstens einer); `null` = keiner */
  activeTimer: ActiveTimer | null;
  /** Gewohnheit (Zählen: Minuten, Abhaken: erledigt), die Fokus-Sitzungen mitzählt */
  focusHabitId: string | null;
  meditationHabitId: string | null;
  // Seit DB-Version 27
  /** Trainingsserie: so viele Trainings (Kraft + Ausdauer) pro Woche halten die Serie */
  trainingWeekTarget: number;
  /** Schon gemeldete Erfolge; `null` = noch nie geprüft (der erste Abgleich meldet nichts) */
  celebrations: Celebrations | null;
}

/** Bereits gezeigte Hinweise, damit jeder Erfolg nur einmal gemeldet wird */
export interface Celebrations {
  /** Abzeichen → höchste gemeldete Stufe (1 = erste) */
  badges: Record<string, number>;
  /** Ziel → Schlüssel des gemeldeten Erreichens (`once` bzw. Beginn des Zeitraums) */
  goals: Record<string, string>;
}

export const DASHBOARD_WIDGETS = [
  'quickActions',
  'habits',
  'todos',
  'week',
  'progress',
  'lastWorkout',
  'records',
  'activity',
  'nextTraining',
  'daily',
  'supplements',
  'nutrition',
  'endurance',
  'goals',
  'motivation',
  'steps',
  'water',
  'sleep',
] as const;
export type DashboardWidget = (typeof DASHBOARD_WIDGETS)[number];
/** Klein = halbe Breite, nur der Wert; Mittel = kurz; Groß = mit Details (seit DB-Version 31) */
export const WIDGET_SIZES = ['small', 'medium', 'large'] as const;
export type WidgetSize = (typeof WIDGET_SIZES)[number];
/** Standardaufbau seit DB-Version 14 (bestehende Startseiten wurden einmalig umgestellt) */
export const DEFAULT_DASHBOARD_WIDGETS: readonly DashboardWidget[] = [
  'quickActions',
  'habits',
  'todos',
  'week',
  'progress',
];
/** Standard bis DB-Version 13 (für die Migrationstests und alte Sicherungen) */
export const LEGACY_DASHBOARD_WIDGETS: readonly DashboardWidget[] = [
  'week',
  'lastWorkout',
  'records',
  'activity',
];

/** Neue Bereiche (Ernährung, Supplements, Ausdauer …) ergänzen hier ihren Button */
export const QUICK_ACTIONS = [
  'training',
  'water',
  'weight',
  'steps',
  'todo',
  'measurements',
  'supplements',
  'meal',
  'protein',
  'endurance',
  'journal',
  'reading',
  'timer',
  'photo',
] as const;
export type QuickAction = (typeof QUICK_ACTIONS)[number];
export const DEFAULT_QUICK_ACTIONS: readonly QuickAction[] = [
  'training',
  'water',
  'weight',
  'todo',
];

/** `builtin` = aus `src/data/`, wird per Seed aktualisiert; `user` = selbst angelegt, nie überschrieben */
export type DataSource = 'builtin' | 'user';

export const EXERCISE_CATEGORIES = ['strength', 'cardio', 'mobility'] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const MUSCLE_GROUPS = [
  'chest',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'lats',
  'upperBack',
  'traps',
  'lowerBack',
  'neck',
  'abs',
  'glutes',
  'quads',
  'hamstrings',
  'adductors',
  'abductors',
  'calves',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'kettlebell',
  'ezBar',
  'trapBar',
  'cable',
  'machine',
  'smith',
  'bodyweight',
  'bands',
  'medicineBall',
  'exerciseBall',
  'foamRoller',
  'other',
  'none',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export interface Exercise extends BaseEntity {
  source: DataSource;
  /** Stabiler Schlüssel aus `exercises.json`, `null` bei eigenen Übungen */
  builtinKey: string | null;
  name: string;
  aliases: string[];
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  isUnilateral: boolean;
  /** Dauer statt Wiederholungen erfassen (Halteübungen, Ausdauer, Dehnen) */
  isTimed: boolean;
  // Nutzerangaben – werden vom Seed nie überschrieben
  isFavorite: boolean;
  /** Vom Nutzer ausgeblendet (getrennt von `deletedAt`, das der Seed für entfernte Einträge setzt) */
  hiddenAt: Timestamp | null;
  notes: string;
  /** Belastung als Gewicht oder als Stufe (Maschinen ohne kg-Anzeige); zuletzt gewählte Variante */
  loadType: LoadType;
}

export const LOAD_TYPES = ['weight', 'level'] as const;
export type LoadType = (typeof LOAD_TYPES)[number];

/** Geräte, bei denen „Stufe“ statt Gewicht angeboten wird */
export const LEVEL_EQUIPMENT: readonly Equipment[] = [
  'machine',
  'cable',
  'smith',
  'bands',
  'other',
];

export interface Workout extends BaseEntity {
  startedAt: Timestamp;
  /** `null` = läuft noch (höchstens ein laufendes Workout) */
  endedAt: Timestamp | null;
  notes: string;
  /** Ende des laufenden Pausen-Timers; über den Zeitstempel läuft er auch nach Neustart weiter */
  restEndsAt: Timestamp | null;
  /** Herkunft aus einem Trainingsplan; `null` = freies Training */
  planId: string | null;
  planDayId: string | null;
  /** Trainingsblock des Plans beim Start; `null` = ohne Block */
  block: WorkoutBlock | null;
}

export interface WorkoutExercise extends BaseEntity {
  workoutId: string;
  exerciseId: string;
  order: number;
  // Zielwerte aus dem Plan (Kopie, damit spätere Planänderungen das Workout nicht berühren)
  repMin: number | null;
  repMax: number | null;
  targetDurationSeconds: number | null;
  /** Pausenzeit dieser Übung; `null` = Standard aus den Einstellungen */
  restSeconds: number | null;
}

export interface WorkoutSet extends BaseEntity {
  workoutId: string;
  workoutExerciseId: string;
  order: number;
  /** kg; bei Körpergewichtsübungen Zusatzgewicht (negativ = Unterstützung) */
  weight: number | null;
  /** Stufe an der Maschine statt Gewicht (dann `weight = null`) */
  level: number | null;
  /** Gewicht (kg) bzw. Stufe in der negativen Phase, falls die Maschine dort mehr gibt */
  eccentricWeight: number | null;
  eccentricLevel: number | null;
  reps: number | null;
  /** Halteübungen statt Wiederholungen */
  durationSeconds: number | null;
  rpe: number | null;
  rir: number | null;
  isWarmup: boolean;
  /** Pausenzeit, mit der der Timer nach diesem Satz gestartet wurde */
  restSeconds: number | null;
  /** `null` = noch nicht abgehakt */
  completedAt: Timestamp | null;
}

export const PLAN_SCHEDULES = ['rotation', 'weekdays'] as const;
/** `rotation` = Trainings der Reihe nach, `weekdays` = feste Wochentage */
export type PlanSchedule = (typeof PLAN_SCHEDULES)[number];

export const BLOCK_KINDS = ['build', 'deload', 'peak', 'test'] as const;
/** Art eines Trainingsblocks: Aufbau, Deload, Peak/Intensität, Test */
export type BlockKind = (typeof BLOCK_KINDS)[number];

/** Anpassung der Vorbefüllung in einem Block */
export interface BlockAdjustment {
  /** Anteil der geplanten Arbeitssätze (mindestens 1 Satz) */
  setsPercent: number;
  /** Anteil der Last vom letzten Mal (Gewicht bzw. Stufe) */
  loadPercent: number;
  /** Verschiebung des Wdh.-Bereichs und der Wdh. vom letzten Mal */
  repShift: number;
  /** Overload-Vorschlag (mehr Last/Wdh.) wie gewohnt */
  progression: boolean;
}

export interface PlanBlock extends BlockAdjustment {
  id: string;
  kind: BlockKind;
  weeks: number;
}

/** Laufender Block: Index in `Plan.blocks` und sein erster Tag */
export interface PlanBlockProgress {
  index: number;
  startDate: DayKey;
}

export interface Plan extends BaseEntity {
  name: string;
  schedule: PlanSchedule;
  order: number;
  /** Abfolge der Trainingsblöcke; leer = ohne Blöcke */
  blocks: PlanBlock[];
  /** `null` = Blöcke nicht gestartet bzw. beendet */
  blockProgress: PlanBlockProgress | null;
  /** Sätze nach Block anpassen; `false` = Block nur anzeigen */
  blockAdjust: boolean;
}

/** Block zum Zeitpunkt des Trainings (Kopie wie die Zielwerte) */
export interface WorkoutBlock extends BlockAdjustment {
  kind: BlockKind;
  index: number;
  week: number;
  weeks: number;
  /** Vorbefüllung wurde angepasst – zählt nicht als Grundlage für den Overload */
  adjusted: boolean;
}

export interface PlanDay extends BaseEntity {
  planId: string;
  name: string;
  order: number;
  /** Wochentage wie `Date.getDay()` (0 = Sonntag); nur bei `schedule: 'weekdays'` wirksam */
  weekdays: number[];
}

export interface PlanExercise extends BaseEntity {
  planId: string;
  planDayId: string;
  exerciseId: string;
  order: number;
  targetSets: number;
  /** Aufwärmsätze vor den Arbeitssätzen (zählen nicht zu `targetSets`) */
  warmupSets: number;
  repMin: number;
  repMax: number;
  /** Nur Halteübungen */
  targetDurationSeconds: number | null;
  /** `null` = Standard aus den Einstellungen */
  restSeconds: number | null;
}

/** Lokaler Tag als `YYYY-MM-DD` */
export type DayKey = string;

/** Ein aktiver Eintrag je Tag; `null` = nicht erfasst */
export interface DailyLog extends BaseEntity {
  date: DayKey;
  steps: number | null;
  waterMl: number | null;
  sleepSeconds: number | null;
  /** 1–5 */
  sleepQuality: number | null;
  weightKg: number | null;
  /** 1–5 */
  mood: number | null;
  /** 1–5 */
  energy: number | null;
  /** Schläge pro Minute (seit DB-Version 19) */
  restingHeartRate: number | null;
  /** Millisekunden; Apple Watch misst SDNN, Garmin RMSSD (Nacht-Ø) */
  hrvMs: number | null;
  /** Nur aus dem Import; gehört zu `sleepSeconds` */
  sleepPhases: SleepPhases | null;
  /**
   * Schnell erfasstes Protein in Gramm (ohne Lebensmittel, seit DB-Version 21); zählt zusätzlich
   * zu den Mahlzeiten zum Protein des Tages, nicht zu den Kalorien
   */
  proteinGrams: number | null;
  /** Werte aus dem Import: ein neuer Import darf sie überschreiben, eigene Einträge nie */
  importedFields: DailyImportField[];
}

/** Sekunden je Schlafphase */
export interface SleepPhases {
  deep: number;
  light: number;
  rem: number;
  awake: number;
}

export const DAILY_IMPORT_FIELDS = ['steps', 'sleep', 'weight', 'restingHeartRate', 'hrv'] as const;
export type DailyImportField = (typeof DAILY_IMPORT_FIELDS)[number];

export const BODY_MEASURES = ['neck', 'chest', 'waist', 'hips', 'arm', 'thigh', 'calf'] as const;
export type BodyMeasure = (typeof BODY_MEASURES)[number];

/** Ein aktiver Eintrag je Tag; nur gemessene Stellen, Werte in Metern */
export interface BodyMeasurement extends BaseEntity {
  date: DayKey;
  values: Partial<Record<BodyMeasure, number>>;
}

export const HABIT_FREQUENCIES = ['daily', 'weekly', 'weekdays'] as const;
/** `daily` = jeden Tag, `weekly` = x-mal pro Woche, `weekdays` = feste Wochentage */
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

export const HABIT_GROUPS = ['morning', 'evening', 'other'] as const;
export type HabitGroup = (typeof HABIT_GROUPS)[number];

export const HABIT_KINDS = ['check', 'count', 'items', 'quit'] as const;
/**
 * `check` = abhaken, `count` = Menge bis zum Ziel, `items` = Unterpunkte (je abhakbar oder zählbar),
 * `quit` = aufhören/reduzieren: eingetragen werden nur Rückfälle, ein Tag ohne Eintrag ist geschafft
 */
export type HabitKind = (typeof HABIT_KINDS)[number];

/** Unterpunkt; `target === step` = ein Tipp erledigt ihn (Anzeige als Haken) */
export interface HabitItem {
  id: string;
  name: string;
  target: number;
  unit: string;
  step: number;
}

/** Pausiert ab `from` bis vor `to`; `to: null` = pausiert noch */
export interface HabitPause {
  from: DayKey;
  to: DayKey | null;
}

export interface Habit extends BaseEntity {
  name: string;
  /** Symbol (bis DB-Version 29 ein Emoji) */
  icon: IconName;
  kind: HabitKind;
  /** `count`: Tagesziel; `quit`: Tageslimit (0 = ganz aufhören); `check`/`items`: 1 */
  target: number;
  /** Einheit der Menge, z. B. „Seiten“; leer = Stück */
  unit: string;
  /** Schrittweite der Plus-Taste (`count`, `quit`) */
  step: number;
  /** Nur bei `kind: 'items'` */
  items: HabitItem[];
  /** Nur bei `kind: 'quit'`: Tag, ab dem gezählt wird */
  startDate: DayKey | null;
  frequency: HabitFrequency;
  /** Nur bei `frequency: 'weekly'` wirksam */
  timesPerWeek: number;
  /** Wie `Date.getDay()`; nur bei `frequency: 'weekdays'` wirksam */
  weekdays: number[];
  group: HabitGroup;
  order: number;
  pauses: HabitPause[];
  /** Archiviert = nicht mehr in Liste und Checkliste, Verlauf bleibt */
  archivedAt: Timestamp | null;
}

/**
 * Menge einer Gewohnheit (bzw. eines Unterpunkts) an einem Tag; höchstens ein aktiver Eintrag je
 * Gewohnheit, Unterpunkt und Tag. Menge 0 wird nicht gespeichert.
 */
export interface HabitCheck extends BaseEntity {
  habitId: string;
  /** `null` = die Gewohnheit selbst */
  itemId: string | null;
  date: DayKey;
  amount: number;
}

export const TODO_PRIORITIES = ['high', 'medium', 'low'] as const;
export type TodoPriority = (typeof TODO_PRIORITIES)[number];

/** Offene Aufgaben mit `date` vor heute wandern in den heutigen Tag */
export interface Todo extends BaseEntity {
  title: string;
  priority: TodoPriority;
  date: DayKey;
  completedAt: Timestamp | null;
}

export const SUPPLEMENT_TIMINGS = ['time', 'period', 'beforeTraining', 'afterTraining'] as const;
/** Zeitpunkt einer Dosis: feste Uhrzeit, Tageszeit oder rund ums Training */
export type SupplementTiming = (typeof SUPPLEMENT_TIMINGS)[number];

export const SUPPLEMENT_PERIODS = ['morning', 'noon', 'evening', 'night'] as const;
export type SupplementPeriod = (typeof SUPPLEMENT_PERIODS)[number];

export const SUPPLEMENT_SCHEDULES = ['daily', 'weekdays', 'training'] as const;
/** `training` = nur an Tagen mit passendem Training (`Supplement.trainingKind`) */
export type SupplementSchedule = (typeof SUPPLEMENT_SCHEDULES)[number];

export const TRAINING_KINDS = ['any', 'strength', 'endurance'] as const;
export type TrainingKind = (typeof TRAINING_KINDS)[number];

export interface SupplementDose {
  id: string;
  /** In der Einheit des Supplements */
  amount: number;
  timing: SupplementTiming;
  /** `HH:MM`, nur bei `timing: 'time'` */
  time: string | null;
  /** Nur bei `timing: 'period'` */
  period: SupplementPeriod | null;
}

export interface Supplement extends BaseEntity {
  name: string;
  /** z. B. „g“, „Kapseln“ */
  unit: string;
  /** Einnahmen pro fälligem Tag */
  doses: SupplementDose[];
  schedule: SupplementSchedule;
  /** Wie `Date.getDay()`; nur bei `schedule: 'weekdays'` wirksam */
  weekdays: number[];
  /** Nur bei `schedule: 'training'` wirksam */
  trainingKind: TrainingKind;
  /** Aktueller Bestand in `unit`; `null` = wird nicht erfasst */
  stock: number | null;
  /** Menge einer Packung („Neue Packung“ addiert sie) */
  packageSize: number | null;
  notes: string;
  order: number;
  /** Archiviert = nicht mehr in Liste und Checkliste, Verlauf bleibt */
  archivedAt: Timestamp | null;
}

/** Einnahme einer Dosis an einem Tag; höchstens ein aktiver Eintrag je Dosis und Tag */
export interface SupplementIntake extends BaseEntity {
  supplementId: string;
  doseId: string;
  date: DayKey;
  amount: number;
  takenAt: Timestamp;
  /** Vom Bestand abgezogene Menge (wird beim Zurücknehmen wieder gutgeschrieben) */
  stockDeducted: number;
}

export const FOOD_CATEGORIES = [
  'fruit',
  'vegetables',
  'legumes',
  'grains',
  'bread',
  'dairy',
  'eggs',
  'meat',
  'sausage',
  'fish',
  'nuts',
  'fats',
  'sweets',
  'beverages',
  'protein',
  'condiments',
  'dishes',
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export interface FoodPortion {
  label: string;
  grams: number;
}

/** Nährwerte in Gramm (bzw. kcal); Kohlenhydrate wie in der EU ohne Ballaststoffe */
export interface Nutrients {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  alcohol: number;
}

export interface RecipeIngredient {
  id: string;
  foodId: string;
  grams: number;
}

export interface Recipe {
  ingredients: RecipeIngredient[];
  /** Gewicht nach dem Kochen; `null` = Summe der Zutaten */
  cookedWeightGrams: number | null;
  /** Anzahl Portionen, die das Rezept ergibt */
  servings: number;
}

/** Nährwerte pro 100 g; Kohlenhydrate wie in der EU ohne Ballaststoffe */
export interface Food extends BaseEntity, Nutrients {
  source: DataSource;
  builtinKey: string | null;
  name: string;
  aliases: string[];
  category: FoodCategory;
  portions: FoodPortion[];
  /** Herkunft, z. B. `usda:171688`, `manual` oder `null` bei eigenen Lebensmitteln */
  sourceRef: string | null;
  // Nutzerangaben – werden vom Seed nie überschrieben
  isFavorite: boolean;
  /** Vom Nutzer ausgeblendet (getrennt von `deletedAt`, das der Seed für entfernte Einträge setzt) */
  hiddenAt: Timestamp | null;
  /** Nur eigene Rezepte; Nährwerte und Portion werden aus den Zutaten berechnet */
  recipe: Recipe | null;
  /** Strichcode (GTIN, normalisiert über `normalizeBarcode`), nur eigene Lebensmittel */
  barcode: string | null;
}

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

/** Gewählte Portion einer Mahlzeit, z. B. 2 × „1 Ei“ à 60 g */
export interface MealPortion {
  label: string;
  grams: number;
  count: number;
}

/**
 * Lebensmittel in einer Mahlzeit. Name und Nährwerte werden beim Eintragen kopiert, damit spätere
 * Änderungen am Lebensmittel (oder am Seed) vergangene Tage nicht verändern.
 */
export interface MealEntry extends BaseEntity {
  date: DayKey;
  meal: MealType;
  foodId: string;
  name: string;
  /** Gesamtmenge */
  grams: number;
  /** `null` = in Gramm eingegeben */
  portion: MealPortion | null;
  /** Pro 100 g */
  nutrients: Nutrients;
}

export interface SavedMealItem {
  id: string;
  foodId: string;
  grams: number;
  portion: MealPortion | null;
}

/** Lieblingsmahlzeit: wird mit einem Tipp in eine Mahlzeit eingetragen (aktuelle Nährwerte) */
export interface SavedMeal extends BaseEntity {
  name: string;
  items: SavedMealItem[];
}

/** `carbs`/`fat`: `null` = kein Ziel */
export interface NutritionGoal {
  kcal: number;
  protein: number;
  carbs: number | null;
  fat: number | null;
}

export interface NutritionGoals {
  /** Tage mit Workout */
  training: NutritionGoal;
  rest: NutritionGoal;
}

export const ENDURANCE_SPORTS = ['run', 'ride', 'swim', 'hike', 'mobility', 'other'] as const;
export type EnduranceSport = (typeof ENDURANCE_SPORTS)[number];

export const SWIM_STROKES = [
  'freestyle',
  'breaststroke',
  'backstroke',
  'butterfly',
  'mixed',
] as const;
export type SwimStroke = (typeof SWIM_STROKES)[number];

export const ENDURANCE_SOURCES = ['manual', 'import'] as const;
export type EnduranceSource = (typeof ENDURANCE_SOURCES)[number];

/** Herkunft einer importierten Einheit (Schritt 14) */
export interface EnduranceImportInfo {
  /** z. B. `fit`, `gpx`, `tcx` */
  format: string;
  fileName: string | null;
  device: string | null;
}

/** Ausdauer-Einheit (Laufen, Rad …); Werte intern in Metern/Sekunden */
export interface EnduranceSession extends BaseEntity {
  sport: EnduranceSport;
  /** Leer = Name der Sportart */
  title: string;
  startedAt: Timestamp;
  durationSeconds: number;
  distanceMeters: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  elevationGainMeters: number | null;
  calories: number | null;
  /** 1–5 */
  rating: number | null;
  notes: string;
  gearId: string | null;
  // Nur Schwimmen
  poolLengthMeters: number | null;
  laps: number | null;
  swimStroke: SwimStroke | null;
  swolf: number | null;
  source: EnduranceSource;
  importInfo: EnduranceImportInfo | null;
  /** Aus dem Verlauf berechnet (seit DB-Version 20), `null` = kein Verlauf */
  trackSummary: TrackSummary | null;
}

/** Schnellste Zeit über eine Strecke innerhalb einer Einheit */
export interface BestEffort {
  meters: number;
  seconds: number;
}

/** [Puls in bpm, Sekunden], aufsteigend nach Puls */
export type HeartRateSeconds = [number, number][];

export interface TrackSummary {
  bestEfforts: BestEffort[];
  heartRateSeconds: HeartRateSeconds;
}

/** Runde bzw. Intervall laut Uhr */
export interface TrackLap {
  /** Sekunden ab Beginn der Einheit */
  startSeconds: number;
  durationSeconds: number;
  distanceMeters: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
}

/**
 * Verlauf einer importierten Einheit, getrennt gespeichert (Listen laden nur die Einheiten).
 * Messwerte spaltenweise, gleich lang wie `time`.
 */
export interface EnduranceTrack extends BaseEntity {
  sessionId: string;
  /** Sekunden ab Beginn (Uhrzeit, Pausen sind Lücken) */
  time: number[];
  /** Zurückgelegte Strecke in m */
  distance: (number | null)[];
  heartRate: (number | null)[];
  /** Höhe in m */
  altitude: (number | null)[];
  /** Vereinfachte Strecke als [Breite, Länge] in Grad, leer ohne GPS */
  route: [number, number][];
  laps: TrackLap[];
}

export const GOAL_KINDS = ['strength', 'effort', 'bodyWeight', 'total', 'habit', 'custom'] as const;
/**
 * `strength` = Bestwert einer Übung, `effort` = Bestzeit über eine Strecke,
 * `bodyWeight` = Zielgewicht, `total` = Menge in einem Zeitraum (z. B. Trainings pro Monat),
 * `habit` = aus einer Gewohnheit, `custom` = eigenes Ziel mit selbst eingetragenem Fortschritt
 */
export type GoalKind = (typeof GOAL_KINDS)[number];

export const STRENGTH_GOAL_METRICS = ['weight', 'oneRepMax', 'reps', 'duration'] as const;
export type StrengthGoalMetric = (typeof STRENGTH_GOAL_METRICS)[number];

export const TOTAL_GOAL_METRICS = [
  'workouts',
  'trainings',
  'distance',
  'duration',
  'steps',
  'stepsGoalDays',
  'waterGoalDays',
  'sleepGoalDays',
  'pages',
  'books',
  'focusTime',
  'meditationTime',
] as const;
/**
 * `workouts` = Krafttrainings, `trainings` = Krafttrainings + Ausdauer-Einheiten,
 * `steps` = Schritte gesamt, `…GoalDays` = Tage mit erreichtem Tagesziel (aktuelle Einstellungen),
 * `pages` = gelesene Seiten, `books` = beendete Bücher (seit DB-Version 25),
 * `focusTime`/`meditationTime` = Timer-Sitzungen in Sekunden (seit DB-Version 26)
 */
export type TotalGoalMetric = (typeof TOTAL_GOAL_METRICS)[number];

export const HABIT_GOAL_METRICS = ['amount', 'days', 'streak', 'limit'] as const;
/**
 * `amount` = Summe der Menge (`count`), `days` = erledigte Tage (`check`/`count`/`items`),
 * `streak` = Tage am Stück im Limit (`quit`), `limit` = höchstens so viel im Zeitraum (`quit`)
 */
export type HabitGoalMetric = (typeof HABIT_GOAL_METRICS)[number];

export const CUSTOM_GOAL_TYPES = ['number', 'check'] as const;
/** `number` = Zielwert mit Einheit, `check` = Ja/Nein (abhaken) */
export type CustomGoalType = (typeof CUSTOM_GOAL_TYPES)[number];

export const GOAL_PERIODS = ['week', 'month', 'year', 'custom'] as const;
/** Wiederkehrend je Kalenderwoche/-monat/-jahr oder einmalig von `startDate` bis `deadline` */
export type GoalPeriod = (typeof GOAL_PERIODS)[number];

/** Ziel (seit DB-Version 23); der Fortschritt wird immer aus den Daten berechnet */
export interface Goal extends BaseEntity {
  kind: GoalKind;
  /** Leer = automatisch aus Art und Zielwert */
  title: string;
  /** Intern: kg, Wdh., Sekunden, Meter oder Anzahl */
  target: number;
  /** Angelegt bzw. Beginn des Zeitraums (`period: 'custom'`) */
  startDate: DayKey;
  /** Zieldatum bzw. Ende des Zeitraums; `null` = ohne */
  deadline: DayKey | null;
  // Nur `strength`
  exerciseId: string | null;
  strengthMetric: StrengthGoalMetric | null;
  /** Nur `weight`: Ein Satz zählt erst ab so vielen Wdh.; `null` = ab 1 */
  minReps: number | null;
  /** `effort`: Pflicht; `total` (Strecke/Dauer): `null` = alle Sportarten */
  sport: EnduranceSport | null;
  /** Nur `effort` */
  effortMeters: number | null;
  /** Nur `bodyWeight`: Gewicht zu Beginn (gibt die Richtung vor) */
  startValue: number | null;
  /** Nur `total` */
  totalMetric: TotalGoalMetric | null;
  /** `total` und `habit` (außer Serie): Pflicht */
  period: GoalPeriod | null;
  // Seit DB-Version 24
  /** Nur `habit` */
  habitId: string | null;
  habitMetric: HabitGoalMetric | null;
  /** Nur `custom` */
  customType: CustomGoalType | null;
  /** Nur `custom` mit Zahl, z. B. „Lektionen“ */
  unit: string;
  /** Symbol (bis DB-Version 29 ein Emoji); leer = Symbol der Art */
  icon: IconName | '';
}

/** Selbst eingetragener Fortschritt eines eigenen Ziels (seit DB-Version 24) */
export interface GoalEntry extends BaseEntity {
  goalId: string;
  date: DayKey;
  /** Ja/Nein: 1 */
  amount: number;
}

export const JOURNAL_KINDS = ['day', 'week'] as const;
/** `day` = Tagebuch, `week` = Wochenreflexion */
export type JournalKind = (typeof JOURNAL_KINDS)[number];

/** Eigene Frage im Journal bzw. in der Wochenreflexion (seit DB-Version 25) */
export interface JournalPrompt extends BaseEntity {
  kind: JournalKind;
  text: string;
  order: number;
  /** Entfernt: nicht mehr gefragt, alte Antworten bleiben lesbar */
  archivedAt: Timestamp | null;
}

/**
 * Journal-Eintrag (seit DB-Version 25); höchstens ein aktiver je Art und Tag bzw. Woche.
 * Ein leerer Eintrag wird gelöscht.
 */
export interface JournalEntry extends BaseEntity {
  kind: JournalKind;
  /** Tag bzw. Montag der Woche */
  date: DayKey;
  /** Tag: freier Text, Woche: Notizen */
  text: string;
  /** Nur Tag: bis zu drei Dinge, für die man dankbar ist (leere Felder als `''`) */
  gratitude: string[];
  /** Antworten je Frage: eigene Fragen über ihre ID, feste Wochenfragen über ihren Schlüssel */
  answers: Record<string, string>;
  /** Nur Woche: 1–5 */
  rating: number | null;
}

export const BOOK_STATUSES = ['reading', 'want', 'finished', 'abandoned'] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

/** Buch im Lese-Log (seit DB-Version 25) */
export interface Book extends BaseEntity {
  title: string;
  author: string;
  /** `null` = unbekannt */
  totalPages: number | null;
  status: BookStatus;
  /** Schon gelesene Seiten vor dem Erfassen in der App (zählen nicht zu Zielen) */
  startPage: number;
  startedOn: DayKey | null;
  /** Gelesen bzw. abgebrochen am */
  finishedOn: DayKey | null;
  /** 1–5 */
  rating: number | null;
}

/** Gelesene Seiten an einem Tag (seit DB-Version 25) */
export interface ReadingLog extends BaseEntity {
  bookId: string;
  date: DayKey;
  pages: number;
  /** Gewohnheit, bei der die Seiten mitgezählt wurden (wird beim Löschen wieder abgezogen) */
  habitId: string | null;
}

/** Notiz oder Zitat zu einem Buch (seit DB-Version 25) */
export interface BookNote extends BaseEntity {
  bookId: string;
  text: string;
  page: number | null;
}

export const TIMER_KINDS = ['focus', 'meditation'] as const;
export type TimerKind = (typeof TIMER_KINDS)[number];

export interface TimerPresets {
  focusMinutes: number;
  breakMinutes: number;
  /** Fokus-Runden je Sitzung (zwischen zwei Runden eine Pause) */
  rounds: number;
  meditationMinutes: number;
}

export type TimerPhaseType = 'focus' | 'break' | 'meditation';

export interface TimerPhase {
  type: TimerPhaseType;
  seconds: number;
}

/**
 * Laufender Timer, nur über Zeitstempel (läuft nach dem Neuladen weiter):
 * vergangene Zeit = (`pausedAt` ?? jetzt) − `startedAt` − `pausedSeconds` + `skippedSeconds`
 */
export interface ActiveTimer {
  kind: TimerKind;
  startedAt: Timestamp;
  phases: TimerPhase[];
  /** Gerade angehalten seit */
  pausedAt: Timestamp | null;
  /** Summe abgeschlossener Unterbrechungen */
  pausedSeconds: number;
  /** Übersprungene Pausenzeit (zählt nie als Fokus) */
  skippedSeconds: number;
}

/** Fokus- bzw. Meditations-Sitzung (seit DB-Version 26) */
export interface TimerSession extends BaseEntity {
  kind: TimerKind;
  /** Tag des Beginns */
  date: DayKey;
  /** `null` = nachgetragen */
  startedAt: Timestamp | null;
  /** Nur Fokus- bzw. Meditationszeit, ohne Pausen */
  durationSeconds: number;
  /** Fokus: abgeschlossene Runden; sonst `null` */
  rounds: number | null;
  note: string;
  /** Gewohnheit, bei der die Sitzung mitgezählt wurde */
  habitId: string | null;
  /** Dort eingetragene Menge (Minuten bzw. 1 beim Abhaken), wird beim Löschen abgezogen */
  habitAmount: number;
}

export const PHOTO_POSES = ['front', 'side', 'back', 'other'] as const;
export type PhotoPose = (typeof PHOTO_POSES)[number];

/** Fortschrittsfoto (seit DB-Version 26); die Bilddaten liegen in `photoFiles` */
export interface ProgressPhoto extends BaseEntity {
  date: DayKey;
  pose: PhotoPose;
  note: string;
  width: number;
  height: number;
  /** Größe von Bild und Vorschau zusammen */
  bytes: number;
}

export type PhotoVariant = 'full' | 'thumb';

/**
 * Bilddaten eines Fotos, je Größe eine Zeile. Getrennt vom Foto, damit Listen keine Bilder und
 * das Raster nur Vorschauen laden; wird beim Löschen des Fotos wirklich entfernt (Speicherplatz).
 */
export interface PhotoFile extends BaseEntity {
  photoId: string;
  variant: PhotoVariant;
  mimeType: string;
  data: ArrayBuffer;
}

/** Ausrüstung (z. B. Laufschuhe) mit Kilometerstand */
export interface Gear extends BaseEntity {
  name: string;
  /** Sportarten, bei denen die Ausrüstung zur Auswahl steht */
  sports: EnduranceSport[];
  /** Strecke vor dem Erfassen in der App */
  initialDistanceMeters: number;
  /** Warnung ab dieser Gesamtstrecke; `null` = keine */
  warnDistanceMeters: number | null;
  notes: string;
  /** Ausgemustert = nicht mehr zur Auswahl, Einheiten behalten sie */
  archivedAt: Timestamp | null;
}
