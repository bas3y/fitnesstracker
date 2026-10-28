import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { db } from './db/database';
import { ensureSettings, getSettings, SETTINGS_ID } from './db/settings';
import { resetDatabase } from './db/testUtils';

beforeEach(async () => {
  await resetDatabase();
  window.location.hash = '';
});

describe('App', () => {
  it('rendert das Dashboard und legt Einstellungen an', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Fitnesstracker' })).toBeInTheDocument();
    await vi.waitFor(async () => expect(await getSettings()).toBeDefined());
  });

  it('navigiert über die Bottom-Navigation', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' });

    for (const label of ['Training', 'Alltag', 'Statistik', 'Einstellungen']) {
      await user.click(within(nav).getByRole('link', { name: label }));
      expect(await screen.findByRole('heading', { level: 1, name: label })).toBeInTheDocument();
    }
  });

  it('speichert Einstellungen und zeigt den Namen im Dashboard', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/settings';
    render(<App />);

    const name = await screen.findByLabelText('Name');
    await user.type(name, 'Alex');
    await user.click(screen.getByRole('button', { name: 'lb' }));
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'lb' })).toHaveAttribute('aria-pressed', 'true'),
    );
    await user.click(screen.getByRole('button', { name: 'Körpergewicht erhöhen' }));

    await vi.waitFor(async () => {
      const settings = await getSettings();
      expect(settings?.name).toBe('Alex');
      expect(settings?.weightUnit).toBe('lb');
      expect(settings?.bodyWeightKg).toBeCloseTo(165 * 0.45359237);
    });

    await user.click(screen.getByRole('link', { name: 'Dashboard' }));
    expect(await screen.findByText('Hallo, Alex!')).toBeInTheDocument();
  });

  it('zeigt den Backup-Hinweis nach 7 Tagen ohne Backup', async () => {
    await ensureSettings();
    await db.settings.update(SETTINGS_ID, { createdAt: '2020-01-01T00:00:00.000Z' });
    render(<App />);
    expect(await screen.findByText(/Noch kein Backup erstellt/)).toBeInTheDocument();
  });
});
