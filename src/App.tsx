import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, type GameState } from './game/GameEngine';
import { HUD } from './components/HUD';
import { GAME_WIDTH, GAME_HEIGHT, type TowerType } from './game/Constants';
import { Tower } from './game/Tower';
import { MAPS, type MapConfig } from './game/Maps';
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
    isPaused: false,
    activeMods: [],
    choosingMod: false,
    modOptions: [],
    speed: 1,
    autoStart: false
  });
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  const [selectedMap, setSelectedMap] = useState<MapConfig>(MAPS[0]);
  const [scale, setScale] = useState(1);

  useEffect(() => {
      const handleResize = () => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          const scaleW = w / GAME_WIDTH;
          const scaleH = h / GAME_HEIGHT;
          // Scale to fit, but max 1 (don't upscale pixelated if not needed, or maybe do? BTD6 upscales. Let's allow upscale)
          const s = Math.min(scaleW, scaleH);
          setScale(s < 1 ? s : s); // Actually just s.
      };

      window.addEventListener('resize', handleResize);
      handleResize();

      return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Sync placement mode
  useEffect(() => {
      if (engineRef.current) {
          engineRef.current.setPlacementMode(selectedTowerType);
      }
  }, [selectedTowerType]);

  const getCanvasCoords = (clientX: number, clientY: number) => {
      if (!canvasRef.current) return {x:0, y:0};
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;
      const scaleY = GAME_HEIGHT / rect.height;
      return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
      };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!engineRef.current) return;
      // Prevent default to avoid scrolling on touch
      e.preventDefault();
      const {x, y} = getCanvasCoords(e.clientX, e.clientY);
      engineRef.current.updateMouse(new Vector2(x, y));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current) return;

    const {x, y} = getCanvasCoords(e.clientX, e.clientY);

    // Update mouse pos just in case
    engineRef.current.updateMouse(new Vector2(x, y));

    if (selectedTowerType) {
        // Attempt placement logic is now handled via explicit buttons on mobile,
        // or click on desktop.
        // For unified approach: Click confirms placement.
        const success = engineRef.current.confirmPlacement();
        if (success) {
            setSelectedTowerType(null);
        }
    } else {
        const clickedTower = engineRef.current.handleClick(x, y);
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
    <div className="w-full h-screen bg-gray-950 flex items-center justify-center overflow-hidden">
      <div
        className="relative shadow-2xl rounded-xl overflow-hidden border border-gray-800 origin-center"
        style={{
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            transform: `scale(${scale})`,
        }}
      >
        <canvas
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          ref={canvasRef}
          className="cursor-crosshair block touch-none"
          onClick={handleCanvasClick}
          onPointerMove={handlePointerMove}
        />

        <HUD
          gameState={gameState}
          engine={engineRef}
          selectedTowerType={selectedTowerType}
          onSelectTower={(type) => {
              if (selectedTowerType === type) {
                  setSelectedTowerType(null); // Toggle off
              } else {
                  setSelectedTowerType(type);
                  setSelectedTower(null);
              }
          }}
          selectedTower={selectedTower}
          onSellTower={handleSell}
          onDeselect={() => setSelectedTower(null)}
          selectedMap={selectedMap}
          onSelectMap={setSelectedMap}
          onConfirmPlacement={() => {
              if (engineRef.current?.confirmPlacement()) {
                  setSelectedTowerType(null);
              }
          }}
          onCancelPlacement={() => {
              engineRef.current?.cancelPlacement();
              setSelectedTowerType(null);
          }}
        />
      </div>
    </div>
  );
}

export default App;
