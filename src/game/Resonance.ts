import { type Tower } from './Tower';

export const LINK_RANGE = 130;
export const SPEED_PER_LINK = 0.08;
export const MAX_LINKS = 3;

/** Resonance: towers of *different* types close together sync up. Farms don't take part. */
export function canResonate(a: { type: string }, b: { type: string }): boolean {
  return a.type !== b.type && a.type !== 'FARM' && b.type !== 'FARM';
}

export function recalcResonance(towers: Tower[]) {
  for (const t of towers) t.links = [];
  for (let i = 0; i < towers.length; i++) {
    for (let j = i + 1; j < towers.length; j++) {
      const a = towers[i], b = towers[j];
      if (canResonate(a, b) && a.position.distanceTo(b.position) <= LINK_RANGE) {
        a.links.push(b.id);
        b.links.push(a.id);
      }
    }
  }
  for (const t of towers) {
    const n = Math.min(MAX_LINKS, t.links.length);
    t.attackSpeedBuff *= 1 + n * SPEED_PER_LINK;
  }
}

export function resonanceBonus(t: Tower): number {
  return Math.min(MAX_LINKS, t.links.length) * SPEED_PER_LINK;
}

export function drawLinks(ctx: CanvasRenderingContext2D, towers: Tower[], colorOf: (t: Tower) => string) {
  const time = performance.now() / 1000;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < towers.length; i++) {
    for (let j = i + 1; j < towers.length; j++) {
      const a = towers[i], b = towers[j];
      if (!a.links.includes(b.id)) continue;
      const g = ctx.createLinearGradient(a.position.x, a.position.y, b.position.x, b.position.y);
      g.addColorStop(0, colorOf(a));
      g.addColorStop(1, colorOf(b));
      ctx.globalAlpha = 0.35 + Math.sin(time * 3 + i + j) * 0.1;
      ctx.strokeStyle = g;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(a.position.x, a.position.y);
      ctx.lineTo(b.position.x, b.position.y);
      ctx.stroke();
      const k = (time * 0.6 + (i * 7 + j) * 0.13) % 1;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(a.position.x + (b.position.x - a.position.x) * k, a.position.y + (b.position.y - a.position.y) * k, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Dashed preview lines from the ghost tower to towers it would resonate with. */
export function drawPreviewLinks(ctx: CanvasRenderingContext2D, towers: Tower[], pos: { x: number; y: number }, type: string, valid: boolean) {
  ctx.save();
  ctx.setLineDash([4, 5]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = valid ? 'rgba(250,250,250,0.8)' : 'rgba(239,68,68,0.5)';
  for (const t of towers) {
    if (!canResonate(t, { type }) || Math.hypot(t.position.x - pos.x, t.position.y - pos.y) > LINK_RANGE) continue;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(t.position.x, t.position.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(t.position.x, t.position.y, 22, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
