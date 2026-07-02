/**
 * bleepSynth.ts
 *
 * Synthesizes censor tones with the Web Audio API — no audio files needed
 * for the default "classic TV bleep". public/sounds/ holds optional
 * pre-recorded fallback samples (buzz, airhorn, static, robotic) for
 * variety; see playRandomBleepVariant().
 */

export type BleepVariant = "classic" | "buzz" | "robotic" | "static";

interface PlayBleepOptions {
  audioCtx: AudioContext;
  /** Node the bleep should be routed into (typically the mix bus gain node). */
  destination: AudioNode;
  /** Also route to speakers for live monitoring. Default true. */
  monitor?: boolean;
  variant?: BleepVariant;
}

/**
 * Classic broadcast censor "bleep": a clean, steady sine tone around
 * 1000Hz with a fast attack and sharp cutoff. Small per-call pitch
 * variance keeps repeats from feeling robotic.
 */
export function playBleep({
  audioCtx,
  destination,
  monitor = true,
  variant = "classic",
}: PlayBleepOptions): void {
  const dur = (150 + Math.random() * 350) / 1000;

  switch (variant) {
    case "buzz":
      return playBuzz(audioCtx, destination, monitor, dur);
    case "robotic":
      return playRobotic(audioCtx, destination, monitor, dur);
    case "static":
      return playStatic(audioCtx, destination, monitor, dur);
    case "classic":
    default:
      return playClassic(audioCtx, destination, monitor, dur);
  }
}

function playClassic(
  audioCtx: AudioContext,
  destination: AudioNode,
  monitor: boolean,
  dur: number
) {
  const freq = 950 + Math.random() * 120; // ~950-1070Hz, classic TV bleep range
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.6, audioCtx.currentTime + 0.008);
  gain.gain.setValueAtTime(0.6, audioCtx.currentTime + dur - 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);

  osc.connect(gain);
  gain.connect(destination);
  if (monitor) gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + dur + 0.05);
}

function playBuzz(
  audioCtx: AudioContext,
  destination: AudioNode,
  monitor: boolean,
  dur: number
) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110 + Math.random() * 40, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);

  osc.connect(gain);
  gain.connect(destination);
  if (monitor) gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + dur + 0.05);
}

function playRobotic(
  audioCtx: AudioContext,
  destination: AudioNode,
  monitor: boolean,
  dur: number
) {
  const osc = audioCtx.createOscillator();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  const gain = audioCtx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);

  lfo.frequency.setValueAtTime(30, audioCtx.currentTime);
  lfoGain.gain.setValueAtTime(150, audioCtx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.45, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);

  osc.connect(gain);
  gain.connect(destination);
  if (monitor) gain.connect(audioCtx.destination);

  osc.start();
  lfo.start();
  osc.stop(audioCtx.currentTime + dur + 0.05);
  lfo.stop(audioCtx.currentTime + dur + 0.05);
}

function playStatic(
  audioCtx: AudioContext,
  destination: AudioNode,
  monitor: boolean,
  dur: number
) {
  const bufferSize = Math.floor(audioCtx.sampleRate * dur);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);

  noise.connect(gain);
  gain.connect(destination);
  if (monitor) gain.connect(audioCtx.destination);

  noise.start();
  noise.stop(audioCtx.currentTime + dur + 0.05);
}

/** Convenience: picks a random variant each call for chaotic mixing. */
export function playRandomBleepVariant(opts: Omit<PlayBleepOptions, "variant">) {
  const variants: BleepVariant[] = ["classic", "classic", "buzz", "robotic", "static"];
  const variant = variants[Math.floor(Math.random() * variants.length)];
  playBleep({ ...opts, variant });
}
