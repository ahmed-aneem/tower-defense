import React, { useState } from 'react';
import { RotateCw, Trophy } from 'lucide-react';
import { getBestWave, recordWave } from '../../game/Records';

interface Props {
  mapId: string;
  mapName: string;
  waveReached: number;
}

export const GameOver: React.FC<Props> = ({ mapId, mapName, waveReached }) => {
  const [best] = useState(() => getBestWave(mapId));
  const [isRecord] = useState(() => recordWave(mapId, waveReached));

  return (
    <div className="absolute inset-0 bg-red-950/90 flex items-center justify-center z-50 pointer-events-auto backdrop-blur-md p-4">
      <div className="bg-slate-900 p-8 rounded-3xl border-2 border-red-500/50 text-center max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)]">
        <h2 className="text-4xl sm:text-5xl font-black text-red-500 tracking-tighter">NÚCLEO PERDIDO</h2>
        <div className="text-slate-400 text-xs uppercase tracking-widest mt-2">{mapName}</div>
        <div className="h-1 w-20 bg-red-500 mx-auto my-5 rounded-full" />
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/70 rounded-xl py-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Onda alcançada</div>
            <div className="text-3xl font-bold text-white">{waveReached}</div>
          </div>
          <div className="bg-slate-800/70 rounded-xl py-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Recorde</div>
            <div className="text-3xl font-bold text-amber-300">{Math.max(best, waveReached)}</div>
          </div>
        </div>
        {isRecord && (
          <div className="flex items-center justify-center gap-2 text-amber-300 font-bold mb-5 animate-pulse">
            <Trophy size={18} /> NOVO RECORDE!
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-slate-800 lg:hover:bg-slate-700 text-white text-lg font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors border border-slate-600"
        >
          <RotateCw size={22} /> TENTAR DE NOVO
        </button>
      </div>
    </div>
  );
};
