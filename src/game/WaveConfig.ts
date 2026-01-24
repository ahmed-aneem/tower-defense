import { type EnemyType } from '../types';

export interface WaveGroup {
  type: EnemyType;
  count: number;
  interval: number; // Frames between spawns in this group
}

export interface Wave {
  round: number;
  groups: WaveGroup[]; // Groups play sequentially
}

export const WAVES: Wave[] = [
  {
    round: 1,
    groups: [
      { type: 'NORMAL', count: 20, interval: 60 } // Standard Red Bloon equivalent
    ]
  },
  {
    round: 2,
    groups: [
      { type: 'NORMAL', count: 35, interval: 45 } // More, slightly faster spawn
    ]
  },
  {
    round: 3,
    groups: [
      { type: 'NORMAL', count: 20, interval: 45 },
      { type: 'FAST', count: 5, interval: 60 } // Blue Bloon equivalent
    ]
  },
  {
    round: 4,
    groups: [
      { type: 'NORMAL', count: 30, interval: 30 },
      { type: 'FAST', count: 15, interval: 45 }
    ]
  },
  {
    round: 5,
    groups: [
      { type: 'FAST', count: 5, interval: 30 },
      { type: 'FAST', count: 15, interval: 40 },
      { type: 'NORMAL', count: 50, interval: 20 }
    ]
  },
  {
    round: 6,
    groups: [
      { type: 'NORMAL', count: 15, interval: 30 },
      { type: 'FAST', count: 15, interval: 30 },
      { type: 'SWARM', count: 4, interval: 60 } // Green equivalent (faster/tougher?) Swarm is fast/weak here
    ]
  },
  {
    round: 7,
    groups: [
       { type: 'SWARM', count: 20, interval: 40 }
    ]
  },
  {
    round: 8,
    groups: [
        { type: 'NORMAL', count: 10, interval: 30 },
        { type: 'TANK', count: 2, interval: 120 }, // First chunky enemy
        { type: 'FAST', count: 10, interval: 30 }
    ]
  },
  {
    round: 9,
    groups: [
        { type: 'SWARM', count: 30, interval: 30 }
    ]
  },
  {
    round: 10,
    groups: [
        { type: 'TANK', count: 10, interval: 100 } // Boss wave 1
    ]
  },
  {
      round: 11,
      groups: [
          { type: 'ARMORED', count: 5, interval: 80 }, // Lead equivalent
          { type: 'NORMAL', count: 20, interval: 20 }
      ]
  },
  {
      round: 12,
      groups: [
          { type: 'FAST', count: 20, interval: 20 },
          { type: 'SWARM', count: 20, interval: 20 },
          { type: 'ARMORED', count: 5, interval: 80 }
      ]
  },
  {
      round: 40,
      groups: [
          { type: 'BOSS', count: 1, interval: 100 } // MOAB equivalent
      ]
  }
];
