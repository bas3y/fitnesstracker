import { LOGO_VARIANTS, LOGO_VARIANT_LABELS, type LogoVariant } from '../../brand/logo';
import { BaseyLogo } from '../../components/BaseyLogo';
import { CheckIcon } from '../../components/icons';

export function LogoPicker({
  value,
  onChange,
}: {
  value: LogoVariant;
  onChange: (variant: LogoVariant) => void;
}) {
  return (
    <div role="radiogroup" aria-label="App-Logo" className="grid grid-cols-4 gap-2">
      {LOGO_VARIANTS.map((variant) => {
        const checked = variant === value;
        return (
          <button
            key={variant}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={LOGO_VARIANT_LABELS[variant]}
            onClick={() => onChange(variant)}
            className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl py-1 text-xs font-medium"
          >
            <span
              aria-hidden="true"
              className={`relative rounded-[1.1rem] ring-offset-2 ring-offset-surface ${
                checked ? 'ring-2 ring-primary' : 'ring-1 ring-line'
              }`}
            >
              <BaseyLogo variant={variant} className="h-14 w-14" />
              {checked && (
                <span className="absolute -right-1.5 -bottom-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary shadow">
                  <CheckIcon className="h-4 w-4" />
                </span>
              )}
            </span>
            <span
              className={`max-w-full text-center leading-tight ${checked ? 'text-fg' : 'text-muted'}`}
            >
              {LOGO_VARIANT_LABELS[variant]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
