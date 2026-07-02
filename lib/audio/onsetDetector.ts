/**
 * onsetDetector.ts
 *
 * Fast-path "phoneme approximation" for Fake Swear Cam.
 *
 * True phoneme recognition in-browser needs a real ASR/phoneme model
 * (see lib/speech/subtitleEngine.ts for the slower, accurate word-level path).
 * This module instead watches for spectral-flux transients — sudden bursts
 * of high-frequency energy that are characteristic of plosive/fricative
 * consonants (b, d, p, t, k, f, sh) — and fires near-instantly so the
 * bleep + visual effect feels synced to speech.
 *
 * Swap this out for a TensorFlow.js / ONNX phoneme classifier for v2.
 */

export const TARGET_SOUNDS = [
  "f",
  "sh",
  "b",
  "d",
  "h",
  "m",
  "p",
  "k",
  "t",
] as const;

export type TriggerSound = (typeof TARGET_SOUNDS)[number];

export interface OnsetDetectorOptions {
  /** Minimum rise in spectral flux to count as an onset. */
  fluxThreshold?: number;
  /** Minimum absolute energy required alongside the flux spike. */
  energyThreshold?: number;
  /** Minimum ms between triggers, to avoid double-firing on one sound. */
  debounceMs?: number;
  onTrigger: (sound: TriggerSound) => void;
}

export class OnsetDetector {
  private analyser: AnalyserNode;
  private freqData: Uint8Array;
  private lastFlux = 0;
  private lastTriggerTime = 0;
  private rafId: number | null = null;
  private opts: Required<Omit<OnsetDetectorOptions, "onTrigger">> & {
    onTrigger: OnsetDetectorOptions["onTrigger"];
  };

  constructor(analyser: AnalyserNode, options: OnsetDetectorOptions) {
    this.analyser = analyser;
    this.freqData = new Uint8Array(analyser.frequencyBinCount);
    this.opts = {
      fluxThreshold: options.fluxThreshold ?? 18,
      energyThreshold: options.energyThreshold ?? 30,
      debounceMs: options.debounceMs ?? 150,
      onTrigger: options.onTrigger,
    };
  }

  private spectralFlux(): number {
    this.analyser.getByteFrequencyData(this.freqData);
    let sum = 0;
    for (let i = 0; i < this.freqData.length; i++) {
      const v = this.freqData[i];
      sum += v * v;
    }
    return Math.sqrt(sum / this.freqData.length);
  }

  private tick = () => {
    this.rafId = requestAnimationFrame(this.tick);

    const flux = this.spectralFlux();
    const delta = flux - this.lastFlux;
    this.lastFlux = flux;

    const now = performance.now();
    const { fluxThreshold, energyThreshold, debounceMs, onTrigger } =
      this.opts;

    if (
      delta > fluxThreshold &&
      flux > energyThreshold &&
      now - this.lastTriggerTime > debounceMs
    ) {
      this.lastTriggerTime = now;
      const sound =
        TARGET_SOUNDS[Math.floor(Math.random() * TARGET_SOUNDS.length)];
      onTrigger(sound);
    }
  };

  start() {
    if (this.rafId !== null) return;
    this.tick();
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
