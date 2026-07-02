/**
 * visualEffects.ts
 *
 * Pure canvas drawing helpers — no React here, so EffectLayer.tsx can run
 * a tight requestAnimationFrame loop without re-render overhead.
 */

export const BANNERS = [
  "WHAT THE #@!%",
  "BLEEP!",
  "CENSORED",
  "LANGUAGE!",
  "*&%$#!",
  "OH COME ON",
];

export const EMOJIS = ["🤬", "💢", "🔥", "😤", "‼️"];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  emoji: string;
}

export function spawnParticles(width: number, height: number): Particle[] {
  const count = 3 + Math.floor(Math.random() * 3);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: width / 2 + (Math.random() - 0.5) * 60,
      y: height * 0.4 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 4,
      vy: -2 - Math.random() * 2,
      life: 40,
      size: 20 + Math.random() * 14,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    });
  }
  return particles;
}

export function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): Particle[] {
  const alive = particles.filter((p) => p.life > 0);
  for (const p of alive) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= 1;
    ctx.save();
    ctx.globalAlpha = Math.max(p.life / 40, 0);
    ctx.font = `${p.size}px serif`;
    ctx.fillText(p.emoji, p.x, p.y);
    ctx.restore();
  }
  return alive;
}

/**
 * Draws a rounded black censor bar over the estimated mouth position for a
 * centered selfie frame (~57% down from the top). Approximate, not
 * face-tracked — see README for a face-landmark upgrade path.
 */
export function drawMouthCensor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  jitter: { dx: number; dy: number }
) {
  const w = width * 0.3;
  const h = height * 0.055;
  const x = width / 2 - w / 2 + jitter.dx;
  const y = height * 0.565 - h / 2 + jitter.dy;
  const r = h / 2;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0,229,255,0.85)";
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${Math.max(h * 0.5, 10)}px 'JetBrains Mono', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BLEEP", x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

export function randomBanner(): string {
  return BANNERS[Math.floor(Math.random() * BANNERS.length)];
}
