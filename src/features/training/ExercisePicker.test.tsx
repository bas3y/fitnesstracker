import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '../../db/database';
import { setExerciseFavorite, setExerciseHidden } from '../../db/exercises';
import type { BuiltinExercise } from '../../db/schemas';
import { applySeed } from '../../db/seed';
import { resetDatabase } from '../../db/testUtils';
import type { Exercise } from '../../db/types';
import { ExercisePicker } from './ExercisePicker';

const base: Omit<BuiltinExercise, 'key' | 'name'> = {
  aliases: [],
  category: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: 'barbell',
  isUnilateral: false,
};

beforeEach(async () => {
  await resetDatabase();
  await applySeed(
    {
      exercises: [
        { ...base, key: 'bench', name: 'Bankdrücken (Langhantel)' },
        { ...base, key: 'squat', name: 'Kniebeugen (Langhantel)', primaryMuscles: ['quads'] },
        {
          ...base,
          key: 'row',
          name: 'Rudern (Kabel)',
          equipment: 'cable',
          primaryMuscles: ['lats'],
        },
      ],
      foods: [],
    },
    1,
  );
});

const byKey = async (key: string) => (await db.exercises.where('builtinKey').equals(key).first())!;

function renderPicker() {
  const onSelect = vi.fn<(exercise: Exercise) => void>();
  const onClose = vi.fn();
  const view = render(<ExercisePicker onSelect={onSelect} onClose={onClose} />);
  return { onSelect, onClose, ...view };
}

async function listedNames() {
  const list = await screen.findByRole('list', { name: 'Übungsliste' });
  return within(list)
    .getAllByRole('listitem')
    .map((item) => item.textContent ?? '');
}

describe('ExercisePicker', () => {
  it('zeigt Favoriten zuerst, blendet ausgeblendete Übungen aus und wählt per Tipp', async () => {
    await setExerciseFavorite((await byKey('row')).id, true);
    await setExerciseHidden((await byKey('squat')).id, true);
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    await vi.waitFor(async () => {
      const names = await listedNames();
      expect(names).toHaveLength(2);
      expect(names[0]).toContain('Rudern');
    });
    expect(screen.queryByText(/Kniebeugen/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Ausgeblendete anzeigen')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Bankdrücken/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ builtinKey: 'bench' }));
  });

  it('filtert nach Suche und Equipment', async () => {
    const user = userEvent.setup();
    renderPicker();
    await screen.findByRole('list', { name: 'Übungsliste' });

    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await user.selectOptions(screen.getByLabelText('Equipment'), 'cable');
    expect(await listedNames()).toEqual([expect.stringContaining('Rudern')]);

    await user.click(screen.getByRole('button', { name: 'Alle zurücksetzen' }));
    await user.type(screen.getByRole('searchbox', { name: 'Übung suchen' }), 'kniebeuge');
    expect(await listedNames()).toEqual([expect.stringContaining('Kniebeugen')]);
  });

  it('legt eine eigene Übung an, wählt sie aus und bietet sie danach in der Auswahl an', async () => {
    const user = userEvent.setup();
    const first = renderPicker();
    await screen.findByRole('list', { name: 'Übungsliste' });
    await user.type(screen.getByRole('searchbox', { name: 'Übung suchen' }), 'Hip Thrust');
    await user.click(screen.getByRole('button', { name: '+ Eigene Übung anlegen' }));

    expect(screen.getByLabelText('Name')).toHaveValue('Hip Thrust');
    await user.click(screen.getByRole('button', { name: 'Anlegen und auswählen' }));
    expect(await screen.findByText('Mindestens eine Hauptmuskelgruppe wählen')).toBeInTheDocument();

    const primary = screen.getByRole('group', { name: 'Hauptmuskeln' });
    await user.click(within(primary).getByRole('button', { name: 'Gesäß' }));
    await user.selectOptions(screen.getByLabelText('Equipment'), 'machine');
    await user.click(screen.getByRole('button', { name: 'Anlegen und auswählen' }));

    await vi.waitFor(() =>
      expect(first.onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Hip Thrust', source: 'user', equipment: 'machine' }),
      ),
    );
    first.unmount();

    const second = renderPicker();
    await screen.findByRole('list', { name: 'Übungsliste' });
    await user.click(screen.getByRole('button', { name: 'Eigene' }));
    await user.click(await screen.findByRole('button', { name: /Hip Thrust/ }));
    expect(second.onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'Hip Thrust' }));
  });

  it('meldet doppelte Namen im Formular', async () => {
    const user = userEvent.setup();
    renderPicker();
    await screen.findByRole('list', { name: 'Übungsliste' });
    await user.click(screen.getByRole('button', { name: '+ Eigene Übung anlegen' }));
    await user.type(screen.getByLabelText('Name'), 'bankdrücken (langhantel)');
    const primary = screen.getByRole('group', { name: 'Hauptmuskeln' });
    await user.click(within(primary).getByRole('button', { name: 'Brust' }));
    await user.click(screen.getByRole('button', { name: 'Anlegen und auswählen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/bereits/);
  });

  it('schließt mit Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPicker();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
