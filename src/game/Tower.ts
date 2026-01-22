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

  // Visual recoil
  recoil: number = 0;

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

    // Recover from recoil
    if (this.recoil > 0) {
        this.recoil *= 0.8;
        if (this.recoil < 0.1) this.recoil = 0;
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
      // Special handling for Laser & Frost (continuous/AOE) or standard shoot

      // For FROST, we don't return a target to 'shoot' a projectile, but we apply slow here (or in Engine)
      // Actually, standard pattern is Engine calls update(), if it returns Enemy, Engine creates projectile.
      // For FROST and LASER, we might want to return null here and handle logic inside update?
      // Or return target and let Engine handle type check.

      // For LASER: We want to deal damage every frame, so cooldown is 0.
      // For FROST: We want to apply slow to ALL enemies in range.

      if (this.type === 'FROST') {
          // Slow all enemies in range
          enemies.forEach(e => {
             if (e.position.distanceTo(this.position) <= this.range) {
                 e.freezeFactor = 0.5;
             }
          });
          // Frost doesn't shoot projectiles
          return null;
      }

      if (this.type === 'LASER') {
          // Continuous damage
           target.takeDamage(this.damage);
           return target; // Return target for visual beam drawing in Engine (or draw here)
      }

      this.cooldownTimer = this.maxCooldown;
      this.recoil = 5; // Kick back
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
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Rotate turret
    ctx.rotate(this.rotation);

    // Apply recoil (move backwards slightly)
    ctx.translate(-this.recoil, 0);

    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    // Draw Base
    ctx.fillStyle = '#1e293b'; // Slate 800
    ctx.fillRect(-14, -14, 28, 28);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -14, 28, 28);

    // Draw Turret
    ctx.fillStyle = this.color;

    // Different shapes for different towers
    if (this.type === 'SNIPER') {
      // Sniper Body
      ctx.fillRect(-8, -8, 16, 16);
      // Long barrel
      ctx.fillRect(0, -3, 35, 6);
      // Scope
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(5, -6, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'RAPID') {
      // Minigun body
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      // Barrels
      ctx.fillRect(8, -6, 18, 4);
      ctx.fillRect(8, 2, 18, 4);
    } else if (this.type === 'FROST') {
        // Frost Tower
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(10, 6);
        ctx.lineTo(-10, 6);
        ctx.closePath();
        ctx.fill();
        // Crystal
        ctx.fillStyle = '#a5f3fc';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
    } else if (this.type === 'SPLASH') {
        // Cannon
        ctx.fillRect(-12, -12, 24, 24);
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(0, -6, 26, 12); // Wide barrel
    } else if (this.type === 'LASER') {
        // Laser
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        // Prongs
        ctx.fillRect(5, -8, 15, 2);
        ctx.fillRect(5, 6, 15, 2);
        ctx.fillStyle = '#f0abfc';
        ctx.fillRect(0, -2, 20, 4); // Core
    } else {
      // Basic
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(0, -4, 22, 8);
    }

    // Center pin
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
