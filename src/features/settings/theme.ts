import { useEffect } from 'react';
import type { ColorPalette, ThemePreference } from '../../db/types';

// Spiegel in localStorage, damit das Script in index.html Theme und Palette vor dem ersten Rendern kennt
export const THEME_STORAGE_KEY = 'theme';
export const PALETTE_STORAGE_KEY = 'palette';

const darkQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)');

function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // z. B. privater Modus – gilt dann nur für diese Sitzung
  }
}

export function applyTheme(theme: ThemePreference, palette: ColorPalette = 'green'): void {
  remember(THEME_STORAGE_KEY, theme);
  remember(PALETTE_STORAGE_KEY, palette);
  const root = document.documentElement;
  const dark = theme === 'dark' || (theme === 'system' && !!darkQuery()?.matches);
  root.classList.toggle('dark', dark);
  root.dataset.palette = palette;
  // Browserleiste (Android) in der Hintergrundfarbe der Seite
  const color = getComputedStyle(document.body ?? root).backgroundColor;
  if (color) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}

export function useApplyTheme(
  theme: ThemePreference | undefined,
  palette: ColorPalette | undefined,
): void {
  useEffect(() => {
    if (!theme) return;
    applyTheme(theme, palette);
    if (theme !== 'system') return;
    const query = darkQuery();
    const onChange = () => applyTheme('system', palette);
    query?.addEventListener('change', onChange);
    return () => query?.removeEventListener('change', onChange);
  }, [theme, palette]);
}
