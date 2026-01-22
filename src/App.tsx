import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, type GameState } from './game/GameEngine';
import { HUD } from './components/HUD';
import { type TowerType } from './game/Constants';
import { Tower } from './game/Tower';

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
    isPaused: false
  });
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Engine
    const engine = new GameEngine(canvasRef.current, (newState) => {
      setGameState(newState);
    });
    engineRef.current = engine;

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedTower = engineRef.current.handleClick(x, y, selectedTowerType);

    if (clickedTower) {
        setSelectedTower(clickedTower);
        setSelectedTowerType(null); // Deselect placement tool when selecting a tower
    } else {
        // If we successfully placed a tower (or clicked empty space), clear selection
        // Note: handleClick handles the placement logic internally if selectedTowerType is set
        // But we might want to keep the tool active for multiple placements?
        // For now let's keep it simple: click to place, stay selected to place more?
        // Let's toggle off for better UX on mobile/simpler interaction
        if (selectedTowerType) {
             // If placement failed (e.g. no money), it returns null and we keep selection
             // If placement succeeded, we might want to deselect or keep.
             // Let's just check money in the engine or here.
             // Actually engine.placeTower returns boolean.
             // Refactoring handleClick to be more transparent might be better but for now:

             // If we clicked empty space and had a tool selected:
             if (!clickedTower) {
                 // Check if we still have money for another one?
                 // Or just keep it selected.
             }
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
        />
      </div>
    </div>
  );
}

export default App;
