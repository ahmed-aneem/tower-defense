import { Vector2 } from './Vector';
import { type ITower } from '../types';
import { TOWERS, type TowerType } from './Constants';
import { Enemy } from './Enemy';

export class Tower implements ITower {
  id: string;
  position: Vector2;
  type: TowerType;
  range: number;
  damage: number;
  maxCooldown: number;
  cooldownTimer: number = 0;
  rotation: number = 0;
  level: number = 1;
  targetId: string | null = null;
  color: string;

  constructor(position: Vector2, type: TowerType) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.position = position;
    this.type = type;

    const config = TOWERS[type];
    this.range = config.range;
    this.damage = config.damage;
    this.maxCooldown = config.cooldown;
    this.color = config.color;
  }

  update(enemies: Enemy[]): Enemy | null {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer--;
    }

    // Find target
    let target: Enemy | null = null;
    let minDist = Infinity;

    // Simple strategy: Closest enemy
    // Could improve to "First in line" or "Most HP"
    for (const enemy of enemies) {
      if (enemy.isDead || enemy.reachedEnd) continue;

      const dist = this.position.distanceTo(enemy.position);
      if (dist <= this.range && dist < minDist) {
        minDist = dist;
        target = enemy;
      }
    }

    if (target) {
      this.targetId = target.id;
      // Calculate rotation to face target
      const dy = target.position.y - this.position.y;
      const dx = target.position.x - this.position.x;
      this.rotation = Math.atan2(dy, dx);
    } else {
      this.targetId = null;
    }

    // Return target if ready to shoot
    if (this.cooldownTimer <= 0 && target) {
      this.cooldownTimer = this.maxCooldown;
      return target;
    }

    return null;
  }

  draw(ctx: CanvasRenderingContext2D, isSelected: boolean = false) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Draw Range if selected
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(0, 0, this.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Rotate turret
    ctx.rotate(this.rotation);

    // Draw Base
    ctx.fillStyle = '#4B5563'; // Gray base
    ctx.fillRect(-12, -12, 24, 24);

    // Draw Turret
    ctx.fillStyle = this.color;
    // Different shapes for different towers
    if (this.type === 'SNIPER') {
      ctx.fillRect(-5, -5, 30, 10); // Long barrel
    } else if (this.type === 'RAPID') {
      ctx.fillRect(-5, -8, 20, 6);
      ctx.fillRect(-5, 2, 20, 6);
    } else {
      ctx.fillRect(0, -5, 20, 10);
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
