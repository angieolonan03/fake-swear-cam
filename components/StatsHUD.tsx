"use client";

export interface StatsHUDProps {
  bleepCount: number;
  ratePerMinute: number;
  topSound: string;
}

export default function StatsHUD({
  bleepCount,
  ratePerMinute,
  topSound,
}: StatsHUDProps) {
  return (
    <div className="hud">
      <div>
        <b>{bleepCount}</b> <span className="label">bleeps</span>
      </div>
      <div>
        <b>{ratePerMinute.toFixed(1)}</b> <span className="label">swears/min</span>
      </div>
      <div>
        <span className="label">top:</span> <b>{topSound || "—"}</b>
      </div>

      <style jsx>{`
        .hud {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 5;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(0, 229, 255, 0.4);
          border-radius: 12px;
          padding: 8px 10px;
          font-size: 11px;
          line-height: 1.5;
          text-align: right;
          min-width: 120px;
        }
        b {
          color: var(--yellow);
          font-size: 14px;
        }
        .label {
          color: #8890b0;
        }
      `}</style>
    </div>
  );
}
