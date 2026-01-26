import { Vector2 } from './Vector';
import { type IEnemy, type EnemyType } from '../types';
import { ENEMIES, DefenseType } from './Constants';
import { type StatusEffect, StatusEffectType } from './StatusEffects';

export class Enemy implements IEnemy {
  id: string;
  position: Vector2;
  hp: number;
  maxHp: number;
  speed: number;
  isDead: boolean = false;
  reachedEnd: boolean = false;
  reward: number;
  effects: Map<string, StatusEffect> = new Map();
  radius: number;
  color: string;
  type: EnemyType;
  defenseType: DefenseType;

  waypointIndex: number = 0;
  private path: Vector2[] = [];
  private wobbleOffset: number = Math.random() * 100;
  private hasStartPosition: boolean = false;

  constructor(type: EnemyType, startPos?: Vector2, startWaypoint?: number) {
    this.type = type;
    this.id = Math.random().toString(36).substr(2, 9);
    const config = ENEMIES[type];
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.speed = config.speed;
    this.reward = config.reward;
    this.radius = config.radius;
    this.color = config.color;
    this.defenseType = config.defenseType;

    if (startPos) {
        this.position = startPos.clone();
        this.hasStartPosition = true;
        // Apply a small random offset to prevent perfect stacking
        this.position.x += (Math.random() - 0.5) * 5;
        this.position.y += (Math.random() - 0.5) * 5;
    } else {
        this.position = new Vector2(0, 0);
    }

    if (startWaypoint !== undefined) {
        this.waypointIndex = startWaypoint;
    }
  }

  setPath(path: Vector2[]) {
      this.path = path;
      if (this.path.length > 0 && !this.hasStartPosition) {
          this.position = this.path[0].clone();
      }
  }

  applyEffect(effect: StatusEffect) {
      // Check if we already have this effect type from this source
      // Actually, for simplicity, let's just key by effect Type.
      // If we want multiple stacks from different sources, we key by type + source.
      // But for now, ONE effect of each type. Stacks just refresh duration/strength if stronger.

      const existing = this.effects.get(effect.type);
      if (existing) {
          // If new effect is stronger or same strength, apply it (refresh duration)
          // If weaker, ignore? Or just refresh duration?
          // BTD6: Stronger slow overrides.
          if (effect.strength >= existing.strength) {
              this.effects.set(effect.type, { ...effect });
          } else {
             // If weaker but new, maybe ignore? Or let's just keep the stronger one.
          }
      } else {
          this.effects.set(effect.type, { ...effect });
      }
  }

  updateEffects() {
      // Process effects
      for (const [key, effect] of this.effects.entries()) {
          effect.duration--;

          if (effect.type === StatusEffectType.BURN) {
              if (effect.tickTimer !== undefined && effect.tickInterval) {
                  effect.tickTimer--;
                  if (effect.tickTimer <= 0) {
                      this.takeDamage(effect.strength);
                      effect.tickTimer = effect.tickInterval;
                  }
              } else {
                  // Init timer if missing
                  effect.tickTimer = effect.tickInterval || 60;
              }
          }

          if (effect.duration <= 0) {
              this.effects.delete(key);
          }
      }
  }

  getSpeedMultiplier(): number {
      let multiplier = 1;
      const slow = this.effects.get(StatusEffectType.SLOW);
      if (slow) {
          // strength 0.5 = 50% slow. strength 0.6 = 60% slow.
          // max clamp at 0.9 to prevent full stop from slow alone if we want
          const slowAmount = Math.min(0.9, slow.strength);
          multiplier *= (1 - slowAmount);
      }
      const stun = this.effects.get(StatusEffectType.STUN);
      if (stun) {
          multiplier = 0;
      }
      return multiplier;
  }

  update() {
    if (this.isDead || this.reachedEnd || this.path.length === 0) return;

    this.updateEffects();
    this.wobbleOffset += 0.1;

    const currentSpeed = this.speed * this.getSpeedMultiplier();

    // If stunned/stopped, don't move
    if (currentSpeed <= 0.01) return;

    const target = this.path[this.waypointIndex + 1];
    if (!target) {
      this.reachedEnd = true;
      return;
    }

    const direction = target.sub(this.position);
    const dist = direction.length();

    // Move towards target
    if (dist < currentSpeed) {
      this.position = target.clone();
      this.waypointIndex++;
    } else {
      this.position = this.position.add(direction.normalize().scale(currentSpeed));
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead || this.reachedEnd) return;

    // Neon Glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    // Draw body based on type
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (this.type === 'TANK' || this.type === 'ARMORED') {
        // Square for Tank/Armored
        ctx.rect(this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2);
    } else if (this.type === 'FAST' || this.type === 'SWARM') {
        // Triangle for Fast/Swarm
        ctx.moveTo(this.position.x + this.radius, this.position.y);
        ctx.lineTo(this.position.x - this.radius, this.position.y - this.radius);
        ctx.lineTo(this.position.x - this.radius, this.position.y + this.radius);
        ctx.closePath();
    } else if (this.type === 'BOSS') {
        // Octagon/Star for Boss
        const spikes = 8;
        const outerRadius = this.radius;
        const innerRadius = this.radius / 1.5;
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / spikes;
            const x = this.position.x + Math.cos(angle) * r;
            const y = this.position.y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    } else {
        // Circle for Normal
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    }

    // Draw Status Effect Visuals
    if (this.effects.has(StatusEffectType.SLOW)) {
        ctx.fillStyle = '#67e8f9'; // Cyan tint
    }
    if (this.effects.has(StatusEffectType.BURN)) {
        ctx.fillStyle = '#f97316'; // Orange tint
    }
    if (this.effects.has(StatusEffectType.STUN)) {
        ctx.fillStyle = '#facc15'; // Yellow tint
    }

    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Draw Health Bar
    const hpPct = this.hp / this.maxHp;
    const barWidth = this.radius * 2;
    const barHeight = 4;
    const yOffset = this.radius + 8;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(this.position.x - barWidth / 2, this.position.y - yOffset, barWidth, barHeight);

    // Health
    const hpColor = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillStyle = hpColor;
    ctx.fillRect(this.position.x - barWidth / 2, this.position.y - yOffset, barWidth * hpPct, barHeight);

    // Draw Status Icons (Small dots above health bar)
    let iconOffset = 0;
    this.effects.forEach((_, type) => {
        ctx.beginPath();
        ctx.arc(this.position.x - barWidth/2 + iconOffset, this.position.y - yOffset - 4, 3, 0, Math.PI*2);
        if (type === StatusEffectType.SLOW) ctx.fillStyle = '#06b6d4';
        if (type === StatusEffectType.BURN) ctx.fillStyle = '#f97316';
        if (type === StatusEffectType.STUN) ctx.fillStyle = '#eab308';
        ctx.fill();
        iconOffset += 8;
    });
  }

  takeDamage(amount: number) {
    // Check for Weaken effect
    if (this.effects.has(StatusEffectType.WEAKEN)) {
        amount = Math.ceil(amount * 1.5);
    }

    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }
}
