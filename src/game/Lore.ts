import { type TowerType } from './Constants';
import { type EnemyType } from '../types';

export interface Lore { callsign: string; role: string; blurb: string }

export const TOWER_LORE: Record<TowerType, Lore> = {
  BASIC: { callsign: 'Pip', role: 'Soldado', blurb: 'Confiável e barato. A base de qualquer defesa.' },
  SNIPER: { callsign: 'Hawk', role: 'Franco-atirador', blurb: 'Alcance enorme, enxerga camuflados.' },
  RAPID: { callsign: 'Rattler', role: 'Metralhadora', blurb: 'Rajadas curtas e furiosas.' },
  FROST: { callsign: 'Glacia', role: 'Controle', blurb: 'Congela tudo ao redor e revela camuflados.' },
  SPLASH: { callsign: 'Boom', role: 'Artilharia', blurb: 'Explosões em área contra multidões.' },
  LASER: { callsign: 'Prism', role: 'Queimador', blurb: 'Feixe contínuo que incendeia alvos.' },
  TESLA: { callsign: 'Volt', role: 'Raios', blurb: 'Descargas que saltam entre inimigos.' },
  TACK: { callsign: 'Spike', role: 'Defesa próxima', blurb: 'Dispara 8 espinhos em círculo.' },
  BEACON: { callsign: 'Lumen', role: 'Suporte', blurb: 'Acelera e amplia torres vizinhas.' },
  FARM: { callsign: 'Mint', role: 'Economia', blurb: 'Gera dinheiro a cada ciclo.' },
  PLASMA: { callsign: 'Nova', role: 'Lendária', blurb: 'Poder bruto de energia perfurante.' }
};

export const ENEMY_LORE: Record<EnemyType, Lore> = {
  NORMAL: { callsign: 'Drone', role: 'Infantaria', blurb: 'Fraco, mas vem em massa.' },
  FAST: { callsign: 'Glitch', role: 'Velocista camuflado', blurb: 'Rápido e invisível sem detecção.' },
  SWARM: { callsign: 'Mite', role: 'Enxame', blurb: 'Minúsculos e velozes.' },
  ARMORED: { callsign: 'Shell', role: 'Blindado', blurb: 'Resiste a dano físico.' },
  TANK: { callsign: 'Bulwark', role: 'Tanque', blurb: 'Se regenera e libera blindados ao morrer.' },
  BOSS: { callsign: 'Overlord', role: 'Chefe', blurb: 'Escudo de energia e uma ninhada ao cair.' }
};
