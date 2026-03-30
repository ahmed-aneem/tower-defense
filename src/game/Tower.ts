import { Vector2 } from './Vector';
import { type ITower } from '../types';
import { TOWERS, type TowerType, DamageType, TowerTargetingMode } from './Constants';
import { Enemy } from './Enemy';
import { type StatusEffect } from './StatusEffects';

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

  targetingMode: TowerTargetingMode = TowerTargetingMode.FIRST;
  damageType: DamageType;
  pierce: number;
  statusEffect?: StatusEffect;
  camoDetection: boolean;
  totalSpent: number;

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
    this.damageType = config.damageType;
    this.pierce = config.pierce;
    // @ts-expect-error - Config has it, but Typescript inference might lag if not explicit in Constants types yet
    this.statusEffect = config.statusEffect;
    // @ts-expect-error config object typing
    this.camoDetection = config.camoDetection;
    this.totalSpent = config.cost;
  }

  get upgradeCost(): number {
    const baseCost = TOWERS[this.type].cost;
    if (this.level === 1) return Math.floor(baseCost * 0.8);
    if (this.level === 2) return Math.floor(baseCost * 1.5);
    return 0;
  }

  upgrade() {
    if (this.level >= 3) return;

    this.totalSpent += this.upgradeCost;
    this.level++;

    if (this.level === 2) {
        this.damage = Math.ceil(this.damage * 1.5);
        this.range = Math.ceil(this.range * 1.2);
        this.pierce += 1;
        if (this.statusEffect) {
            this.statusEffect.strength *= 1.2; // Buff effect
        }
        if (this.type === 'SNIPER') this.camoDetection = true; // Sniper gets Camo at level 2
    } else if (this.level === 3) {
        // Advanced Upgrades
        this.camoDetection = true; // All towers get Camo at level 3

        if (this.type === 'SNIPER') {
            // Railgun
            this.damage *= 2;
            this.pierce = 20;
            this.damageType = DamageType.ENERGY; // Change to Energy
        } else if (this.type === 'BASIC') {
            // Double Tap
            this.maxCooldown = Math.floor(this.maxCooldown / 2);
        } else if (this.type === 'SPLASH') {
            // Cluster Bomb (Logic handled in Projectile but stats buff here)
            this.range += 50;
            this.damage = Math.ceil(this.damage * 1.2);
        } else if (this.type === 'PLASMA') {
             this.damage = Math.ceil(this.damage * 2);
             this.range += 50;
        } else {
             // Generic Level 3
             this.damage = Math.ceil(this.damage * 1.5);
             this.maxCooldown = Math.max(1, Math.floor(this.maxCooldown * 0.8));
             this.pierce += 2;
             if (this.statusEffect) {
                this.statusEffect.duration *= 1.5;
             }
        }
    }

    this.recoil = 10;
  }

  setTargetingMode(mode: TowerTargetingMode) {
      this.targetingMode = mode;
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

    // Frost logic (AOE Pulse)
    if (this.type === 'FROST') {
        if (this.cooldownTimer <= 0) {
             let hit = false;
             for (const e of enemies) {
                 if (!e.isDead && !e.reachedEnd && this.position.distanceTo(e.position) <= this.range) {
                     if (this.statusEffect) {
                         e.applyEffect(this.statusEffect);
                         hit = true;
                     }
                 }
             }
             if (hit) {
                 this.cooldownTimer = this.maxCooldown;
             }
        }
        return null;
    }

    // Farm Logic
    if (this.type === 'FARM') {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer--;
        }
        // GameEngine checks if cooldownTimer <= 0 to generate money
        return null;
    }

    // Single pass targeting
    let target: Enemy | null = null;
    let bestMetric = this.targetingMode === TowerTargetingMode.WEAKEST || this.targetingMode === TowerTargetingMode.LAST || this.targetingMode === TowerTargetingMode.CLOSEST
                     ? Infinity : -Infinity;

    for (const e of enemies) {
        if (e.isDead || e.reachedEnd) continue;
        // Camo Check
        if (e.isCamo && !this.camoDetection) continue;

        const dist = this.position.distanceTo(e.position);
        if (dist > this.range) continue;

        let metric = 0;
        switch (this.targetingMode) {
            case TowerTargetingMode.FIRST:
                metric = e.waypointIndex;
                if (metric > bestMetric) { bestMetric = metric; target = e; }
                break;
            case TowerTargetingMode.LAST:
                metric = e.waypointIndex;
                if (metric < bestMetric) { bestMetric = metric; target = e; }
                break;
            case TowerTargetingMode.STRONGEST:
                metric = e.hp;
                if (metric > bestMetric) { bestMetric = metric; target = e; }
                break;
            case TowerTargetingMode.WEAKEST:
                metric = e.hp;
                if (metric < bestMetric) { bestMetric = metric; target = e; }
                break;
            case TowerTargetingMode.CLOSEST:
                metric = dist;
                if (metric < bestMetric) { bestMetric = metric; target = e; }
                break;
        }
    }

    if (target) {
      this.targetId = (target as Enemy).id;
      // Calculate rotation to face target
      const dy = (target as Enemy).position.y - this.position.y;
      const dx = (target as Enemy).position.x - this.position.x;
      this.rotation = Math.atan2(dy, dx);
    } else {
      this.targetId = null;
    }

    // Return target if ready to shoot
    if (this.cooldownTimer <= 0 && target) {
      if (this.type === 'LASER') {
           // Continuous damage handled by GameEngine usually, but let's check.
           // GameEngine calls t.update(). If returns target, GameEngine does:
           // if (t.type === 'LASER') { sound... } else { spawn projectile }
           // Wait, GameEngine DOES NOT do damage for Laser?
           // I recall reading: (target as Enemy).takeDamage(this.damage); inside Tower.update() for Laser.
           // Let's verify.
           // Yes, in my previous read of Tower.ts, it had logic for Laser inside.

           (target as Enemy).takeDamage(this.damage);
           // Apply Burn for Laser
           if (this.statusEffect) {
               (target as Enemy).applyEffect(this.statusEffect);
           }

           return target;
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

    // Glow effect removed for performance

    // Draw Base
    ctx.fillStyle = '#1e293b'; // Slate 800
    ctx.fillRect(-14, -14, 28, 28);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -14, 28, 28);

    // Level Indicators
    if (this.level >= 2) {
         ctx.strokeStyle = '#FCD34D'; // Amber 300
         ctx.lineWidth = 2;
         ctx.strokeRect(-17, -17, 34, 34); // Gold ring
    }
    if (this.level >= 3) {
         ctx.strokeStyle = '#fff';
         ctx.lineWidth = 1;
         ctx.strokeRect(-20, -20, 40, 40); // Outer white ring
    }

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
    } else if (this.type === 'TESLA') {
        // Coil Base
        ctx.fillStyle = '#94a3b8'; // Slate 400
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Coil Turns
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        for(let i=0; i<3; i++) {
             ctx.beginPath();
             ctx.arc(0, 0, 8 - (i*2), 0, Math.PI * 2);
             ctx.stroke();
        }

        // Top Sphere
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Static sparks
        if (Math.random() < 0.2) {
             ctx.strokeStyle = '#fff';
             ctx.lineWidth = 1;
             const angle = Math.random() * Math.PI * 2;
             ctx.beginPath();
             ctx.moveTo(Math.cos(angle)*4, Math.sin(angle)*4);
             ctx.lineTo(Math.cos(angle)*12, Math.sin(angle)*12);
             ctx.stroke();
        }
    } else if (this.type === 'TACK') {
        // Tack Shooter
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        // Spikes
        ctx.fillStyle = '#cbd5e1'; // Slate 300
        for(let i=0; i<8; i++) {
            ctx.save();
            ctx.rotate((Math.PI * 2 * i) / 8);
            ctx.beginPath();
            ctx.moveTo(10, -3);
            ctx.lineTo(18, 0);
            ctx.lineTo(10, 3);
            ctx.fill();
            ctx.restore();
        }
        ctx.fillStyle = this.color; // Reset for center
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
    } else if (this.type === 'FARM') {
        // Farm
        ctx.fillStyle = '#fcd34d'; // Amber 300
        ctx.fillRect(-15, -15, 30, 30);
        ctx.strokeStyle = '#b45309'; // Amber 700
        ctx.lineWidth = 2;
        ctx.strokeRect(-15, -15, 30, 30);
        // Crop lines
        ctx.beginPath();
        ctx.moveTo(-10, -10); ctx.lineTo(10, -10);
        ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
        ctx.moveTo(-10, 10); ctx.lineTo(10, 10);
        ctx.stroke();
        // Banana/Coin icon?
        ctx.fillStyle = '#166534'; // Green
        ctx.beginPath();
        ctx.arc(0, -5, 4, 0, Math.PI*2);
        ctx.arc(5, 5, 4, 0, Math.PI*2);
        ctx.arc(-5, 5, 4, 0, Math.PI*2);
        ctx.fill();
    } else if (this.type === 'PLASMA') {
        // Plasma Tower
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        // Glowy core
        ctx.fillStyle = '#c4b5fd'; // Violet 300
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        // Rings
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI*2);
        ctx.stroke();
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
