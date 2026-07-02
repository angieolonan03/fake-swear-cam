/**
 * subtitleEngine.ts
 *
 * Slow-path, accurate word source: browser SpeechRecognition. Runs a beat
 * behind the audio (a few hundred ms), which is fine — the bleep sound and
 * mouth censor already fired from the fast onset-detection path; subtitles
 * just need to catch up with the right words censored.
 */

import { TARGET_SOUNDS } from "../audio/onsetDetector";

// Minimal ambient types so this compiles without "dom.iterable"/vendor libs.
type SpeechRecognitionCtor = new () => SpeechRecognition;

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SubtitleEngineOptions {
  /** Called with the censored HTML-safe string on every result update. */
  onTranscript: (censoredText: string) => void;
  /** Probability [0,1] that a matching word actually gets censored. */
  censorChance?: number;
  lang?: string;
}

export function censorText(text: string, censorChance = 0.55): string {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, "");
      const firstTwo = clean.slice(0, 2);
      const hitsSound = TARGET_SOUNDS.some(
        (s) => clean.startsWith(s) || firstTwo === s
      );
      if (hitsSound && Math.random() < censorChance) {
        return '<span class="bleep">[BLEEP]</span>';
      }
      return word;
    })
    .join(" ");
}

export class SubtitleEngine {
  private recognizer: SpeechRecognition | null = null;
  private opts: Required<SubtitleEngineOptions>;
  private active = false;

  constructor(opts: SubtitleEngineOptions) {
    this.opts = {
      censorChance: opts.censorChance ?? 0.55,
      lang: opts.lang ?? "en-US",
      onTranscript: opts.onTranscript,
    };
  }

  get supported(): boolean {
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  start() {
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    this.active = true;
    const recognizer = new SR();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = this.opts.lang;

    recognizer.onresult = (event) => {
      const e = event as unknown as SpeechRecognitionEventLike;
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      this.opts.onTranscript(censorText(text.trim(), this.opts.censorChance));
    };
    recognizer.onerror = () => {
      /* transient errors (no-speech, network) are expected; keep listening */
    };
    recognizer.onend = () => {
      // browsers auto-stop after a period of silence — restart if still active
      if (this.active) {
        try {
          recognizer.start();
        } catch {
          /* already starting */
        }
      }
    };

    this.recognizer = recognizer;
    try {
      recognizer.start();
    } catch {
      /* ignore double-start */
    }
  }

  stop() {
    this.active = false;
    this.recognizer?.stop();
    this.recognizer = null;
  }
}
