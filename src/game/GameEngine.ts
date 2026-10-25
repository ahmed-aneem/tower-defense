import { MODS, Mod, drawModOptions, applyStatMods } from './Mods';
import { Tower, TowerType, TOWER_CONFIGS } from './Towers';
import { Enemy } from './Enemies';

export class GameEngine {
  // ... existing fields ...
  public activeMods: Mod[] = [];
  public modOptions: Mod[] = [];
  public towers: Tower[] = [];
  public baseTowerStats: Map<string, { range: number; damage: number; attackSpeed: number }> = new Map();

  public triggerModSelection() {
    this.modOptions = drawModOptions(MODS, this.activeMods);
  }

  public selectMod(mod: Mod) {
    this.activeMods.push(mod);
    this.modOptions = [];

    const rangeCount = this.activeMods.filter((m) => m.id === 'RANGE_BOOST').length;
    const damageCount = this.activeMods.filter((m) => m.id === 'DAMAGE_BOOST').length;
    const speedCount = this.activeMods.filter((m) => m.id === 'ATTACK_SPEED').length;

    for (const tower of this.towers) {
      const base = this.baseTowerStats.get(tower.id);
      if (base) {
        tower.range = applyStatMods(base.range, rangeCount);
        tower.damage = applyStatMods(base.damage, damageCount);
        tower.attackSpeed = applyStatMods(base.attackSpeed, speedCount);
      }
    }
  }

  public placeTower(type: TowerType, x: number, y: number): Tower {
    const config = TOWER_CONFIGS[type];
    const id = 'tower_' + Math.random();
    
    const rangeCount = this.activeMods.filter((m) => m.id === 'RANGE_BOOST').length;
    const damageCount = this.activeMods.filter((m) => m.id === 'DAMAGE_BOOST').length;
    const speedCount = this.activeMods.filter((m) => m.id === 'ATTACK_SPEED').length;

    const tower: Tower = {
      id,
      type,
      x,
      y,
      range: applyStatMods(config.range, rangeCount),
      damage: applyStatMods(config.damage, damageCount),
      attackSpeed: applyStatMods(config.attackSpeed, speedCount),
      level: 1,
      cost: config.cost,
    };

    this.baseTowerStats.set(id, {
      range: config.range,
      damage: config.damage,
      attackSpeed: config.attackSpeed,
    });

    this.towers.push(tower);
    return tower;
  }
}
