export interface MapTheme {
  name: string;
  bgTop: string;
  bgBottom: string;
  grid: string;
  road: string; // road body
  edge: string; // neon edge line
  glow: string; // outer glow
  flow: string; // chevrons / center dash
  decor: string; // props color
  prop: 'HEX' | 'DOT' | 'CRYSTAL' | 'RING' | 'BAR';
}

export const THEMES: Record<string, MapTheme> = {
  GRID: {
    name: 'Neon Grid', bgTop: '#0b1530', bgBottom: '#0f172a', grid: 'rgba(56,189,248,0.07)',
    road: '#0c1a3a', edge: '#38bdf8', glow: 'rgba(56,189,248,0.22)', flow: 'rgba(125,211,252,0.55)',
    decor: 'rgba(56,189,248,0.10)', prop: 'BAR'
  },
  FOUNDRY: {
    name: 'Foundry', bgTop: '#2a0f0a', bgBottom: '#160a08', grid: 'rgba(251,146,60,0.07)',
    road: '#2b120c', edge: '#fb923c', glow: 'rgba(249,115,22,0.22)', flow: 'rgba(253,186,116,0.55)',
    decor: 'rgba(251,146,60,0.10)', prop: 'HEX'
  },
  CRYO: {
    name: 'Cryo Array', bgTop: '#0b2230', bgBottom: '#081521', grid: 'rgba(165,243,252,0.07)',
    road: '#0d2d3d', edge: '#a5f3fc', glow: 'rgba(103,232,249,0.22)', flow: 'rgba(207,250,254,0.6)',
    decor: 'rgba(165,243,252,0.12)', prop: 'CRYSTAL'
  },
  REACTOR: {
    name: 'Toxic Reactor', bgTop: '#082a14', bgBottom: '#06170d', grid: 'rgba(74,222,128,0.07)',
    road: '#0a2a15', edge: '#4ade80', glow: 'rgba(74,222,128,0.22)', flow: 'rgba(187,247,208,0.55)',
    decor: 'rgba(74,222,128,0.10)', prop: 'RING'
  },
  VOID: {
    name: 'Void Nexus', bgTop: '#1b0b3a', bgBottom: '#0c0620', grid: 'rgba(192,132,252,0.08)',
    road: '#220f4a', edge: '#c084fc', glow: 'rgba(168,85,247,0.25)', flow: 'rgba(233,213,255,0.55)',
    decor: 'rgba(192,132,252,0.12)', prop: 'DOT'
  }
};
