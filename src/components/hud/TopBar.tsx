import React, { useEffect, useRef, useState } from 'react';
import { Heart, Coins, Activity, Volume2, VolumeX, RotateCw, FastForward, Pause, Play, Cpu, Keyboard } from 'lucide-react';
import { type GameState, type GameEngine } from '../../game/GameEngine';
import { soundManager } from '../../game/SoundManager';

interface Props {
  gameState: GameState;
  engine: React.MutableRefObject<GameEngine | null> | null;
  isPortrait: boolean;
}

const Stat: React.FC<{ icon: React.ReactNode; value: React.ReactNode; tone: string; title: string; alert?: boolean }> = ({ icon, value, tone, title, alert }) => (
  <div title={title} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${alert ? 'bg-rose-950/70 border-rose-500/60 animate-pulse' : 'bg-slate-800/60 border-slate-700/40'}`}>
    {icon}
    <span className={`font-bold tabular-nums whitespace-nowrap text-sm sm:text-lg ${tone}`}>{value}</span>
  </div>
);

const TONES = {
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/50'
};

const Btn: React.FC<{ onClick: () => void; title: string; active?: boolean; tone?: keyof typeof TONES; children: React.ReactNode }> = ({ onClick, title, active, tone = 'emerald', children }) => (
  <button
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg border transition-all active:scale-95 ${active
      ? TONES[tone]
      : 'bg-slate-800/60 text-slate-400 border-slate-700/40 lg:hover:text-white lg:hover:bg-slate-700'}`}
  >
    {children}
  </button>
);

const SHORTCUTS: [string, string][] = [['Space', 'Start wave / speed'], ['1-0', 'Select tower'], ['U', 'Upgrade'], ['Backspace', 'Sell'], ['Esc', 'Cancel / pause']];

/** Brief +/- indicator whenever the money value changes. */
function useDelta(value: number) {
  const prev = useRef(value);
  const [delta, setDelta] = useState(0);
  useEffect(() => {
    const d = value - prev.current;
    prev.current = value;
    if (d === 0) return;
    setDelta(d);
    const t = setTimeout(() => setDelta(0), 900);
    return () => clearTimeout(t);
  }, [value]);
  return delta;
}

export const TopBar: React.FC<Props> = ({ gameState, engine, isPortrait }) => {
  const [muted, setMuted] = useState(false);
  const [help, setHelp] = useState(false);
  const delta = useDelta(gameState.money);
  const progress = gameState.waveTotal > 0 ? 1 - gameState.enemiesLeft / gameState.waveTotal : 0;
  const eng = () => engine?.current;
  const nextSpeed = gameState.speed === 1 ? 2 : gameState.speed === 2 ? 4 : 1;
  const iconSize = isPortrait ? 14 : 18;

  return (
    <div className={`pointer-events-auto flex items-center justify-between gap-2 bg-slate-900/85 backdrop-blur-md border border-(--accent)/40 shadow-[0_0_24px_-6px_var(--accent)]
      ${isPortrait ? 'fixed top-0 left-0 w-full z-50 px-2 py-2 border-x-0 border-t-0' : 'self-center w-full max-w-4xl rounded-2xl p-2 relative'}`}>
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <Stat title="Lives" alert={gameState.lives <= 5} tone={gameState.lives <= 5 ? 'text-rose-300' : 'text-white'}
          icon={<Heart size={iconSize} className="text-rose-500" fill="currentColor" />} value={gameState.lives} />
        <Stat title="Money" tone="text-amber-200" icon={<Coins size={iconSize} className="text-amber-400" fill="currentColor" />} value={<>{gameState.money}{delta !== 0 && <span className={`ml-1 text-[10px] ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{delta > 0 ? '+' : ''}{delta}</span>}</>} />
        <Stat title="Wave" tone="text-cyan-200" icon={<Activity size={iconSize} className="text-cyan-400" />} value={<>W{gameState.wave}{gameState.waveActive && !isPortrait && <span className="ml-1.5 text-[10px] font-mono text-slate-400">{gameState.enemiesLeft} left</span>}</>} />
        {gameState.activeMods.length > 0 && (
          <div className="flex items-center gap-1 pl-2 border-l border-slate-700/50">
            {gameState.activeMods.map((mod, i) => (
              <div key={i} title={`${mod.name}: ${mod.description}`} className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center border border-slate-600">
                <Cpu size={13} className={mod.rarity === 'LEGENDARY' ? 'text-amber-400' : mod.rarity === 'RARE' ? 'text-cyan-400' : 'text-slate-400'} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isPortrait && (
          <Btn title="Shortcuts" active={help} tone="amber" onClick={() => setHelp(!help)}>
            <Keyboard size={18} />
          </Btn>
        )}
        <Btn title="Sound" onClick={() => { soundManager.toggleMute(); setMuted(!muted); }}>
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </Btn>
        <Btn title="Auto-start waves" active={gameState.autoStart} tone="purple" onClick={() => eng()?.toggleAutoStart()}>
          <RotateCw size={18} />
        </Btn>
        <Btn title={`Speed ${gameState.speed}x (Space)`} active={gameState.speed > 1} onClick={() => eng()?.setSpeed(nextSpeed)}>
          <span className="absolute -top-1.5 -right-1.5 bg-slate-950 border border-slate-600 text-[9px] font-bold px-1 rounded-full text-white">{gameState.speed}x</span>
          <FastForward size={18} fill={gameState.speed > 1 ? 'currentColor' : 'none'} />
        </Btn>
        <Btn title={gameState.isPaused ? 'Resume (Esc)' : 'Pause (Esc)'} active={gameState.isPaused} tone="amber" onClick={() => eng()?.togglePause()}>
          {gameState.isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} />}
        </Btn>
      </div>
      {gameState.waveActive && (
        <div className="absolute left-3 right-3 -bottom-px h-0.5 bg-slate-700/60 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      {help && !isPortrait && (
        <div className="absolute right-0 top-full mt-2 bg-slate-900/95 border border-slate-700 rounded-xl p-3 text-xs shadow-xl z-50">
          {SHORTCUTS.map(([k, d]) => (
            <div key={k} className="flex items-center gap-3 py-0.5">
              <kbd className="font-mono bg-slate-800 border border-slate-600 rounded px-1.5 text-slate-200 min-w-12 text-center">{k}</kbd>
              <span className="text-slate-400">{d}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
