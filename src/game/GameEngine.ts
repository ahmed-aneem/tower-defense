import { Enemy } from './Enemy';
import { Tower } from './Tower';
import { Projectile } from './Projectile';
import { Particle } from './Particle';
import { ObjectPool } from './ObjectPool';
import { QuadTree } from './QuadTree';
import { Vector2 } from './Vector';
import { GAME_WIDTH, GAME_HEIGHT, TOWERS, type TowerType, DamageType, DefenseType, ENEMIES } from './Constants';
import { type EnemyType } from '../types';
import { soundManager } from './SoundManager';
import { type Mod, MODS } from './Mods';

export interface GameState {
  money: number;
  lives: number;
  wave: number;
  isGameOver: boolean;
  gameStarted: boolean; // Has the user clicked "Start Game"?
  waveActive: boolean; // Are enemies spawning/alive?
  isPaused: boolean;
  activeMods: Mod[];
  choosingMod: boolean;
  modOptions: Mod[];
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  enemies: Enemy[] = [];
  towers: Tower[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];

  projectilePool: ObjectPool<Projectile>;
  particlePool: ObjectPool<Particle>;
  quadTree: QuadTree;

  state: GameState = {
    money: 300,
    lives: 20,
    wave: 1,
    isGameOver: false,
    gameStarted: false,
    waveActive: false,
    isPaused: false,
    activeMods: [],
    choosingMod: false,
    modOptions: []
  };

  path: Vector2[];
  modOptions: Mod[] = [];
  isRunning: boolean = true;
  placementMode: TowerType | null = null;
  mousePosition: Vector2 = new Vector2(0, 0);

  private lastModWave: number = 0;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly TIMESTEP: number = 1000 / 60; // 60 FPS Logic
  private spawnTimer: number = 0;
  private enemiesToSpawn: EnemyType[] = [];
  private onStateChange: (state: GameState) => void;

  // Screen shake
  private shakeIntensity: number = 0;

