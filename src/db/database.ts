import Dexie, { type Table } from 'dexie';
import {
  DAILY_GOAL_DEFAULTS,
  NUTRITION_GOAL_DEFAULTS,
  SUPPLEMENT_SETTING_DEFAULTS,
} from './schemas';
import {
  DEFAULT_DASHBOARD_WIDGETS,
  DEFAULT_QUICK_ACTIONS,
  ENDURANCE_SPORTS,
  LEGACY_DASHBOARD_WIDGETS,
  type BodyMeasurement,
  type DailyLog,
  type EnduranceSession,
  type EnduranceTrack,
  type Exercise,
  type Food,
  type Gear,
  type Habit,
  type HabitCheck,
  type MealEntry,
  type Plan,
  type PlanDay,
  type PlanExercise,
  type SavedMeal,
  type Settings,
  type Supplement,
  type SupplementIntake,
  type Todo,
  type Workout,
  type WorkoutExercise,
  type WorkoutSet,
} from './types';

export const DB_NAME = 'fitnesstracker';

// Schemaänderungen nur über eine neue `version(n)` mit Upgrade-Funktion – alte Versionen nie entfernen
export class AppDatabase extends Dexie {
  settings!: Table<Settings, string>;
  exercises!: Table<Exercise, string>;
  foods!: Table<Food, string>;
  workouts!: Table<Workout, string>;
  workoutExercises!: Table<WorkoutExercise, string>;
  sets!: Table<WorkoutSet, string>;
  plans!: Table<Plan, string>;
  planDays!: Table<PlanDay, string>;
  planExercises!: Table<PlanExercise, string>;
  dailyLogs!: Table<DailyLog, string>;
  bodyMeasurements!: Table<BodyMeasurement, string>;
  habits!: Table<Habit, string>;
  habitChecks!: Table<HabitCheck, string>;
  todos!: Table<Todo, string>;
  supplements!: Table<Supplement, string>;
  supplementIntakes!: Table<SupplementIntake, string>;
  mealEntries!: Table<MealEntry, string>;
  savedMeals!: Table<SavedMeal, string>;
  enduranceSessions!: Table<EnduranceSession, string>;
  gear!: Table<Gear, string>;
  enduranceTracks!: Table<EnduranceTrack, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({
      settings: 'id, updatedAt',
    });
    this.version(2)
      .stores({
        exercises: 'id, builtinKey, source, category, updatedAt',
        foods: 'id, builtinKey, source, category, updatedAt',
      })
      .upgrade((tx) =>
        tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.seedVersion ??= 0;
          }),
      );
    this.version(3)
      .stores({
        exercises: 'id, builtinKey, source, category, updatedAt',
      })
      .upgrade((tx) =>
        tx
          .table<Exercise, string>('exercises')
          .toCollection()
          .modify((exercise) => {
            exercise.isFavorite ??= false;
            exercise.hiddenAt ??= null;
            exercise.notes ??= '';
          }),
      );
    // Mitgelieferte Halteübungen bekommen `isTimed: true` über Seed-Version 3
    this.version(4)
      .stores({
        workouts: 'id, startedAt, updatedAt',
        workoutExercises: 'id, workoutId, exerciseId, updatedAt',
        sets: 'id, workoutId, workoutExerciseId, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.restTimerSeconds ??= 180;
            settings.restTimerSound ??= true;
            settings.restTimerVibrate ??= true;
          });
        await tx
          .table<Exercise, string>('exercises')
          .toCollection()
          .modify((exercise) => {
            exercise.isTimed ??= false;
          });
      });
    // Stufe statt Gewicht (Maschinen ohne kg-Anzeige)
    this.version(5)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table<Exercise, string>('exercises')
          .toCollection()
          .modify((exercise) => {
            exercise.loadType ??= 'weight';
          });
        await tx
          .table<WorkoutSet, string>('sets')
          .toCollection()
          .modify((set) => {
            set.level ??= null;
          });
      });
    // Exzentrik (Negativ mit mehr Gewicht)
    this.version(6)
      .stores({})
      .upgrade((tx) =>
        tx
          .table<WorkoutSet, string>('sets')
          .toCollection()
          .modify((set) => {
            set.eccentricWeight ??= null;
            set.eccentricLevel ??= null;
          }),
      );
    // Trainingspläne
    this.version(7)
      .stores({
        plans: 'id, updatedAt',
        planDays: 'id, planId, updatedAt',
        planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.activePlanId ??= null;
          });
        await tx
          .table<Workout, string>('workouts')
          .toCollection()
          .modify((workout) => {
            workout.planId ??= null;
            workout.planDayId ??= null;
          });
        await tx
          .table<WorkoutExercise, string>('workoutExercises')
          .toCollection()
          .modify((item) => {
            item.repMin ??= null;
            item.repMax ??= null;
            item.targetDurationSeconds ??= null;
            item.restSeconds ??= null;
          });
      });
    // Reihenfolge der Pläne: bisherige Pläne behalten ihre Anlagereihenfolge
    this.version(8)
      .stores({})
      .upgrade(async (tx) => {
        const plans = await tx.table<Plan, string>('plans').toArray();
        const sorted = plans.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        await tx
          .table<Plan, string>('plans')
          .bulkPut(sorted.map((plan, order) => ({ ...plan, order })));
      });
    // Planbare Aufwärmsätze
    this.version(9)
      .stores({})
      .upgrade((tx) =>
        tx
          .table<PlanExercise, string>('planExercises')
          .toCollection()
          .modify((item) => {
            item.warmupSets ??= 0;
          }),
      );
    // Pausen-Timer abschaltbar, Pausen-Auswertung als erweiterter Modus
    this.version(10)
      .stores({})
      .upgrade((tx) =>
        tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.restTimerEnabled ??= true;
            settings.restAnalysisEnabled ??= false;
          }),
      );
    // Dashboard mit anpassbaren Widgets
    this.version(11)
      .stores({})
      .upgrade((tx) =>
        tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.dashboardWidgets ??= [...LEGACY_DASHBOARD_WIDGETS];
          }),
      );
    // Tägliches Tracking
    this.version(12)
      .stores({
        dailyLogs: 'id, date, updatedAt',
        bodyMeasurements: 'id, date, updatedAt',
      })
      .upgrade((tx) =>
        tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.stepsGoal ??= DAILY_GOAL_DEFAULTS.stepsGoal;
            settings.waterGoalMl ??= DAILY_GOAL_DEFAULTS.waterGoalMl;
            settings.sleepGoalSeconds ??= DAILY_GOAL_DEFAULTS.sleepGoalSeconds;
          }),
      );
    // Habit-Tracker
    this.version(13).stores({
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
    });
    // Gewohnheiten mit Mengen/Unterpunkten/Aufhören, Pausieren/Archivieren, To-dos, neue Startseite
    this.version(14)
      .stores({
        todos: 'id, date, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table<Habit, string>('habits')
          .toCollection()
          .modify((habit) => {
            habit.kind ??= 'check';
            habit.target ??= 1;
            habit.unit ??= '';
            habit.step ??= 1;
            habit.items ??= [];
            habit.startDate ??= null;
            habit.pauses ??= [];
            habit.archivedAt ??= null;
          });
        await tx
          .table<HabitCheck, string>('habitChecks')
          .toCollection()
          .modify((check) => {
            check.itemId ??= null;
            check.amount ??= 1;
          });
        // Einmalige Umstellung auf den neuen Standardaufbau (mit dem Nutzer abgestimmt)
        await tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.dashboardWidgets = [...DEFAULT_DASHBOARD_WIDGETS];
            settings.quickActions ??= [...DEFAULT_QUICK_ACTIONS];
          });
      });
    // Supplements mit Bestand und Einnahmen
    this.version(15)
      .stores({
        supplements: 'id, updatedAt',
        supplementIntakes: 'id, supplementId, date, updatedAt',
      })
      .upgrade((tx) =>
        tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.supplementLowStockDays ??= SUPPLEMENT_SETTING_DEFAULTS.supplementLowStockDays;
            settings.supplementRemindersEnabled ??=
              SUPPLEMENT_SETTING_DEFAULTS.supplementRemindersEnabled;
            settings.supplementNotificationsEnabled ??=
              SUPPLEMENT_SETTING_DEFAULTS.supplementNotificationsEnabled;
          }),
      );
    // Ernährung: Mahlzeiten, Lieblingsmahlzeiten, Favoriten/Ausblenden/Rezepte an Lebensmitteln
    this.version(16)
      .stores({
        mealEntries: 'id, date, foodId, updatedAt',
        savedMeals: 'id, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table<Food, string>('foods')
          .toCollection()
          .modify((food) => {
            food.isFavorite ??= false;
            food.hiddenAt ??= null;
            food.recipe ??= null;
          });
        await tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.nutritionGoals ??= {
              training: { ...NUTRITION_GOAL_DEFAULTS.training },
              rest: { ...NUTRITION_GOAL_DEFAULTS.rest },
            };
          });
      });
    // Ausdauer-Einheiten, Ausrüstung, Kacheln der Trainingsseite
    this.version(17)
      .stores({
        enduranceSessions: 'id, sport, startedAt, gearId, updatedAt',
        gear: 'id, updatedAt',
      })
      .upgrade((tx) =>
        tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.trainingTiles ??= [...ENDURANCE_SPORTS];
          }),
      );
    // Import von Einheiten: Verläufe, Pulszonen
    this.version(18)
      .stores({
        enduranceTracks: 'id, sessionId, updatedAt',
      })
      .upgrade((tx) =>
        tx
          .table<Settings, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.maxHeartRate ??= null;
            settings.restingHeartRate ??= null;
          }),
      );
    // Import von Gesundheitsdaten: Ruhepuls, HRV, Schlafphasen, Herkunft der Tageswerte
    this.version(19)
      .stores({})
      .upgrade((tx) =>
        tx
          .table<DailyLog, string>('dailyLogs')
          .toCollection()
          .modify((log) => {
            log.restingHeartRate ??= null;
            log.hrvMs ??= null;
            log.sleepPhases ??= null;
            log.importedFields ??= [];
          }),
      );
  }
}

export const db = new AppDatabase();
