let audioContext: AudioContext | null = null;

/**
 * Muss in einer Nutzeraktion (z. B. Tipp auf „Satz abhaken“) aufgerufen werden,
 * damit iOS/Safari später ohne Interaktion einen Ton abspielen darf.
 */
export function primeAudio(): void {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') void audioContext.resume();
  } catch {
    audioContext = null;
  }
}

/** Drei kurze Pieptöne, erzeugt per Web Audio (keine Audiodatei nötig) */
export function playBeep(): void {
  const ctx = audioContext;
  if (!ctx) return;
  const start = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = 880;
    const t = start + i * 0.3;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(t);
    oscillator.stop(t + 0.22);
  }
}

/**
 * Klangschale/Gong (Grundton mit unharmonischen Obertönen, lang ausklingend). `soft` = leiser
 * und kürzer, z. B. für das Ende einer Pause.
 */
export function playGong(soft = false): void {
  const ctx = audioContext;
  if (!ctx) return;
  const start = ctx.currentTime;
  const length = soft ? 2.5 : 6;
  const partials: [ratio: number, volume: number][] = [
    [1, 0.35],
    [2.76, 0.15],
    [5.4, 0.08],
    [8.93, 0.04],
  ];
  for (const [ratio, volume] of partials) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = (soft ? 330 : 196) * ratio;
    const peak = volume * (soft ? 0.6 : 1);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length / ratio ** 0.3);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + length);
  }
}

/** Auf iPhones nicht verfügbar – dort bleibt es beim Ton */
export function vibrate(): void {
  if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
}
