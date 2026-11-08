import { useId, useState } from 'react';
import { parseEmoji } from '../domain/emoji';
import { inputField } from './buttons';
import { Chip } from './Chip';

/**
 * Symbol wählen: Vorschläge als Chips plus Feld „Eigenes Emoji“ (Emoji-Tastatur des Handys).
 * Ungültige Eingaben ändern das Symbol nicht und zeigen einen Hinweis.
 */
export function EmojiPicker({
  value,
  suggestions,
  onChange,
  label = 'Symbol',
  optional = false,
}: {
  value: string;
  suggestions: readonly string[];
  onChange: (emoji: string) => void;
  label?: string;
  /** Leeres Feld erlaubt (Standard-Symbol) */
  optional?: boolean;
}) {
  const inputId = useId();
  const hintId = useId();
  const own = value && !suggestions.includes(value) ? value : '';
  const [draft, setDraft] = useState(own);
  const [invalid, setInvalid] = useState(false);

  const changeDraft = (text: string) => {
    setDraft(text);
    if (text.trim() === '') {
      setInvalid(false);
      if (optional && own) onChange('');
      return;
    }
    const emoji = parseEmoji(text);
    setInvalid(emoji === null);
    if (emoji) onChange(emoji);
  };

  return (
    <div role="group" aria-label={label}>
      <p className="mb-1 block text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-1">
        {suggestions.map((icon) => (
          <Chip
            key={icon}
            pressed={value === icon}
            className="px-3 text-lg"
            aria-label={`Symbol ${icon}`}
            onClick={() => {
              setDraft('');
              setInvalid(false);
              onChange(optional && value === icon ? '' : icon);
            }}
          >
            {icon}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label htmlFor={inputId} className="shrink-0 text-sm font-medium">
          Eigenes Emoji
        </label>
        <input
          id={inputId}
          className={`${inputField} w-20 text-center text-lg ${own ? 'border-primary' : ''}`}
          inputMode="text"
          autoComplete="off"
          maxLength={32}
          aria-invalid={invalid}
          aria-describedby={hintId}
          value={draft}
          onChange={(event) => changeDraft(event.target.value)}
        />
      </div>
      <p
        id={hintId}
        className={`mt-1 text-sm ${invalid ? 'font-medium text-danger' : 'text-muted'}`}
      >
        {invalid ? 'Bitte genau ein Emoji eingeben' : 'Über die Emoji-Tastatur, genau ein Zeichen'}
      </p>
    </div>
  );
}
