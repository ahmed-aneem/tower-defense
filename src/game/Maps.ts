import { Vector2 } from './Vector';

export interface MapConfig {
  id: string;
  name: string;
  description: string;
  waypoints: Vector2[];
}

export const MAPS: MapConfig[] = [
  {
    id: 'SERPENT',
    name: 'The Serpent',
    description: 'A long winding path with many corners.',
    waypoints: [
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
    ]
  },
  {
    id: 'FORTRESS',
    name: 'The Fortress',
    description: 'A defensive perimeter around the core.',
    waypoints: [
        new Vector2(0, 400),
        new Vector2(200, 400),
        new Vector2(200, 100),
        new Vector2(1000, 100),
        new Vector2(1000, 700),
        new Vector2(200, 700),
        new Vector2(200, 500),
        new Vector2(1200, 500)
    ]
  },
  {
    id: 'CROSSING',
    name: 'The Crossing',
    description: 'A treacherous path that cuts through the center.',
    waypoints: [
        new Vector2(0, 100),
        new Vector2(300, 100),
        new Vector2(300, 700),
        new Vector2(600, 700),
        new Vector2(600, 100),
        new Vector2(900, 100),
        new Vector2(900, 700),
        new Vector2(1200, 700)
    ]
  }
];
