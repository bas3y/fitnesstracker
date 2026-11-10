import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { DbStatusNotice } from './components/DbStatusNotice';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UpdatePrompt } from './components/UpdatePrompt';
import { db } from './db/database';
import { watchDatabase } from './db/dbStatus';
import { ensureSeeded } from './db/seed';
import { requestPersistentStorage } from './features/settings/storage';
import './index.css';

void requestPersistentStorage();
void watchDatabase(db);
ensureSeeded().catch((error: unknown) =>
  console.error('Mitgelieferte Daten konnten nicht eingespielt werden', error),
);

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <UpdatePrompt />
    <DbStatusNotice />
  </StrictMode>,
);
