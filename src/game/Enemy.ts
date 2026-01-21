import { Vector2 } from './Vector';
import { type IEnemy, type EnemyType } from '../types';
import { PATH_WAYPOINTS, ENEMIES } from './Constants';

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

  private waypointIndex: number = 0;
  private path: Vector2[] = PATH_WAYPOINTS;

  constructor(type: EnemyType) {
    this.id = Math.random().toString(36).substr(2, 9);
    const config = ENEMIES[type];
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.speed = config.speed;
    this.reward = config.reward;
    this.radius = config.radius;
    this.color = config.color;

    // Start at the first waypoint
    this.position = this.path[0].clone();
  }

  update() {
    if (this.isDead || this.reachedEnd) return;

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

    // Draw body
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Health Bar
    const hpPct = this.hp / this.maxHp;
    const barWidth = 20;
    const barHeight = 4;

    ctx.fillStyle = 'red';
    ctx.fillRect(this.position.x - barWidth / 2, this.position.y - this.radius - 8, barWidth, barHeight);

    ctx.fillStyle = 'lime';
    ctx.fillRect(this.position.x - barWidth / 2, this.position.y - this.radius - 8, barWidth * hpPct, barHeight);
  }

  takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }
}
