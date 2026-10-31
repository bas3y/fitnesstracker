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
  isTimed: false,
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

    await user.click(screen.getByRole('button', { name: /^Bankdrücken/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ builtinKey: 'bench' }));
  });

  it('markiert per Stern als Favorit, ohne die Übung auszuwählen', async () => {
    const user = userEvent.setup();
    const { onSelect, onClose } = renderPicker();
    const star = await screen.findByRole('button', { name: 'Favorit: Rudern (Kabel)' });
    expect(star).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /^Rudern/ })).not.toContainElement(star);

    await user.click(star);

    await vi.waitFor(async () => expect((await byKey('row')).isFavorite).toBe(true));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Favorit: Rudern (Kabel)' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
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
    await user.click(await screen.findByRole('button', { name: /^Hip Thrust/ }));
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

  describe('Mehrfachauswahl', () => {
    function renderMany(addedIds?: ReadonlySet<string>) {
      const onSelectMany = vi.fn<(exercises: Exercise[]) => void>();
      render(<ExercisePicker addedIds={addedIds} onSelectMany={onSelectMany} onClose={vi.fn()} />);
      return onSelectMany;
    }

    it('sammelt Übungen über Suchen hinweg in Tipp-Reihenfolge', async () => {
      const user = userEvent.setup();
      const onSelectMany = renderMany();
      await screen.findByRole('list', { name: 'Übungsliste' });
      expect(screen.queryByRole('button', { name: /hinzufügen$/ })).not.toBeInTheDocument();

      const row = screen.getByRole('button', { name: /^Rudern/ });
      await user.click(row);
      expect(row).toHaveAttribute('aria-pressed', 'true');
      await user.click(screen.getByRole('button', { name: /^Bankdrücken/ }));
      await user.click(screen.getByRole('button', { name: /^Bankdrücken/ }));

      await user.type(screen.getByRole('searchbox', { name: 'Übung suchen' }), 'kniebeuge');
      await user.click(await screen.findByRole('button', { name: /^Kniebeugen/ }));
      await user.click(screen.getByRole('button', { name: '2 Übungen hinzufügen' }));

      expect(onSelectMany).toHaveBeenCalledTimes(1);
      expect(onSelectMany.mock.calls[0]![0].map((exercise) => exercise.builtinKey)).toEqual([
        'row',
        'squat',
      ]);
    });

    it('behält die Auswahl, wenn man per Stern einen Favoriten setzt', async () => {
      const user = userEvent.setup();
      const onSelectMany = renderMany();
      await user.click(await screen.findByRole('button', { name: /^Rudern/ }));
      await user.click(screen.getByRole('button', { name: 'Favorit: Bankdrücken (Langhantel)' }));

      await user.click(screen.getByRole('button', { name: '1 Übung hinzufügen' }));
      expect(onSelectMany).toHaveBeenCalledWith([expect.objectContaining({ builtinKey: 'row' })]);
    });

    it('markiert enthaltene Übungen, lässt sie aber wählbar', async () => {
      const user = userEvent.setup();
      const onSelectMany = renderMany(new Set([(await byKey('bench')).id]));
      const bench = await screen.findByRole('button', { name: /^Bankdrücken/ });
      expect(bench).toHaveTextContent('Im Training');
      expect(screen.getByRole('button', { name: /^Rudern/ })).not.toHaveTextContent('Im Training');

      await user.click(bench);
      await user.click(screen.getByRole('button', { name: '1 Übung hinzufügen' }));
      expect(onSelectMany).toHaveBeenCalledWith([expect.objectContaining({ builtinKey: 'bench' })]);
    });

    it('wählt eine neu angelegte Übung aus und bleibt offen', async () => {
      const user = userEvent.setup();
      const onSelectMany = renderMany();
      await screen.findByRole('list', { name: 'Übungsliste' });
      await user.type(screen.getByRole('searchbox', { name: 'Übung suchen' }), 'Hip Thrust');
      await user.click(screen.getByRole('button', { name: '+ Eigene Übung anlegen' }));
      const primary = screen.getByRole('group', { name: 'Hauptmuskeln' });
      await user.click(within(primary).getByRole('button', { name: 'Gesäß' }));
      await user.click(screen.getByRole('button', { name: 'Anlegen und auswählen' }));

      await user.click(await screen.findByRole('button', { name: '1 Übung hinzufügen' }));
      expect(onSelectMany).toHaveBeenCalledWith([expect.objectContaining({ name: 'Hip Thrust' })]);
    });
  });

  it('schließt mit Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPicker();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
