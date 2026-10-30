import { useId, useState } from 'react';
import { inputField } from '../../components/buttons';

/** Name, der beim Verlassen des Felds gespeichert wird; leere Eingaben werden verworfen */
export function NameField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (name: string) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    setDraft(null);
    if (draft.trim() !== '' && draft.trim() !== value) onSave(draft);
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className={inputField}
        maxLength={80}
        value={draft ?? value}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
      />
    </div>
  );
}
