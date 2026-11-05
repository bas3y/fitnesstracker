import { createLuminanceDecoder } from './zxingDecoder';

// EAN-13-Codierung: linke Hälfte L/G je nach erster Ziffer, rechte Hälfte R
const L = [
  '0001101',
  '0011001',
  '0010011',
  '0111101',
  '0100011',
  '0110001',
  '0101111',
  '0111011',
  '0110111',
  '0001011',
];
const G = [
  '0100111',
  '0110011',
  '0011011',
  '0100001',
  '0011101',
  '0111001',
  '0000101',
  '0010001',
  '0001001',
  '0010111',
];
const R = L.map((code) => [...code].map((bit) => (bit === '1' ? '0' : '1')).join(''));
const PARITY = [
  'LLLLLL',
  'LLGLGG',
  'LLGGLG',
  'LLGGGL',
  'LGLLGG',
  'LGGLLG',
  'LGGGLL',
  'LGLGLG',
  'LGLGGL',
  'LGGLGL',
];

function ean13Modules(code: string): string {
  const digits = [...code].map(Number);
  const parity = PARITY[digits[0]!]!;
  const left = digits
    .slice(1, 7)
    .map((digit, i) => (parity[i] === 'L' ? L : G)[digit])
    .join('');
  const right = digits
    .slice(7)
    .map((digit) => R[digit])
    .join('');
  return `101${left}01010${right}101`;
}

/** Strichcode als Graustufenbild mit Ruhezone, `scale` Pixel je Modul */
function render(code: string, scale = 3, height = 60) {
  const modules = `${'0'.repeat(11)}${ean13Modules(code)}${'0'.repeat(11)}`;
  const width = modules.length * scale;
  const luminances = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      luminances[y * width + x] = modules[Math.floor(x / scale)] === '1' ? 0 : 255;
    }
  }
  return { luminances, width, height };
}

describe('ZXing-Erkennung (iPhone ohne BarcodeDetector)', () => {
  it('liest EAN-13 aus einem Graustufenbild', () => {
    const decode = createLuminanceDecoder();
    const { luminances, width, height } = render('4006381333931');
    expect(decode(luminances, width, height)).toBe('4006381333931');
    const other = render('5000112637922');
    expect(decode(other.luminances, other.width, other.height)).toBe('5000112637922');
  });

  it('liefert null ohne Strichcode', () => {
    const decode = createLuminanceDecoder();
    expect(decode(new Uint8ClampedArray(200 * 50).fill(255), 200, 50)).toBeNull();
  });
});
