/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { SPLASH_BACKGROUND, SPLASH_CSS, splashHtml } from './src/brand/splashHtml.ts';

// Android zeigt beim Start Icon + Hintergrundfarbe, danach übernimmt der Ladebildschirm
const THEME_COLOR = SPLASH_BACKGROUND;
const BACKGROUND_COLOR = SPLASH_BACKGROUND;

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'basey-splash',
      transformIndexHtml: (html) =>
        html
          .replace('<!-- splash-css -->', `<style>${SPLASH_CSS}</style>`)
          .replace('<!-- splash -->', splashHtml()),
    },
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon*.png'],
      manifest: {
        name: 'Basey',
        short_name: 'Basey',
        description: 'Fitness & Lifestyle – offline, deine Daten bleiben auf dem Gerät',
        lang: 'de',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        theme_color: THEME_COLOR,
        background_color: BACKGROUND_COLOR,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        // Android: Dateien aus Garmin Connect, Strava … per „Teilen“ an die App (Import)
        share_target: {
          action: 'share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              {
                name: 'files',
                accept: [
                  '.fit',
                  '.gpx',
                  '.tcx',
                  '.zip',
                  '.gz',
                  'application/octet-stream',
                  'application/zip',
                  'application/gzip',
                  'application/gpx+xml',
                  'application/vnd.garmin.tcx+xml',
                  'application/xml',
                  'text/xml',
                ],
              },
            ],
          },
        },
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,webmanifest,woff2}'],
        globIgnores: ['share-target.js'],
        importScripts: ['share-target.js'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
