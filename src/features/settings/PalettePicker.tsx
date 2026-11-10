import { COLOR_PALETTES, type ColorPalette } from '../../db/types';
import { PALETTE_LABELS } from '../../domain/labels';
import { CheckIcon } from '../../components/icons';

/** Vorschau je Palette: eine Fläche in ihrer Hauptfarbe (wie in `src/index.css`) */
const SWATCHES: Record<ColorPalette, string> = {
  basey: '#bea98e',
  green: '#50c878',
  red: '#d72638',
  blue: '#0f52ba',
  violet: '#8a5cb8',
};

export function PalettePicker({
  value,
  onChange,
}: {
  value: ColorPalette;
  onChange: (palette: ColorPalette) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Farbpalette" className="grid grid-cols-5 gap-2">
      {COLOR_PALETTES.map((palette) => {
        const checked = palette === value;
        return (
          <button
            key={palette}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={PALETTE_LABELS[palette]}
            onClick={() => onChange(palette)}
            className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl py-1 text-xs font-medium"
          >
            <span
              aria-hidden="true"
              className={`relative block h-12 w-12 overflow-hidden rounded-2xl ring-offset-2 ring-offset-surface ${
                checked ? 'ring-2 ring-primary' : 'ring-1 ring-line'
              }`}
              style={{ backgroundColor: SWATCHES[palette] }}
            >
              {checked && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-fg shadow">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                </span>
              )}
            </span>
            <span className={`max-w-full truncate ${checked ? 'text-fg' : 'text-muted'}`}>
              {PALETTE_LABELS[palette]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
