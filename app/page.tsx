"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CameraStage from "../components/CameraStage";
import { EffectLayerHandle } from "../components/EffectLayer";
import RecIndicator from "../components/RecIndicator";
import StatsHUD from "../components/StatsHUD";
import SubtitleBar from "../components/SubtitleBar";
import ControlBar from "../components/ControlBar";
import { createAudioMixer, AudioMixer } from "../lib/audio/audioMixer";
import { OnsetDetector, TriggerSound } from "../lib/audio/onsetDetector";
import { playBleep } from "../lib/audio/bleepSynth";
import { SubtitleEngine } from "../lib/speech/subtitleEngine";
import { ClipRecorder } from "../lib/recording/recorder";

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const effectLayerRef = useRef<EffectLayerHandle>(null);

  const mixerRef = useRef<AudioMixer | null>(null);
  const onsetRef = useRef<OnsetDetector | null>(null);
  const subtitleEngineRef = useRef<SubtitleEngine | null>(null);
  const recorderRef = useRef<ClipRecorder>(new ClipRecorder());
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionStartRef = useRef<number>(0);
  const tallyRef = useRef<Record<string, number>>({});
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [status, setStatus] = useState(
    "tap start to grant camera + mic access"
  );
  const [subtitleHtml, setSubtitleHtml] = useState("");
  const [bleepCount, setBleepCount] = useState(0);
  const [ratePerMinute, setRatePerMinute] = useState(0);
  const [topSound, setTopSound] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasClip, setHasClip] = useState(false);

  const handleTrigger = useCallback((sound: TriggerSound) => {
    const mixer = mixerRef.current;
    if (!mixer) return;

    playBleep({ audioCtx: mixer.audioCtx, destination: mixer.mixBus });
    effectLayerRef.current?.trigger(sound);

    tallyRef.current[sound] = (tallyRef.current[sound] ?? 0) + 1;
    setBleepCount((c) => c + 1);

    let top = "";
    let topN = 0;
    for (const [k, v] of Object.entries(tallyRef.current)) {
      if (v > topN) {
        top = k.toUpperCase();
        topN = v;
      }
    }
    setTopSound(top);

    const elapsedMin = Math.max(
      (performance.now() - sessionStartRef.current) / 60000,
      1 / 60
    );
    const totalTriggers = Object.values(tallyRef.current).reduce(
      (a, b) => a + b,
      0
    );
    setRatePerMinute(totalTriggers / elapsedMin);
  }, []);

  const startCamera = useCallback(async () => {
    setStatus("requesting camera + mic…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const mixer = createAudioMixer(stream);
      mixerRef.current = mixer;

      const onset = new OnsetDetector(mixer.analyser, {
        onTrigger: handleTrigger,
      });
      onset.start();
      onsetRef.current = onset;

      const subtitleEngine = new SubtitleEngine({
        onTranscript: setSubtitleHtml,
      });
      if (subtitleEngine.supported) {
        subtitleEngine.start();
        subtitleEngineRef.current = subtitleEngine;
      } else {
        setSubtitleHtml("(live captions unsupported in this browser)");
      }

      sessionStartRef.current = performance.now();
      setCameraReady(true);
      setStatus("live — talk normally");
    } catch (err) {
      setStatus(
        `camera/mic permission denied or unsupported — ${
          (err as Error).message
        }`
      );
    }
  }, [handleTrigger]);

  const startRecording = useCallback(() => {
    const video = videoRef.current;
    const fxCanvas = effectLayerRef.current?.canvas;
    const mixer = mixerRef.current;
    if (!video || !fxCanvas || !mixer) return;

    recorderRef.current.start({
      video,
      fxCanvas,
      audioStream: mixer.mixedStream,
    });
    setIsRecording(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setHasClip(false);

    const start = performance.now();
    recTimerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((performance.now() - start) / 1000));
    }, 250);
  }, []);

  const stopRecording = useCallback(async () => {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    await recorderRef.current.stop();
    setIsRecording(false);
    setIsPaused(false);
    setHasClip(true);
  }, []);

  const togglePause = useCallback(() => {
    // MediaRecorder supports pause/resume natively; ClipRecorder can be
    // extended with pause()/resume() wrapping recorder.pause()/resume().
    setIsPaused((p) => !p);
  }, []);

  const replayClip = useCallback(() => {
    const blob = recorderRef.current.getLastBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }, []);

  const downloadClip = useCallback(() => {
    recorderRef.current.downloadLast();
  }, []);

  const exportMp4 = useCallback(async () => {
    const blob = recorderRef.current.getLastBlob();
    if (!blob) return;
    setStatus("uploading for MP4 transcode…");
    const form = new FormData();
    form.append("clip", blob, "clip.webm");
    try {
      const res = await fetch("/api/render", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const outBlob = await res.blob();
      const url = URL.createObjectURL(outBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fake-swear-cam-${Date.now()}.mp4`;
      a.click();
      setStatus("live — talk normally");
    } catch (err) {
      setStatus(`export failed — ${(err as Error).message}`);
    }
  }, []);

  useEffect(() => {
    return () => {
      onsetRef.current?.stop();
      subtitleEngineRef.current?.stop();
      mixerRef.current?.destroy();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    };
  }, []);

  return (
    <main className="app">
      <CameraStage
        ref={stageRef}
        videoRef={videoRef}
        effectLayerRef={effectLayerRef}
      >
        <RecIndicator visible={isRecording} elapsedSeconds={elapsedSeconds} />
        <StatsHUD
          bleepCount={bleepCount}
          ratePerMinute={ratePerMinute}
          topSound={topSound}
        />
        <SubtitleBar html={subtitleHtml} />
        <div className="status">{status}</div>

        <ControlBar
          cameraReady={cameraReady}
          isRecording={isRecording}
          isPaused={isPaused}
          hasClip={hasClip}
          onStartCamera={startCamera}
          onRecord={startRecording}
          onPause={togglePause}
          onStop={stopRecording}
          onReplay={replayClip}
          onDownload={downloadClip}
          onExportMp4={exportMp4}
        />

        {!cameraReady && (
          <div className="gate">
            <h1>
              FAKE SWEAR
              <br />
              CAM
            </h1>
            <p>
              Talk normally. We&apos;ll make it sound like you&apos;re
              constantly getting censored. Camera + mic required, nothing
              leaves your browser unless you choose Export MP4.
            </p>
            <button className="go" onClick={startCamera}>
              Enable Camera &amp; Mic
            </button>
          </div>
        )}
      </CameraStage>

      <style jsx>{`
        .app {
          position: relative;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(
              circle at 20% 10%,
              rgba(0, 229, 255, 0.08),
              transparent 40%
            ),
            radial-gradient(
              circle at 80% 90%,
              rgba(255, 43, 74, 0.1),
              transparent 40%
            ),
            var(--bg);
        }
        .status {
          position: absolute;
          bottom: 66px;
          left: 0;
          right: 0;
          text-align: center;
          z-index: 6;
          font-size: 10px;
          color: #7a8099;
          letter-spacing: 1px;
        }
        .gate {
          position: absolute;
          inset: 0;
          z-index: 20;
          background: rgba(4, 4, 8, 0.94);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
          gap: 14px;
        }
        .gate h1 {
          font-family: Impact, "Arial Black", sans-serif;
          font-size: clamp(28px, 7vw, 40px);
          margin: 0;
          color: var(--red);
          -webkit-text-stroke: 1.5px var(--blue);
          letter-spacing: 1px;
        }
        .gate p {
          color: #a7adcf;
          font-size: 13px;
          max-width: 320px;
          margin: 0;
        }
        .gate :global(button) {
          font-family: inherit;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 9px 14px;
          border-radius: 10px;
          border: 1px solid var(--blue);
          background: var(--blue);
          color: #000;
          cursor: pointer;
        }
      `}</style>
    </main>
  );
}
