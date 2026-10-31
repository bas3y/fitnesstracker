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
      className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-slate-500 active:bg-slate-100 dark:text-slate-400 dark:active:bg-slate-700"
      onClick={onClick}
    >
      ✕
    </button>
  );
}
