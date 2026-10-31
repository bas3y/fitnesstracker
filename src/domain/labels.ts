import type {
  DashboardWidget,
  Equipment,
  ExerciseCategory,
  FoodCategory,
  MuscleGroup,
} from '../db/types';

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidget, { name: string; hint: string }> = {
  week: { name: 'Diese Woche', hint: 'Workouts, Sätze und Volumen' },
  lastWorkout: { name: 'Letztes Workout', hint: 'Dein letztes Training auf einen Blick' },
  records: { name: 'Erfolge', hint: 'Deine neuesten Rekorde' },
  activity: { name: 'Trainingstage', hint: 'Heatmap der letzten 3 Monate' },
  nextTraining: { name: 'Nächstes Training', hint: 'Vorschlag aus deinem Plan mit Startknopf' },
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
