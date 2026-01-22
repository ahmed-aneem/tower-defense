import { Vector2 } from './Vector';
import { type IParticle } from '../types';

export class Particle implements IParticle {
  id: string;
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  decay: number;

  constructor(position: Vector2, color: string, speedMultiplier: number = 1, sizeMultiplier: number = 1) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.position = position.clone();
    this.color = color;
    this.maxLife = 30 + Math.random() * 30;
    this.life = this.maxLife;
    this.size = (2 + Math.random() * 3) * sizeMultiplier;
    this.decay = 0.95; // Friction

    // Random direction with improved physics feel
    const angle = Math.random() * Math.PI * 2;
    const speed = (1 + Math.random() * 3) * speedMultiplier;
    this.velocity = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  update() {
    this.position = this.position.add(this.velocity);
    this.velocity = this.velocity.scale(this.decay); // Apply friction
    this.life--;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;

    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;

    // Add glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size * alpha, 0, Math.PI * 2); // Shrink as it dies
    ctx.fill();

    // Reset context
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
  }
}
