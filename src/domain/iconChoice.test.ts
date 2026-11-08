import { ICON_PATHS } from '../components/iconPaths';
import { ICON_GROUPS, ICON_LABELS, ICON_NAMES, toIconName } from './iconChoice';

describe('toIconName', () => {
  it('ordnet frühere Emojis Symbolen zu, auch ohne Varianten-Selektor', () => {
    expect(toIconName('📚', 'star')).toBe('book');
    expect(toIconName('🏋️', 'star')).toBe('dumbbell');
    expect(toIconName('🏋', 'star')).toBe('dumbbell');
    expect(toIconName(' 🚭 ', 'star')).toBe('ban');
    expect(toIconName('✍️', 'star')).toBe('pen');
  });

  it('behält Symbol-Namen und nimmt sonst den Ersatz', () => {
    expect(toIconName('moon', 'star')).toBe('moon');
    expect(toIconName('🇪🇸', 'star')).toBe('star');
    expect(toIconName('🇪🇸', '')).toBe('');
    expect(toIconName('', '')).toBe('');
    expect(toIconName('toString', 'star')).toBe('star');
  });
});

describe('Symbol-Auswahl', () => {
  it('enthält nur vorhandene Symbole, jedes höchstens einmal', () => {
    const icons = ICON_GROUPS.flatMap((group) => group.icons);
    expect(new Set(icons).size).toBe(icons.length);
    for (const icon of icons) expect(ICON_PATHS[icon]).toBeDefined();
    expect(icons.length).toBeGreaterThanOrEqual(40);
  });

  it('hat für jedes Symbol einen deutschen Namen', () => {
    for (const icon of ICON_NAMES) expect(ICON_LABELS[icon]).toBeTruthy();
    expect(new Set(Object.values(ICON_LABELS)).size).toBe(ICON_NAMES.length);
  });
});
