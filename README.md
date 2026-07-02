# Fake Swear Cam

Live webcam comedy app: talks normally on camera, and it sounds/looks like
constant censorship — bleeps, mouth censor bar, glitch effects, and fake
censored subtitles, all synced to real speech in real time.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Camera/mic permissions are required and
everything runs client-side — nothing is uploaded unless you click
**Export MP4**, which is the only network round trip (webm → mp4 via the
optional `/api/render` ffmpeg route).

`/api/render` needs an `ffmpeg` binary available on the server (or install
`ffmpeg-static` and set `FFMPEG_PATH`, see comments in
`app/api/render/route.ts`). If you skip this, the **Download** button still
gives users a `.webm` clip with everything baked in.

## How detection works

- **Fast path** — `lib/audio/onsetDetector.ts` watches for spectral-flux
  transients (bursts of high-frequency energy typical of plosive/fricative
  consonants) and fires almost instantly. This drives the bleep sound, the
  mouth censor bar, and the glitch/shake/emoji effects.
- **Slow path** — `lib/speech/subtitleEngine.ts` wraps the browser
  `SpeechRecognition` API to get real words (a few hundred ms behind the
  audio) and censors any word starting with a target sound for the live
  subtitle bar.

See the file-level comments in `lib/audio/onsetDetector.ts` for the
recommended upgrade path to genuine phoneme-level detection (TensorFlow.js /
ONNX phoneme classifier) instead of the transient heuristic.

## Project layout

```
fake-swear-cam/
├─ app/
│  ├─ layout.tsx              # root layout, imports globals.css
│  ├─ page.tsx                # main studio view — wires everything together
│  └─ api/render/route.ts     # optional server-side ffmpeg webm→mp4 pass
├─ components/                # presentational + stage components
├─ lib/
│  ├─ audio/                  # onset detection, bleep synth, mic/bleep mixer
│  ├─ speech/                 # SpeechRecognition wrapper + censor logic
│  ├─ recording/              # MediaRecorder + canvas capture
│  └─ effects/                # canvas particle/glitch/mouth-censor renderers
├─ public/sounds/              # optional pre-recorded bleep sample slot
└─ styles/globals.css
```
