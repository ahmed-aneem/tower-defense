import React, { useEffect, useState } from 'react';
import { Skull } from 'lucide-react';
import { type GameEngine } from '../../game/GameEngine';

interface Props {
  wave: number;
  active: boolean;
  engine: React.MutableRefObject<GameEngine | null> | null;
}

/** Cinematic banner that sweeps across the screen when a wave starts. */
export const WaveBanner: React.FC<Props> = ({ wave, active, engine }) => {
  const [dismissed, setDismissed] = useState(0);

  useEffect(() => {
    if (!active || wave < 1) return;
    const t = setTimeout(() => setDismissed(wave), 2200);
    return () => clearTimeout(t);
  }, [wave, active]);

  if (!active || wave < 1 || dismissed === wave) return null;
  const shown = wave;
  const boss = (engine?.current?.waveManager.preview(shown).BOSS ?? 0) > 0;

  return (
    <div key={shown} className="absolute inset-x-0 top-1/3 flex justify-center pointer-events-none z-30 wave-banner">
      <div className={`px-10 py-3 skew-x-[-12deg] border-y-2 backdrop-blur-sm ${boss ? 'bg-rose-950/70 border-rose-500' : 'bg-slate-950/60 border-cyan-400'}`}>
        <div className="skew-x-[12deg] text-center">
          <div className={`text-3xl sm:text-4xl font-black tracking-[0.25em] ${boss ? 'text-rose-300' : 'text-white'}`}>
            ONDA {shown}
          </div>
          {boss && (
            <div className="flex items-center justify-center gap-2 text-rose-400 text-xs font-bold tracking-widest mt-1">
              <Skull size={14} /> OVERLORD DETECTADO
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
