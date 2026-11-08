import { applyLogoVariant, hideSplash, LOGO_STORAGE_KEY, storedLogoVariant } from './splash';

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
    applyLogoVariant('stone');
    expect(storedLogoVariant()).toBe('stone');
    const link = document.querySelector('link[rel="apple-touch-icon"]')!;
    expect(link.getAttribute('href')).toBe('/apple-touch-icon-stone.png');
    applyLogoVariant('charcoal');
    expect(link.getAttribute('href')).toBe('/apple-touch-icon.png');
  });
});

describe('hideSplash', () => {
  it('fades out and removes the splash after the animation', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="splash"></div>';
    hideSplash();
    hideSplash();
    vi.advanceTimersByTime(5000);
    expect(document.getElementById('splash')).toBeNull();
    vi.useRealTimers();
  });
});
