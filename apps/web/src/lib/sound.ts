/**
 * Sonidos del sorteo sintetizados con Web Audio (sin archivos externos):
 * pitidos de cuenta regresiva, "chillidos" de cuy y fanfarria de ganador.
 * El AudioContext se crea/reanuda tras un gesto del usuario (el clic en
 * "Iniciar sorteo"), respetando la política de autoplay del navegador.
 */
const MUTE_KEY = 'dod-sound-muted';

let ctx: AudioContext | null = null;
let muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';

function ac(): AudioContext {
  if (!ctx) {
    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  return ctx;
}

/** Tono simple con envolvente. */
function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  vol = 0.2,
  glideTo?: number,
): void {
  if (muted) return;
  const c = ac();
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sound = {
  get muted(): boolean {
    return muted;
  },
  setMuted(m: boolean): void {
    muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0');
    } catch {
      /* ignore */
    }
  },
  /** Reanuda el contexto (llamar dentro del gesto del usuario). */
  unlock(): void {
    try {
      const c = ac();
      if (c.state === 'suspended') void c.resume();
    } catch {
      /* sin audio disponible */
    }
  },
  /** Pitido de la cuenta regresiva (3·2·1). */
  countBeep(): void {
    tone(440, 0.16, 'square', 0.18);
  },
  /** "¡CORRAN!" — tono más alto y largo. */
  go(): void {
    tone(784, 0.38, 'square', 0.22);
  },
  /** Chillido de cuy: chirrido que sube y baja, con base aleatoria. */
  wheek(): void {
    if (muted) return;
    const base = 1000 + Math.random() * 500;
    const c = ac();
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(base, t);
    o.frequency.exponentialRampToValueAtTime(base * 2.1, t + 0.09);
    o.frequency.exponentialRampToValueAtTime(base * 1.4, t + 0.26);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.32);
  },
  /** Fanfarria corta al cruzar el ganador. */
  win(): void {
    if (muted) return;
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.22), i * 110));
  },
};
