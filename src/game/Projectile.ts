import { Vector2 } from './Vector';
import { type IProjectile } from '../types';

export class Projectile implements IProjectile {
  id: string;
  position: Vector2;
  velocity: Vector2;
  damage: number;
  targetId: string | null;
  active: boolean = true;
  speed: number = 8;
  color: string;

  constructor(startPos: Vector2, targetPos: Vector2, damage: number, color: string) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.position = startPos.clone();
    this.damage = damage;
    this.color = color;
    this.targetId = null;

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
    ctx.arc(this.position.x, this.position.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
