import { COLOR_PALETTES, type ColorPalette } from '../../db/types';
import { PALETTE_LABELS } from '../../domain/labels';
import { CheckIcon } from '../../components/icons';

/** Vorschaufarben je Palette: hell, Akzent hell, Akzent, dunkel (wie in `src/index.css`) */
const SWATCHES: Record<ColorPalette, readonly string[]> = {
  basey: ['#e8d9c2', '#bea98e', '#6f5b43', '#1a1714'],
  green: ['#d1f2eb', '#50c878', '#0b6e4f', '#013220'],
  red: ['#fbe4e3', '#d72638', '#9b111e', '#3f0d12'],
  blue: ['#d6e6f3', '#a6c5d7', '#0f52ba', '#000926'],
  violet: ['#e6c7e6', '#a3779d', '#663399', '#2e1a47'],
};

/** Hervorhebung je Palette (`--p-pop`) */
const POP: Record<ColorPalette, string> = {
  basey: '#d9480f',
  green: '#d6336c',
  red: '#b26b00',
  blue: '#e8590c',
  violet: '#0c8599',
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
              className={`relative grid h-12 w-12 grid-cols-2 overflow-hidden rounded-2xl ring-offset-2 ring-offset-surface ${
                checked ? 'ring-2 ring-primary' : 'ring-1 ring-line'
              }`}
            >
              {SWATCHES[palette].map((color) => (
                <span key={color} style={{ backgroundColor: color }} />
              ))}
              {!checked && (
                <span
                  className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface"
                  style={{ backgroundColor: POP[palette] }}
                />
              )}
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
