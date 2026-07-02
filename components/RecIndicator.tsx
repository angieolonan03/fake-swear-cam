"use client";

interface RecIndicatorProps {
  visible: boolean;
  elapsedSeconds: number;
}

function formatTime(totalSeconds: number): string {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(Math.floor(totalSeconds % 60)).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function RecIndicator({ visible, elapsedSeconds }: RecIndicatorProps) {
  if (!visible) return null;

  return (
    <div className="rec">
      <span className="dot" />
      REC <span>{formatTime(elapsedSeconds)}</span>

      <style jsx>{`
        .rec {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          letter-spacing: 1px;
          border: 1px solid rgba(255, 43, 74, 0.5);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--red);
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.25;
          }
        }
      `}</style>
    </div>
  );
}
