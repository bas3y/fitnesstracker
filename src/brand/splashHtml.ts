// Mit Dateiendung: vite.config.ts lädt diese Datei direkt
import {
  ART_SIZE,
  artworkSvg,
  type ArtworkPalette,
  DEFAULT_ARTWORK_PALETTE,
  PALETTE_ARTWORKS,
} from './artwork.ts';
import { DEFAULT_LOGO_VARIANT, LOGO_VARIANTS } from './logo.ts';
import { wordmarkSvg } from './wordmarkSvg.ts';

/** Hintergrund von Android-Startbild und Statusleiste beim Start (Standardpalette) */
export const SPLASH_BACKGROUND = PALETTE_ARTWORKS[DEFAULT_ARTWORK_PALETTE].background;

/** Klasse am `<html>`, solange der Ladebildschirm steht (App unsichtbar, Hintergrund dunkel) */
export const SPLASH_ACTIVE_CLASS = 'splash-on';

export const SPLASH_PALETTES = Object.keys(PALETTE_ARTWORKS) as ArtworkPalette[];

/**
 * Ausschnitt des vorgerenderten Artworks im 420er-Raster: Das Band ragt über das Quadrat hinaus,
 * hoch (Handy) und quer (PC) soll es nicht abgeschnitten wirken
 */
export const SPLASH_ART_AREA = { x: -180, y: -150, width: 780, height: 720 } as const;
/** Pixel je Rastereinheit im Bild (Handy mit 3× Dichte braucht knapp das Doppelte, das Band ist weich) */
export const SPLASH_ART_SCALE = 2;

/** Vorgerendertes Artwork in `public/` (`npm run icons`) */
export const splashImageFile = (palette: ArtworkPalette) => `splash-${palette}.webp`;

/** SVG-Quelle des vorgerenderten Artworks */
export const splashArtworkSvg = (palette: ArtworkPalette) =>
  artworkSvg(PALETTE_ARTWORKS[palette], { id: `spl-${palette}`, area: SPLASH_ART_AREA });

const percent = (value: number) => `${Math.round((value / ART_SIZE) * 100000) / 1000}%`;

/**
 * Ladebildschirm für `index.html` (per Vite-Plugin eingefügt, damit nichts aufblitzt): je
 * Farbpalette ein vorgerendertes Artwork (WebP – das SVG mit Filtern zu rastern kostete auf dem
 * Handy über eine Sekunde), das Script nimmt die Palette vom `<html>` (setzt das Script im
 * `<head>`). Darüber blendet nur der Schriftzug ein. Ausblenden: `hideSplash()`. Animiert wird
 * nur die Deckkraft, damit nichts neu gerastert wird.
 */
export function splashHtml(): string {
  return `<div id="splash" aria-hidden="true">
      <div class="splash-art"><img alt="" decoding="sync" /></div>
      <div class="splash-word">${wordmarkSvg()}</div>
    </div>
    <script>
      (function () {
        var root = document.documentElement;
        root.classList.add('${SPLASH_ACTIVE_CLASS}');
        var palette = root.getAttribute('data-palette');
        if (${JSON.stringify(SPLASH_PALETTES)}.indexOf(palette) < 0) palette = '${DEFAULT_ARTWORK_PALETTE}';
        document.querySelector('#splash .splash-art img').setAttribute('src', './splash-' + palette + '.webp');
        // iPhone: „Zum Home-Bildschirm“ übernimmt das Icon der gewählten Logo-Variante
        var variant = null;
        try {
          variant = localStorage.getItem('logo');
        } catch (e) {}
        if (${JSON.stringify(LOGO_VARIANTS.filter((variant) => variant !== DEFAULT_LOGO_VARIANT))}.indexOf(variant) >= 0) {
          document
            .querySelector('link[rel="apple-touch-icon"]')
            .setAttribute('href', './apple-touch-icon-' + variant + '.png');
        }
        // Notbremse, falls die App nicht startet
        setTimeout(function () {
          root.classList.remove('${SPLASH_ACTIVE_CLASS}');
          var splash = document.getElementById('splash');
          if (splash) splash.remove();
        }, 7000);
      })();
    </script>`;
}

const paletteCss = SPLASH_PALETTES.map((palette) => {
  const art = PALETTE_ARTWORKS[palette];
  return `
      html.${SPLASH_ACTIVE_CLASS}[data-palette='${palette}'],
      html.${SPLASH_ACTIVE_CLASS}[data-palette='${palette}'] body,
      html[data-palette='${palette}'] #splash {
        background: ${art.background};
      }
      html[data-palette='${palette}'] #splash .splash-word {
        color: ${art.text};
      }`;
}).join('');

export const SPLASH_CSS = `
      html.${SPLASH_ACTIVE_CLASS},
      html.${SPLASH_ACTIVE_CLASS} body,
      #splash {
        background: ${SPLASH_BACKGROUND};
      }
      #splash .splash-word {
        color: ${PALETTE_ARTWORKS[DEFAULT_ARTWORK_PALETTE].text};
      }
      ${paletteCss}
      html.${SPLASH_ACTIVE_CLASS} #root {
        visibility: hidden;
      }
      #splash {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        height: 100lvh;
        z-index: 1000;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.4s ease;
      }
      #splash.splash-hidden {
        opacity: 0;
        pointer-events: none;
      }
      /* Artwork wie ein Poster: Band läuft über die ganze Breite, oben und unten Hintergrund */
      #splash .splash-art {
        position: absolute;
        top: 50%;
        left: 50%;
        width: min(140vw, 100vh);
        height: min(140vw, 100vh);
        transform: translate(-50%, -50%);
        will-change: opacity;
        animation: splash-fade 0.7s ease-out both;
      }
      #splash .splash-art img {
        position: absolute;
        left: ${percent(SPLASH_ART_AREA.x)};
        top: ${percent(SPLASH_ART_AREA.y)};
        width: ${percent(SPLASH_ART_AREA.width)};
        height: ${percent(SPLASH_ART_AREA.height)};
        max-width: none;
      }
      #splash .splash-word {
        position: relative;
        width: min(52vw, 240px);
        will-change: opacity;
        animation: splash-fade 0.8s 0.45s ease-out both;
      }
      #splash .splash-word svg {
        display: block;
        width: 100%;
        height: auto;
      }
      @keyframes splash-fade {
        from { opacity: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        #splash,
        #splash * {
          animation: none !important;
          transition: none !important;
        }
      }
`;
