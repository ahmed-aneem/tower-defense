import { Vector2 } from './Vector';

export const CELL_SIZE = 40; // Size of grid cells (if we use a grid) but we might use free coordinates
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const TOWERS = {
  BASIC: {
    name: 'Basic Turret',
    cost: 50,
    range: 120,
    damage: 15,
    cooldown: 30, // Frames
    color: '#3B82F6', // Blue
    type: 'BASIC'
  },
  SNIPER: {
    name: 'Sniper',
    cost: 150,
    range: 300,
    damage: 100,
    cooldown: 120,
    color: '#10B981', // Green
    type: 'SNIPER'
  },
  RAPID: {
    name: 'Minigun',
    cost: 120,
    range: 100,
    damage: 5,
    cooldown: 5,
    color: '#F59E0B', // Amber
    type: 'RAPID'
  }
} as const;

export type TowerType = keyof typeof TOWERS;

export const ENEMIES = {
  NORMAL: {
    hp: 50,
    speed: 1.5,
    reward: 10,
    color: '#EF4444', // Red
    radius: 12
  },
  FAST: {
    hp: 30,
    speed: 3,
    reward: 15,
    color: '#EC4899', // Pink
    radius: 10
  },
  TANK: {
    hp: 200,
    speed: 0.8,
    reward: 30,
    color: '#7F1D1D', // Dark Red
    radius: 16
  }
} as const;

// Define a simple winding path
export const PATH_WAYPOINTS = [
  new Vector2(0, 100),
  new Vector2(200, 100),
  new Vector2(200, 400),
  new Vector2(500, 400),
  new Vector2(500, 200),
  new Vector2(700, 200),
  new Vector2(700, 500),
  new Vector2(800, 500)
];
