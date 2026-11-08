import { LOGO_COLORS, LOGO_VARIANTS, isLogoVariant, logoDataUrl, logoSvg } from './logo';
import { splashHtml } from './splashHtml';
import { wordmarkAspect, wordmarkSvg } from './wordmarkSvg';

describe('logoSvg', () => {
  it('draws ring and ball as separately animatable groups', () => {
    const svg = logoSvg('charcoal');
    expect(svg).toContain('class="logo-ring"');
    expect(svg).toContain('class="logo-ball"');
    expect(svg).toContain(`fill="${LOGO_COLORS.charcoal.tile}"`);
    expect(svg).toContain('aria-hidden="true"');
  });

  it('prefixes all ids so several logos can share a page', () => {
    const svg = logoSvg('taupe', { id: 'a1' });
    const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]!);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id.startsWith('a1-'))).toBe(true);
    for (const ref of svg.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref[1]);
  });

  it('adds the variant texture', () => {
    expect(logoSvg('graphite')).toContain('<pattern');
    expect(logoSvg('stone')).toContain('-sp0');
    expect(logoSvg('charcoal')).not.toContain('<pattern');
  });

  it('supports full-bleed, motif-only, scaled and labelled variants', () => {
    expect(logoSvg('charcoal', { shape: 'square' })).not.toContain('rx="50"');
    expect(logoSvg('charcoal', { shape: 'none' })).not.toContain(
      `fill="${LOGO_COLORS.charcoal.tile}"`,
    );
    expect(logoSvg('charcoal', { scale: 0.8 })).toContain('scale(0.8)');
    expect(logoSvg('charcoal', { size: 64, label: 'Basey' })).toMatch(
      /width="64" height="64" role="img" aria-label="Basey"/,
    );
  });

  it('draws only the ring or only the ball for animation layers', () => {
    const ring = logoSvg('taupe', { shape: 'none', parts: 'ring' });
    expect(ring).toContain('logo-ring');
    expect(ring).not.toContain('logo-ball');
    const ball = logoSvg('taupe', { shape: 'none', parts: 'ball' });
    expect(ball).toContain('logo-ball');
    expect(ball).not.toContain('logo-ring');
  });

  it('builds a data URL', () => {
    expect(logoDataUrl('stone')).toMatch(/^data:image\/svg\+xml;charset=utf-8,%3Csvg/);
  });

  it('recognises variants', () => {
    expect(LOGO_VARIANTS[0]).toBe('charcoal');
    expect(isLogoVariant('taupe')).toBe(true);
    expect(isLogoVariant('green')).toBe(false);
    expect(isLogoVariant(null)).toBe(false);
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
  it('contains one template per variant and the wordmark', () => {
    const html = splashHtml();
    for (const variant of LOGO_VARIANTS) expect(html).toContain(`data-logo="${variant}"`);
    expect(html).toContain('id="splash"');
    expect(html).toContain('aria-label="Basey"');
  });
});
