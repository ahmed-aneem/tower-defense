import { Vector2 } from './Vector';
import { type IParticle } from '../types';

export class Particle implements IParticle {
  id: string;
  position: Vector2;
  velocity: Vector2;
  life!: number;
  maxLife!: number;
  color: string;
  size!: number;
  decay!: number;
  text?: string;
  shape: 'CIRCLE' | 'SQUARE' | 'STAR' = 'CIRCLE';

  constructor(position: Vector2, color: string, speedMultiplier: number = 1, sizeMultiplier: number = 1, text?: string, shape: 'CIRCLE' | 'SQUARE' | 'STAR' = 'CIRCLE') {
    this.id = Math.random().toString(36).substr(2, 9);
    this.position = position.clone();
    this.color = color;
    this.velocity = new Vector2(0,0);
    this.reset(position, color, speedMultiplier, sizeMultiplier, text, shape);
  }

  reset(position: Vector2, color: string, speedMultiplier: number = 1, sizeMultiplier: number = 1, text?: string, shape: 'CIRCLE' | 'SQUARE' | 'STAR' = 'CIRCLE') {
    this.position = position.clone();
    this.color = color;
    this.text = text;
    this.shape = shape;

    if (this.text) {
        this.maxLife = 60;
        this.life = this.maxLife;
        this.size = 20 * sizeMultiplier;
        this.decay = 0.98;
        this.velocity = new Vector2(0, -1.5 * speedMultiplier); // Float up

        // Add some random drift for text too
        this.velocity.x += (Math.random() - 0.5) * 0.5;
    } else {
        this.maxLife = 30 + Math.random() * 30;
        this.life = this.maxLife;
        this.size = (2 + Math.random() * 3) * sizeMultiplier;
        this.decay = 0.95; // Friction

        // Random direction with improved physics feel
        const angle = Math.random() * Math.PI * 2;
        const speed = (1 + Math.random() * 3) * speedMultiplier;
        this.velocity = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
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

    if (this.text) {
        ctx.font = `bold ${this.size}px monospace`;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.position.x, this.position.y);

        ctx.fillText(this.text, this.position.x, this.position.y);

    } else {
        // Add glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;
        ctx.beginPath();

        const s = this.size * alpha;

        if (this.shape === 'SQUARE') {
             ctx.save();
             ctx.translate(this.position.x, this.position.y);
             ctx.rotate(this.life * 0.1); // Spin
             ctx.fillRect(-s, -s, s*2, s*2);
             ctx.restore();
        } else if (this.shape === 'STAR') {
             // 5-pointed star
             const spikes = 5;
             const outer = s * 1.5;
             const inner = s * 0.6;

             ctx.save();
             ctx.translate(this.position.x, this.position.y);
             ctx.rotate(this.life * 0.05);

             ctx.moveTo(0, 0 - outer);
             for (let i = 0; i < spikes; i++) {
                ctx.rotate(Math.PI / spikes);
                ctx.lineTo(0, 0 - inner);
                ctx.rotate(Math.PI / spikes);
                ctx.lineTo(0, 0 - outer);
             }
             ctx.closePath();
             ctx.fill();
             ctx.restore();
        } else {
            // Circle
            ctx.arc(this.position.x, this.position.y, s, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Reset context
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
  }
}
