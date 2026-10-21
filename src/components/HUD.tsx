import React, { useState } from 'react';
import { Play, Zap, Cpu, Check, X } from 'lucide-react';
import { type GameState, GameEngine } from '../game/GameEngine';
import { TOWERS, type TowerType } from '../game/Constants';
import { Tower } from '../game/Tower';
import { soundManager } from '../game/SoundManager';
import { type MapConfig } from '../game/Maps';
import { StartMenu } from './StartMenu';
import { TopBar } from './hud/TopBar';
import { TowerBar } from './hud/TowerBar';
import { TowerPanel } from './hud/TowerPanel';
import { WavePanel } from './hud/WavePanel';
import { GameOver } from './hud/GameOver';
import { WaveBanner } from './hud/WaveBanner';
import { THEMES } from '../game/MapThemes';

interface HUDProps {
  gameState: GameState;
  engine: React.MutableRefObject<GameEngine | null> | null;
  selectedTowerType: TowerType | null;
  onSelectTower: (type: TowerType | null) => void;
  selectedTower: Tower | null;
  onSellTower: () => void;
  onDeselect: () => void;
  selectedMap: MapConfig;
  onSelectMap: (map: MapConfig) => void;
  onConfirmPlacement: () => void;
  onCancelPlacement: () => void;
  isPortrait?: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  engine,
  selectedTowerType,
  onSelectTower,
  selectedTower,
  onSellTower,
  onDeselect,
  selectedMap,
  onSelectMap,
  onConfirmPlacement,
  onCancelPlacement,
  isPortrait = false
}) => {
  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if Mod Selection or Game Over
      if (gameState.isGameOver || gameState.choosingMod) return;

      switch (e.key) {
        case ' ':
          if (!gameState.gameStarted) {
            engine?.current?.startGame();
          } else if (gameState.waveActive) {
            // Toggle Speed
            const nextSpeed = gameState.speed === 1 ? 2 : gameState.speed === 2 ? 4 : 1;
            engine?.current?.setSpeed(nextSpeed);
          } else {
            engine?.current?.startWave();
          }
          break;
        case 'Escape':
          if (selectedTowerType) {
            onCancelPlacement();
          } else if (selectedTower) {
            onDeselect();
          } else {
            engine?.current?.togglePause();
          }
          break;
        case 'Backspace':
        case 'Delete':
          if (selectedTower) onSellTower();
          break;
        case 'u':
        case 'U':
          if (selectedTower && engine?.current) engine.current.upgradeTower(selectedTower);
          break;
      }

      // Tower Selection 1-0
      const towerKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
      const towerTypes = Object.keys(TOWERS) as TowerType[];
      const idx = towerKeys.indexOf(e.key);
      if (idx !== -1 && idx < towerTypes.length) {
        onSelectTower(towerTypes[idx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedTower, selectedTowerType, engine, onCancelPlacement, onDeselect, onSellTower, onSelectTower]);

  return (
    <div style={{ '--accent': THEMES[selectedMap.theme]?.edge } as React.CSSProperties} className={`absolute inset-0 pointer-events-none flex flex-col justify-between font-sans selection:bg-blue-500/30 ${isPortrait ? '' : 'p-4'}`}>
      {gameState.gameStarted && !gameState.isGameOver && gameState.lives <= 5 && <div className="absolute inset-0 danger-vignette pointer-events-none" />}
      <WaveBanner wave={gameState.wave} active={gameState.waveActive} engine={engine} />

      <TopBar gameState={gameState} engine={engine} isPortrait={isPortrait} />

      {selectedTower && !gameState.isGameOver && !gameState.choosingMod && (
        <TowerPanel tower={selectedTower} gameState={gameState} engine={engine} isPortrait={isPortrait} onSell={onSellTower} onClose={onDeselect} />
      )}

      {/* Placement Controls */}
      {selectedTowerType && !gameState.isGameOver && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-8 pointer-events-auto z-30">
          <button
            onClick={onCancelPlacement}
            className="bg-slate-800/80 lg:hover:bg-red-500 text-white p-4 rounded-full shadow-lg border-2 border-slate-600 lg:hover:border-red-400 transition-all backdrop-blur-sm active:scale-95"
          >
            <X size={28} />
          </button>
          <button
            onClick={onConfirmPlacement}
            className="bg-emerald-500 lg:hover:bg-emerald-400 text-white p-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] border-2 border-emerald-300 transition-all lg:hover:scale-110 active:scale-95"
          >
            <Check size={32} />
          </button>
        </div>
      )}

      {/* Special Abilities */}
      {gameState.gameStarted && !gameState.isGameOver && !gameState.choosingMod && !(isPortrait && selectedTower) && (
        <div className="absolute bottom-24 right-4 pointer-events-auto z-20">
          <button
            onClick={() => engine?.current?.activateAbility('ORBITAL_STRIKE')}
            disabled={gameState.money < 500}
            className={`bg-red-600 lg:hover:bg-red-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] border-4 border-red-800 transition-all active:scale-95 flex flex-col items-center gap-1 group relative overflow-hidden ${gameState.money < 500 ? 'opacity-50 grayscale cursor-not-allowed' : 'lg:hover:scale-110'}`}
            title="Orbital Strike ($500)"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            <Zap size={24} fill="currentColor" className={`${gameState.money >= 500 ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-black tracking-wider shadow-black drop-shadow-md">NUKE</span>
            <span className="text-[10px] font-mono bg-black/30 px-1 rounded">$500</span>
          </button>
        </div>
      )}

      <div className={`flex flex-col gap-2 ${isPortrait ? 'absolute bottom-3 left-0 right-[60px] items-center' : 'items-center'}`}>
        {!gameState.waveActive && !selectedTowerType && gameState.gameStarted && !gameState.isGameOver && !gameState.isPaused && !gameState.choosingMod && (
          <WavePanel nextWave={gameState.wave + 1} engine={engine} />
        )}
        {!isPortrait && <TowerBar gameState={gameState} selectedTowerType={selectedTowerType} onSelectTower={onSelectTower} isPortrait={isPortrait} />}
      </div>
      {isPortrait && <TowerBar gameState={gameState} selectedTowerType={selectedTowerType} onSelectTower={onSelectTower} isPortrait />}

      {/* Start Game Overlay */}
      {!gameState.gameStarted && !gameState.isGameOver && (
        <StartMenu
          selectedMap={selectedMap}
          onSelectMap={onSelectMap}
          onStart={() => {
            engine?.current?.startGame();
            soundManager.playShoot('BASIC');
          }}
        />
      )}

      {/* Mod Selection Overlay */}
      {
        gameState.choosingMod && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-50 pointer-events-auto backdrop-blur-md">
            <div className="max-w-4xl w-full px-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">SYSTEM UPGRADE AVAILABLE</h2>
                <p className="text-slate-400">Choose a modification to enhance your defenses.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto p-2 no-scrollbar">
                {gameState.modOptions?.map((mod, i) => (
                  <button
                    key={i}
                    onClick={() => engine?.current?.selectMod(mod)}
                    className={`
                                relative group overflow-hidden bg-slate-900 border-2 p-6 rounded-2xl transition-all lg:hover:scale-105 text-left flex flex-col h-64 shadow-2xl
                                ${mod.rarity === 'LEGENDARY' ? 'border-amber-500/50 lg:hover:border-amber-500 shadow-amber-500/10' :
                        mod.rarity === 'RARE' ? 'border-cyan-500/50 lg:hover:border-cyan-500 shadow-cyan-500/10' :
                          'border-slate-600 lg:hover:border-slate-400 shadow-blue-500/5'}
                            `}
                  >
                    <div className={`
                                absolute inset-0 opacity-0 lg:group-hover:opacity-10 transition-opacity
                                ${mod.rarity === 'LEGENDARY' ? 'bg-amber-500' : mod.rarity === 'RARE' ? 'bg-cyan-500' : 'bg-white'}
                            `} />

                    <div className="mb-4">
                      <span className={`
                                    text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded
                                    ${mod.rarity === 'LEGENDARY' ? 'bg-amber-500/20 text-amber-400' :
                          mod.rarity === 'RARE' ? 'bg-cyan-500/20 text-cyan-400' :
                            'bg-slate-700 text-slate-300'}
                                `}>
                        {mod.rarity}
                      </span>
                    </div>

                    <Cpu size={32} className={`mb-4 ${mod.rarity === 'LEGENDARY' ? 'text-amber-400' : mod.rarity === 'RARE' ? 'text-cyan-400' : 'text-slate-200'}`} />

                    <h3 className="text-xl font-bold text-white mb-2 lg:group-hover:text-blue-200 transition-colors">{mod.name}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{mod.description}</p>

                    <div className="mt-auto pt-4 flex items-center gap-2 text-xs font-mono opacity-50">
                      <span>ID: {mod.id.split('_')[0]}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {/* Paused Overlay */}
      {
        gameState.isPaused && !gameState.isGameOver && !gameState.choosingMod && (
          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center z-40 pointer-events-auto backdrop-blur-sm">
            <div className="bg-slate-900/90 p-8 rounded-2xl border border-slate-700 text-center shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6 tracking-widest">SYSTEM PAUSED</h2>
              <button
                onClick={() => engine?.current?.togglePause()}
                className="bg-blue-600 lg:hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 mx-auto"
              >
                <Play size={20} fill="currentColor" /> RESUME
              </button>
            </div>
          </div>
        )
      }

      {gameState.isGameOver && <GameOver mapId={selectedMap.id} mapName={selectedMap.name} waveReached={Math.max(1, gameState.wave - 1)} />}

    </div >
  );
};
