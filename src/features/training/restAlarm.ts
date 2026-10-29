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

/** Auf iPhones nicht verfügbar – dort bleibt es beim Ton */
export function vibrate(): void {
  if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
}
