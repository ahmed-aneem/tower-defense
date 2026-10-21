import { type EnemyType } from '../types';

const TAU = Math.PI * 2;

function poly(ctx: CanvasRenderingContext2D, n: number, r: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + (TAU * i) / n;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, look = 0.35) {
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0b1120';
  ctx.beginPath(); ctx.arc(x + r * look, y, r * 0.5, 0, TAU); ctx.fill();
}

/**
 * Draws an enemy in a local frame facing +x. `t` = seconds, `phase` desyncs idle animations.
 */
export function drawEnemySprite(
  ctx: CanvasRenderingContext2D, type: EnemyType, r: number, fill: string, outline: string, t: number, phase: number
) {
  const tt = t + phase;
  ctx.fillStyle = fill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;

  switch (type) {
    case 'FAST': {
      // Glitch dart with chromatic ghosts
      for (const [dx, dy, c] of [[-3, 2, 'rgba(34,211,238,0.35)'], [-3, -2, 'rgba(244,114,182,0.35)']] as const) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(r + dx, dy); ctx.lineTo(-r + dx, -r * 0.8 + dy); ctx.lineTo(-r * 0.4 + dx, dy); ctx.lineTo(-r + dx, r * 0.8 + dy);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(r * 1.1, 0); ctx.lineTo(-r, -r * 0.8); ctx.lineTo(-r * 0.4, 0); ctx.lineTo(-r, r * 0.8);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      eye(ctx, r * 0.2, 0, r * 0.28);
      break;
    }
    case 'SWARM': {
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        const w = Math.sin(tt * 18 + i) * 2.5;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(i * r * 0.5, 0);
          ctx.lineTo(i * r * 0.9 + w, s * r * 1.25);
          ctx.stroke();
        }
      }
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.75, 0, 0, TAU); ctx.fill(); ctx.stroke();
      eye(ctx, r * 0.45, 0, r * 0.3);
      break;
    }
    case 'ARMORED': {
      ctx.beginPath(); ctx.roundRect(-r, -r, r * 2, r * 2, r * 0.35); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.moveTo(-r * 0.2, -r); ctx.lineTo(-r * 0.2, r); ctx.moveTo(r * 0.45, -r); ctx.lineTo(r * 0.45, r); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (const [x, y] of [[-0.7, -0.7], [-0.7, 0.7], [0.75, -0.7], [0.75, 0.7]]) {
        ctx.beginPath(); ctx.arc(x * r, y * r, 1.6, 0, TAU); ctx.fill();
      }
      eye(ctx, r * 0.55, 0, r * 0.22);
      break;
    }
    case 'TANK': {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(-r, -r * 1.15, r * 2, r * 0.35);
      ctx.fillRect(-r, r * 0.8, r * 2, r * 0.35);
      ctx.fillStyle = fill;
      poly(ctx, 8, r, Math.PI / 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.arc(-r * 0.15, 0, r * 0.45, 0, TAU); ctx.fill();
      ctx.fillStyle = fill;
      ctx.fillRect(0, -r * 0.14, r * 1.15, r * 0.28);
      eye(ctx, -r * 0.15, 0, r * 0.28, 0.2);
      break;
    }
    case 'BOSS': {
      const aura = 1 + Math.sin(tt * 3) * 0.06;
      ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.arc(0, 0, r * 1.25 * aura, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      for (let i = 0; i < 3; i++) {
        const a = tt * 1.6 + (TAU * i) / 3;
        ctx.fillStyle = outline;
        ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15, 3.5, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = fill;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const rad = i % 2 ? r * 0.68 : r;
        const a = (TAU * i) / 16 + tt * 0.3;
        ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0b1120';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, TAU); ctx.fill();
      eye(ctx, r * 0.05, 0, r * 0.38, 0.45);
      break;
    }
    default: { // NORMAL drone
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.65, 0, TAU); ctx.stroke();
      ctx.strokeStyle = outline;
      const wob = Math.sin(tt * 6) * 0.25;
      ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(-r * 1.2, -r * (1 + wob)); ctx.stroke();
      eye(ctx, r * 0.35, 0, r * 0.34);
    }
  }
}
