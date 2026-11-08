// Mit Dateiendung: vite.config.ts lädt diese Datei direkt
import { LOGO_COLORS, LOGO_VARIANTS, logoSvg } from './logo.ts';
import { wordmarkSvg } from './wordmarkSvg.ts';

/** Hintergrund von Ladebildschirm, Android-Startbild und Statusleiste beim Start */
export const SPLASH_BACKGROUND = '#0C0C0C';

/** Klasse am `<html>`, solange der Ladebildschirm steht (App unsichtbar, Hintergrund dunkel) */
export const SPLASH_ACTIVE_CLASS = 'splash-on';

/**
 * Ladebildschirm für `index.html` (per Vite-Plugin eingefügt, damit nichts aufblitzt):
 * je Logo-Variante eine Vorlage, das Script wählt die gespeicherte. Ausblenden: `hideSplash()`.
 * Kachel, Ring und Kugel sind eigene Ebenen (HTML-Elemente), damit die Animation auf der
 * Grafikkarte läuft und nicht ruckelt, während die App im Hintergrund lädt.
 */
export function splashHtml(): string {
  const templates = LOGO_VARIANTS.map(
    (variant) =>
      `<template data-logo="${variant}">` +
      `<div class="splash-layer splash-tile" style="background:${LOGO_COLORS[variant].tile}"></div>` +
      `<div class="splash-layer splash-ring">${logoSvg(variant, { id: `splr-${variant}`, shape: 'none', parts: 'ring' })}</div>` +
      `<div class="splash-layer splash-ball">${logoSvg(variant, { id: `splb-${variant}`, shape: 'none', parts: 'ball' })}</div>` +
      `</template>`,
  ).join('');
  return `<div id="splash" aria-hidden="true">
      <div class="splash-logo"></div>
      <div class="splash-word">${wordmarkSvg({ color: '#F4EBDD', taglineColor: '#BEA98E' })}</div>
    </div>
    ${templates}
    <script>
      (function () {
        var root = document.documentElement;
        root.classList.add('${SPLASH_ACTIVE_CLASS}');
        var variant = null;
        try {
          variant = localStorage.getItem('logo');
        } catch (e) {}
        var template =
          document.querySelector('template[data-logo="' + variant + '"]') ||
          document.querySelector('template[data-logo]');
        document.querySelector('#splash .splash-logo').appendChild(template.content.cloneNode(true));
        // iPhone: „Zum Home-Bildschirm“ übernimmt das Icon der gewählten Variante
        if (template.dataset.logo !== '${LOGO_VARIANTS[0]}') {
          document
            .querySelector('link[rel="apple-touch-icon"]')
            .setAttribute('href', './apple-touch-icon-' + template.dataset.logo + '.png');
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

export const SPLASH_CSS = `
      html.${SPLASH_ACTIVE_CLASS},
      html.${SPLASH_ACTIVE_CLASS} body {
        background: ${SPLASH_BACKGROUND};
      }
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
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 28px;
        background: ${SPLASH_BACKGROUND};
        transition: opacity 0.4s ease;
      }
      #splash.splash-hidden {
        opacity: 0;
        pointer-events: none;
      }
      #splash .splash-logo {
        position: relative;
        width: 112px;
        height: 112px;
        animation: splash-tile 0.45s ease-out both;
        will-change: transform, opacity;
      }
      #splash .splash-layer {
        position: absolute;
        inset: 0;
      }
      #splash .splash-tile {
        border-radius: 22.7%;
      }
      #splash .splash-layer svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      #splash .splash-ring {
        will-change: transform, opacity;
        animation: splash-ring 1.05s cubic-bezier(0.2, 0.9, 0.25, 1.12) both;
      }
      #splash .splash-ball {
        transform-origin: 50% 22.7%;
        will-change: transform, opacity;
        animation: splash-ball 0.5s 0.75s cubic-bezier(0.3, 1.6, 0.5, 1) both;
      }
      #splash .splash-word {
        width: 148px;
        will-change: transform, opacity;
        animation: splash-word 0.55s 0.95s ease-out both;
      }
      #splash .splash-word svg {
        display: block;
        width: 100%;
        height: auto;
      }
      @keyframes splash-tile {
        from { opacity: 0; transform: scale(0.88); }
      }
      @keyframes splash-ring {
        from { opacity: 0; transform: rotate(-200deg) scale(0.6); }
        40% { opacity: 1; }
      }
      @keyframes splash-ball {
        from { opacity: 0; transform: scale(0); }
      }
      @keyframes splash-word {
        from { opacity: 0; transform: translateY(8px); }
      }
      @media (prefers-reduced-motion: reduce) {
        #splash,
        #splash * {
          animation: none !important;
          transition: none !important;
        }
      }
`;
