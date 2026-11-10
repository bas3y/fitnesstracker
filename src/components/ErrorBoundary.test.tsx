import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Broken({ fail }: { fail: boolean }) {
  if (fail) throw new Error('kaputt');
  return <p>Alles gut</p>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('zeigt einen Hinweis mit „Neu laden“ statt einer leeren Seite', () => {
    render(
      <ErrorBoundary>
        <Broken fail />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Hier ist etwas schiefgelaufen');
    expect(screen.getByRole('button', { name: 'Neu laden' })).toBeInTheDocument();
    expect(screen.getByText('kaputt')).toBeInTheDocument();
  });

  it('versucht es bei neuem Pfad erneut', () => {
    const { rerender } = render(
      <ErrorBoundary variant="page" resetKey="/a">
        <Broken fail />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(
      <ErrorBoundary variant="page" resetKey="/b">
        <Broken fail={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Alles gut')).toBeInTheDocument();
  });
});
