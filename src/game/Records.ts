const key = (mapId: string) => `neon-defense:best:${mapId}`;

export const getBestWave = (mapId: string): number => {
  try { return Number(localStorage.getItem(key(mapId))) || 0; } catch { return 0; }
};

/** Stores the wave if it beats the record; returns true on a new record. */
export const recordWave = (mapId: string, wave: number): boolean => {
  if (wave <= getBestWave(mapId)) return false;
  try { localStorage.setItem(key(mapId), String(wave)); } catch { /* ignore */ }
  return true;
};
