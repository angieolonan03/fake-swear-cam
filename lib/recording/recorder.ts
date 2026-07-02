/**
 * recorder.ts
 *
 * Draws the mirrored video feed + the effects canvas on top of it into an
 * offscreen capture canvas every frame, captures that as a video stream,
 * merges it with the mixed audio stream (mic + bleeps) from audioMixer,
 * and records the result with MediaRecorder.
 */

export interface StartRecordingOptions {
  video: HTMLVideoElement;
  fxCanvas: HTMLCanvasElement;
  audioStream: MediaStream;
  /** Frames per second for the capture canvas. Default 30. */
  fps?: number;
}

export class ClipRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private capCanvas: HTMLCanvasElement;
  private capCtx: CanvasRenderingContext2D;
  private paintRafId: number | null = null;
  private painting = false;
  private lastBlobUrl: string | null = null;

  constructor() {
    this.capCanvas = document.createElement("canvas");
    const ctx = this.capCanvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.capCtx = ctx;
  }

  get isRecording(): boolean {
    return this.recorder?.state === "recording";
  }

  start({ video, fxCanvas, audioStream }: StartRecordingOptions) {
    this.capCanvas.width = fxCanvas.width;
    this.capCanvas.height = fxCanvas.height;

    this.painting = true;
    const paint = () => {
      if (!this.painting) return;
      const { width, height } = this.capCanvas;
      this.capCtx.save();
      this.capCtx.translate(width, 0);
      this.capCtx.scale(-1, 1);
      this.capCtx.drawImage(video, 0, 0, width, height);
      this.capCtx.restore();
      this.capCtx.drawImage(fxCanvas, 0, 0);
      this.paintRafId = requestAnimationFrame(paint);
    };
    paint();

    const videoStream = this.capCanvas.captureStream(30);
    const combined = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);

    let mimeType = "video/webm;codecs=vp9,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";

    this.chunks = [];
    this.recorder = new MediaRecorder(combined, { mimeType });
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start();
  }

  /** Stops recording and resolves with a downloadable blob URL. */
  stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error("Recorder was never started"));
        return;
      }
      this.recorder.onstop = () => {
        this.painting = false;
        if (this.paintRafId) cancelAnimationFrame(this.paintRafId);
        const blob = new Blob(this.chunks, { type: "video/webm" });
        if (this.lastBlobUrl) URL.revokeObjectURL(this.lastBlobUrl);
        this.lastBlobUrl = URL.createObjectURL(blob);
        resolve(this.lastBlobUrl);
      };
      this.recorder.stop();
    });
  }

  downloadLast(filename = `fake-swear-cam-${Date.now()}.webm`) {
    if (!this.lastBlobUrl) return;
    const a = document.createElement("a");
    a.href = this.lastBlobUrl;
    a.download = filename;
    a.click();
  }

  /** For server-side transcode (see app/api/render/route.ts). */
  getLastBlob(): Blob | null {
    if (this.chunks.length === 0) return null;
    return new Blob(this.chunks, { type: "video/webm" });
  }
}
