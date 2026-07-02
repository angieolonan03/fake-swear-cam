# public/sounds/

Not required to run the app — `lib/audio/bleepSynth.ts` synthesizes every
censor tone (classic, buzz, robotic, static) with the Web Audio API, so
there's zero network/asset weight for the core experience.

Drop pre-recorded samples in here if you want *real* audio clips instead of
synthesized ones (e.g. a classic TV bleep sample, an airhorn, radio static):

```
public/sounds/
├─ bleep-classic.mp3
├─ buzz.mp3
├─ airhorn.mp3
├─ robotic.mp3
└─ static.mp3
```

Then extend `playBleep()` in `lib/audio/bleepSynth.ts` with an
`HTMLAudioElement`/`AudioBufferSourceNode` path that loads and plays one of
these instead of (or randomly mixed with) the synthesized variant.
