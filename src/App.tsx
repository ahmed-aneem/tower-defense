import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, type GameState } from './game/GameEngine';
import { HUD } from './components/HUD';
import { type TowerType } from './game/Constants';
import { Tower } from './game/Tower';
import { Vector2 } from './game/Vector';

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

  // Drag State
  const [dragState, setDragState] = useState<{ active: boolean; type: TowerType | null }>({ active: false, type: null });
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

  const handlePointerMove = (e: React.PointerEvent) => {
      if (dragState.active && engineRef.current && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const pos = new Vector2(x, y);
          engineRef.current.setPreview(pos, dragState.type);
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      if (dragState.active) {
          if (engineRef.current && canvasRef.current) {
               const rect = canvasRef.current.getBoundingClientRect();
               const x = e.clientX - rect.left;
               const y = e.clientY - rect.top;
               const pos = new Vector2(x, y);

               // Attempt placement
               if (dragState.type) {
                   engineRef.current.placeTower(pos, dragState.type);
               }

               // Reset Engine Preview
               engineRef.current.setPreview(null, null);
          }
          setDragState({ active: false, type: null });
      }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only handle selection clicks if we weren't dragging
    if (!dragState.active && engineRef.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const pos = new Vector2(x, y);

        const clickedTower = engineRef.current.getTowerAt(pos);
        if (clickedTower) {
            setSelectedTower(clickedTower);
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
    <div
        className="w-full h-screen bg-gray-950 flex items-center justify-center overflow-hidden touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
    >
      <div className="relative shadow-2xl rounded-xl overflow-hidden border border-gray-800 touch-none select-none">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair block touch-none"
          onClick={handleCanvasClick}
        />

        <HUD
          gameState={gameState}
          engine={engineRef}
          selectedTowerType={null}
          onStartDrag={(type) => {
              setDragState({ active: true, type });
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
