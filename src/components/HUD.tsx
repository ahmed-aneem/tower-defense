import React from 'react';
import { Heart, Coins, Activity, ShieldAlert, Play, RotateCw } from 'lucide-react';
import { type GameState, GameEngine } from '../game/GameEngine';
import { TOWERS, type TowerType } from '../game/Constants';
import { Tower } from '../game/Tower';

interface HUDProps {
  gameState: GameState;
  engine: GameEngine | null;
  selectedTowerType: TowerType | null;
  onSelectTower: (type: TowerType | null) => void;
  selectedTower: Tower | null;
  onSellTower: () => void;
  onDeselect: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  engine,
  selectedTowerType,
  onSelectTower,
  selectedTower,
  onSellTower,
  onDeselect
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      {/* Top Bar: Stats */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex gap-4 bg-gray-900/80 p-3 rounded-lg text-white border border-gray-700 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-red-400">
            <Heart size={20} fill="currentColor" />
            <span className="font-bold text-xl">{gameState.lives}</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-400">
            <Coins size={20} fill="currentColor" />
            <span className="font-bold text-xl">{gameState.money}</span>
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <Activity size={20} />
            <span className="font-bold text-xl">Wave {gameState.wave}</span>
          </div>
        </div>

        {/* Wave Control */}
        {!gameState.waveActive && gameState.gameStarted && !gameState.isGameOver && (
          <button
            onClick={() => engine?.startWave()}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 animate-pulse"
          >
            <ShieldAlert size={20} />
            Start Next Wave
          </button>
        )}
      </div>

      {/* Center: Selected Tower Info */}
      {selectedTower && (
         <div className="pointer-events-auto self-center bg-gray-900/90 p-4 rounded-lg border border-gray-600 text-white w-64">
             <div className="flex justify-between items-center mb-2">
                 <h3 className="font-bold text-lg">{TOWERS[selectedTower.type].name}</h3>
                 <button onClick={onDeselect} className="text-gray-400 hover:text-white">✕</button>
             </div>
             <div className="text-sm text-gray-300 mb-4">
                 <p>Damage: {selectedTower.damage}</p>
                 <p>Range: {selectedTower.range}</p>
                 <p>Speed: {Math.round(60/selectedTower.maxCooldown * 10) / 10}/s</p>
             </div>
             <button
                onClick={onSellTower}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded font-semibold transition-colors flex items-center justify-center gap-2"
             >
                 Sell (${Math.floor(TOWERS[selectedTower.type].cost * 0.5)})
             </button>
         </div>
      )}

      {/* Bottom Bar: Tower Selection */}
      <div className="flex justify-center gap-4 pointer-events-auto">
        {Object.entries(TOWERS).map(([key, tower]) => (
          <button
            key={key}
            onClick={() => onSelectTower(selectedTowerType === key ? null : key as TowerType)}
            disabled={gameState.money < tower.cost}
            className={`
              relative group flex flex-col items-center p-3 rounded-lg border-2 transition-all
              ${selectedTowerType === key
                ? 'bg-gray-700 border-blue-500 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'bg-gray-800 border-gray-700 hover:border-gray-500 hover:bg-gray-750'}
              ${gameState.money < tower.cost ? 'opacity-50 cursor-not-allowed grayscale' : ''}
            `}
          >
            <div className="w-8 h-8 rounded mb-2" style={{ backgroundColor: tower.color }}></div>
            <span className="text-white font-bold text-sm">{tower.name}</span>
            <span className="text-yellow-400 font-mono text-xs">${tower.cost}</span>

            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-gray-900 text-white text-xs p-2 rounded border border-gray-600 z-10">
                 <p>Dmg: {tower.damage} | Rng: {tower.range}</p>
                 <p className="text-gray-400 mt-1">Speed: Fast</p>
            </div>
          </button>
        ))}
      </div>

      {/* Overlays */}
      {!gameState.gameStarted && !gameState.isGameOver && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-600 text-center max-w-md shadow-2xl">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
              GRID DEFENSE
            </h1>
            <p className="text-gray-300 mb-8">
              Defend the base from waves of enemies. Place towers strategically and manage your economy.
            </p>
            <button
              onClick={() => engine?.startGame()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-transform hover:scale-105"
            >
              <Play fill="currentColor" /> START GAME
            </button>
          </div>
        </div>
      )}

      {gameState.isGameOver && (
        <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-gray-900 p-8 rounded-2xl border-2 border-red-500 text-center max-w-md shadow-2xl">
            <h2 className="text-4xl font-black text-red-500 mb-2">GAME OVER</h2>
            <p className="text-white text-xl mb-6">You survived {gameState.wave - 1} waves</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white text-lg font-bold py-3 rounded-lg flex items-center justify-center gap-3"
            >
              <RotateCw /> TRY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
