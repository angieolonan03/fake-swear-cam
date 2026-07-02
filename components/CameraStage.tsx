"use client";

import { forwardRef, RefObject } from "react";
import EffectLayer, { EffectLayerHandle } from "./EffectLayer";

interface CameraStageProps {
  videoRef: RefObject<HTMLVideoElement>;
  effectLayerRef: RefObject<EffectLayerHandle>;
  children?: React.ReactNode;
}

/**
 * Video + canvas compositor. Renders the mirrored webcam feed with the
 * EffectLayer (glitch/shake/emoji/mouth-censor canvas) stacked on top.
 * `children` is used to slot in RecIndicator, StatsHUD, SubtitleBar, etc.
 * so they share the same stage bounding box.
 */
const CameraStage = forwardRef<HTMLDivElement, CameraStageProps>(
  ({ videoRef, effectLayerRef, children }, stageRef) => {
    return (
      <div ref={stageRef} className="stage">
        <video ref={videoRef} autoPlay playsInline muted className="video" />
        <EffectLayer ref={effectLayerRef} />
        {children}

        <style jsx>{`
          .stage {
            position: relative;
            width: min(92vw, 560px);
            aspect-ratio: 9 / 16;
            border-radius: 22px;
            overflow: hidden;
            background: #000;
            box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.35),
              0 0 40px rgba(0, 229, 255, 0.15), 0 20px 60px rgba(0, 0, 0, 0.6);
          }
          .video {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transform: scaleX(-1);
          }
        `}</style>
      </div>
    );
  }
);

CameraStage.displayName = "CameraStage";
export default CameraStage;
