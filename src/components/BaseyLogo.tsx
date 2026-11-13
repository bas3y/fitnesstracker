import { useId, useMemo } from 'react';
import { logoSvg, type LogoSvgOptions } from '../brand/logo';

/** Basey-Logo (Schriftzug auf Artwork, SVG aus `src/brand/logo.ts`); Größe über `className` */
export function BaseyLogo({
  shape,
  label,
  className = 'h-12 w-12',
}: {
  shape?: LogoSvgOptions['shape'];
  label?: string;
  className?: string;
}) {
  // IDs der Masken/Filter müssen im Dokument eindeutig sein; `useId` enthält Doppelpunkte
  const id = `logo${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const html = useMemo(() => logoSvg({ id, shape, label }), [id, shape, label]);
  return (
    // SVG aus festen Konstanten, `label` wird in `artworkSvg` escapt (Test in logo.test.ts)
    <span
      className={`inline-block shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`}
      // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
