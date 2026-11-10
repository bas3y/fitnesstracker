import { COLOR_PALETTES } from '../db/types';
import { artworkSvg, PALETTE_ARTWORKS } from './artwork';
import {
  LOGO_ARTWORKS,
  LOGO_VARIANTS,
  isLogoVariant,
  logoDataUrl,
  logoSvg,
  toLogoVariant,
} from './logo';
import { splashHtml, SPLASH_CSS } from './splashHtml';
import { wordmarkAspect, wordmarkSvg } from './wordmarkSvg';

describe('logoSvg', () => {
  it('draws the wordmark on the variant artwork', () => {
    const svg = logoSvg('charcoal');
    expect(svg).toContain('class="art-wordmark"');
    expect(svg).toContain(`fill="${LOGO_ARTWORKS.charcoal.text}"`);
    expect(svg).toContain(`fill="${LOGO_ARTWORKS.charcoal.background}"`);
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).not.toContain('logo-ring');
  });

  it('prefixes all ids so several logos can share a page', () => {
    const svg = logoSvg('taupe', { id: 'a1' });
    const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]!);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id.startsWith('a1-'))).toBe(true);
    for (const ref of svg.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref[1]);
  });

  it('gives both variants the satin gradient', () => {
    expect(LOGO_ARTWORKS.charcoal.style).toBe('satin');
    expect(LOGO_ARTWORKS.taupe.style).toBe('satin');
    expect(logoSvg('taupe')).not.toContain('<pattern');
  });

  it('supports rounded, full-bleed and labelled icons', () => {
    expect(logoSvg('charcoal')).toContain('clip-path=');
    expect(logoSvg('charcoal', { shape: 'square' })).not.toContain('clip-path=');
    expect(logoSvg('charcoal', { size: 64, label: 'Basey' })).toMatch(
      /width="64" height="64" role="img" aria-label="Basey"/,
    );
  });

  it('builds a data URL', () => {
    expect(logoDataUrl('taupe')).toMatch(/^data:image\/svg\+xml;charset=utf-8,%3Csvg/);
  });

  it('recognises variants, Charcoal Satin is the default', () => {
    expect(LOGO_VARIANTS).toEqual(['charcoal', 'taupe']);
    expect(isLogoVariant('taupe')).toBe(true);
    expect(isLogoVariant('stone')).toBe(false);
    expect(isLogoVariant(null)).toBe(false);
    expect(toLogoVariant('graphite')).toBe('charcoal');
    expect(toLogoVariant('taupe')).toBe('taupe');
  });
});

describe('artworkSvg', () => {
  it('has one artwork per color palette', () => {
    expect(Object.keys(PALETTE_ARTWORKS).sort()).toEqual([...COLOR_PALETTES].sort());
  });

  it('fills its container when used as a cover', () => {
    const svg = artworkSvg(PALETTE_ARTWORKS.blue, { shape: 'cover' });
    expect(svg).toContain('preserveAspectRatio="xMidYMid slice"');
    expect(svg).not.toContain('art-wordmark');
  });

  it('tints the speckles with the artwork colors', () => {
    expect(artworkSvg(PALETTE_ARTWORKS.green)).toContain('0 0 0 0 0.04  0 0 0 0 0.43');
  });
});

describe('wordmarkSvg', () => {
  it('draws the name and optionally the tagline', () => {
    const name = wordmarkSvg();
    expect(name).toContain('aria-label="Basey"');
    expect(name.match(/<path/g)).toHaveLength(1);
    expect(name).toContain('fill="currentColor"');
    const withTagline = wordmarkSvg({ color: '#fff', taglineColor: '#ccc' });
    expect(withTagline.match(/<path/g)).toHaveLength(2);
    expect(wordmarkAspect(true)).toBeLessThan(wordmarkAspect(false));
  });
});

describe('splashHtml', () => {
  it('contains one artwork per palette and only the name', () => {
    const html = splashHtml();
    for (const palette of COLOR_PALETTES) {
      expect(html).toContain(`"${palette}"`);
      expect(SPLASH_CSS).toContain(`html[data-palette='${palette}'] #splash`);
    }
    expect(html).toContain("'./splash-' + palette + '.webp'");
    expect(html).toContain('id="splash"');
    expect(html).toContain('aria-label="Basey"');
    expect(html).not.toContain('Fitness');
  });
});