  constructor(canvas: HTMLCanvasElement, mapPath: Vector2[], onStateChange: (state: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;
    this.path = mapPath;

    // Init Pools
    this.projectilePool = new ObjectPool<Projectile>(
        () => new Projectile(new Vector2(0,0), new Vector2(0,0), 0, ''),
        (p, start, target, dmg, col, type, pierce, splash, rad, effect) => p.reset(start, target, dmg, col, type, pierce, splash, rad, effect)
    );

    this.particlePool = new ObjectPool<Particle>(
        () => new Particle(new Vector2(0,0), ''),
        (p, pos, col, speed, size, txt, shape, gravity) => p.reset(pos, col, speed, size, txt, shape, gravity)
    );

    // Init QuadTree
    this.quadTree = new QuadTree({ x: 0, y: 0, w: GAME_WIDTH, h: GAME_HEIGHT }, 4);

    // Set canvas size
    this.updateCanvasSize();

    // Listen for resize
    window.addEventListener('resize', this.handleResize);

    // Start loop
    requestAnimationFrame((t) => this.loop(t));
  }

  private handleResize = () => {
    this.updateCanvasSize();
  };

  destroy() {
    this.isRunning = false;
    window.removeEventListener('resize', this.handleResize);
  }

  private updateCanvasSize() {
      this.canvas.width = GAME_WIDTH;
      this.canvas.height = GAME_HEIGHT;
  }

  startGame() {
    this.state.gameStarted = true;
    this.startWave();
    this.notifyState();
  }

  togglePause() {
    this.state.isPaused = !this.state.isPaused;
    this.notifyState();
  }

  startWave() {
    // Check for Mod Selection every 5 waves (Wave 6, 11, 16...) meaning we just finished 5, 10, 15
    if (this.state.wave > 1 && (this.state.wave - 1) % 5 === 0 && !this.state.choosingMod && this.lastModWave !== this.state.wave) {
        this.triggerModSelection();
        return;
    }

    this.state.waveActive = true;
    this.enemiesToSpawn = this.generateWave(this.state.wave);
    this.spawnTimer = 0;
    this.notifyState();
  }

  triggerModSelection() {
      // Pick 3 random mods not already active (duplicates allowed? maybe not for some)
      // Let's allow duplicates for stats, but maybe filter unique ones if needed.
      // For now, random 3.
      const shuffled = [...MODS].sort(() => 0.5 - Math.random());
      this.modOptions = shuffled.slice(0, 3);
      this.state.modOptions = this.modOptions; // Sync to state
      this.state.choosingMod = true;
      this.notifyState();
  }

  selectMod(mod: Mod) {
      this.state.activeMods.push(mod);
      this.state.choosingMod = false;
      this.lastModWave = this.state.wave;

      // Apply immediate effects
      if (mod.id === 'RANGE_BOOST') {
          this.towers.forEach(t => t.range = Math.ceil(t.range * 1.15));
      }
      if (mod.id === 'DAMAGE_BOOST') {
          this.towers.forEach(t => t.damage = Math.ceil(t.damage * 1.15));
      }

      this.notifyState();

      // Resume start wave logic
      this.startWave();
  }

  generateWave(waveNum: number): EnemyType[] {
    const enemies: EnemyType[] = [];
    const count = 5 + Math.floor(waveNum * 1.5);

    // Apply complexity
    for (let i = 0; i < count; i++) {
        if (waveNum % 10 === 0 && i === 0) {
            enemies.push('BOSS');
        } else if (waveNum % 5 === 0 && i < waveNum / 3) {
             enemies.push('TANK');
             enemies.push('ARMORED');
        } else if (waveNum > 3 && i % 4 === 0) {
            enemies.push('SWARM');
            enemies.push('SWARM');
            enemies.push('SWARM');
        } else if (waveNum > 2 && i % 3 === 0) {
            enemies.push('FAST');
        } else {
            enemies.push('NORMAL');
        }
    }
    return enemies;
  }

  hasMod(id: string): boolean {
      return this.state.activeMods.some(m => m.id === id);
  }

  placeTower(pos: Vector2, type: TowerType): boolean {
    let cost: number = TOWERS[type].cost;
    // Apply Discount Mod
    if (this.hasMod('DISCOUNT')) {
        cost = Math.floor(cost * 0.9);
    }

    if (this.state.money >= cost) {
      // Check collision with other towers
      for (const t of this.towers) {
        if (pos.distanceTo(t.position) < 40) return false;
      }

      // Check collision with path
      for (let i=0; i<this.path.length-1; i++) {
           const p1 = this.path[i];
           const p2 = this.path[i+1];
           const dist = this.pointToSegmentDistance(pos, p1, p2);
           if (dist < 30) return false;
      }

      this.state.money -= cost;
      const newTower = new Tower(pos, type);

      // Apply active stat mods to new tower
      if (this.hasMod('RANGE_BOOST')) {
          const count = this.state.activeMods.filter(m => m.id === 'RANGE_BOOST').length;
          newTower.range = Math.ceil(newTower.range * Math.pow(1.15, count));
      }
      if (this.hasMod('DAMAGE_BOOST')) {
          const count = this.state.activeMods.filter(m => m.id === 'DAMAGE_BOOST').length;
          newTower.damage = Math.ceil(newTower.damage * Math.pow(1.15, count));
      }

      this.towers.push(newTower);

      // Visual feedback
      this.createExplosion(pos, TOWERS[type].color, 10, 2);

      this.notifyState();
      return true;
    }
    return false;
  }

  sellTower(tower: Tower) {
      let cost: number = TOWERS[tower.type].cost;
       // Discount mod means we spent less, so we should probably refund based on spent?
       // But simplified: refund 50% of base cost.
       // If we want to be nice, 50% of current cost.
      if (this.hasMod('DISCOUNT')) cost = Math.floor(cost * 0.9);

      this.state.money += Math.floor(cost * 0.5);
      this.createExplosion(tower.position, '#F87171', 8, 1.5);
      this.towers = this.towers.filter(t => t.id !== tower.id);
      this.notifyState();
  }

  upgradeTower(tower: Tower) {
      let cost = tower.upgradeCost;
      if (this.hasMod('DISCOUNT')) {
          cost = Math.floor(cost * 0.9);
      }

      if (this.state.money >= cost && tower.level < 3) {
          this.state.money -= cost;
          tower.upgrade();

          // Apply mods again?
          // upgrade() sets stats based on base. We need to re-apply multipliers.
          // Tower.upgrade logic: sets damage = damage * 1.5.
          // Since we already buffed damage in constructor, upgrade multiplies that buffed damage.
          // Correct.

          this.createFloatingText(tower.position, "LEVEL UP!", "#FCD34D");
          this.createExplosion(tower.position, "#FCD34D", 10, 1.5);
          soundManager.playShoot('BASIC');
          this.notifyState();
      }
  }

  activateAbility(name: string) {
      if (name === 'ORBITAL_STRIKE') {
          const COST = 500;
          if (this.state.money >= COST) {
              this.state.money -= COST;

              this.enemies.forEach(e => {
                  e.takeDamage(500);
                  this.createExplosion(e.position, '#FFF', 5, 1);
              });

              for(let i=0; i<20; i++) {
                  this.particles.push(this.particlePool.get(
                      new Vector2(Math.random() * this.canvas.width, Math.random() * this.canvas.height),
                      '#FFF',
                      5,
                      5
                  ));
              }

              this.createFloatingText(new Vector2(this.canvas.width/2, this.canvas.height/2), "ORBITAL STRIKE", "#FFF");
              this.shakeIntensity = 20;
              soundManager.playExplosion();

              this.notifyState();
          }
      }
  }

  getTowerAt(pos: Vector2): Tower | null {
      for (const t of this.towers) {
          if (pos.distanceTo(t.position) < 20) return t;
      }
      return null;
  }

  private pointToSegmentDistance(p: Vector2, v: Vector2, w: Vector2): number {
    const l2 = v.distanceTo(w) * v.distanceTo(w);
    if (l2 == 0) return p.distanceTo(v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projection = new Vector2(
        v.x + t * (w.x - v.x),
        v.y + t * (w.y - v.y)
    );
    return p.distanceTo(projection);
  }

  private loop(timestamp: number) {
    if (!this.isRunning) return;

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Cap deltaTime to avoid spiral of death on lag spikes (e.g. background tab)
    const cappedDelta = Math.min(deltaTime, 100);

    if (this.state.gameStarted && !this.state.isGameOver && !this.state.isPaused && !this.state.choosingMod) {
        this.accumulator += cappedDelta;
        while (this.accumulator >= this.TIMESTEP) {
            this.update();
            this.accumulator -= this.TIMESTEP;
        }
    } else {
        // Reset accumulator if paused to avoid fast-forward
        this.accumulator = 0;
    }

    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  private update() {
    // Spawning
    if (this.state.waveActive) {
      if (this.enemiesToSpawn.length > 0) {
        this.spawnTimer++;
        if (this.spawnTimer > 60) {
          const type = this.enemiesToSpawn.shift()!;
          // Pass path to enemy
          const enemy = new Enemy(type);
          enemy.setPath(this.path); // Enemy needs to know path!
          this.enemies.push(enemy);
          this.spawnTimer = 0;
        }
      } else if (this.enemies.length === 0) {
        // Wave complete
        this.state.waveActive = false;

        // Apply End of Wave Mods
        this.applyEndOfWaveMods();

        this.state.wave++;
        this.notifyState();
      }
    }

    // Update Enemies
    this.enemies.forEach(e => e.update());

    // Check lives and removal
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].reachedEnd) {
        this.state.lives--;
        this.createFloatingText(this.enemies[i].position, "-1 HP", "#F43F5E");
        this.shakeIntensity = 10;
        soundManager.playHit();
        this.enemies.splice(i, 1);
        this.notifyState();
        if (this.state.lives <= 0) {
          this.state.isGameOver = true;
          soundManager.playGameOver();
          this.notifyState();
        }
      }
    }

    // Update Towers
    this.towers.forEach(t => {
      const target = t.update(this.enemies);

      if (target) {
          if (t.type === 'LASER') {
              if (Math.random() < 0.1) soundManager.playShoot(t.type);
          } else {
            const isSplash = t.type === 'SPLASH';
            const splashRadius = isSplash ? 60 : 0;

            // Check Critical Hit Mod
            let damage = t.damage;
            let color = t.color;
            if (this.hasMod('CRITICAL_HIT') && Math.random() < 0.1) {
                damage *= 2;
                color = '#FFF'; // White flash for crit
            }

            const effect = t.statusEffect ? { ...t.statusEffect, sourceId: t.id } : undefined;
            this.projectiles.push(this.projectilePool.get(t.position, target.position, damage, color, t.damageType, t.pierce, isSplash, splashRadius, effect));
            soundManager.playShoot(t.type);
            this.createExplosion(t.position, t.color, 3, 0.5);
          }
      }
    });

    // Update Projectiles
    this.projectiles.forEach(p => p.update());

    // Rebuild QuadTree
    this.quadTree = new QuadTree({ x: 0, y: 0, w: GAME_WIDTH, h: GAME_HEIGHT }, 4);
    this.enemies.forEach(e => {
        if (!e.isDead && !e.reachedEnd) {
            this.quadTree.insert(e);
        }
    });

    // Collision Detection (Projectile vs Enemy)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.active) {
        this.projectiles.splice(i, 1);
        this.projectilePool.release(p);
        continue;
      }

