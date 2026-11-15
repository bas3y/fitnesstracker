import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoButton } from './InfoButton';
import { Card } from './Page';
import { Switch } from './Switch';

describe('InfoButton', () => {
  it('öffnet die Erklärung als Fenster und schließt mit ✕, Escape und daneben tippen', async () => {
    const user = userEvent.setup();
    render(
      <InfoButton title="Puls">
        <p>Für die Pulszonen.</p>
      </InfoButton>,
    );
    const button = screen.getByRole('button', { name: 'Info: Puls' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(button);
    const dialog = screen.getByRole('dialog', { name: 'Puls' });
    expect(dialog).toHaveTextContent('Für die Pulszonen.');
    expect(dialog).toHaveFocus();
    expect(button).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();

    await user.click(button);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(button);
    await user.click(screen.getByRole('dialog').previousElementSibling!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('löst keine Klicks der umgebenden Zeile aus', async () => {
    const user = userEvent.setup();
    const onRow = vi.fn();
    render(
      <div onClick={onRow}>
        <InfoButton title="Hinweis">
          <p>Text</p>
        </InfoButton>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Info: Hinweis' }));
    await user.click(screen.getByRole('dialog'));
    await user.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(onRow).not.toHaveBeenCalled();
  });

  it('sitzt in Karte und Schalter, ohne den Namen des Schalters zu ändern', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Card title="Erweitert" info={<p>Karten-Erklärung</p>}>
        <Switch
          label="Pausen-Auswertung"
          checked={false}
          onChange={onChange}
          info={{ title: 'Pausen-Auswertung', content: <p>Schalter-Erklärung</p> }}
        />
      </Card>,
    );
    expect(screen.getByRole('button', { name: 'Info: Erweitert' })).toBeInTheDocument();
    const toggle = screen.getByRole('switch', { name: 'Pausen-Auswertung' });

    await user.click(screen.getByRole('button', { name: 'Info: Pausen-Auswertung' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Schalter-Erklärung');
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');

    await user.click(screen.getByText('Pausen-Auswertung'));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(toggle).toBeInTheDocument();
  });
});
