import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

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
  },
  projects: [
    { name: 'android', use: { ...devices['Pixel 7'] } },
    // iPhone-Viewport mit Chromium, da WebKit unter Windows keine Service Worker im Test unterstützt
    { name: 'iphone', use: { ...devices['iPhone 14'], browserName: 'chromium' } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
