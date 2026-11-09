import { useId, useMemo } from 'react';
import {
  DEFAULT_LOGO_VARIANT,
  logoSvg,
  type LogoSvgOptions,
  type LogoVariant,
} from '../brand/logo';

/** Basey-Logo (Schriftzug auf Artwork, SVG aus `src/brand/logo.ts`); Größe über `className` */
export function BaseyLogo({
  variant = DEFAULT_LOGO_VARIANT,
  shape,
  label,
  className = 'h-12 w-12',
}: {
  variant?: LogoVariant;
  shape?: LogoSvgOptions['shape'];
  label?: string;
  className?: string;
}) {
  // IDs der Masken/Filter müssen im Dokument eindeutig sein; `useId` enthält Doppelpunkte
  const id = `logo${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const html = useMemo(() => logoSvg(variant, { id, shape, label }), [variant, id, shape, label]);
  return (
    <span
      className={`inline-block shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
