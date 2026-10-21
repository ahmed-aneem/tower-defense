import React from 'react';
import { type TowerType } from '../../game/Constants';
import { SpriteCanvas } from './SpriteCanvas';

interface Props {
  type: TowerType;
  size?: number;
  glow?: boolean;
  animated?: boolean;
}

export const TowerIcon: React.FC<Props> = ({ type, size = 40, glow = false, animated = false }) => (
  <div className={`rounded-lg flex-shrink-0 ${glow ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]' : ''}`}>
    <SpriteCanvas kind="tower" type={type} size={size} animated={animated} />
  </div>
);