      // Query QuadTree for potential collisions
      // For direct hits, we check a small radius. For splash, we might still check direct hit first or just explode?
      // Existing logic: "Projectile travels, hits FIRST enemy it touches".
      // So we search for candidates near projectile.
      const searchRadius = 30; // Max enemy radius + buffer
      const candidates = this.quadTree.queryCircle(p.position, searchRadius);

      for (const item of candidates) {
        const e = item as Enemy;
        if (e.isDead || p.hitList.has(e.id)) continue;

        if (p.position.distanceTo(e.position) < e.radius + 5) { // 5 is projectile size buffer
            p.hitList.add(e.id);
            const finalDamage = this.calculateDamage(p.damage, p.damageType, e.defenseType);

            if (p.isSplash) {
                // For splash, we query again for the splash radius
                const splashCandidates = this.quadTree.queryCircle(p.position, p.splashRadius);
                splashCandidates.forEach(splashItem => {
                    const nearby = splashItem as Enemy;
                    if (nearby.isDead) return;
                    // Exact circle check
                    if (nearby.position.distanceTo(p.position) <= p.splashRadius + nearby.radius) {
                         const splashDmg = this.calculateDamage(p.damage, p.damageType, nearby.defenseType);
                         nearby.takeDamage(splashDmg);
                         if (p.statusEffect) nearby.applyEffect(p.statusEffect);
                         if (splashDmg <= 0) this.createFloatingText(nearby.position, "IMMUNE", "#fff");
                    }
                });
                this.createExplosion(p.position, p.color, 20, 1.5);
                soundManager.playExplosion();
                p.active = false;
            } else {
                e.takeDamage(finalDamage);
                if (p.statusEffect) e.applyEffect(p.statusEffect);

                if (finalDamage <= 0) {
                    this.createFloatingText(e.position, "IMMUNE", "#fff");
                } else {
                    this.createExplosion(p.position, p.color, 5, 0.5);
                }

                p.pierce--;
                if (p.pierce <= 0) {
                    p.active = false;
                }
            }

            if (!p.active) break;
        }
      }

