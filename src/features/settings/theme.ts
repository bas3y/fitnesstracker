import { useEffect } from 'react';
import type { ThemePreference } from '../../db/types';

// Spiegel in localStorage, damit das Script in index.html das Theme vor dem ersten Rendern kennt
export const THEME_STORAGE_KEY = 'theme';

const darkQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)');

export function applyTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // z. B. privater Modus – Theme gilt dann nur für diese Sitzung
  }
  const dark = theme === 'dark' || (theme === 'system' && !!darkQuery()?.matches);
  document.documentElement.classList.toggle('dark', dark);
}

export function useApplyTheme(theme: ThemePreference | undefined): void {
  useEffect(() => {
    if (!theme) return;
    applyTheme(theme);
    if (theme !== 'system') return;
    const query = darkQuery();
    const onChange = () => applyTheme('system');
    query?.addEventListener('change', onChange);
    return () => query?.removeEventListener('change', onChange);
  }, [theme]);
}
