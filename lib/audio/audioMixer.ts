/**
 * audioMixer.ts
 *
 * Builds the Web Audio graph:
 *
 *   mic source ──► analyser (for onset detection, not connected to output)
 *              └─► gain (mix bus) ──► MediaStreamAudioDestinationNode (mixedStream)
 *
 * bleepSynth nodes are connected directly into the same gain node by the
 * caller, so both mic audio and synthesized bleeps end up in one
 * MediaStream that can be handed to MediaRecorder.
 */

export interface AudioMixer {
  audioCtx: AudioContext;
  analyser: AnalyserNode;
  /** Mix bus — connect bleep synth output nodes here to include them in recordings. */
  mixBus: GainNode;
  /** Single audio stream containing mic + any bleeps routed into mixBus. */
  mixedStream: MediaStream;
  destroy: () => void;
}

export function createAudioMixer(micStream: MediaStream): AudioMixer {
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const audioCtx = new AudioContextCtor();

  const source = audioCtx.createMediaStreamSource(micStream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.4;
  source.connect(analyser);

  const mixBus = audioCtx.createGain();
  mixBus.gain.value = 1.0;
  source.connect(mixBus);

  const dest = audioCtx.createMediaStreamDestination();
  mixBus.connect(dest);

  return {
    audioCtx,
    analyser,
    mixBus,
    mixedStream: dest.stream,
    destroy: () => {
      try {
        source.disconnect();
        analyser.disconnect();
        mixBus.disconnect();
        audioCtx.close();
      } catch {
        // already closed / disconnected — safe to ignore
      }
    },
  };
}