      if (!p.active) {
          this.projectiles.splice(i, 1);
          this.projectilePool.release(p);
      }
    }

    // Cleanup Dead Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].isDead) {
        let reward = this.enemies[i].reward;

        // Bounty Hunter Mod
        if (this.hasMod('BOUNTY_HUNTER')) {
            reward += 5;
        }

        this.state.money += reward;
        this.createFloatingText(this.enemies[i].position, `+$${reward}`, '#FCD34D');
        this.createExplosion(this.enemies[i].position, '#FFF', 15, 1.5);
        soundManager.playExplosion();
        this.shakeIntensity = Math.min(this.shakeIntensity + 2, 10);

        // Explosive Death Mod
        if (this.hasMod('EXPLOSIVE_DEATH') && Math.random() < 0.2) {
             this.createExplosion(this.enemies[i].position, '#f59e0b', 10, 2);
             this.enemies.forEach(nearby => {
                 if (!nearby.isDead && nearby.id !== this.enemies[i].id && nearby.position.distanceTo(this.enemies[i].position) < 50) {
                     nearby.takeDamage(nearby.maxHp * 0.1);
                 }
             });
        }

        // Spawn Children (Layered Spawning)
        const enemyConfig = ENEMIES[this.enemies[i].type];
        if (enemyConfig.children && enemyConfig.children.length > 0) {
             enemyConfig.children.forEach(childType => {
                 const child = new Enemy(childType, this.enemies[i].position, this.enemies[i].waypointIndex);
                 child.setPath(this.path);
                 this.enemies.push(child);
             });
        }

        this.enemies.splice(i, 1);
        this.notifyState();
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) {
          this.particles.splice(i, 1);
          this.particlePool.release(p);
      }
    }

    // Decay shake
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.9;
      if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
    }
  }

  private applyEndOfWaveMods() {
      if (this.hasMod('LIFE_REGEN')) {
          this.state.lives += 2;
          this.createFloatingText(new Vector2(GAME_WIDTH/2, GAME_HEIGHT/2), "REPAIRED +2 HP", "#F43F5E");
      }
      if (this.hasMod('INTEREST')) {
          const interest = Math.min(500, Math.floor(this.state.money * 0.1));
          if (interest > 0) {
              this.state.money += interest;
              this.createFloatingText(new Vector2(GAME_WIDTH/2, GAME_HEIGHT/2 + 30), `INTEREST +$${interest}`, "#FCD34D");
          }
      }
  }

  private createExplosion(pos: Vector2, color: string, count: number, scale: number = 1) {
    for (let i = 0; i < count; i++) {
      const shape = Math.random() > 0.5 ? 'SQUARE' : 'CIRCLE';
      // Occasional star for big explosions
      const finalShape = (scale > 1.5 && Math.random() > 0.7) ? 'STAR' : shape;

      // Gravity only for non-circle (debris)
      const gravity = finalShape === 'CIRCLE' ? 0 : 0.3;

      this.particles.push(this.particlePool.get(pos, color, scale, scale, undefined, finalShape, gravity));
    }
  }

  private createFloatingText(pos: Vector2, text: string, color: string) {
      this.particles.push(this.particlePool.get(pos, color, 1, 1, text));
  }

  private calculateDamage(amount: number, type: DamageType, defense: DefenseType): number {
      if (defense === DefenseType.HEAVY) {
          if (type === DamageType.PHYSICAL) return Math.floor(amount * 0.5);
          if (type === DamageType.EXPLOSIVE) return Math.floor(amount * 1.5);
      } else if (defense === DefenseType.SHIELDED) {
          if (type === DamageType.PHYSICAL) return amount;
          if (type === DamageType.EXPLOSIVE) return Math.floor(amount * 0.5);
          if (type === DamageType.ENERGY) return Math.floor(amount * 1.5);
      }
      return amount;
  }

  private draw() {
    this.ctx.save();

    if (this.shakeIntensity > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity;
      const dy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(dx, dy);
    }

    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();

    // Draw Path with Glow
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#3b82f6';
    this.ctx.beginPath();
    this.ctx.moveTo(this.path[0].x, this.path[0].y);
    for (let i = 1; i < this.path.length; i++) {
      this.ctx.lineTo(this.path[i].x, this.path[i].y);
    }
    this.ctx.lineWidth = 20;
    this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#60a5fa';
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;

    this.towers.forEach(t => {
        t.draw(this.ctx);
        if (t.type === 'LASER' && t.targetId) {
            const target = this.enemies.find(e => e.id === t.targetId);
            if (target && !target.isDead) {
                this.ctx.beginPath();
                this.ctx.moveTo(t.position.x, t.position.y);
                this.ctx.lineTo(target.position.x, target.position.y);
                this.ctx.lineWidth = 4;
                this.ctx.strokeStyle = t.color;
                this.ctx.lineCap = 'round';
                this.ctx.stroke();

                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = '#fff';
                this.ctx.stroke();

                this.createExplosion(target.position, t.color, 1, 0.5);
            }
        }
    });
    this.enemies.forEach(e => e.draw(this.ctx));

    this.ctx.shadowBlur = 10;
    this.projectiles.forEach(p => {
        this.ctx.shadowColor = p.color;
        p.draw(this.ctx)
    });
    this.ctx.shadowBlur = 0;

    this.particles.forEach(p => p.draw(this.ctx));

    // Draw Placement Ghost
    if (this.placementMode) {
        const tConf = TOWERS[this.placementMode];
        this.ctx.save();
        this.ctx.translate(this.mousePosition.x, this.mousePosition.y);

        // Range
        this.ctx.beginPath();
        this.ctx.arc(0, 0, tConf.range, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();

        // Body
        this.ctx.fillStyle = tConf.color;
        this.ctx.beginPath();
        if (this.placementMode === 'SPLASH') {
            this.ctx.rect(-10, -10, 20, 20);
        } else {
            this.ctx.arc(0, 0, 10, 0, Math.PI*2);
        }
        this.ctx.fill();

        this.ctx.restore();
    }

    this.ctx.restore();
  }

  private drawGrid() {
      this.ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
      this.ctx.lineWidth = 1;

      const cellSize = 40;
      for (let x = 0; x <= this.canvas.width; x += cellSize) {
          this.ctx.beginPath();
          this.ctx.moveTo(x, 0);
          this.ctx.lineTo(x, this.canvas.height);
          this.ctx.stroke();
      }

      for (let y = 0; y <= this.canvas.height; y += cellSize) {
          this.ctx.beginPath();
          this.ctx.moveTo(0, y);
          this.ctx.lineTo(this.canvas.width, y);
          this.ctx.stroke();
      }
  }

  private notifyState() {
      this.onStateChange({ ...this.state });
  }

  handleClick(x: number, y: number): Tower | null {
      const clickPos = new Vector2(x, y);
      const existingTower = this.getTowerAt(clickPos);
      if (existingTower) return existingTower;
      return null;
  }

  setPlacementMode(type: TowerType | null) {
      this.placementMode = type;
  }

  updateMouse(pos: Vector2) {
      this.mousePosition = pos;
  }

  confirmPlacement(): boolean {
      if (this.placementMode) {
          if (this.placeTower(this.mousePosition, this.placementMode)) {
              this.placementMode = null;
              return true;
          }
      }
      return false;
  }

  cancelPlacement() {
      this.placementMode = null;
  }
}
