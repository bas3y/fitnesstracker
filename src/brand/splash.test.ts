import { applyLogoVariant, hideSplash, LOGO_STORAGE_KEY, storedLogoVariant } from './splash';
import { SPLASH_CSS, SPLASH_PALETTES, splashHtml, splashImageFile } from './splashHtml';

describe('logo variant storage', () => {
  beforeEach(() => {
    localStorage.clear();
    document.head.innerHTML = '<link rel="apple-touch-icon" href="./apple-touch-icon.png" />';
  });

  it('falls back to the default variant', () => {
    expect(storedLogoVariant()).toBe('charcoal');
    localStorage.setItem(LOGO_STORAGE_KEY, 'unknown');
    expect(storedLogoVariant()).toBe('charcoal');
  });

  it('remembers the variant and switches the iPhone icon', () => {
    applyLogoVariant('taupe');
    expect(storedLogoVariant()).toBe('taupe');
    const link = document.querySelector('link[rel="apple-touch-icon"]')!;
    expect(link.getAttribute('href')).toBe('/apple-touch-icon-taupe.png');
    applyLogoVariant('charcoal');
    expect(link.getAttribute('href')).toBe('/apple-touch-icon.png');
  });
});

describe('splashHtml', () => {
  it('nutzt je Palette ein vorgerendertes Bild statt SVG-Filtern', () => {
    const html = splashHtml();
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
