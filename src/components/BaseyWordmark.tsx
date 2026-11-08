import { useMemo } from 'react';
import { wordmarkSvg } from '../brand/wordmarkSvg';

/** Schriftzug „Basey“ in Textfarbe, optional mit Untertitel (nicht ins Hauptbundle ziehen) */
export function BaseyWordmark({
  tagline = false,
  className = 'w-28',
}: {
  tagline?: boolean;
  className?: string;
}) {
  const html = useMemo(
    () => wordmarkSvg({ taglineColor: tagline ? 'var(--muted)' : undefined }),
    [tagline],
  );
  return (
    <span
      className={`inline-block shrink-0 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
