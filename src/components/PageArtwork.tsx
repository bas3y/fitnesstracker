import type { ColorPalette } from '../db/types';

/**
 * Artwork der Farbpalette (Ladebildschirm-Bild, `public/splash-<palette>.webp`) leicht hinter dem
 * Seitenkopf, läuft nach unten aus. Hell dezent, dunkel kräftiger (`.page-artwork` in index.css).
 * Liegt im Scrollbereich, scrollt also mit dem Kopf weg.
 */
export function PageArtwork({ palette }: { palette: ColorPalette }) {
  return (
    <div aria-hidden="true" className="page-artwork">
      <img src={`${import.meta.env.BASE_URL}splash-${palette}.webp`} alt="" decoding="async" />
    </div>
  );
}
