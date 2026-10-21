import React, { useState } from 'react';
import { Crosshair, X } from 'lucide-react';
import { TOWERS, TowerTargetingMode } from '../../game/Constants';
import { type GameState, type GameEngine } from '../../game/GameEngine';
import { type Tower } from '../../game/Tower';
import { TowerIcon } from './TowerIcon';
import { TOWER_LORE } from '../../game/Lore';
import { resonanceBonus, MAX_LINKS } from '../../game/Resonance';

interface Props {
  tower: Tower;
  gameState: GameState;
  engine: React.MutableRefObject<GameEngine | null> | null;
  isPortrait: boolean;
  onSell: () => void;
  onClose: () => void;
}

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="bg-slate-800/60 rounded-lg px-2 py-1.5">
    <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
    <div className="font-mono text-sm text-white leading-tight">{value}</div>
  </div>
);

export const TowerPanel: React.FC<Props> = ({ tower, gameState, engine, isPortrait, onSell, onClose }) => {
  const [, refresh] = useState(0);
  const afford = gameState.money >= tower.upgradeCost;
  const upgrade = (path?: 'A' | 'B') => { engine?.current?.upgradeTower(tower, path); refresh(n => n + 1); };
  const cycleTarget = () => {
    const modes = Object.values(TowerTargetingMode);
    tower.setTargetingMode(modes[(modes.indexOf(tower.targetingMode) + 1) % modes.length]);
    refresh(n => n + 1);
  };
  const pops = Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.floor(tower.pops));
  const upBtn = 'flex-1 py-2 rounded-lg font-bold text-xs border transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className={`pointer-events-auto absolute z-30 bg-slate-900/95 backdrop-blur-xl border border-(--accent)/50 text-white shadow-[0_0_30px_-8px_var(--accent)] p-3 animate-in fade-in
      ${isPortrait ? 'left-0 right-[60px] bottom-0 rounded-t-2xl' : 'right-4 top-24 w-64 rounded-2xl'}`}>
      <div className="flex items-center gap-2 mb-2">
        <TowerIcon type={tower.type} size={30} glow />
        <div className="flex-1 min-w-0">
          <div className="font-bold tracking-wide leading-none">{TOWER_LORE[tower.type].callsign.toUpperCase()} <span className="text-[10px] font-normal text-slate-500">{TOWERS[tower.type].name}</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">{TOWER_LORE[tower.type].role} · LVL {tower.level}{tower.camoDetection ? ' · camo' : ''}</div>
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1 text-slate-500 lg:hover:text-white"><X size={18} /></button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-2">
        <Stat label="Damage" value={tower.damage} />
        <Stat label="Range" value={tower.range} />
        <Stat label="Rate" value={`${(60 / tower.maxCooldown).toFixed(1)}/s`} />
        <Stat label="Pierce" value={tower.pierce} />
        <Stat label="Type" value={<span className="text-[10px]">{tower.damageType}</span>} />
        <Stat label="Pops" value={<span className="text-emerald-400">{pops}</span>} />
      </div>

      {tower.type !== 'FARM' && (
        <div className="mb-2 px-3 py-1.5 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 flex items-center justify-between text-[11px]">
          <span className="font-bold uppercase tracking-wider text-fuchsia-300">Ressonância</span>
          <span className="font-mono text-fuchsia-200">
            {tower.links.length}/{MAX_LINKS} · +{Math.round(resonanceBonus(tower) * 100)}% vel.
          </span>
        </div>
      )}

      <button onClick={cycleTarget} className="w-full mb-2 bg-slate-800 lg:hover:bg-slate-700 border border-slate-600 px-3 py-2 rounded-lg flex items-center justify-between transition-colors">
        <span className="flex items-center gap-2 text-slate-300 text-[10px] font-bold uppercase"><Crosshair size={14} /> Target</span>
        <span className="font-mono text-cyan-400 text-sm font-bold">{tower.targetingMode}</span>
      </button>

      <div className="flex gap-1.5">
        <button onClick={onSell} className={`${upBtn} bg-rose-500/15 text-rose-300 border-rose-500/30 lg:hover:bg-rose-500/25`}>
          SELL <span className="font-mono opacity-80">+${Math.floor(tower.totalSpent * 0.7)}</span>
        </button>
        {tower.level < 2 ? (
          <button disabled={!afford} onClick={() => upgrade()} className={`${upBtn} bg-amber-500/15 text-amber-300 border-amber-500/30 lg:hover:bg-amber-500/25`}>
            UPGRADE <span className="font-mono opacity-80">-${tower.upgradeCost}</span>
          </button>
        ) : tower.level === 2 ? (
          <>
            <button disabled={!afford} onClick={() => upgrade('A')} className={`${upBtn} bg-blue-600/30 text-blue-200 border-blue-500/50`}>
              PATH A <span className="font-mono opacity-80">-${tower.upgradeCost}</span>
            </button>
            <button disabled={!afford} onClick={() => upgrade('B')} className={`${upBtn} bg-fuchsia-600/30 text-fuchsia-200 border-fuchsia-500/50`}>
              PATH B <span className="font-mono opacity-80">-${tower.upgradeCost}</span>
            </button>
          </>
        ) : (
          <div className="flex-1 py-2 rounded-lg text-center text-xs font-bold text-slate-500 bg-slate-800 border border-slate-700">MAX</div>
        )}
      </div>
    </div>
  );
};
