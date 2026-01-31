import React, { useState } from 'react';
import { Heart, Coins, Activity, ShieldAlert, Play, RotateCw, Pause, Volume2, VolumeX, Zap, Crosshair, Map as MapIcon, Cpu, ChevronLeft, ChevronRight, Check, X, FastForward } from 'lucide-react';
import { type GameState, GameEngine } from '../game/GameEngine';
import { TOWERS, type TowerType, TowerTargetingMode } from '../game/Constants';
import { Tower } from '../game/Tower';
import { soundManager } from '../game/SoundManager';
import { MAPS, type MapConfig } from '../game/Maps';

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
  const [isMuted, setIsMuted] = useState(false);
  const [, forceUpdate] = useState(0);

  const toggleMute = () => {
    soundManager.toggleMute();
    setIsMuted(!isMuted);
  };

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
  }, [gameState, selectedTower, selectedTowerType, engine]);

  const cycleTargetingMode = () => {
    if (!selectedTower) return;
    const modes = Object.values(TowerTargetingMode);
    const currentIndex = modes.indexOf(selectedTower.targetingMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    selectedTower.setTargetingMode(modes[nextIndex]);
    forceUpdate(n => n + 1);
  };

  const nextMap = () => {
    const idx = MAPS.findIndex(m => m.id === selectedMap.id);
    const next = MAPS[(idx + 1) % MAPS.length];
    onSelectMap(next);
  };

  const prevMap = () => {
    const idx = MAPS.findIndex(m => m.id === selectedMap.id);
    const prev = MAPS[(idx - 1 + MAPS.length) % MAPS.length];
    onSelectMap(prev);
  };

  return (
    <div className={`absolute inset-0 pointer-events-none flex flex-col justify-between font-sans selection:bg-blue-500/30 ${isPortrait ? '' : 'p-4'}`}>
      {/* Top Bar: Stats & Controls */}
      <div className="flex justify-between items-start pointer-events-auto w-full max-w-5xl mx-auto">

        {/* Stats */}
        <div className={`flex gap-2 sm:gap-4 bg-slate-900/90 rounded-xl text-white border border-slate-700/50 backdrop-blur-md shadow-lg shadow-blue-500/10 ${isPortrait ? 'fixed top-0 left-0 w-full rounded-none border-x-0 border-t-0 p-3 z-50 justify-between' : 'p-2 sm:p-3'}`}>
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <Heart size={isPortrait ? 14 : 18} className="text-rose-500 animate-pulse" fill="currentColor" />
            <span className={`font-bold tabular-nums ${isPortrait ? 'text-sm' : 'text-lg sm:text-xl'}`}>{gameState.lives}</span>
          </div>
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <Coins size={isPortrait ? 14 : 18} className="text-amber-400" fill="currentColor" />
            <span className={`font-bold text-amber-200 tabular-nums ${isPortrait ? 'text-sm' : 'text-lg sm:text-xl'}`}>{gameState.money}</span>
          </div>
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <Activity size={isPortrait ? 14 : 18} className="text-cyan-400" />
            <span className={`font-bold text-cyan-200 tabular-nums ${isPortrait ? 'text-sm' : 'text-lg sm:text-xl'}`}>WAVE {gameState.wave}</span>
          </div>

          {/* Active Mods Icons */}
          {gameState.activeMods.length > 0 && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-700/50">
              {gameState.activeMods.map((mod, i) => (
                <div key={i} className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-800 rounded flex items-center justify-center text-[10px] text-white border border-slate-600" title={mod.name + ": " + mod.description}>
                  <Cpu size={isPortrait ? 12 : 14} className={mod.rarity === 'LEGENDARY' ? 'text-amber-400' : mod.rarity === 'RARE' ? 'text-cyan-400' : 'text-slate-400'} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={toggleMute}
            className="bg-slate-900/90 p-3 rounded-xl text-slate-400 hover:text-white border border-slate-700/50 hover:bg-slate-800 transition-all"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            onClick={() => engine?.current?.toggleAutoStart()}
            className={`p-3 rounded-xl border transition-all ${gameState.autoStart
              ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-700/50 hover:bg-slate-800'}`}
            title="Auto Start Rounds"
          >
            <RotateCw size={20} className={gameState.autoStart ? "animate-spin-slow" : ""} />
          </button>
          <button
            onClick={() => {
              const nextSpeed = gameState.speed === 1 ? 2 : gameState.speed === 2 ? 4 : 1;
              engine?.current?.setSpeed(nextSpeed);
            }}
            className={`p-3 rounded-xl border transition-all ${gameState.speed > 1
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-700/50 hover:bg-slate-800'} relative`}
          >
            <div className="absolute -top-2 -right-2 bg-emerald-500 text-black text-[10px] font-bold px-1.5 rounded-full border border-emerald-400">
              {gameState.speed}x
            </div>
            <FastForward size={20} fill={gameState.speed > 1 ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => engine?.current?.togglePause()}
            className={`p-3 rounded-xl border transition-all ${gameState.isPaused
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-700/50 hover:bg-slate-800'}`}
          >
            <Pause size={20} fill={gameState.isPaused ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Wave Control (Floating) */}
      {!gameState.waveActive && gameState.gameStarted && !gameState.isGameOver && !gameState.isPaused && !gameState.choosingMod && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={() => engine?.current?.startWave()}
            className="group flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95 border border-emerald-400/30"
          >
            <ShieldAlert size={20} className="group-hover:animate-bounce" />
            <span>DEPLOY NEXT WAVE</span>
          </button>
        </div>
      )}

      {/* Center: Selected Tower Info */}
      {selectedTower && !gameState.isGameOver && !gameState.choosingMod && (
        <div className="pointer-events-auto self-center bg-slate-900/95 p-4 sm:p-5 rounded-2xl border border-slate-600/50 text-white w-[95%] sm:w-72 max-w-sm backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 mb-32 sm:mb-0">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ background: TOWERS[selectedTower.type].color, boxShadow: `0 0 10px ${TOWERS[selectedTower.type].color}` }} />
              <h3 className="font-bold text-lg tracking-wide">{TOWERS[selectedTower.type].name.toUpperCase()}</h3>
            </div>
            <button onClick={onDeselect} className="text-slate-500 hover:text-white transition-colors">✕</button>
          </div>

          <div className={`space-y-2 mb-6 text-sm text-slate-300 ${isPortrait ? 'text-xs' : ''}`}>
            <div className="flex justify-between">
              <span>Damage</span>
              <span className="font-mono text-white">{selectedTower.damage}</span>
            </div>
            <div className="flex justify-between">
              <span>Range</span>
              <span className="font-mono text-white">{selectedTower.range}px</span>
            </div>
            <div className="flex justify-between">
              <span>Fire Rate</span>
              <span className="font-mono text-white">{(60 / selectedTower.maxCooldown).toFixed(1)}/s</span>
            </div>
            <div className="flex justify-between">
              <span>Pierce</span>
              <span className="font-mono text-white">{selectedTower.pierce}</span>
            </div>
            <div className="flex justify-between">
              <span>Type</span>
              <span className="font-mono text-white text-[10px] bg-slate-800 px-1 rounded">{selectedTower.damageType}</span>
            </div>
            {selectedTower.camoDetection && (
              <div className="flex justify-between text-emerald-400">
                <span>Camo Detect</span>
                <span className="font-mono">ACTIVE</span>
              </div>
            )}
          </div>

          {/* Targeting Control */}
          <button
            onClick={cycleTargetingMode}
            className="w-full mb-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 p-3 rounded-lg flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-300">
              <Crosshair size={16} />
              <span className="text-xs font-bold uppercase">Target Priority</span>
            </div>
            <span className="font-mono text-cyan-400 font-bold">{selectedTower.targetingMode}</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onSellTower}
              className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 hover:text-rose-200 border border-rose-500/30 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 group"
            >
              <span>SELL</span>
              <span className="bg-rose-950/50 px-2 py-0.5 rounded text-xs font-mono group-hover:bg-rose-900/50">
                +${Math.floor(TOWERS[selectedTower.type].cost * 0.5)}
              </span>
            </button>

            {selectedTower.level < 3 ? (
              <button
                onClick={() => engine?.current?.upgradeTower(selectedTower)}
                disabled={gameState.money < selectedTower.upgradeCost}
                className={`w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 hover:text-amber-200 border border-amber-500/30 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 group ${gameState.money < selectedTower.upgradeCost ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>UPGRADE</span>
                <span className="bg-amber-950/50 px-2 py-0.5 rounded text-xs font-mono group-hover:bg-amber-900/50">
                  -${selectedTower.upgradeCost}
                </span>
              </button>
            ) : (
              <div className="w-full bg-slate-800 text-slate-500 py-2.5 rounded-lg font-bold text-center border border-slate-700">
                MAX LEVEL
              </div>
            )}
          </div>
        </div>
      )}

      {/* Placement Controls */}
      {selectedTowerType && !gameState.isGameOver && (
        <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 flex gap-8 pointer-events-auto z-30">
          <button
            onClick={onCancelPlacement}
            className="bg-slate-800/80 hover:bg-red-500 text-white p-4 rounded-full shadow-lg border-2 border-slate-600 hover:border-red-400 transition-all backdrop-blur-sm active:scale-95"
          >
            <X size={28} />
          </button>
          <button
            onClick={onConfirmPlacement}
            className="bg-emerald-500 hover:bg-emerald-400 text-white p-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] border-2 border-emerald-300 transition-all hover:scale-110 active:scale-95"
          >
            <Check size={32} />
          </button>
        </div>
      )}

      {/* Special Abilities */}
      {gameState.gameStarted && !gameState.isGameOver && !gameState.choosingMod && (
        <div className="absolute bottom-28 sm:bottom-32 right-4 pointer-events-auto z-20">
          <button
            onClick={() => engine?.current?.activateAbility('ORBITAL_STRIKE')}
            disabled={gameState.money < 500}
            className={`bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] border-4 border-red-800 transition-all active:scale-95 flex flex-col items-center gap-1 group relative overflow-hidden ${gameState.money < 500 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-110'}`}
            title="Orbital Strike ($500)"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            <Zap size={24} fill="currentColor" className={`${gameState.money >= 500 ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-black tracking-wider shadow-black drop-shadow-md">NUKE</span>
            <span className="text-[10px] font-mono bg-black/30 px-1 rounded">$500</span>
          </button>
        </div>
      )}

      {/* Bottom Bar (or Side Bar in Portrait): Tower Selection */}
      <div className={`
        pointer-events-auto pb-4 sm:pb-4 overflow-x-auto no-scrollbar
        ${isPortrait
          ? `fixed right-0 top-[70px] bottom-0 w-[60px] bg-slate-900 border-l border-slate-800 flex flex-col gap-2 overflow-y-auto items-center pt-2 z-40`
          : 'flex justify-start sm:justify-center gap-3 sm:gap-4 w-full px-4 sm:px-4'}
      `}>
        {Object.entries(TOWERS).map(([key, tower]) => {
          const isSelected = selectedTowerType === key;
          const canAfford = gameState.money >= tower.cost;

          return (
            <button
              key={key}
              onClick={() => onSelectTower(isSelected ? null : key as TowerType)}
              disabled={!canAfford}
              className={`
                  relative group flex flex-col items-center rounded-xl border transition-all duration-200 flex-shrink-0
                  ${isPortrait
                  ? 'p-1 min-w-[50px] w-12'
                  : 'p-3 sm:p-3 min-w-[90px] sm:min-w-[100px]'}
                  ${isSelected
                  ? 'bg-slate-800 border-blue-400 ring-2 ring-blue-500/50 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.5)]' + (isPortrait ? ' -translate-x-0' : ' -translate-y-2')
                  : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}
                  ${!canAfford ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                `}
            >
              <div
                className={`${isPortrait ? 'w-8 h-8 mb-1' : 'w-10 h-10 sm:w-12 sm:h-12 mb-1 sm:mb-3'} rounded-lg shadow-lg flex items-center justify-center transition-transform group-hover:scale-110`}
                style={{ backgroundColor: tower.color, boxShadow: isSelected ? `0 0 15px ${tower.color}` : 'none' }}
              >
                {/* Simple Icon Representation */}
                {key === 'BASIC' && <div className="w-4 h-4 bg-white rounded-full" />}
                {key === 'SNIPER' && <div className="w-6 h-1 bg-white" />}
                {key === 'RAPID' && <div className="flex gap-0.5"><div className="w-1 h-4 bg-white" /><div className="w-1 h-4 bg-white" /><div className="w-1 h-4 bg-white" /></div>}
                {key === 'FROST' && <div className="w-4 h-4 bg-white rotate-45" />}
                {key === 'SPLASH' && <div className="w-5 h-3 bg-white" />}
                {key === 'LASER' && <div className="w-6 h-0.5 bg-white" />}
                {key === 'TESLA' && <Zap size={24} className="text-white fill-current" />}
                {key === 'TACK' && <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full" /></div>}
                {key === 'FARM' && <div className="w-4 h-4 bg-white" />}
                {key === 'PLASMA' && <div className="w-6 h-6 rounded-full border-2 border-white bg-violet-300" />}
              </div>

              <span className={`font-bold ${isPortrait ? 'text-[9px] tracking-tight' : 'text-xs sm:text-sm tracking-wider'} mb-0.5 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {tower.name.toUpperCase()}
              </span>
              <span className={`font-mono ${isPortrait ? 'text-[9px]' : 'text-xs'} ${canAfford ? 'text-amber-400' : 'text-slate-500'}`}>
                ${tower.cost}
              </span>

              {/* Stats Popup - Disable/Hide on Portrait mobile to avoid clutter */}
              {!isPortrait && (
                <div className="absolute bottom-full mb-4 hidden group-hover:block w-48 bg-slate-900/95 text-white text-xs p-3 rounded-lg border border-slate-600 shadow-xl z-20 backdrop-blur-sm pointer-events-none">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Damage</span>
                    <span className="font-mono text-emerald-400">{tower.damage}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Range</span>
                    <span className="font-mono text-blue-400">{tower.range}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cooldown</span>
                    <span className="font-mono text-amber-400">{tower.cooldown}f</span>
                  </div>
                  <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-slate-600 rotate-45"></div>
                </div>
              )}
            </button>
          );
        })}
      </div >

      {/* Start Game Overlay */}
      {
        !gameState.gameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center z-50 pointer-events-auto backdrop-blur-sm">
            <div className="bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-700/50 text-center max-w-lg shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden w-full mx-4">
              {/* Background decoration */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

              <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 mb-4 tracking-tight filter drop-shadow-lg">
                NEON DEFENSE
              </h1>
              <p className="text-slate-400 mb-8 text-lg leading-relaxed">
                Strategic tower defense in a cyberpunk grid.
                <br />Protect the core at all costs.
              </p>

              {/* Map Selection */}
              <div className="mb-10 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Target Sector</div>
                <div className="flex items-center justify-between gap-4">
                  <button onClick={prevMap} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white">
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-xl font-bold text-white">
                      <MapIcon size={20} className="text-blue-400" />
                      {selectedMap.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{selectedMap.description}</div>
                  </div>
                  <button onClick={nextMap} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white">
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  engine?.current?.startGame();
                  soundManager.playShoot('BASIC');
                }}
                className="group relative w-full bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold py-5 rounded-2xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(37,99,235,0.4)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
                <Play fill="currentColor" size={24} />
                <span>INITIALIZE SYSTEM</span>
              </button>
            </div>
          </div>
        )
      }

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
                                relative group overflow-hidden bg-slate-900 border-2 p-6 rounded-2xl transition-all hover:scale-105 text-left flex flex-col h-64 shadow-2xl
                                ${mod.rarity === 'LEGENDARY' ? 'border-amber-500/50 hover:border-amber-500 shadow-amber-500/10' :
                        mod.rarity === 'RARE' ? 'border-cyan-500/50 hover:border-cyan-500 shadow-cyan-500/10' :
                          'border-slate-600 hover:border-slate-400 shadow-blue-500/5'}
                            `}
                  >
                    <div className={`
                                absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity
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

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">{mod.name}</h3>
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
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 mx-auto"
              >
                <Play size={20} fill="currentColor" /> RESUME
              </button>
            </div>
          </div>
        )
      }

      {/* Game Over Overlay */}
      {
        gameState.isGameOver && (
          <div className="absolute inset-0 bg-red-950/90 flex items-center justify-center z-50 pointer-events-auto backdrop-blur-md p-4">
            <div className="bg-slate-900 p-8 sm:p-10 rounded-3xl border-2 border-red-500/50 text-center max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              <h2 className="text-5xl font-black text-red-500 mb-2 tracking-tighter">CRITICAL FAILURE</h2>
              <div className="h-1 w-20 bg-red-500 mx-auto my-6 rounded-full" />
              <p className="text-slate-300 text-xl mb-2">Systems compromised at</p>
              <p className="text-4xl font-bold text-white mb-8">Wave {gameState.wave - 1}</p>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-lg font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors border border-slate-600 hover:border-slate-500"
              >
                <RotateCw size={24} /> REBOOT SYSTEM
              </button>
            </div>
          </div>
        )
      }

      {/* Shortcuts Help */}
      <div className="absolute bottom-4 left-4 pointer-events-none text-[10px] text-slate-500 font-mono hidden sm:block">
        [SPACE] Start/Speed &nbsp; [ESC] Cancel/Pause &nbsp; [1-0] Select Tower &nbsp; [U] Upgrade &nbsp; [BKSP] Sell
      </div>
    </div >
  );
};
