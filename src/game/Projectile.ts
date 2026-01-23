import { Vector2 } from './Vector';
import { type IProjectile } from '../types';
import { DamageType } from './Constants';

export class Projectile implements IProjectile {
  id: string;
  position: Vector2;
  velocity: Vector2;
  damage: number;
  targetId: string | null;
  active: boolean = true;
  speed: number = 8;
  color: string;
  isSplash: boolean;
  splashRadius: number;
  pierce: number = 1;
  damageType: DamageType = DamageType.PHYSICAL;
  hitList: Set<string> = new Set();

  constructor(
      startPos: Vector2,
      targetPos: Vector2,
      damage: number,
      color: string,
      damageType: DamageType = DamageType.PHYSICAL,
      pierce: number = 1,
      isSplash: boolean = false,
      splashRadius: number = 0
  ) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.position = startPos.clone();
    this.velocity = new Vector2(0, 0); // Initial dummy
    this.damage = damage;
    this.color = color;
    this.damageType = damageType;
    this.pierce = pierce;
    this.targetId = null;
    this.isSplash = isSplash;
    this.splashRadius = splashRadius;

    // If real positions provided, init velocity
    if (targetPos) {
       const dir = targetPos.sub(startPos).normalize();
       this.velocity = dir.scale(this.speed);
    }
  }

  reset(
      startPos: Vector2,
      targetPos: Vector2,
      damage: number,
      color: string,
      damageType: DamageType,
      pierce: number,
      isSplash: boolean = false,
      splashRadius: number = 0
  ) {
    this.active = true;
    this.position = startPos.clone();
    this.damage = damage;
    this.color = color;
    this.damageType = damageType;
    this.pierce = pierce;
    this.isSplash = isSplash;
    this.splashRadius = splashRadius;
    this.targetId = null;
    this.hitList.clear();

    const dir = targetPos.sub(startPos).normalize();
    this.velocity = dir.scale(this.speed);
  }

  update() {
    this.position = this.position.add(this.velocity);

    // Basic bounds check to clean up stray projectiles
    if (this.position.x < -50 || this.position.x > 2000 || this.position.y < -50 || this.position.y > 2000) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;

    ctx.beginPath();
    const r = this.isSplash ? 6 : 4;
    ctx.arc(this.position.x, this.position.y, r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
