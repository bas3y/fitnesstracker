import { Link } from 'react-router-dom';
import { secondaryButton } from '../../../components/buttons';
import { useOnline } from '../../../components/useOnline';

const LABEL = 'Strichcode scannen';

/**
 * Einstieg in den Scanner (Link oder Button). Ohne Internet bleibt er nutzbar, findet dann aber
 * nur schon gespeicherte Strichcodes – die Abfrage bei Open Food Facts ist ausgegraut.
 */
export function ScanButton({ to, onClick }: { to?: string; onClick?: () => void }) {
  const online = useOnline();
  const content = (
    <>
      <span aria-hidden="true" className="mr-2">
        ▥
      </span>
      {LABEL}
    </>
  );
  return (
    <div className="mb-4">
      {to ? (
        <Link to={to} className={secondaryButton}>
          {content}
        </Link>
      ) : (
        <button type="button" className={secondaryButton} onClick={onClick}>
          {content}
        </button>
      )}
      {!online && (
        <p className="mt-1 text-sm text-muted">
          Ohne Internet nur gespeicherte Strichcodes. Neue Produkte: Nur mit Internet.
        </p>
      )}
    </div>
  );
}
