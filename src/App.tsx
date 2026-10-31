import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Page } from './components/Page';
import { HomePage } from './features/dashboard/HomePage';
import { DailyPage } from './features/daily/DailyPage';
import { FoodSearchPage } from './features/nutrition/FoodSearchPage';
import { PlanDayPage } from './features/plans/PlanDayPage';
import { PlanDetailPage } from './features/plans/PlanDetailPage';
import { PlanListPage } from './features/plans/PlanListPage';
import { PlanNewPage } from './features/plans/PlanNewPage';
import { AboutPage } from './features/settings/AboutPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ExerciseDetailPage } from './features/training/ExerciseDetailPage';
import { ExerciseCreatePage, ExerciseEditPage } from './features/training/ExerciseEditPage';
import { ExerciseListPage } from './features/training/ExerciseListPage';
import { TrainingPage } from './features/training/TrainingPage';
import { WorkoutDetailPage } from './features/training/WorkoutDetailPage';
import { WorkoutEditPage } from './features/training/WorkoutEditPage';
import { WorkoutHistoryPage } from './features/training/WorkoutHistoryPage';
import { WorkoutPage } from './features/training/WorkoutPage';

// Eigener Chunk wegen Recharts
const StatsPage = lazy(() =>
  import('./features/stats/StatsPage').then((module) => ({ default: module.StatsPage })),
);

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
          <Route path="daily" element={<DailyPage />} />
          <Route path="daily/foods" element={<FoodSearchPage />} />
          <Route
            path="stats"
            element={
              <Suspense fallback={<Page title="Statistik">{null}</Page>}>
                <StatsPage />
              </Suspense>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
