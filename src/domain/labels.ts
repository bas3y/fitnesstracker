import type { IconName } from '../components/iconPaths';
import type {
  BlockKind,
  BookStatus,
  BodyMeasure,
  ColorPalette,
  DailyImportField,
  DashboardWidget,
  WidgetSize,
  EnduranceSport,
  Equipment,
  ExerciseCategory,
  FoodCategory,
  GoalKind,
  GoalPeriod,
  TotalGoalMetric,
  MealType,
  MuscleGroup,
  PhotoPose,
  QuickAction,
  SwimStroke,
  TimerKind,
  TimerPhaseType,
} from '../db/types';

export const BLOCK_KIND_LABELS: Record<BlockKind, string> = {
  build: 'Aufbau',
  deload: 'Deload',
  peak: 'Peak',
  test: 'Test',
};

export const PALETTE_LABELS: Record<ColorPalette, string> = {
  green: 'Grün',
  red: 'Rot',
  blue: 'Blau',
  graphite: 'Graphit',
  violet: 'Violett',
};

export const DAILY_IMPORT_FIELD_LABELS: Record<DailyImportField, string> = {
  steps: 'Schritte',
  sleep: 'Schlaf',
  weight: 'Gewicht',
  restingHeartRate: 'Ruhepuls',
  hrv: 'HRV',
};

export const ENDURANCE_SPORT_LABELS: Record<EnduranceSport, { name: string; icon: IconName }> = {
  run: { name: 'Laufen', icon: 'run' },
  ride: { name: 'Radfahren', icon: 'bike' },
  swim: { name: 'Schwimmen', icon: 'swim' },
  hike: { name: 'Wandern', icon: 'mountain' },
  mobility: { name: 'Mobility & Yoga', icon: 'yoga' },
  other: { name: 'Sonstiges', icon: 'timer' },
};

export const SWIM_STROKE_LABELS: Record<SwimStroke, string> = {
  freestyle: 'Kraul',
  breaststroke: 'Brust',
  backstroke: 'Rücken',
  butterfly: 'Delfin',
  mixed: 'Gemischt',
};

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidget, { name: string; hint: string }> = {
  quickActions: { name: 'Schnellzugriff', hint: 'Buttons für Training, Wasser, Gewicht und mehr' },
  habits: { name: 'Gewohnheiten', hint: 'Heute abhaken und zählen' },
  todos: { name: 'To-dos', hint: 'Offene Aufgaben für heute' },
  progress: { name: 'Trainingsfortschritt', hint: 'Kraftsteigerung, Workouts und Rekorde' },
  week: { name: 'Diese Woche', hint: 'Trainingstage und Wochenziel, Sätze und Volumen' },
  lastWorkout: { name: 'Letztes Workout', hint: 'Dein letztes Training auf einen Blick' },
  records: { name: 'Neue Rekorde', hint: 'Deine neuesten Kraft-Rekorde' },
  activity: { name: 'Trainingstage', hint: 'Heatmap der letzten 3 Monate' },
  nextTraining: { name: 'Nächstes Training', hint: 'Vorschlag aus deinem Plan mit Startknopf' },
  daily: { name: 'Heute', hint: 'Schritte, Wasser, Schlaf und Gewicht' },
  supplements: { name: 'Supplements', hint: 'Heutige Einnahmen abhaken, Bestand im Blick' },
  nutrition: { name: 'Ernährung', hint: 'Kalorien und Protein heute' },
  endurance: { name: 'Ausdauer', hint: 'Strecke dieser Woche, letzte Einheit, Bestzeiten' },
  goals: { name: 'Ziele', hint: 'Fortschritt deiner Ziele' },
  motivation: { name: 'Serien & Abzeichen', hint: 'Laufende Serien und nächstes Abzeichen' },
  steps: { name: 'Schritte', hint: 'Schritte heute und Tagesziel' },
  water: { name: 'Wasser', hint: 'Getrunken heute, schnell nachtragen' },
  sleep: { name: 'Schlaf', hint: 'Schlaf der letzten Nacht und Tagesziel' },
};

export const WIDGET_SIZE_LABELS: Record<WidgetSize, { short: string; name: string }> = {
  small: { short: 'S', name: 'Klein' },
  medium: { short: 'M', name: 'Mittel' },
  large: { short: 'L', name: 'Groß' },
};

export const GOAL_KIND_LABELS: Record<GoalKind, { name: string; icon: IconName; hint: string }> = {
  strength: { name: 'Kraft', icon: 'dumbbell', hint: 'z. B. Bankdrücken 100 kg' },
  effort: { name: 'Bestzeit', icon: 'timer', hint: 'z. B. 10 km unter 50 Minuten' },
  bodyWeight: { name: 'Gewicht', icon: 'scale', hint: 'Zielgewicht, ab- oder zunehmen' },
  total: {
    name: 'Menge',
    icon: 'calendar',
    hint: 'z. B. 12 Trainings im Monat, 500 km im Jahr, 300.000 Schritte im Monat',
  },
  habit: {
    name: 'Gewohnheit',
    icon: 'todo',
    hint: 'z. B. 1000 Seiten lesen, an 100 Tagen meditieren, 30 Tage rauchfrei',
  },
  custom: {
    name: 'Eigenes',
    icon: 'target',
    hint: 'Fortschritt selbst eintragen, z. B. 50 Lektionen Spanisch oder Führerschein machen',
  },
};

