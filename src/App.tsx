import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './features/dashboard/HomePage';
import { DailyPage } from './features/daily/DailyPage';
import { FoodSearchPage } from './features/nutrition/FoodSearchPage';
import { AboutPage } from './features/settings/AboutPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { StatsPage } from './features/stats/StatsPage';
import { ExerciseSearchPage } from './features/training/ExerciseSearchPage';
import { TrainingPage } from './features/training/TrainingPage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="training" element={<TrainingPage />} />
          <Route path="training/exercises" element={<ExerciseSearchPage />} />
          <Route path="daily" element={<DailyPage />} />
          <Route path="daily/foods" element={<FoodSearchPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
