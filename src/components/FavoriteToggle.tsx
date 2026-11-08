import { StarIcon } from './icons';

/**
 * Stern als eigene Schaltfläche neben einer Listenzeile (nicht in einen Button oder Link schachteln).
 * Heißt „Favorit: <Name>“; Selektoren für die Zeile daher mit `^` verankern.
 */
export function FavoriteToggle({
  name,
  isFavorite,
  onToggle,
}: {
  name: string;
  isFavorite: boolean;
  onToggle: (isFavorite: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={`Favorit: ${name}`}
      className="flex h-14 w-14 shrink-0 items-center justify-center"
      onClick={() => onToggle(!isFavorite)}
    >
      <StarIcon
        filled={isFavorite}
        className={`h-6 w-6 ${isFavorite ? 'text-star' : 'text-faint'}`}
      />
    </button>
  );
}
