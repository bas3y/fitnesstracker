import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('rendert die Startseite', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Fitnesstracker' })).toBeInTheDocument();
  });

  it('stellt IndexedDB in Tests bereit', () => {
    expect(globalThis.indexedDB).toBeDefined();
  });
});
