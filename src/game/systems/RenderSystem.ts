import { type GameEngine } from '../GameEngine';

export class RenderSystem {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    draw() {
        const {
            ctx, canvas, gridCanvas, shakeIntensity, shakeX, shakeY,
            path, towers, enemies, projectiles, lightningBolts, particles
        } = this.engine;

        ctx.save();

        if (shakeIntensity > 0) {
            ctx.translate(shakeX, shakeY);
        }

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (gridCanvas) {
            ctx.drawImage(gridCanvas, 0, 0);
        } else {
            this.drawGrid(ctx, canvas);
        }

        // Draw Path
        ctx.beginPath();
        if (path.length > 0) {
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
        }
        ctx.lineWidth = 20;
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#60a5fa';
        ctx.stroke();

        towers.forEach(t => {
            t.draw(ctx);
            if (t.type === 'LASER' && t.targetId) {
                const target = enemies.find(e => e.id === t.targetId);
                if (target && !target.isDead) {
                    ctx.beginPath();
                    ctx.moveTo(t.position.x, t.position.y);
                    ctx.lineTo(target.position.x, target.position.y);
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = t.color;
                    ctx.lineCap = 'round';
                    ctx.stroke();

                    ctx.lineWidth = 1;
                    ctx.strokeStyle = '#fff';
                    ctx.stroke();

                    this.engine.createExplosion(target.position, t.color, 1, 0.5);
                }
            }
        });

        enemies.forEach(e => e.draw(ctx));

        projectiles.forEach(p => p.draw(ctx));

        lightningBolts.forEach(bolt => {
            if (bolt.points.length < 2) return;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
            for (let i = 1; i < bolt.points.length; i++) {
                ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
            }
            ctx.strokeStyle = bolt.color;
            ctx.lineWidth = bolt.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = bolt.life / bolt.maxLife;
            ctx.stroke();
            ctx.restore();
        });

        particles.forEach(p => p.draw(ctx));

        // Draw Placement Ghost
        this.engine.inputManager.drawPreview(ctx);

        ctx.restore();
    }

    private drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
        ctx.lineWidth = 1;

        const cellSize = 40;
        for (let x = 0; x <= canvas.width; x += cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y <= canvas.height; y += cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
}
