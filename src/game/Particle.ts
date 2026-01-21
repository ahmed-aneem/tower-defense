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

  constructor(position: Vector2, color: string) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.position = position.clone();
    this.color = color;
    this.maxLife = 20 + Math.random() * 20;
    this.life = this.maxLife;
    this.size = 2 + Math.random() * 3;

    // Random direction
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2;
    this.velocity = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  update() {
    this.position = this.position.add(this.velocity);
    this.life--;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;

    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}
