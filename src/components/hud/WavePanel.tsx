import React from 'react';
import { ShieldAlert, Skull } from 'lucide-react';
import { SpriteCanvas } from './SpriteCanvas';
import { ENEMY_LORE } from '../../game/Lore';
import { type GameEngine } from '../../game/GameEngine';
import { type EnemyType } from '../../types';

interface Props {
  nextWave: number;
  engine: React.MutableRefObject<GameEngine | null> | null;
}

const ORDER: EnemyType[] = ['NORMAL', 'FAST', 'SWARM', 'ARMORED', 'TANK', 'BOSS'];

export const WavePanel: React.FC<Props> = ({ nextWave, engine }) => {
  const preview = engine?.current?.waveManager.preview(nextWave) ?? {};
  const hasBoss = (preview.BOSS ?? 0) > 0;

  return (
    <div className="pointer-events-auto self-center flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/50 rounded-full px-3 py-0.5">
        {ORDER.filter(t => preview[t]).map(t => (
          <span key={t} className="flex items-center gap-0.5 text-[11px] font-mono text-slate-300" title={ENEMY_LORE[t].callsign}>
            <SpriteCanvas kind="enemy" type={t} size={24} />×{preview[t]}
          </span>
        ))}
        {hasBoss && <Skull size={13} className="text-rose-400" />}
      </div>
      <button
        onClick={() => engine?.current?.startWave()}
        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 lg:hover:from-emerald-500 lg:hover:to-teal-500 text-white pl-5 pr-6 py-2.5 rounded-full font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all lg:hover:scale-105 active:scale-95 border border-emerald-400/30 animate-pulse"
      >
        <ShieldAlert size={18} />
        <span>WAVE {nextWave}</span>
        <kbd className="text-[10px] bg-black/25 rounded px-1.5 py-0.5 font-mono">SPACE</kbd>
      </button>
    </div>
  );
};
