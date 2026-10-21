import { type TowerType } from './Constants';

const TAU = Math.PI * 2;

function poly(ctx: CanvasRenderingContext2D, n: number, r: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + (TAU * i) / n;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/** Glowing "eye" lens shared by every tower so they read as little characters. */
function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, active: boolean) {
  disc(ctx, x, y, r, '#0b1120');
  disc(ctx, x, y, r * 0.62, active ? '#ffffff' : color);
  disc(ctx, x + r * 0.2, y - r * 0.2, r * 0.2, 'rgba(255,255,255,0.9)');
}

/**
 * Draws the tower "character" in a local frame that already faces +x.
 * `t` is seconds (idle animation), `firing` flashes the eye.
 */
export function drawTowerSprite(ctx: CanvasRenderingContext2D, type: TowerType, color: string, t: number, firing: boolean) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const pulse = 1 + Math.sin(t * 3) * 0.08;

  switch (type) {
    case 'SNIPER':
      ctx.fillRect(2, -2.5, 30, 5);
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(14, -2.5, 3, 5);
      ctx.fillRect(24, -2.5, 3, 5);
      ctx.fillStyle = color;
      poly(ctx, 4, 11, Math.PI / 4);
      ctx.fill();
      eye(ctx, 1, 0, 5, '#fb7185', firing);
      break;
    case 'RAPID':
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(6, -7, 20, 3);
      ctx.fillRect(6, -1.5, 22, 3);
      ctx.fillRect(6, 4, 20, 3);
      ctx.fillStyle = color;
      disc(ctx, 0, 0, 11, color);
      ctx.strokeStyle = '#0b1120';
      ctx.setLineDash([3, 3]);
      ctx.lineDashOffset = -t * 30;
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      eye(ctx, 1, 0, 4, color, firing);
      break;
    case 'FROST':
      poly(ctx, 6, 12, t * 0.4);
      ctx.fill();
      ctx.strokeStyle = '#ecfeff';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * i) / 3 + t * 0.4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9);
        ctx.lineTo(-Math.cos(a) * 9, -Math.sin(a) * 9);
        ctx.stroke();
      }
      for (let i = 0; i < 3; i++) {
        const a = t * 1.5 + (TAU * i) / 3;
        disc(ctx, Math.cos(a) * 17, Math.sin(a) * 17, 2.5, '#a5f3fc');
      }
      eye(ctx, 0, 0, 4.5, '#a5f3fc', firing);
      break;
    case 'SPLASH':
      ctx.fillRect(4, -7, 24, 14);
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(26, -8.5, 4, 17);
      ctx.fillStyle = color;
      disc(ctx, 0, 0, 12, color);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (let i = 0; i < 4; i++) disc(ctx, Math.cos(i * Math.PI / 2 + 0.78) * 8, Math.sin(i * Math.PI / 2 + 0.78) * 8, 1.4, 'rgba(0,0,0,0.4)');
      eye(ctx, 1, 0, 5, '#fca5a5', firing);
      break;
    case 'LASER':
      poly(ctx, 3, 13, 0);
      ctx.fill();
      ctx.fillStyle = '#fdf4ff';
      ctx.fillRect(4, -1.5, 22, 3);
      poly(ctx, 3, 6, t * 2);
      ctx.fillStyle = '#0b1120';
      ctx.fill();
      eye(ctx, 0, 0, 3.5, color, firing);
      break;
    case 'TESLA': {
      disc(ctx, 0, 0, 11, '#334155');
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, 9 - i * 2.4, 0, TAU);
        ctx.stroke();
      }
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#fef9c3';
      for (let k = 0; k < 2; k++) {
        ctx.beginPath();
        const base = t * 6 + k * 3;
        for (let s = 0; s <= 5; s++) {
          const a = base + s * 0.25;
          const r = 6 + s * 3.4 + Math.sin(t * 20 + s * 2 + k) * 1.5;
          ctx[s ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.stroke();
      }
      eye(ctx, 0, 0, 4, color, firing);
      break;
    }
    case 'TACK':
      ctx.save();
      ctx.rotate(t * 0.8);
      ctx.fillStyle = '#e2e8f0';
      for (let i = 0; i < 8; i++) {
        ctx.rotate(TAU / 8);
        ctx.beginPath();
        ctx.moveTo(9, -3.5); ctx.lineTo(19, 0); ctx.lineTo(9, 3.5);
        ctx.fill();
      }
      ctx.restore();
      disc(ctx, 0, 0, 10, color);
      eye(ctx, 0, 0, 5, color, firing);
      break;
    case 'BEACON':
      for (let i = 0; i < 2; i++) {
        const k = (t * 0.7 + i * 0.5) % 1;
        ctx.globalAlpha = 0.5 * (1 - k);
        ctx.beginPath();
        ctx.arc(0, 0, 8 + k * 14, 0, TAU);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      poly(ctx, 3, 14 * pulse, -Math.PI / 2);
      ctx.fill();
      eye(ctx, 0, 1, 4, '#ccfbf1', true);
      break;
    case 'FARM':
      disc(ctx, 0, 4, 11, '#92400e');
      disc(ctx, 0, 0, 11, '#fbbf24');
      disc(ctx, 0, -4, 11, '#fcd34d');
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, -3);
      break;
    case 'PLASMA':
      disc(ctx, 0, 0, 12 * pulse, color);
      disc(ctx, 0, 0, 8, '#ddd6fe');
      for (let i = 0; i < 3; i++) {
        const a = t * 2.2 + (TAU * i) / 3;
        disc(ctx, Math.cos(a) * 18, Math.sin(a) * 18, 3, '#fff');
      }
      eye(ctx, 0, 0, 4.5, color, firing);
      break;
    default: // BASIC
      ctx.fillRect(2, -4, 22, 8);
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(22, -5, 3, 10);
      disc(ctx, 0, 0, 10.5, color);
      eye(ctx, 1, 0, 5, color, firing);
  }
}
