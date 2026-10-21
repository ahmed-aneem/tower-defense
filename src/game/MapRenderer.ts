import { type Vector2 } from './Vector';
import { THEMES, type MapTheme } from './MapThemes';

const ROAD_W = 34;

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function segDist(p: Vector2, a: Vector2, b: Vector2): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function tracePath(ctx: CanvasRenderingContext2D, path: Vector2[]) {
  ctx.beginPath();
  path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
}

function drawProp(ctx: CanvasRenderingContext2D, kind: MapTheme['prop'], x: number, y: number, r: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  if (kind === 'HEX') {
    for (let i = 0; i < 6; i++) ctx[i ? 'lineTo' : 'moveTo'](Math.cos(i * Math.PI / 3) * r, Math.sin(i * Math.PI / 3) * r);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'DOT') {
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'CRYSTAL') {
    ctx.moveTo(0, -r); ctx.lineTo(r * 0.5, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.5, 0);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'RING') {
    ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.rect(-r, -r * 0.18, r * 2, r * 0.36);
    ctx.fill();
  }
  ctx.restore();
}

function drawChevrons(ctx: CanvasRenderingContext2D, path: Vector2[], color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 1) continue;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    for (let d = 40; d < len - 20; d += 80) {
      ctx.save();
      ctx.translate(a.x + Math.cos(ang) * d, a.y + Math.sin(ang) * d);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(-4, -5); ctx.lineTo(2, 0); ctx.lineTo(-4, 5);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/** Pre-renders the full static map background (called once per map/resize). */
export function renderMapBackground(
  ctx: CanvasRenderingContext2D, w: number, h: number, path: Vector2[], themeKey: string, seed: number
) {
  const t = THEMES[themeKey] ?? THEMES.GRID;

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, t.bgTop);
  g.addColorStop(1, t.bgBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = t.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
  for (let y = 0; y <= h; y += 40) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
  ctx.stroke();

  // Decorative props, kept off the road and buildable area edges
  const rand = rng(seed);
  ctx.fillStyle = t.decor;
  ctx.strokeStyle = t.decor;
  const count = Math.round((w * h) / 9000);
  for (let n = 0; n < count; n++) {
    const p = { x: rand() * w, y: rand() * h } as Vector2;
    const r = 6 + rand() * 12;
    const rot = rand() * Math.PI;
    if (path.some((a, i) => i < path.length - 1 && segDist(p, a, path[i + 1]) < ROAD_W + r)) continue;
    drawProp(ctx, t.prop, p.x, p.y, r, rot);
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  tracePath(ctx, path);
  ctx.lineWidth = ROAD_W + 16;
  ctx.strokeStyle = t.glow;
  ctx.stroke();

  ctx.lineWidth = ROAD_W + 4;
  ctx.strokeStyle = t.edge;
  ctx.stroke();

  ctx.lineWidth = ROAD_W;
  ctx.strokeStyle = t.road;
  ctx.stroke();

  ctx.setLineDash([10, 14]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = t.flow;
  ctx.globalAlpha = 0.35;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  drawChevrons(ctx, path, t.flow);
}

/** Animated spawn portal + core, drawn every frame on top of the background. */
export function drawEndpoints(ctx: CanvasRenderingContext2D, path: Vector2[], themeKey: string, lives: number) {
  if (path.length < 2) return;
  const t = THEMES[themeKey] ?? THEMES.GRID;
  const time = performance.now() * 0.003;
  const start = path[0], end = path[path.length - 1];

  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f87171';
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.8 - i * 0.2;
    ctx.beginPath();
    ctx.arc(start.x, start.y, 10 + i * 6 + Math.sin(time + i) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  const pulse = 1 + Math.sin(time * 1.5) * 0.08;
  ctx.translate(end.x, end.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = t.road;
  ctx.strokeStyle = lives <= 5 ? '#ef4444' : t.edge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) ctx[i ? 'lineTo' : 'moveTo'](Math.cos(i * Math.PI / 3) * 22, Math.sin(i * Math.PI / 3) * 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = lives <= 5 ? '#ef4444' : t.edge;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
