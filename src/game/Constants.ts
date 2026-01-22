import { Vector2 } from './Vector';

export const CELL_SIZE = 40;
export const GAME_WIDTH = 1200; // Increased size for "mapa maior"
export const GAME_HEIGHT = 800;

export const TOWERS = {
  BASIC: {
    name: 'Basic',
    cost: 50,
    range: 150,
    damage: 15,
    cooldown: 30, // Frames
    color: '#3B82F6', // Blue
    type: 'BASIC'
  },
  SNIPER: {
    name: 'Sniper',
    cost: 150,
    range: 400,
    damage: 100,
    cooldown: 120,
    color: '#10B981', // Green
    type: 'SNIPER'
  },
  RAPID: {
    name: 'Minigun',
    cost: 120,
    range: 120,
    damage: 5,
    cooldown: 5,
    color: '#F59E0B', // Amber
    type: 'RAPID'
  },
  FROST: {
    name: 'Frost',
    cost: 100,
    range: 150,
    damage: 0, // Does slow instead
    cooldown: 5, // Applies constantly
    color: '#06b6d4', // Cyan
    type: 'FROST'
  },
  SPLASH: {
    name: 'Cannon',
    cost: 200,
    range: 200,
    damage: 40,
    cooldown: 90,
    color: '#ef4444', // Red
    type: 'SPLASH'
  },
  LASER: {
    name: 'Laser',
    cost: 250,
    range: 180,
    damage: 2, // Per frame
    cooldown: 0,
    color: '#d946ef', // Fuchsia
    type: 'LASER'
  }
} as const;

export type TowerType = keyof typeof TOWERS;

export const ENEMIES = {
  NORMAL: {
    hp: 50,
    speed: 1.5,
    reward: 10,
    color: '#EF4444', // Red
    radius: 12,
    isArmored: false
  },
  FAST: {
    hp: 30,
    speed: 3,
    reward: 15,
    color: '#EC4899', // Pink
    radius: 10,
    isArmored: false
  },
  TANK: {
    hp: 200,
    speed: 0.8,
    reward: 30,
    color: '#7F1D1D', // Dark Red
    radius: 16,
    isArmored: true
  },
  SWARM: {
    hp: 15,
    speed: 3.5,
    reward: 5,
    color: '#f97316', // Orange
    radius: 8,
    isArmored: false
  },
  ARMORED: {
    hp: 150,
    speed: 1.0,
    reward: 25,
    color: '#57534e', // Stone
    radius: 14,
    isArmored: true
  },
  BOSS: {
    hp: 1000,
    speed: 0.5,
    reward: 200,
    color: '#4c1d95', // Violet
    radius: 25,
    isArmored: true
  }
} as const;

// Define a larger, more complex winding path
export const PATH_WAYPOINTS = [
  new Vector2(0, 100),
  new Vector2(200, 100),
  new Vector2(200, 300),
  new Vector2(100, 300),
  new Vector2(100, 500),
  new Vector2(400, 500),
  new Vector2(400, 200),
  new Vector2(600, 200),
  new Vector2(600, 400),
  new Vector2(800, 400),
  new Vector2(800, 150),
  new Vector2(1000, 150),
  new Vector2(1000, 600),
  new Vector2(1200, 600)
];
