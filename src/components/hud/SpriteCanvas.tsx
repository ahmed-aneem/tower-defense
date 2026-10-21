import React, { useEffect, useRef } from 'react';
import { TOWERS, ENEMIES, type TowerType } from '../../game/Constants';
import { type EnemyType } from '../../types';
import { drawTowerSprite } from '../../game/TowerSprites';
import { drawEnemySprite } from '../../game/EnemySprites';
import { drawTowerBase, getSkin, skinTowerColor, skinEnemyColor } from '../../game/Skins';

type Props =
  | { kind: 'tower'; type: TowerType; size?: number; animated?: boolean; base?: boolean }
  | { kind: 'enemy'; type: EnemyType; size?: number; animated?: boolean; base?: boolean };

/** Renders the in-game sprite (same code the engine uses) so UI and gameplay art never drift. */
export const SpriteCanvas: React.FC<Props> = (props) => {
  const { kind, type, size = 40, animated = false, base = true } = props;
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    let raf = 0;
    const paint = (now: number) => {
      const t = now / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(size / 2, size / 2);
      if (kind === 'tower') {
        const color = skinTowerColor(type as TowerType, TOWERS[type as TowerType].color);
        const k = size / 52;
        ctx.scale(k, k);
        if (base) drawTowerBase(ctx, color);
        ctx.translate(-3, 0);
        drawTowerSprite(ctx, type as TowerType, color, t, false);
      } else {
        const cfg = ENEMIES[type as EnemyType];
        const k = size / (cfg.radius * 3.2);
        ctx.scale(k, k);
        drawEnemySprite(ctx, type as EnemyType, cfg.radius, skinEnemyColor(type, cfg.color), getSkin().outline, t, 0);
      }
      ctx.restore();
      if (animated) raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [kind, type, size, animated, base]);

  return <canvas ref={ref} style={{ width: size, height: size }} className="flex-shrink-0" />;
};
