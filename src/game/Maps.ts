import { Vector2 } from './Vector';

export interface MapConfig {
  id: string;
  name: string;
  description: string;
  waypoints: Vector2[];
  theme: string; // key of THEMES
  difficulty: 1 | 2 | 3;
}

export const MAPS: MapConfig[] = [
  {
    id: 'SERPENT',
    theme: 'GRID',
    difficulty: 1,
    name: 'The Serpent',
    description: 'A long winding path with many corners.',
    waypoints: [
        new Vector2(0, 0.125),
        new Vector2(0.166, 0.125),
        new Vector2(0.166, 0.375),
        new Vector2(0.083, 0.375),
        new Vector2(0.083, 0.625),
        new Vector2(0.333, 0.625),
        new Vector2(0.333, 0.25),
        new Vector2(0.5, 0.25),
        new Vector2(0.5, 0.5),
        new Vector2(0.666, 0.5),
        new Vector2(0.666, 0.1875),
        new Vector2(0.833, 0.1875),
        new Vector2(0.833, 0.75),
        new Vector2(1, 0.75)
    ]
  },
  {
    id: 'FORTRESS',
    theme: 'FOUNDRY',
    difficulty: 2,
    name: 'The Fortress',
    description: 'A defensive perimeter around the core.',
    waypoints: [
        new Vector2(0, 0.5),
        new Vector2(0.166, 0.5),
        new Vector2(0.166, 0.125),
        new Vector2(0.833, 0.125),
        new Vector2(0.833, 0.875),
        new Vector2(0.166, 0.875),
        new Vector2(0.166, 0.625),
        new Vector2(1, 0.625)
    ]
  },
  {
    id: 'CROSSING',
    theme: 'CRYO',
    difficulty: 2,
    name: 'The Crossing',
    description: 'A treacherous path that cuts through the center.',
    waypoints: [
        new Vector2(0, 0.125),
        new Vector2(0.25, 0.125),
        new Vector2(0.25, 0.875),
        new Vector2(0.5, 0.875),
        new Vector2(0.5, 0.125),
        new Vector2(0.75, 0.125),
        new Vector2(0.75, 0.875),
        new Vector2(1, 0.875)
    ]
  },
  {
    id: 'LOOP',
    theme: 'REACTOR',
    difficulty: 3,
    name: 'The Loop',
    description: 'A circular path that tests endurance.',
    waypoints: [
        new Vector2(0, 0.5),
        new Vector2(0.2, 0.5),
        new Vector2(0.2, 0.2),
        new Vector2(0.8, 0.2),
        new Vector2(0.8, 0.8),
        new Vector2(0.2, 0.8),
        new Vector2(0.2, 0.5),
        new Vector2(0, 0.5)
    ]
  },
  {
    id: 'SPIRAL',
    theme: 'VOID',
    difficulty: 3,
    name: 'The Spiral',
    description: 'A spiral path leading to the center.',
    waypoints: [
        new Vector2(0, 0.1),
        new Vector2(0.9, 0.1),
        new Vector2(0.9, 0.9),
        new Vector2(0.1, 0.9),
        new Vector2(0.1, 0.3),
        new Vector2(0.7, 0.3),
        new Vector2(0.7, 0.7),
        new Vector2(0.3, 0.7),
        new Vector2(0.3, 0.5),
        new Vector2(0.5, 0.5)
    ]
  },
  {
    id: 'ZIGZAG',
    theme: 'FOUNDRY',
    difficulty: 1,
    name: 'The Zigzag',
    description: 'Diagonais rápidas e curvas fechadas.',
    waypoints: [
        new Vector2(0, 0.1),
        new Vector2(0.3, 0.1),
        new Vector2(0.15, 0.4),
        new Vector2(0.6, 0.4),
        new Vector2(0.4, 0.7),
        new Vector2(0.85, 0.7),
        new Vector2(0.7, 0.92),
        new Vector2(1, 0.92)
    ]
  },
  {
    id: 'HOURGLASS',
    theme: 'CRYO',
    difficulty: 3,
    name: 'The Hourglass',
    description: 'Gargalo central: todo mundo passa por ali.',
    waypoints: [
        new Vector2(0, 0.15),
        new Vector2(0.85, 0.15),
        new Vector2(0.85, 0.3),
        new Vector2(0.5, 0.5),
        new Vector2(0.15, 0.7),
        new Vector2(0.15, 0.85),
        new Vector2(1, 0.85)
    ]
  }
];
