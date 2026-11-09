// Mit Dateiendung: vite.config.ts lädt diese Datei direkt
import { artworkSvg, DEFAULT_ARTWORK_PALETTE, PALETTE_ARTWORKS } from './artwork.ts';
import { DEFAULT_LOGO_VARIANT, LOGO_VARIANTS } from './logo.ts';
import { wordmarkSvg } from './wordmarkSvg.ts';

/** Hintergrund von Android-Startbild und Statusleiste beim Start (Standardpalette) */
export const SPLASH_BACKGROUND = PALETTE_ARTWORKS[DEFAULT_ARTWORK_PALETTE].background;

/** Klasse am `<html>`, solange der Ladebildschirm steht (App unsichtbar, Hintergrund dunkel) */
export const SPLASH_ACTIVE_CLASS = 'splash-on';

const PALETTES = Object.keys(PALETTE_ARTWORKS) as (keyof typeof PALETTE_ARTWORKS)[];

/**
 * Ladebildschirm für `index.html` (per Vite-Plugin eingefügt, damit nichts aufblitzt): je
 * Farbpalette ein Artwork als Vorlage, das Script nimmt die Palette vom `<html>` (setzt das
 * Script im `<head>`). Darüber blendet nur der Schriftzug ein. Ausblenden: `hideSplash()`.
 * Artwork und Schriftzug sind eigene Ebenen, damit die Animation auf der Grafikkarte läuft.
 */
export function splashHtml(): string {
  const templates = PALETTES.map(
    (palette) =>
      `<template data-palette="${palette}">${artworkSvg(PALETTE_ARTWORKS[palette], { id: `spl-${palette}` })}</template>`,
  ).join('');
  return `<div id="splash" aria-hidden="true">
      <div class="splash-art"></div>
      <div class="splash-word">${wordmarkSvg()}</div>
    </div>
    ${templates}
    <script>
      (function () {
        var root = document.documentElement;
        root.classList.add('${SPLASH_ACTIVE_CLASS}');
        var template =
          document.querySelector('template[data-palette="' + root.getAttribute('data-palette') + '"]') ||
          document.querySelector('template[data-palette="${DEFAULT_ARTWORK_PALETTE}"]');
        document.querySelector('#splash .splash-art').appendChild(template.content.cloneNode(true));
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

const paletteCss = PALETTES.map((palette) => {
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
        will-change: transform, opacity;
        animation: splash-art 0.7s ease-out both;
      }
      #splash .splash-art svg {
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      #splash .splash-word {
        position: relative;
        width: min(52vw, 240px);
        will-change: transform, opacity;
        animation: splash-word 0.8s 0.45s ease-out both;
      }
      #splash .splash-word svg {
        display: block;
        width: 100%;
        height: auto;
      }
      @keyframes splash-art {
        from { opacity: 0; transform: translate(-50%, -50%) scale(1.04); }
      }
      @keyframes splash-word {
        from { opacity: 0; transform: translateY(10px); }
      }
      @media (prefers-reduced-motion: reduce) {
        #splash,
        #splash * {
          animation: none !important;
          transition: none !important;
        }
      }
`;
