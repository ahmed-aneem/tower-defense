import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, type GameState } from './game/GameEngine';
import { HUD } from './components/HUD';
import { type TowerType, DESKTOP_WIDTH, DESKTOP_HEIGHT, MOBILE_WIDTH, MOBILE_HEIGHT } from './game/Constants';
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
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const _isMobile = w < 1024;
      const _isPortrait = h > w;
      setIsPortrait(_isMobile && _isPortrait);

      let virtualW = DESKTOP_WIDTH;
      let virtualH = DESKTOP_HEIGHT;


      if (_isMobile) {
        if (_isPortrait) {
          // PORTRAIT MOBILE LAYOUT
          // Top Bar: ~60px
          // Right Bar: ~60px (Build Menu)
          // Safe Area = Window - UI
          // We map the "Virtual" resolution to match the physical aspect ratio of the "Safe Area"

          const SAFE_AREA_WIDTH = w - 60; // Reserve 60px for right bar
          const SAFE_AREA_HEIGHT = h - 70; // Reserve 70px for top bar

          // Set Virtual Resolution to match the Safe Area Aspect Ratio
          // We want high fidelity, so let's use the actual logical pixels roughly
          virtualW = SAFE_AREA_WIDTH;
          virtualH = SAFE_AREA_HEIGHT;

        } else {
          // LANDSCAPE MOBILE
          virtualW = MOBILE_WIDTH;
          virtualH = MOBILE_HEIGHT;
        }
      }

      setDimensions({ width: virtualW, height: virtualH });

      // Calculate Scale to fit the Safe Window Area
      // If Portrait, we already calculated W/H to fit EXACTLY (Scale = 1 usually)
      // But let's keep the logic generic

      if (_isMobile && _isPortrait) {
        setScale(1); // 1:1 mapping for our calculated safe zone
      } else {
        const scaleW = w / virtualW;
        const scaleH = h / virtualH;
        const s = Math.min(scaleW, scaleH);
        setScale(s);
      }
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

    // Initialize Engine with selected map and dynamic dimensions
    const engine = new GameEngine(canvasRef.current, selectedMap.waypoints, dimensions.width, dimensions.height, (newState) => {
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
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;
    // Prevent default to avoid scrolling on touch
    e.preventDefault();
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    engineRef.current.updateMouse(new Vector2(x, y));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current) return;

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

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
        className={`relative shadow-2xl rounded-xl overflow-hidden border border-gray-800 origin-center bg-slate-950 transition-all duration-300`}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          // Safe Area Layout - Strict Positioning
          ...(isPortrait ? {
            position: 'absolute',
            top: '70px',
            left: '0',
            marginTop: '0',
            marginRight: '0',
            transform: 'none', // Disable scaling, use direct pixel dimensions
            border: 'none',
            borderRadius: '0',
          } : {
            // Desktop/Landscape Mobile: Keep centered + scaled
            transform: `scale(${scale})`,
          })
        }}
      >
        <canvas
          width={dimensions.width}
          height={dimensions.height}
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
          isPortrait={isPortrait}
        />
      </div>
    </div>
  );
}

export default App;
