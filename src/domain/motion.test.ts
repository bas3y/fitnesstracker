import { describe, expect, it } from 'vitest';
import {
  canTweenNumberText,
  easeOutCubic,
  nextLeavingIds,
  nextRestSpan,
  restShare,
  tweenNumberText,
} from './motion';

describe('tweenNumberText', () => {
  it('zählt deutsche Zahlen mit Tausenderpunkt und Komma', () => {
    expect(tweenNumberText('6.420', '7.420', 0.5)).toBe('6.920');
    expect(tweenNumberText('1,00 l', '1,50 l', 0.5)).toBe('1,25 l');
    expect(tweenNumberText('950', '1.050', 0.5)).toBe('1.000');
  });

  it('zählt mehrere Zahlen gleicher Form', () => {
    expect(tweenNumberText('2/5', '4/5', 0.5)).toBe('3/5');
    expect(tweenNumberText('7 h 20 min', '7 h 40 min', 0.5)).toBe('7 h 30 min');
  });

  it('nimmt am Ende und bei anderer Form sofort den neuen Text', () => {
    expect(tweenNumberText('1', '5', 1)).toBe('5');
    expect(tweenNumberText('–', '1.200', 0.5)).toBe('1.200');
    expect(tweenNumberText('3 Einh.', '1 Einheit', 0.5)).toBe('1 Einheit');
    expect(tweenNumberText('12 Tage', '12 Wochen', 0.5)).toBe('12 Wochen');
  });

  it('beginnt beim alten Wert', () => {
    expect(tweenNumberText('10 g', '30 g', 0)).toBe('10 g');
  });

  it('erkennt zählbare Texte', () => {
    expect(canTweenNumberText('1/3', '2/3')).toBe(true);
    expect(canTweenNumberText('–', '2/3')).toBe(false);
    expect(canTweenNumberText('2/3', '2/3')).toBe(false);
  });
});

describe('easeOutCubic', () => {
  it('läuft von 0 bis 1 und bleibt in den Grenzen', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe('nextLeavingIds', () => {
  it('nimmt eben abgehakte auf und behält gleitende', () => {
    const next = nextLeavingIds(['a', 'b', 'c'], ['a', 'c'], new Set(['x']));
    expect([...next].sort()).toEqual(['b', 'x']);
  });

  it('wieder geöffnete gleiten nicht mehr', () => {
    expect([...nextLeavingIds(['a'], ['a', 'b'], new Set(['b']))]).toEqual([]);
  });
});

describe('nextRestSpan', () => {
  const now = Date.parse('2026-11-15T10:00:00Z');
  const at = (seconds: number) => new Date(now + seconds * 1000).toISOString();

  it('neue Pause: Länge ab jetzt', () => {
    expect(nextRestSpan(null, at(90), now)).toEqual({ endsAt: at(90), totalSeconds: 90 });
  });

  it('±15 s ändern die Länge der laufenden Pause', () => {
    const span = { endsAt: at(60), totalSeconds: 90 };
    expect(nextRestSpan(span, at(75), now)).toEqual({ endsAt: at(75), totalSeconds: 105 });
    expect(nextRestSpan(span, at(45), now)?.totalSeconds).toBe(75);
  });

  it('nach einer abgelaufenen Pause beginnt eine neue', () => {
    const old = { endsAt: at(-5), totalSeconds: 90 };
    expect(nextRestSpan(old, at(120), now)?.totalSeconds).toBe(120);
  });

  it('ohne Pause nichts, gleiches Ende bleibt', () => {
    const span = { endsAt: at(60), totalSeconds: 90 };
    expect(nextRestSpan(span, null, now)).toBeNull();
    expect(nextRestSpan(span, at(60), now)).toBe(span);
  });

  it('Anteil bleibt zwischen 0 und 1', () => {
    const span = { endsAt: at(60), totalSeconds: 90 };
    expect(restShare(span, 45)).toBe(0.5);
    expect(restShare(span, 200)).toBe(1);
    expect(restShare(null, 10)).toBe(0);
  });
});
