import { Vector2 } from './Vector';
import { type IProjectile } from '../types';
import { DamageType } from './Constants';
import { type StatusEffect } from './StatusEffects';

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
  statusEffect?: StatusEffect;
  isCluster: boolean = false;
  origin: Vector2;
  maxRange: number;
  trail: Vector2[] = [];

  constructor(
      startPos: Vector2,
      targetPos: Vector2,
      damage: number,
      color: string,
      damageType: DamageType = DamageType.PHYSICAL,
      pierce: number = 1,
      isSplash: boolean = false,
      splashRadius: number = 0,
      statusEffect?: StatusEffect,
      isCluster: boolean = false,
      maxRange: number = 2000
  ) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.position = startPos.clone();
    this.origin = startPos.clone();
    this.maxRange = maxRange;
    this.velocity = new Vector2(0, 0); // Initial dummy
    this.damage = damage;
    this.color = color;
    this.damageType = damageType;
    this.pierce = pierce;
    this.targetId = null;
    this.isSplash = isSplash;
    this.splashRadius = splashRadius;
    this.statusEffect = statusEffect;
    this.isCluster = isCluster;

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
      splashRadius: number = 0,
      statusEffect?: StatusEffect,
      isCluster: boolean = false,
      maxRange: number = 2000
  ) {
    this.active = true;
    this.position = startPos.clone();
    this.origin = startPos.clone();
    this.maxRange = maxRange;
    this.damage = damage;
    this.color = color;
    this.damageType = damageType;
    this.pierce = pierce;
    this.isSplash = isSplash;
    this.splashRadius = splashRadius;
    this.statusEffect = statusEffect;
    this.isCluster = isCluster;
    this.targetId = null;
    this.hitList.clear();
    this.trail = [];

    const dir = targetPos.sub(startPos).normalize();
    this.velocity = dir.scale(this.speed);
  }

  update() {
    this.trail.push(this.position.clone());
    if (this.trail.length > 3) {
        this.trail.shift();
    }

    this.position = this.position.add(this.velocity);

    // Basic bounds check to clean up stray projectiles
    if (this.position.x < -50 || this.position.x > 2000 || this.position.y < -50 || this.position.y > 2000) {
      this.active = false;
    }

    if (this.position.distanceTo(this.origin) > this.maxRange) {
        this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;

    // Draw trail
    if (this.trail.length > 0) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.lineTo(this.position.x, this.position.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.isSplash ? 6 : 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    ctx.beginPath();
    const r = this.isSplash ? 6 : 4;
    ctx.arc(this.position.x, this.position.y, r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