export const TOTAL_GOAL_METRIC_LABELS: Record<TotalGoalMetric, string> = {
  workouts: 'Krafttrainings',
  trainings: 'Trainings (Kraft + Ausdauer)',
  distance: 'Strecke',
  duration: 'Ausdauer-Zeit',
  steps: 'Schritte',
  stepsGoalDays: 'Tage mit erreichtem Schrittziel',
  waterGoalDays: 'Tage mit erreichtem Wasserziel',
  sleepGoalDays: 'Tage mit erreichtem Schlafziel',
  pages: 'Gelesene Seiten',
  books: 'Gelesene Bücher',
  focusTime: 'Fokus-Minuten',
  meditationTime: 'Meditationsminuten',
};

export const GOAL_PERIOD_LABELS: Record<GoalPeriod, string> = {
  week: 'Pro Woche',
  month: 'Pro Monat',
  year: 'Pro Jahr',
  custom: 'Eigener Zeitraum',
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snacks',
};

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  reading: 'Lese ich',
  want: 'Will ich lesen',
  finished: 'Gelesen',
  abandoned: 'Abgebrochen',
};

export const QUICK_ACTION_LABELS: Record<QuickAction, { name: string; icon: IconName }> = {
  training: { name: 'Training', icon: 'dumbbell' },
  water: { name: '+250 ml Wasser', icon: 'drop' },
  weight: { name: 'Gewicht', icon: 'scale' },
  steps: { name: 'Schritte', icon: 'footprints' },
  todo: { name: 'To-do', icon: 'todo' },
  measurements: { name: 'Körpermaße', icon: 'ruler' },
  supplements: { name: 'Supplements', icon: 'pill' },
  meal: { name: 'Mahlzeit', icon: 'utensils' },
  protein: { name: '+20 g Protein', icon: 'shaker' },
  endurance: { name: 'Ausdauer', icon: 'run' },
  journal: { name: 'Journal', icon: 'journal' },
  reading: { name: 'Lesen', icon: 'book' },
  timer: { name: 'Timer', icon: 'timer' },
  photo: { name: 'Foto', icon: 'camera' },
};

export const TIMER_KIND_LABELS: Record<TimerKind, { name: string; icon: IconName }> = {
  focus: { name: 'Fokus', icon: 'target' },
  meditation: { name: 'Meditation', icon: 'yoga' },
};

export const TIMER_PHASE_LABELS: Record<TimerPhaseType, string> = {
  focus: 'Fokus',
  break: 'Pause',
  meditation: 'Meditation',
};

export const PHOTO_POSE_LABELS: Record<PhotoPose, string> = {
  front: 'Vorne',
  side: 'Seite',
  back: 'Hinten',
  other: 'Sonstige',
};

export const BODY_MEASURE_LABELS: Record<BodyMeasure, string> = {
  neck: 'Hals',
  chest: 'Brust',
  waist: 'Taille',
  hips: 'Hüfte',
  arm: 'Arm',
  thigh: 'Oberschenkel',
  calf: 'Wade',
};

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: 'Kraft',
  cardio: 'Ausdauer',
  mobility: 'Beweglichkeit',
};

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Brust',
  shoulders: 'Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  forearms: 'Unterarme',
  lats: 'Latissimus',
  upperBack: 'Oberer Rücken',
  traps: 'Trapez',
  lowerBack: 'Unterer Rücken',
  neck: 'Nacken',
  abs: 'Bauch',
  glutes: 'Gesäß',
  quads: 'Oberschenkel vorne',
  hamstrings: 'Oberschenkel hinten',
  adductors: 'Adduktoren',
  abductors: 'Abduktoren',
  calves: 'Waden',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Langhantel',
  dumbbell: 'Kurzhantel',
  kettlebell: 'Kettlebell',
  ezBar: 'SZ-Stange',
  trapBar: 'Trap Bar',
  cable: 'Kabelzug',
  machine: 'Maschine',
  smith: 'Multipresse',
  bodyweight: 'Körpergewicht',
  bands: 'Widerstandsband',
  medicineBall: 'Medizinball',
  exerciseBall: 'Gymnastikball',
  foamRoller: 'Faszienrolle',
  other: 'Sonstiges',
  none: 'Ohne Gerät',
};

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  fruit: 'Obst',
  vegetables: 'Gemüse & Kräuter',
  legumes: 'Hülsenfrüchte & Soja',
  grains: 'Getreide, Reis & Nudeln',
  bread: 'Brot & Backwaren',
  dairy: 'Milch & Käse',
  eggs: 'Eier',
  meat: 'Fleisch & Geflügel',
  sausage: 'Wurst & Aufschnitt',
  fish: 'Fisch & Meeresfrüchte',
  nuts: 'Nüsse & Samen',
  fats: 'Öle & Fette',
  sweets: 'Süßes & Snacks',
  beverages: 'Getränke',
  protein: 'Proteinprodukte',
  condiments: 'Saucen & Gewürze',
  dishes: 'Gerichte & Fast Food',
};
