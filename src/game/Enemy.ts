import { Vector2 } from './Vector';
import { type IEnemy, type EnemyType } from '../types';
import { ENEMIES, DefenseType } from './Constants';

export class Enemy implements IEnemy {
  id: string;
  position: Vector2;
  hp: number;
  maxHp: number;
  speed: number;
  isDead: boolean = false;
  reachedEnd: boolean = false;
  reward: number;
  freezeFactor: number = 1;
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

  update() {
    if (this.isDead || this.reachedEnd || this.path.length === 0) return;

    this.wobbleOffset += 0.1;

    // Apply slow decay (return to normal speed)
    if (this.freezeFactor < 1) {
        this.freezeFactor += 0.005;
        if (this.freezeFactor > 1) this.freezeFactor = 1;
    }

    const target = this.path[this.waypointIndex + 1];
    if (!target) {
      this.reachedEnd = true;
      return;
    }

    const direction = target.sub(this.position);
    const dist = direction.length();

    // Move towards target
    if (dist < this.speed * this.freezeFactor) {
      this.position = target.clone();
      this.waypointIndex++;
    } else {
      this.position = this.position.add(direction.normalize().scale(this.speed * this.freezeFactor));
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

    // Draw Frozen effect
    if (this.freezeFactor < 0.8) {
        ctx.fillStyle = '#67e8f9'; // Cyan tint
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
  }

  takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }
}
