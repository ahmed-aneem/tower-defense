import { drawTowerBase, skinTowerColor } from '../Skins';
import { drawTowerSprite } from '../TowerSprites';
import { Vector2 } from '../Vector';
import { type TowerType, TOWERS } from '../Constants';
import { Tower } from '../Tower';

export class InputManager {
    public mousePosition: Vector2 = new Vector2(0, 0);
    public placementMode: TowerType | null = null;
    // private canvas: HTMLCanvasElement; // Removed unused

    constructor() {

    }

    updateMouse(x: number, y: number) {
        this.mousePosition = new Vector2(x, y);
    }

    setPlacementMode(type: TowerType | null) {
        this.placementMode = type;
    }

    handleClick(towers: Tower[], money: number): { action: 'PLACE', type: TowerType, pos: Vector2 } | { action: 'SELECT', tower: Tower } | null {
        if (this.placementMode) {
            const cost = TOWERS[this.placementMode].cost;
            if (money >= cost) {
                // The GameEngine handles placement validation, so we just return the action.
                return { action: 'PLACE', type: this.placementMode, pos: this.mousePosition };
            }
            return null;
        } else {
            // Select tower
            for (const t of towers) {
                if (t.position.distanceTo(this.mousePosition) < 20) {
                    return { action: 'SELECT', tower: t };
                }
            }
        }
        return null;
    }

    drawPreview(ctx: CanvasRenderingContext2D, canPlace: boolean = true) {
        if (this.placementMode) {
            const tConf = TOWERS[this.placementMode];
            ctx.save();
            ctx.translate(this.mousePosition.x, this.mousePosition.y);

            // Range
            ctx.beginPath();
            ctx.arc(0, 0, tConf.range, 0, Math.PI * 2);
            ctx.fillStyle = canPlace ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)'; // Red if invalid
            ctx.fill();
            ctx.strokeStyle = canPlace ? '#fff' : '#ef4444';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.stroke();

            // Body (real sprite, semi-transparent)
            ctx.globalAlpha = canPlace ? 0.85 : 0.45;
            const color = skinTowerColor(this.placementMode, tConf.color);
            drawTowerBase(ctx, color);
            drawTowerSprite(ctx, this.placementMode, color, performance.now() / 1000, false);
            ctx.globalAlpha = 1;

            ctx.restore();
        }
    }
}
