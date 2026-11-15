import { secondaryButton } from './buttons';
import { useFloatUp } from './useFloatUp';

/** „+250 ml“, „+20 g“ …: Betrag schwebt nach dem Antippen kurz auf (22d, Q1) */
export function QuickAddButton({
  text,
  label,
  onAdd,
}: {
  text: string;
  /** Name für Screenreader, falls `text` allein nicht reicht */
  label?: string;
  onAdd: () => void;
}) {
  const { float, floats } = useFloatUp();
  return (
    <button
      type="button"
      aria-label={label}
      className={`${secondaryButton} relative`}
      onClick={() => {
        float(text);
        onAdd();
      }}
    >
      {text}
      {floats}
    </button>
  );
}
