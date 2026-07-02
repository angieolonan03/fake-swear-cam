"use client";

export interface ControlBarProps {
  cameraReady: boolean;
  isRecording: boolean;
  isPaused: boolean;
  hasClip: boolean;
  onStartCamera: () => void;
  onRecord: () => void;
  onPause: () => void;
  onStop: () => void;
  onReplay: () => void;
  onDownload: () => void;
  onExportMp4?: () => void;
}

export default function ControlBar({
  cameraReady,
  isRecording,
  isPaused,
  hasClip,
  onStartCamera,
  onRecord,
  onPause,
  onStop,
  onReplay,
  onDownload,
  onExportMp4,
}: ControlBarProps) {
  return (
    <div className="controls">
      {!cameraReady && (
        <button className="go" onClick={onStartCamera}>
          Start Cam
        </button>
      )}

      {cameraReady && !isRecording && (
        <button className="primary" onClick={onRecord}>
          ● Record
        </button>
      )}

      {isRecording && (
        <>
          <button onClick={onPause}>{isPaused ? "Resume" : "Pause"}</button>
          <button onClick={onStop}>Stop</button>
        </>
      )}

      {hasClip && !isRecording && (
        <>
          <button onClick={onReplay}>Replay</button>
          <button onClick={onDownload}>Download</button>
          {onExportMp4 && (
            <button onClick={onExportMp4}>Export MP4</button>
          )}
        </>
      )}

      <style jsx>{`
        .controls {
          position: absolute;
          bottom: 14px;
          left: 0;
          right: 0;
          z-index: 6;
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          padding: 0 10px;
        }
        button {
          font-family: inherit;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 9px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(20, 20, 32, 0.85);
          color: var(--text);
          cursor: pointer;
          transition: transform 0.08s ease, border-color 0.15s ease;
        }
        button:hover {
          border-color: var(--blue);
          transform: translateY(-1px);
        }
        button:active {
          transform: translateY(0);
        }
        .primary {
          background: var(--red);
          border-color: var(--red);
          color: #fff;
        }
        .go {
          background: var(--blue);
          border-color: var(--blue);
          color: #000;
        }
      `}</style>
    </div>
  );
}
