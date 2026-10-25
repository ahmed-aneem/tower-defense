import React from 'react';
import { Mod } from '../game/Mods';

interface TopBarProps {
  activeMods: Mod[];
  gold: number;
  lives: number;
  wave: number;
}

export const TopBar: React.FC<TopBarProps> = ({ activeMods, gold, lives, wave }) => {
  const modCounts = activeMods.reduce<Record<string, { mod: Mod; count: number }>>((acc, mod) => {
    if (!acc[mod.id]) {
      acc[mod.id] = { mod, count: 0 };
    }
    acc[mod.id].count++;
    return acc;
  }, {});

  return (
    <div className="top-bar flex justify-between p-4 bg-gray-800 text-white">
      <div>Wave: {wave}</div>
      <div>Gold: {gold}</div>
      <div>Lives: {lives}</div>
      <div className="flex gap-2 items-center">
        {Object.values(modCounts).map(({ mod, count }) => (
          <div key={mod.id} className="relative flex items-center bg-gray-700 px-2 py-1 rounded" title={mod.name}>
            <span className="text-lg">{mod.icon}</span>
            {count > 1 && (
              <span className="ml-1 text-xs bg-blue-500 rounded-full px-1.5 py-0.2">
                &times;{count}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
