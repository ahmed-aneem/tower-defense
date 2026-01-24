export interface Mod {
  id: string;
  name: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
}

export const MODS: Mod[] = [
  {
    id: 'DAMAGE_BOOST',
    name: 'High Voltage',
    description: 'All towers deal 15% more damage.',
    rarity: 'COMMON'
  },
  {
    id: 'RANGE_BOOST',
    name: 'Long Lens',
    description: 'All towers have 15% increased range.',
    rarity: 'COMMON'
  },
  {
    id: 'DISCOUNT',
    name: 'Efficient Fabrication',
    description: 'Tower build and upgrade costs are reduced by 10%.',
    rarity: 'RARE'
  },
  {
    id: 'BOUNTY_HUNTER',
    name: 'Salvage Protocol',
    description: 'Gain +$5 extra for every enemy killed.',
    rarity: 'COMMON'
  },
  {
    id: 'EXPLOSIVE_DEATH',
    name: 'Unstable Isotopes',
    description: 'Enemies have a 20% chance to explode on death, damaging nearby enemies.',
    rarity: 'RARE'
  },
  {
    id: 'CRITICAL_HIT',
    name: 'Targeting AI',
    description: 'Towers have a 10% chance to deal double damage.',
    rarity: 'RARE'
  },
  {
    id: 'LIFE_REGEN',
    name: 'Nanobot Repair',
    description: 'Restore 2 lives at the end of every wave.',
    rarity: 'LEGENDARY'
  },
  {
    id: 'INTEREST',
    name: 'Compound Interest',
    description: 'Gain 10% of your current money at the end of every wave (max $500).',
    rarity: 'LEGENDARY'
  }
];
