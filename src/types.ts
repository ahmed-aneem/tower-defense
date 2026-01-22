import { Vector2 } from './game/Vector';
import { type TowerType } from './game/Constants';

export interface GameEntity {
  id: string;
  position: Vector2;
  update(): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export type EnemyType = 'NORMAL' | 'FAST' | 'TANK';

export interface IEnemy extends GameEntity {
  hp: number;
  maxHp: number;
  speed: number;
  isDead: boolean;
  reachedEnd: boolean;
  reward: number;
  freezeFactor: number; // 1 = normal, 0 = stopped
}

import { type Enemy } from './game/Enemy';

export interface ITower extends GameEntity {
  type: TowerType;
  range: number;
  cooldownTimer: number;
  rotation: number;
  level: number;
  targetId: string | null;
  update(enemies?: Enemy[]): Enemy | null;
}

export interface IProjectile extends GameEntity {
  damage: number;
  targetId: string | null; // Homing logic potentially
  velocity: Vector2;
  active: boolean;
  color: string;
}

export interface IParticle extends GameEntity {
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
