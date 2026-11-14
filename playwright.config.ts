import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const LAYOUT_SPEC = /layout\.spec\.ts$/;

// Läuft gegen den Produktions-Build (`npm run preview`), damit der Service Worker aktiv ist
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    // Ohne Animationen: Ladebildschirm verschwindet sofort, Fenster stehen gleich still (eigener Test in branding.spec.ts)
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'android', use: { ...devices['Pixel 7'] }, testIgnore: LAYOUT_SPEC },
    // iPhone-Viewport mit Chromium, da WebKit unter Windows keine Service Worker im Test unterstützt
    {
      name: 'iphone',
      use: { ...devices['iPhone 14'], browserName: 'chromium' },
      testIgnore: LAYOUT_SPEC,
    },
    // Große und quer gehaltene Bildschirme (seit 22c): nur die Abläufe aus `layout.spec.ts`
    { name: 'android-quer', use: { ...devices['Pixel 7 landscape'] }, testMatch: LAYOUT_SPEC },
    {
      name: 'tablet',
      use: { ...devices['iPad Pro 11 landscape'], browserName: 'chromium' },
      testMatch: LAYOUT_SPEC,
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testMatch: LAYOUT_SPEC,
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
