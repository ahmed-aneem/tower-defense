import { type TowerType } from './Constants';

export type BaseStyle = 'SQUARE' | 'HEX' | 'ROUND';

export interface Skin {
  id: string;
  name: string;
  description: string;
  base: BaseStyle;
  baseFill: string;
  outline: string; // enemy outline
  accent: string; // level rings / UI swatch
  towers: Partial<Record<TowerType, string>>;
  enemies: Record<string, string>;
}

export const SKINS: Skin[] = [
  {
    id: 'NEON', name: 'Neon Grid', description: 'Clássico flat neon.',
    base: 'SQUARE', baseFill: '#1e293b', outline: '#ffffff', accent: '#60a5fa',
    towers: {},
    enemies: {}
  },
  {
    id: 'SYNTHWAVE', name: 'Synthwave', description: 'Rosa, ciano e roxo anos 80.',
    base: 'HEX', baseFill: '#2e1065', outline: '#fdf4ff', accent: '#f0abfc',
    towers: {
      BASIC: '#22d3ee', SNIPER: '#a78bfa', RAPID: '#fb7185', FROST: '#67e8f9', SPLASH: '#f43f5e',
      LASER: '#e879f9', TESLA: '#fde047', TACK: '#f472b6', BEACON: '#2dd4bf', FARM: '#fbbf24', PLASMA: '#c084fc'
    },
    enemies: {
      NORMAL: '#fb7185', FAST: '#f0abfc', TANK: '#be123c', SWARM: '#fb923c', ARMORED: '#7c3aed', BOSS: '#312e81'
    }
  },
  {
    id: 'TERMINAL', name: 'Terminal', description: 'Fósforo verde monocromático.',
    base: 'SQUARE', baseFill: '#052e16', outline: '#bbf7d0', accent: '#4ade80',
    towers: {
      BASIC: '#4ade80', SNIPER: '#86efac', RAPID: '#a3e635', FROST: '#5eead4', SPLASH: '#bef264',
      LASER: '#34d399', TESLA: '#d9f99d', TACK: '#22c55e', BEACON: '#2dd4bf', FARM: '#facc15', PLASMA: '#6ee7b7'
    },
    enemies: {
      NORMAL: '#f87171', FAST: '#fbbf24', TANK: '#b91c1c', SWARM: '#fb923c', ARMORED: '#a8a29e', BOSS: '#e11d48'
    }
  },
  {
    id: 'SOLAR', name: 'Solar Forge', description: 'Ouro, bronze e brasa.',
    base: 'ROUND', baseFill: '#431407', outline: '#fef3c7', accent: '#fbbf24',
    towers: {
      BASIC: '#fb923c', SNIPER: '#fde68a', RAPID: '#f59e0b', FROST: '#7dd3fc', SPLASH: '#ef4444',
      LASER: '#fb7185', TESLA: '#fef08a', TACK: '#fdba74', BEACON: '#5eead4', FARM: '#facc15', PLASMA: '#fcd34d'
    },
    enemies: {
      NORMAL: '#38bdf8', FAST: '#818cf8', TANK: '#1d4ed8', SWARM: '#22d3ee', ARMORED: '#64748b', BOSS: '#4338ca'
    }
  }
];

const KEY = 'neon-defense:skin';
let active: Skin = SKINS[0];

try {
  const saved = localStorage.getItem(KEY);
  active = SKINS.find(s => s.id === saved) ?? SKINS[0];
} catch { /* storage unavailable */ }

export const getSkin = (): Skin => active;

export const setSkin = (id: string) => {
  active = SKINS.find(s => s.id === id) ?? SKINS[0];
  try { localStorage.setItem(KEY, active.id); } catch { /* ignore */ }
};

export const skinTowerColor = (type: TowerType, fallback: string): string => active.towers[type] ?? fallback;
export const skinEnemyColor = (type: string, fallback: string): string => active.enemies[type] ?? fallback;

/** Draws the tower pedestal according to the active skin's base style. */
export function drawTowerBase(ctx: CanvasRenderingContext2D, color: string) {
  const s = active;
  ctx.fillStyle = s.baseFill;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (s.base === 'ROUND') {
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
  } else if (s.base === 'HEX') {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * 17, Math.sin(a) * 17);
    }
    ctx.closePath();
  } else {
    ctx.rect(-14, -14, 28, 28);
  }
  ctx.fill();
  ctx.stroke();
}
