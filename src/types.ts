import { Vector2 } from './game/Vector';
import { type TowerType, DamageType, DefenseType, TowerTargetingMode } from './game/Constants';

export interface GameEntity {
  id: string;
  position: Vector2;
  update(): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export type EnemyType = 'NORMAL' | 'FAST' | 'TANK' | 'BOSS' | 'SWARM' | 'ARMORED';

export interface IEnemy extends GameEntity {
  hp: number;
  maxHp: number;
  speed: number;
  isDead: boolean;
  reachedEnd: boolean;
  reward: number;
  defenseType: DefenseType;
}

import { type Enemy } from './game/Enemy';
import { type StatusEffect } from './game/StatusEffects';

export interface ITower extends GameEntity {
  type: TowerType;
  range: number;
  cooldownTimer: number;
  rotation: number;
  level: number;
  targetId: string | null;
  upgradeCost: number;
  targetingMode: TowerTargetingMode;
  damageType: DamageType;
  pierce: number;
  statusEffect?: StatusEffect;
  upgrade(): void;
  update(enemies?: Enemy[]): Enemy | null;
}

export interface IProjectile extends GameEntity {
  damage: number;
  targetId: string | null; // Homing logic potentially
  velocity: Vector2;
  active: boolean;
  color: string;
  isSplash: boolean;
  splashRadius: number;
  pierce: number;
  damageType: DamageType;
  hitList: Set<string>;
  statusEffect?: StatusEffect;
}

export interface IParticle extends GameEntity {
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  text?: string;
  shape?: 'CIRCLE' | 'SQUARE' | 'STAR';
}
