import { hideSplash } from './splash';
import { SPLASH_CSS, SPLASH_PALETTES, splashHtml, splashImageFile } from './splashHtml';

describe('splashHtml', () => {
  it('nutzt je Palette ein vorgerendertes Bild statt SVG-Filtern', () => {
    const html = splashHtml();
    // Seit 22b ein festes Logo: kein Tausch des iPhone-Icons mehr, alter Speicherwert wird entfernt
    expect(html).not.toContain('apple-touch-icon-');
    expect(html).toContain("localStorage.removeItem('logo')");
    expect(html).not.toContain('<filter');
    expect(html).toContain('<img');
    const files = Object.keys(import.meta.glob('../../public/splash-*.webp'));
    for (const palette of SPLASH_PALETTES) {
      expect(files).toContain(`../../public/${splashImageFile(palette)}`);
    }
    // Animation nur über die Deckkraft (Skalieren würde das Bild neu rastern)
    expect(SPLASH_CSS).not.toMatch(/scale\(/);
  });
});

describe('hideSplash', () => {
  it('fades out and removes the splash after the animation', () => {
    vi.useFakeTimers();
    document.documentElement.classList.add('splash-on');
    document.body.innerHTML = '<div id="splash"></div>';
    hideSplash();
    hideSplash();
    vi.advanceTimersByTime(5000);
    expect(document.getElementById('splash')).toBeNull();
    expect(document.documentElement.classList.contains('splash-on')).toBe(false);
    vi.useRealTimers();
  });
});
