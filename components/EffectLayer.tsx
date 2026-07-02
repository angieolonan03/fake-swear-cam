"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { TriggerSound } from "../lib/audio/onsetDetector";
import {
  Particle,
  drawMouthCensor,
  randomBanner,
  spawnParticles,
  updateAndDrawParticles,
} from "../lib/effects/visualEffects";

export interface EffectLayerHandle {
  canvas: HTMLCanvasElement | null;
  /** Fires the full visual bundle: flash, shake, banner, particles, mouth censor. */
  trigger: (sound: TriggerSound) => void;
}

const EffectLayer = forwardRef<EffectLayerHandle>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouthCensorUntilRef = useRef(0);
  const mouthJitterRef = useRef({ dx: 0, dy: 0 });
  const rafRef = useRef<number | null>(null);

  const [flashOpacity, setFlashOpacity] = useState(0);
  const [bannerText, setBannerText] = useState("BLEEP!");
  const [bannerVisible, setBannerVisible] = useState(false);

  // resize canvas to match parent
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current?.parentElement;
    if (!canvas || !stage) return;
    const resize = () => {
      const rect = stage.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // draw loop: particles + mouth censor
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (performance.now() < mouthCensorUntilRef.current) {
        drawMouthCensor(ctx, canvas.width, canvas.height, mouthJitterRef.current);
      }

      particlesRef.current = updateAndDrawParticles(ctx, particlesRef.current);
    };
    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    canvas: canvasRef.current,
    trigger: (_sound: TriggerSound) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // screen flash
      setFlashOpacity(0.35);
      requestAnimationFrame(() => setFlashOpacity(0));

      // shake
      const stage = canvas.parentElement;
      stage?.animate(
        [
          { transform: "translate(0,0) rotate(0deg)" },
          {
            transform: `translate(${(Math.random() - 0.5) * 10}px, ${
              (Math.random() - 0.5) * 10
            }px) rotate(${(Math.random() - 0.5) * 2}deg)`,
          },
          { transform: "translate(0,0) rotate(0deg)" },
        ],
        { duration: 180, iterations: 1 }
      );

      // banner
      setBannerText(randomBanner());
      setBannerVisible(true);
      setTimeout(() => setBannerVisible(false), 260);

      // particles
      particlesRef.current = [
        ...particlesRef.current,
        ...spawnParticles(canvas.width, canvas.height),
      ];

      // mouth censor window
      mouthCensorUntilRef.current = performance.now() + (200 + Math.random() * 300);
      mouthJitterRef.current = {
        dx: (Math.random() - 0.5) * 6,
        dy: (Math.random() - 0.5) * 6,
      };
    },
  }));

  return (
    <div ref={stageRef} className="effect-layer">
      <canvas ref={canvasRef} className="fx-canvas" />
      <div className="censor-flash" style={{ opacity: flashOpacity }} />
      <div
        className="banner"
        style={{
          opacity: bannerVisible ? 1 : 0,
          transform: `translate(-50%,-50%) scale(${
            bannerVisible ? 1.05 : 0.5
          }) rotate(-2deg)`,
        }}
      >
        {bannerText}
      </div>

      <style jsx>{`
        .effect-layer {
          position: absolute;
          inset: 0;
          z-index: 4;
          pointer-events: none;
        }
        .fx-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .censor-flash {
          position: absolute;
          inset: 0;
          background: var(--red);
          mix-blend-mode: screen;
          transition: opacity 220ms ease;
        }
        .banner {
          position: absolute;
          top: 44%;
          left: 50%;
          font-family: Impact, "Arial Black", sans-serif;
          font-size: clamp(28px, 9vw, 54px);
          color: var(--yellow);
          -webkit-text-stroke: 2px #000;
          text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);
          transition: transform 160ms cubic-bezier(0.2, 1.4, 0.4, 1),
            opacity 160ms ease;
        }
      `}</style>
    </div>
  );
});

EffectLayer.displayName = "EffectLayer";
export default EffectLayer;
