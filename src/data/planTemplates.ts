import type { PlanSchedule } from '../db/types';

export interface PlanTemplateExercise {
  /** `key` aus `exercises.json` */
  key: string;
  sets: number;
  reps: [min: number, max: number];
  durationSeconds?: number;
  restSeconds?: number;
}

export interface PlanTemplateDay {
  name: string;
  /** Wie `Date.getDay()` (0 = Sonntag) */
  weekdays: number[];
  exercises: PlanTemplateExercise[];
}

export interface PlanTemplate {
  key: string;
  name: string;
  description: string;
  schedule: PlanSchedule;
  days: PlanTemplateDay[];
}

const compound = (key: string, sets: number, min: number, max: number): PlanTemplateExercise => ({
  key,
  sets,
  reps: [min, max],
  restSeconds: 180,
});
const isolation = (key: string, sets = 3, min = 10, max = 15): PlanTemplateExercise => ({
  key,
  sets,
  reps: [min, max],
  restSeconds: 90,
});
const hold = (key: string, durationSeconds: number): PlanTemplateExercise => ({
  key,
  sets: 3,
  reps: [8, 12],
  durationSeconds,
  restSeconds: 60,
});
const plank = hold('plank', 45);

/** Vorlagen werden beim Auswählen als eigener Plan kopiert und sind danach frei änderbar */
export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    key: 'push-pull-legs',
    name: 'Push/Pull/Legs',
    description: 'Drei Trainings im Wechsel: Drücken, Ziehen, Beine',
    schedule: 'rotation',
    days: [
      {
        name: 'Push',
        weekdays: [],
        exercises: [
          compound('barbell-bench-press', 4, 6, 10),
          compound('overhead-press', 3, 6, 10),
          isolation('incline-dumbbell-press', 3, 8, 12),
          isolation('lateral-raise'),
          isolation('triceps-pushdown'),
        ],
      },
      {
        name: 'Pull',
        weekdays: [],
        exercises: [
          compound('pull-up', 4, 6, 10),
          compound('barbell-row', 3, 6, 10),
          isolation('seated-cable-row', 3, 8, 12),
          isolation('face-pull'),
          isolation('barbell-curl', 3, 8, 12),
        ],
      },
      {
        name: 'Legs',
        weekdays: [],
        exercises: [
          compound('barbell-squat', 4, 6, 10),
          compound('romanian-deadlift', 3, 8, 12),
          isolation('leg-press', 3, 10, 12),
          isolation('lying-leg-curl'),
          isolation('standing-calf-raise'),
        ],
      },
    ],
  },
  {
    key: 'five-by-five',
    name: '5×5',
    description: 'Zwei Grundübungs-Trainings im Wechsel, Ziel 5 Sätze mit je 5 Wdh.',
    schedule: 'rotation',
    days: [
      {
        name: 'Training A',
        weekdays: [],
        exercises: [
          compound('barbell-squat', 5, 5, 5),
          compound('barbell-bench-press', 5, 5, 5),
          compound('barbell-row', 5, 5, 5),
        ],
      },
      {
        name: 'Training B',
        weekdays: [],
        exercises: [
          compound('barbell-squat', 5, 5, 5),
          compound('overhead-press', 5, 5, 5),
          compound('barbell-deadlift', 1, 5, 5),
        ],
      },
    ],
  },
  {
    key: 'full-body-3x',
    name: 'Ganzkörper 3×/Woche',
    description: 'Drei Ganzkörper-Trainings an Montag, Mittwoch und Freitag',
    schedule: 'weekdays',
    days: [
      {
        name: 'Ganzkörper A',
        weekdays: [1],
        exercises: [
          compound('barbell-squat', 3, 6, 10),
          compound('barbell-bench-press', 3, 6, 10),
          compound('barbell-row', 3, 8, 12),
          plank,
        ],
      },
      {
        name: 'Ganzkörper B',
        weekdays: [3],
        exercises: [
          compound('barbell-deadlift', 3, 5, 8),
          compound('overhead-press', 3, 6, 10),
          compound('lat-pulldown', 3, 8, 12),
          isolation('bulgarian-split-squat', 3, 8, 12),
        ],
      },
      {
        name: 'Ganzkörper C',
        weekdays: [5],
        exercises: [
          compound('leg-press', 3, 8, 12),
          compound('incline-dumbbell-press', 3, 8, 12),
          compound('seated-cable-row', 3, 8, 12),
          isolation('lateral-raise'),
          plank,
        ],
      },
    ],
  },
  {
    key: 'upper-lower',
    name: 'Oberkörper/Unterkörper',
    description: 'Vier Trainings pro Woche, je zweimal Ober- und Unterkörper',
    schedule: 'weekdays',
    days: [
      {
        name: 'Oberkörper 1',
        weekdays: [1],
        exercises: [
          compound('barbell-bench-press', 4, 6, 10),
          compound('barbell-row', 4, 6, 10),
          compound('dumbbell-shoulder-press', 3, 8, 12),
          isolation('lat-pulldown', 3, 8, 12),
          isolation('hammer-curl'),
          isolation('rope-pushdown'),
        ],
      },
      {
        name: 'Unterkörper 1',
        weekdays: [2],
        exercises: [
          compound('barbell-squat', 4, 6, 10),
          compound('romanian-deadlift', 3, 8, 12),
          isolation('leg-extension'),
          isolation('seated-leg-curl'),
          isolation('standing-calf-raise'),
        ],
      },
      {
        name: 'Oberkörper 2',
        weekdays: [4],
        exercises: [
          compound('overhead-press', 4, 6, 10),
          compound('pull-up', 4, 6, 10),
          compound('incline-dumbbell-press', 3, 8, 12),
          isolation('seated-cable-row', 3, 8, 12),
          isolation('lateral-raise'),
          isolation('face-pull'),
        ],
      },
      {
        name: 'Unterkörper 2',
        weekdays: [5],
        exercises: [
          compound('barbell-deadlift', 3, 5, 8),
          compound('leg-press', 3, 10, 12),
          isolation('bulgarian-split-squat', 3, 8, 12),
          isolation('lying-leg-curl'),
          plank,
        ],
      },
    ],
  },
  {
    key: 'arnold-split',
    name: 'Arnold-Split',
    description: 'Drei Trainings im Wechsel: Brust & Rücken, Schultern & Arme, Beine',
    schedule: 'rotation',
    days: [
      {
        name: 'Brust & Rücken',
        weekdays: [],
        exercises: [
          compound('barbell-bench-press', 4, 6, 10),
          compound('pull-up', 4, 6, 10),
          compound('incline-dumbbell-press', 3, 8, 12),
          compound('barbell-row', 3, 8, 12),
          isolation('dumbbell-flyes'),
          isolation('dumbbell-pullover'),
        ],
      },
      {
        name: 'Schultern & Arme',
        weekdays: [],
        exercises: [
          compound('overhead-press', 4, 6, 10),
          isolation('lateral-raise'),
          isolation('rear-delt-raise'),
          isolation('barbell-curl', 3, 8, 12),
          isolation('skull-crusher', 3, 8, 12),
          isolation('incline-dumbbell-curl'),
          isolation('triceps-pushdown'),
        ],
      },
      {
        name: 'Beine',
        weekdays: [],
        exercises: [
          compound('barbell-squat', 4, 6, 10),
          compound('romanian-deadlift', 3, 8, 12),
          isolation('leg-extension'),
          isolation('lying-leg-curl'),
          isolation('standing-calf-raise'),
          isolation('hanging-leg-raise', 3, 8, 15),
        ],
      },
    ],
  },
  {
    key: 'calisthenics',
    name: 'Calisthenics',
    description: 'Zwei Ganzkörper-Trainings im Wechsel, nur mit Körpergewicht',
    schedule: 'rotation',
    days: [
      {
        name: 'Calisthenics A',
        weekdays: [],
        exercises: [
          compound('pull-up', 4, 5, 10),
          compound('chest-dips', 4, 6, 12),
          isolation('inverted-row', 3, 8, 15),
          isolation('push-up', 3, 10, 20),
          hold('hollow-hold', 30),
        ],
      },
      {
        name: 'Calisthenics B',
        weekdays: [],
        exercises: [
          compound('chin-up', 4, 5, 10),
          compound('pike-push-up', 3, 6, 12),
          isolation('bodyweight-squat', 3, 15, 25),
          isolation('hanging-knee-raise', 3, 8, 15),
          plank,
        ],
      },
    ],
  },
  {
    key: 'abs',
    name: 'Bauchworkout',
    description: 'Ein kurzes Bauchtraining, auch als Ergänzung zum Haupttraining',
    schedule: 'rotation',
    days: [
      {
        name: 'Bauch',
        weekdays: [],
        exercises: [
          isolation('hanging-leg-raise', 3, 8, 15),
          isolation('cable-crunch', 3, 10, 15),
          isolation('crunch', 3, 15, 25),
          isolation('russian-twist', 3, 15, 25),
          plank,
          hold('side-plank', 30),
        ],
      },
    ],
  },
];
