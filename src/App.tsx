import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, type GameState } from './game/GameEngine';
import { HUD } from './components/HUD';
import { type TowerType } from './game/Constants';
import { Tower } from './game/Tower';
import { MAPS, type MapConfig } from './game/Maps';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    money: 0,
    lives: 0,
    wave: 0,
    isGameOver: false,
    gameStarted: false,
    waveActive: false,
    isPaused: false,
    activeMods: [],
    choosingMod: false
  });
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  const [selectedMap, setSelectedMap] = useState<MapConfig>(MAPS[0]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Cleanup previous engine if exists
    if (engineRef.current) {
        engineRef.current.destroy();
    }

    // Initialize Engine with selected map
    const engine = new GameEngine(canvasRef.current, selectedMap.waypoints, (newState) => {
      setGameState(newState);
    });
    engineRef.current = engine;

    return () => {
      if (engineRef.current) {
          engineRef.current.destroy();
      }
    };
  }, [selectedMap]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedTower = engineRef.current.handleClick(x, y, selectedTowerType);

    if (clickedTower) {
        setSelectedTower(clickedTower);
        setSelectedTowerType(null);
    } else {
        if (selectedTowerType) {
             // Keep tool selected? For now, yes.
        } else {
            setSelectedTower(null);
        }
    }
  };

  const handleSell = () => {
      if (engineRef.current && selectedTower) {
          engineRef.current.sellTower(selectedTower);
          setSelectedTower(null);
      }
  }

  return (
    <div className="w-full h-screen bg-gray-950 flex items-center justify-center overflow-hidden">
      <div className="relative shadow-2xl rounded-xl overflow-hidden border border-gray-800">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair block"
          onClick={handleCanvasClick}
        />

        <HUD
          gameState={gameState}
          engine={engineRef}
          selectedTowerType={selectedTowerType}
          onSelectTower={(type) => {
              setSelectedTowerType(type);
              setSelectedTower(null);
          }}
          selectedTower={selectedTower}
          onSellTower={handleSell}
          onDeselect={() => setSelectedTower(null)}
          selectedMap={selectedMap}
          onSelectMap={setSelectedMap}
        />
      </div>
    </div>
  );
}

export default App;
