import { lazy, type ComponentType } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './features/dashboard/HomePage';

/** Eigene Chunks halten den Start klein, offline liefert sie der Precache */
function lazyPage<Name extends string>(
  load: () => Promise<Record<Name, ComponentType>>,
  name: Name,
) {
  return lazy(() => load().then((module) => ({ default: module[name] })));
}

const BodyMeasurementsPage = lazyPage(
  () => import('./features/daily/BodyMeasurementsPage'),
  'BodyMeasurementsPage',
);
const BodyPage = lazyPage(() => import('./features/daily/BodyPage'), 'BodyPage');
const DailyHistoryPage = lazyPage(
  () => import('./features/daily/DailyHistoryPage'),
  'DailyHistoryPage',
);
const DailyPage = lazyPage(() => import('./features/daily/DailyPage'), 'DailyPage');
const HabitCreatePage = lazyPage(() => import('./features/daily/HabitEditPage'), 'HabitCreatePage');
const HabitDetailPage = lazyPage(
  () => import('./features/daily/HabitDetailPage'),
  'HabitDetailPage',
);
const HabitEditPage = lazyPage(() => import('./features/daily/HabitEditPage'), 'HabitEditPage');
const HabitListPage = lazyPage(() => import('./features/daily/HabitListPage'), 'HabitListPage');
const TodoPage = lazyPage(() => import('./features/daily/TodoPage'), 'TodoPage');
const ActivityPage = lazyPage(() => import('./features/endurance/ActivityPage'), 'ActivityPage');
const GearCreatePage = lazyPage(
  () => import('./features/endurance/GearEditPage'),
  'GearCreatePage',
);
const GearDetailPage = lazyPage(
  () => import('./features/endurance/GearDetailPage'),
  'GearDetailPage',
);
const GearEditPage = lazyPage(() => import('./features/endurance/GearEditPage'), 'GearEditPage');
const GearListPage = lazyPage(() => import('./features/endurance/GearListPage'), 'GearListPage');
const ImportPage = lazyPage(() => import('./features/endurance/ImportPage'), 'ImportPage');
const SessionCreatePage = lazyPage(
  () => import('./features/endurance/SessionEditPage'),
  'SessionCreatePage',
);
const SessionDetailPage = lazyPage(
  () => import('./features/endurance/SessionDetailPage'),
  'SessionDetailPage',
);
const SessionEditPage = lazyPage(
  () => import('./features/endurance/SessionEditPage'),
  'SessionEditPage',
);
const FoodCreatePage = lazyPage(
  () => import('./features/nutrition/FoodEditPage'),
  'FoodCreatePage',
);
const FoodDetailPage = lazyPage(
  () => import('./features/nutrition/FoodDetailPage'),
  'FoodDetailPage',
);
const FoodEditPage = lazyPage(() => import('./features/nutrition/FoodEditPage'), 'FoodEditPage');
const FoodListPage = lazyPage(() => import('./features/nutrition/FoodListPage'), 'FoodListPage');
const NutritionPage = lazyPage(() => import('./features/nutrition/NutritionPage'), 'NutritionPage');
const RecipeCreatePage = lazyPage(
  () => import('./features/nutrition/FoodEditPage'),
  'RecipeCreatePage',
);
const PlanDayPage = lazyPage(() => import('./features/plans/PlanDayPage'), 'PlanDayPage');
const PlanDetailPage = lazyPage(() => import('./features/plans/PlanDetailPage'), 'PlanDetailPage');
const PlanListPage = lazyPage(() => import('./features/plans/PlanListPage'), 'PlanListPage');
const PlanNewPage = lazyPage(() => import('./features/plans/PlanNewPage'), 'PlanNewPage');
const SupplementCreatePage = lazyPage(
  () => import('./features/supplements/SupplementEditPage'),
  'SupplementCreatePage',
);
const SupplementDetailPage = lazyPage(
  () => import('./features/supplements/SupplementDetailPage'),
  'SupplementDetailPage',
);
const SupplementEditPage = lazyPage(
  () => import('./features/supplements/SupplementEditPage'),
  'SupplementEditPage',
);
const SupplementsPage = lazyPage(
  () => import('./features/supplements/SupplementsPage'),
  'SupplementsPage',
);
const AboutPage = lazyPage(() => import('./features/settings/AboutPage'), 'AboutPage');
const SettingsPage = lazyPage(() => import('./features/settings/SettingsPage'), 'SettingsPage');
const StatsPage = lazyPage(() => import('./features/stats/StatsPage'), 'StatsPage');
const ExerciseDetailPage = lazyPage(
  () => import('./features/training/ExerciseDetailPage'),
  'ExerciseDetailPage',
);
const ExerciseCreatePage = lazyPage(
  () => import('./features/training/ExerciseEditPage'),
  'ExerciseCreatePage',
);
const ExerciseEditPage = lazyPage(
  () => import('./features/training/ExerciseEditPage'),
  'ExerciseEditPage',
);
const ExerciseListPage = lazyPage(
  () => import('./features/training/ExerciseListPage'),
  'ExerciseListPage',
);
const TrainingPage = lazyPage(() => import('./features/training/TrainingPage'), 'TrainingPage');
const WorkoutDetailPage = lazyPage(
  () => import('./features/training/WorkoutDetailPage'),
  'WorkoutDetailPage',
);
const WorkoutEditPage = lazyPage(
  () => import('./features/training/WorkoutEditPage'),
  'WorkoutEditPage',
);
const WorkoutHistoryPage = lazyPage(
  () => import('./features/training/WorkoutHistoryPage'),
  'WorkoutHistoryPage',
);
const WorkoutPage = lazyPage(() => import('./features/training/WorkoutPage'), 'WorkoutPage');

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="training" element={<TrainingPage />} />
          <Route path="training/exercises" element={<ExerciseListPage />} />
          <Route path="training/exercises/new" element={<ExerciseCreatePage />} />
          <Route path="training/exercises/:id" element={<ExerciseDetailPage />} />
          <Route path="training/exercises/:id/edit" element={<ExerciseEditPage />} />
          <Route path="training/workout" element={<WorkoutPage />} />
          <Route path="training/history" element={<WorkoutHistoryPage />} />
          <Route path="training/history/:id" element={<WorkoutDetailPage />} />
          <Route path="training/history/:id/edit" element={<WorkoutEditPage />} />
          <Route path="training/plans" element={<PlanListPage />} />
          <Route path="training/plans/new" element={<PlanNewPage />} />
          <Route path="training/plans/:id" element={<PlanDetailPage />} />
          <Route path="training/plans/:id/days/:dayId" element={<PlanDayPage />} />
          <Route path="training/activity/:sport" element={<ActivityPage />} />
          <Route path="training/activity/:sport/new" element={<SessionCreatePage />} />
          <Route path="training/sessions/:id" element={<SessionDetailPage />} />
          <Route path="training/sessions/:id/edit" element={<SessionEditPage />} />
          <Route path="training/gear" element={<GearListPage />} />
          <Route path="training/gear/new" element={<GearCreatePage />} />
          <Route path="training/gear/:id" element={<GearDetailPage />} />
          <Route path="training/gear/:id/edit" element={<GearEditPage />} />
          <Route path="training/import" element={<ImportPage />} />
          <Route path="daily" element={<DailyPage />} />
          <Route path="daily/history" element={<DailyHistoryPage />} />
          <Route path="daily/body" element={<BodyPage />} />
          <Route path="daily/measurements" element={<BodyMeasurementsPage />} />
          <Route path="daily/habits" element={<HabitListPage />} />
          <Route path="daily/habits/new" element={<HabitCreatePage />} />
          <Route path="daily/habits/:id" element={<HabitDetailPage />} />
          <Route path="daily/habits/:id/edit" element={<HabitEditPage />} />
          <Route path="daily/todos" element={<TodoPage />} />
          <Route path="daily/supplements" element={<SupplementsPage />} />
          <Route path="daily/supplements/new" element={<SupplementCreatePage />} />
          <Route path="daily/supplements/:id" element={<SupplementDetailPage />} />
          <Route path="daily/supplements/:id/edit" element={<SupplementEditPage />} />
          <Route path="daily/nutrition" element={<NutritionPage />} />
          <Route path="daily/foods" element={<FoodListPage />} />
          <Route path="daily/foods/new" element={<FoodCreatePage />} />
          <Route path="daily/foods/new-recipe" element={<RecipeCreatePage />} />
          <Route path="daily/foods/:id" element={<FoodDetailPage />} />
          <Route path="daily/foods/:id/edit" element={<FoodEditPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
