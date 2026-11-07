import type {
  BookStatus,
  BodyMeasure,
  DailyImportField,
  DashboardWidget,
  EnduranceSport,
  Equipment,
  ExerciseCategory,
  FoodCategory,
  GoalKind,
  GoalPeriod,
  TotalGoalMetric,
  MealType,
  MuscleGroup,
  QuickAction,
  SwimStroke,
} from '../db/types';

export const DAILY_IMPORT_FIELD_LABELS: Record<DailyImportField, string> = {
  steps: 'Schritte',
  sleep: 'Schlaf',
  weight: 'Gewicht',
  restingHeartRate: 'Ruhepuls',
  hrv: 'HRV',
};

export const ENDURANCE_SPORT_LABELS: Record<EnduranceSport, { name: string; icon: string }> = {
  run: { name: 'Laufen', icon: '🏃' },
  ride: { name: 'Radfahren', icon: '🚴' },
  swim: { name: 'Schwimmen', icon: '🏊' },
  hike: { name: 'Wandern', icon: '🥾' },
  mobility: { name: 'Mobility & Yoga', icon: '🧘' },
  other: { name: 'Sonstiges', icon: '⏱️' },
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
  week: { name: 'Diese Woche', hint: 'Workouts, Sätze und Volumen' },
  lastWorkout: { name: 'Letztes Workout', hint: 'Dein letztes Training auf einen Blick' },
  records: { name: 'Erfolge', hint: 'Deine neuesten Rekorde' },
  activity: { name: 'Trainingstage', hint: 'Heatmap der letzten 3 Monate' },
  nextTraining: { name: 'Nächstes Training', hint: 'Vorschlag aus deinem Plan mit Startknopf' },
  daily: { name: 'Heute', hint: 'Schritte, Wasser, Schlaf und Gewicht' },
  supplements: { name: 'Supplements', hint: 'Heutige Einnahmen abhaken, Bestand im Blick' },
  nutrition: { name: 'Ernährung', hint: 'Kalorien und Protein heute' },
  endurance: { name: 'Ausdauer', hint: 'Strecke dieser Woche, letzte Einheit, Bestzeiten' },
  goals: { name: 'Ziele', hint: 'Fortschritt deiner Ziele' },
};

export const GOAL_KIND_LABELS: Record<GoalKind, { name: string; icon: string; hint: string }> = {
  strength: { name: 'Kraft', icon: '🏋️', hint: 'z. B. Bankdrücken 100 kg' },
  effort: { name: 'Bestzeit', icon: '⏱️', hint: 'z. B. 10 km unter 50 Minuten' },
  bodyWeight: { name: 'Gewicht', icon: '⚖️', hint: 'Zielgewicht, ab- oder zunehmen' },
  total: {
    name: 'Menge',
    icon: '📅',
    hint: 'z. B. 12 Trainings im Monat, 500 km im Jahr, 300.000 Schritte im Monat',
  },
  habit: {
    name: 'Gewohnheit',
    icon: '✅',
    hint: 'z. B. 1000 Seiten lesen, an 100 Tagen meditieren, 30 Tage rauchfrei',
  },
  custom: {
    name: 'Eigenes',
    icon: '🎯',
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

export const QUICK_ACTION_LABELS: Record<QuickAction, { name: string; icon: string }> = {
  training: { name: 'Training', icon: '🏋️' },
  water: { name: '+250 ml Wasser', icon: '💧' },
  weight: { name: 'Gewicht', icon: '⚖️' },
  steps: { name: 'Schritte', icon: '👣' },
  todo: { name: 'To-do', icon: '✅' },
  measurements: { name: 'Körpermaße', icon: '📏' },
  supplements: { name: 'Supplements', icon: '💊' },
  meal: { name: 'Mahlzeit', icon: '🍽️' },
  protein: { name: '+20 g Protein', icon: '🥤' },
  endurance: { name: 'Ausdauer', icon: '🏃' },
  journal: { name: 'Journal', icon: '📓' },
  reading: { name: 'Lesen', icon: '📚' },
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
