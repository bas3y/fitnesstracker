import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { UpdatePrompt } from './components/UpdatePrompt';
import { ensureSeeded } from './db/seed';
import { requestPersistentStorage } from './features/settings/storage';
import './index.css';

void requestPersistentStorage();
ensureSeeded().catch((error: unknown) =>
  console.error('Mitgelieferte Daten konnten nicht eingespielt werden', error),
);

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');

createRoot(root).render(
  <StrictMode>
    <App />
    <UpdatePrompt />
  </StrictMode>,
);
