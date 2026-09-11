// Self-contained Web Audio API synthesizer for MOE SSOE school network environments
// No external MP3/WAV network requests needed

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a warm classroom bell chime when a timer completes.
 */
export function playChimeSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.18 / (index + 1), now + index * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 1.5);
    });
  } catch (e) {
    console.warn('AudioContext not permitted yet:', e);
  }
}

/**
 * Plays a gentle, calming tone for breathing transitions (e.g. Inhale / Hold / Exhale).
 */
export function playBreathTone(pitch: 'high' | 'mid' | 'low' = 'mid') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const freqMap = {
      high: 440, // A4
      mid: 349.23, // F4
      low: 261.63, // C4
    };

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqMap[pitch], now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 2.0);
  } catch (e) {
    console.warn('Breath tone error:', e);
  }
}

/**
 * Subtle tap feedback
 */
export function playTapSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch {
    // Ignore audio error if not user initiated yet
  }
}

/**
 * Triumphant celebratory fanfare sound effect for completion!
 * Plays an energetic arpeggio and bright harmonic major chord using Web Audio API.
 */
export function playCelebrationFanfare() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Upbeat fanfare sequence: C5, E5, G5, C6, high shimmer chord (C5 + G5 + C6 + E6)
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.16, type: 'triangle' as OscillatorType, vol: 0.22 }, // C5
      { freq: 659.25, time: 0.14, dur: 0.16, type: 'triangle' as OscillatorType, vol: 0.24 }, // E5
      { freq: 783.99, time: 0.28, dur: 0.18, type: 'triangle' as OscillatorType, vol: 0.26 }, // G5
      { freq: 1046.50, time: 0.44, dur: 0.65, type: 'sine' as OscillatorType, vol: 0.32 },     // C6 (accent)
      { freq: 1318.51, time: 0.52, dur: 0.60, type: 'sine' as OscillatorType, vol: 0.25 },     // E6 shimmer
      { freq: 783.99, time: 0.44, dur: 0.65, type: 'triangle' as OscillatorType, vol: 0.18 }, // G5 chord base
      { freq: 523.25, time: 0.44, dur: 0.65, type: 'sine' as OscillatorType, vol: 0.20 },     // C5 foundation
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(note.vol, now + note.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur + 0.05);
    });

    // Add bright celebratory sparkle bell sprinkles
    const sparkles = [1567.98, 2093.0, 2637.02];
    sparkles.forEach((freq, idx) => {
      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      const sTime = now + 0.6 + idx * 0.12;

      sOsc.type = 'sine';
      sOsc.frequency.setValueAtTime(freq, sTime);

      sGain.gain.setValueAtTime(0, sTime);
      sGain.gain.linearRampToValueAtTime(0.12, sTime + 0.02);
      sGain.gain.exponentialRampToValueAtTime(0.0001, sTime + 0.4);

      sOsc.connect(sGain);
      sGain.connect(ctx.destination);

      sOsc.start(sTime);
      sOsc.stop(sTime + 0.45);
    });
  } catch (e) {
    console.warn('Celebration sound error:', e);
  }
}

/**
 * Friendly swoosh/reset sound when clicking 'Try Again'
 */
export function playResetSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch {
    // ignore
  }
}
