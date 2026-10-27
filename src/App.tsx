import { HashRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './features/dashboard/HomePage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<HomePage />} />
      </Routes>
    </HashRouter>
  );
}
