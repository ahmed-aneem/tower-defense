export interface Mod {
  id: string;
  name: string;
  description: string;
  icon: string;
  unique?: boolean;
}

export const MODS: Mod[] = [
  {
    id: 'DAMAGE_BOOST',
    name: 'Damage Boost',
    description: '+15% Tower Damage',
    icon: '⚔️',
  },
  {
    id: 'RANGE_BOOST',
    name: 'Range Boost',
    description: '+15% Tower Range',
    icon: '🎯',
  },
  {
    id: 'ATTACK_SPEED',
    name: 'Attack Speed',
    description: '+15% Fire Rate',
    icon: '⚡',
  },
  {
    id: 'DISCOUNT',
    name: 'Discount',
    description: 'Towers cost 10% less',
    icon: '💰',
    unique: true,
  },
  {
    id: 'CRITICAL_HIT',
    name: 'Critical Hit',
    description: 'Towers have a chance to deal 2x damage',
    icon: '💥',
    unique: true,
  },
  {
    id: 'BOUNTY_HUNTER',
    name: 'Bounty Hunter',
    description: '+25% gold per kill',
    icon: '🪙',
    unique: true,
  },
  {
    id: 'EXPLOSIVE_DEATH',
    name: 'Explosive Death',
    description: 'Enemies explode on death dealing area damage',
    icon: '💣',
    unique: true,
  },
  {
    id: 'LIFE_REGEN',
    name: 'Life Regen',
    description: 'Restore 1 life every 10 waves',
    icon: '❤️',
    unique: true,
  },
  {
    id: 'INTEREST',
    name: 'Interest',
    description: 'Gain 5% interest on gold at the end of each wave',
    icon: '📈',
    unique: true,
  },
];

export function drawModOptions(
  pool: Mod[],
  active: Mod[],
  rng: () => number = Math.random,
  n = 3
): Mod[] {
  const activeIds = new Set(active.map((m) => m.id));
  const availablePool = pool.filter((m) => !(m.unique && activeIds.has(m.id)));

  const shuffled = [...availablePool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const primaryPicks = shuffled.slice(0, n);

  if (primaryPicks.length < n) {
    const needed = n - primaryPicks.length;
    const fallbackPool = pool.filter((m) => !primaryPicks.some((p) => p.id === m.id));
    for (let i = fallbackPool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [fallbackPool[i], fallbackPool[j]] = [fallbackPool[j], fallbackPool[i]];
    }
    primaryPicks.push(...fallbackPool.slice(0, needed));
  }

  return primaryPicks;
}

export function applyStatMods(base: number, count: number): number {
  return Math.ceil(base * Math.pow(1.15, count));
}
