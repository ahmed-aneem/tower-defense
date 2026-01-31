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
  }
];
