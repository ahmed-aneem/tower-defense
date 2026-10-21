import React, { useState } from 'react';
import { Play, Star } from 'lucide-react';
import { MAPS, type MapConfig } from '../game/Maps';
import { THEMES } from '../game/MapThemes';
import { SKINS, getSkin, setSkin } from '../game/Skins';
import { TOWERS, type TowerType } from '../game/Constants';
import { TOWER_LORE, ENEMY_LORE } from '../game/Lore';
import { SpriteCanvas } from './hud/SpriteCanvas';
import { type EnemyType } from '../types';

interface Props {
  selectedMap: MapConfig;
  onSelectMap: (map: MapConfig) => void;
  onStart: () => void;
}

const MapThumb: React.FC<{ map: MapConfig; active: boolean; onClick: () => void }> = ({ map, active, onClick }) => {
  const t = THEMES[map.theme];
  const pts = map.waypoints.map(p => `${p.x * 100},${p.y * 60}`).join(' ');
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-1.5 text-left transition-all flex-shrink-0 w-[108px] ${active ? 'ring-2 scale-[1.03]' : 'opacity-70 lg:hover:opacity-100'}`}
      style={{ borderColor: active ? t.edge : '#334155', background: t.bgBottom, boxShadow: active ? `0 0 14px ${t.glow}` : undefined }}
    >
      <svg viewBox="-4 -4 108 68" className="w-full h-12 rounded" style={{ background: t.bgTop }}>
        <polyline points={pts} fill="none" stroke={t.glow} strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={pts} fill="none" stroke={t.edge} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="text-[11px] font-bold text-white mt-1 truncate">{map.name.replace('The ', '')}</div>
      <div className="flex gap-0.5">
        {[1, 2, 3].map(n => (
          <Star key={n} size={9} className={n <= map.difficulty ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
        ))}
      </div>
    </button>
  );
};

export const StartMenu: React.FC<Props> = ({ selectedMap, onSelectMap, onStart }) => {
  const [skinId, setSkinId] = useState(getSkin().id);
  const skin = SKINS.find(s => s.id === skinId) ?? SKINS[0];

  return (
    <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center z-50 pointer-events-auto backdrop-blur-sm">
      <div className="bg-slate-900 p-5 sm:p-8 rounded-3xl border border-slate-700/50 text-center max-w-2xl shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden w-full mx-3 max-h-full overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(90deg, ${THEMES[selectedMap.theme].edge}, ${skin.accent})` }} />

        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 tracking-tight">
          NEON DEFENSE
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 mb-5">
          Defenda o núcleo. Escolha o setor, escolha o visual, segure as ondas.
        </p>

        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Setor</div>
        <div className="flex gap-2 flex-wrap pb-2 mb-1 justify-center">
          {MAPS.map(m => (
            <MapThumb key={m.id} map={m} active={m.id === selectedMap.id} onClick={() => onSelectMap(m)} />
          ))}
        </div>
        <div className="text-xs text-slate-400 mb-4">{selectedMap.description}</div>

        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Skin</div>
        <div className="flex gap-2 justify-center flex-wrap mb-1">
          {SKINS.map(s => (
            <button
              key={s.id}
              onClick={() => { setSkin(s.id); setSkinId(s.id); }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all ${s.id === skinId ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-400 border-slate-700'}`}
              style={s.id === skinId ? { borderColor: s.accent } : undefined}
            >
              <span className="flex">
                {[s.towers.BASIC ?? '#3B82F6', s.towers.RAPID ?? '#F59E0B', s.towers.SPLASH ?? '#ef4444', s.accent].map((c, i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full -ml-0.5 first:ml-0 border border-slate-900" style={{ background: c }} />
                ))}
              </span>
              {s.name}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 mb-5">{skin.description}</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
          <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/40">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Arsenal</div>
            <div className="flex flex-wrap gap-0.5">
              {(Object.keys(TOWERS) as TowerType[]).map(t => (
                <span key={`${t}-${skinId}`} title={`${TOWER_LORE[t].callsign} — ${TOWER_LORE[t].role}`}>
                  <SpriteCanvas kind="tower" type={t} size={40} animated />
                </span>
              ))}
            </div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/40">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ameaças</div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ENEMY_LORE) as EnemyType[]).map(e => (
                <span key={`${e}-${skinId}`} title={`${ENEMY_LORE[e].callsign} — ${ENEMY_LORE[e].blurb}`}>
                  <SpriteCanvas kind="enemy" type={e} size={40} animated />
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-fuchsia-300/90 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg px-3 py-1.5 mb-5">
          ✦ <b>Ressonância:</b> torres de tipos diferentes próximas se conectam e ganham +8% de velocidade por elo (até 3).
        </div>

        <button
          onClick={onStart}
          className="group relative w-full bg-blue-600 lg:hover:bg-blue-500 text-white text-lg font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] overflow-hidden"
        >
          <Play fill="currentColor" size={22} />
          <span>INICIAR DEFESA</span>
        </button>
      </div>
    </div>
  );
};
