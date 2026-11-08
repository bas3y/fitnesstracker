import { Icon } from './icons';

/** ✕ am Ende einer Listenzeile; gelöscht wird erst nach der Rückfrage des Aufrufers */
export function DeleteRowButton({
  name,
  verb = 'löschen',
  onClick,
}: {
  name: string;
  verb?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${name} ${verb}`}
      className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted active:bg-subtle"
      onClick={onClick}
    >
      <Icon name="close" className="h-5 w-5" />
    </button>
  );
}
