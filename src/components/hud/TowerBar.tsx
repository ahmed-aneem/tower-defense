import React from 'react';
import { TOWERS, type TowerType } from '../../game/Constants';
import { type GameState } from '../../game/GameEngine';
import { TowerIcon } from './TowerIcon';
import { TOWER_LORE } from '../../game/Lore';

interface Props {
  gameState: GameState;
  selectedTowerType: TowerType | null;
  onSelectTower: (type: TowerType | null) => void;
  isPortrait: boolean;
}

const HOTKEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export const TowerBar: React.FC<Props> = ({ gameState, selectedTowerType, onSelectTower, isPortrait }) => {
  const discount = gameState.activeMods.some(m => m.id === 'DISCOUNT');

  return (
    <div className={`pointer-events-auto no-scrollbar ${isPortrait
      ? 'fixed right-0 top-[52px] bottom-0 w-[60px] bg-slate-900/95 border-l border-slate-800 flex flex-col gap-1.5 overflow-y-auto items-center py-2 z-40'
      : 'self-center max-w-full overflow-x-auto flex gap-1.5 p-1.5 pt-3 bg-slate-900/80 backdrop-blur-md border border-(--accent)/40 rounded-2xl shadow-[0_0_24px_-6px_var(--accent)]'}`}>
      {(Object.keys(TOWERS) as TowerType[]).map((key, i) => {
        const tower = TOWERS[key];
        const cost = discount ? Math.floor(tower.cost * 0.9) : tower.cost;
        const active = selectedTowerType === key;
        const canAfford = gameState.money >= cost;

        return (
          <button
            key={key}
            onClick={() => onSelectTower(active ? null : key)}
            disabled={!canAfford}
            className={`relative group flex flex-col items-center gap-0.5 rounded-xl border flex-shrink-0 transition-all active:scale-95
              ${isPortrait ? 'w-12 py-1' : 'w-[68px] py-1.5'}
              ${active ? 'bg-slate-700 border-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.35)] -translate-y-1' : 'bg-slate-800/70 border-slate-700/60 lg:hover:bg-slate-700 lg:hover:border-slate-500'}
              ${canAfford ? '' : 'opacity-40 cursor-not-allowed'}`}
          >
            {!isPortrait && HOTKEYS[i] && (
              <span className="absolute top-0.5 left-1 text-[9px] font-mono text-slate-500">{HOTKEYS[i]}</span>
            )}
            <TowerIcon type={key} size={isPortrait ? 30 : 40} glow={active} />
            <span className={`font-bold leading-none ${isPortrait ? 'text-[8px]' : 'text-[10px]'} ${active ? 'text-white' : 'text-slate-300'}`}>{TOWER_LORE[key].callsign.toUpperCase()}</span>
            <span className={`font-mono leading-none ${isPortrait ? 'text-[9px]' : 'text-[11px]'} ${canAfford ? 'text-amber-400' : 'text-slate-500'}`}>${cost}</span>
            {!isPortrait && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 hidden lg:group-hover:block w-52 bg-slate-950/95 border border-slate-600 rounded-xl p-3 text-left z-30 pointer-events-none shadow-2xl">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-white text-sm">{TOWER_LORE[key].callsign}</span>
                  <span className="text-[10px] uppercase tracking-wider text-cyan-300">{TOWER_LORE[key].role}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug my-1.5">{TOWER_LORE[key].blurb}</p>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-300">
                  <span>DMG {tower.damage}</span><span>RNG {tower.range}</span><span>CD {tower.cooldown}f</span>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
