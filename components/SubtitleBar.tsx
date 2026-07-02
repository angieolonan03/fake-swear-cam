"use client";

export interface SubtitleBarProps {
  /** Pre-censored HTML string from lib/speech/subtitleEngine.censorText(). */
  html: string;
}

export default function SubtitleBar({ html }: SubtitleBarProps) {
  return (
    <>
      <div className="subtitle" dangerouslySetInnerHTML={{ __html: html }} />
      <style jsx>{`
        .subtitle {
          position: absolute;
          bottom: 74px;
          left: 0;
          right: 0;
          z-index: 6;
          text-align: center;
          padding: 0 16px;
          font-weight: 800;
          font-size: clamp(16px, 4.2vw, 22px);
          color: #fff;
          text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000,
            2px 2px 0 #000, 0 0 12px rgba(0, 0, 0, 0.8);
          letter-spacing: 0.3px;
          min-height: 1.4em;
        }
        .subtitle :global(.bleep) {
          color: var(--red);
        }
      `}</style>
    </>
  );
}
