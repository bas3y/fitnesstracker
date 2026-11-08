// Mit Dateiendung: vite.config.ts lädt diese Datei direkt
import { LOGO_VARIANTS, logoSvg } from './logo.ts';
import { wordmarkSvg } from './wordmarkSvg.ts';

/** Hintergrund von Ladebildschirm, Android-Startbild und Statusleiste beim Start */
export const SPLASH_BACKGROUND = '#0C0C0C';

/**
 * Ladebildschirm für `index.html` (per Vite-Plugin eingefügt, damit nichts aufblitzt):
 * je Logo-Variante eine Vorlage, das Script wählt die gespeicherte. Ausblenden: `hideSplash()`.
 */
export function splashHtml(): string {
  const templates = LOGO_VARIANTS.map(
    (variant) =>
      `<template data-logo="${variant}">${logoSvg(variant, { id: `splash-${variant}` })}</template>`,
  ).join('');
  return `<div id="splash" aria-hidden="true">
      <div class="splash-logo"></div>
      <div class="splash-word">${wordmarkSvg({ color: '#F4EBDD', taglineColor: '#BEA98E' })}</div>
    </div>
    ${templates}
    <script>
      (function () {
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
          var splash = document.getElementById('splash');
          if (splash) splash.remove();
        }, 6000);
      })();
    </script>`;
}

export const SPLASH_CSS = `
      #splash {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 28px;
        background: ${SPLASH_BACKGROUND};
        transition: opacity 0.3s ease;
      }
      #splash.splash-hidden {
        opacity: 0;
        pointer-events: none;
      }
      #splash .splash-logo {
        width: 112px;
        height: 112px;
        animation: splash-tile 0.35s ease-out both;
      }
      #splash .splash-logo svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      #splash .splash-word {
        width: 148px;
        animation: splash-word 0.45s 0.7s ease-out both;
      }
      #splash .splash-word svg {
        display: block;
        width: 100%;
        height: auto;
      }
      #splash .logo-ring {
        transform-box: view-box;
        transform-origin: 110px 110px;
        animation: splash-ring 0.8s cubic-bezier(0.2, 0.9, 0.25, 1.12) both;
      }
      #splash .logo-ball {
        transform-box: view-box;
        transform-origin: 110px 50px;
        animation: splash-ball 0.45s 0.55s cubic-bezier(0.3, 1.6, 0.5, 1) both;
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
