import { Enemy } from './Enemy';
import { Tower } from './Tower';
import { Projectile } from './Projectile';
import { Particle } from './Particle';
import { ObjectPool } from './ObjectPool';
import { Vector2 } from './Vector';
import { GAME_WIDTH, GAME_HEIGHT, PATH_WAYPOINTS, TOWERS, type TowerType } from './Constants';
import { soundManager } from './SoundManager';
import { WaveManager, type SpawnInstruction } from './WaveManager';
import { DamageSystem } from './DamageSystem';

export interface GameState {
  money: number;
  lives: number;
  wave: number;
  isGameOver: boolean;
  gameStarted: boolean; // Has the user clicked "Start Game"?
  waveActive: boolean; // Are enemies spawning/alive?
  isPaused: boolean;
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
  waveManager: WaveManager;

  // Placement Preview
  previewPos: Vector2 | null = null;
  previewType: TowerType | null = null;

  state: GameState = {
    money: 300,
    lives: 20,
    wave: 1,
    isGameOver: false,
    gameStarted: false,
    waveActive: false,
    isPaused: false
  };

  // private lastTime: number = 0;
  private spawnTimer: number = 0;
  private spawnQueue: SpawnInstruction[] = [];
  private onStateChange: (state: GameState) => void;

  // Screen shake
  private shakeIntensity: number = 0;

  constructor(canvas: HTMLCanvasElement, onStateChange: (state: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;
    this.waveManager = new WaveManager();

    // Init Pools
    this.projectilePool = new ObjectPool<Projectile>(
        () => new Projectile(new Vector2(0,0), new Vector2(0,0), 0, ''),
        (p, start, target, dmg, col, type, pierce, splash, rad) => p.reset(start, target, dmg, col, type, pierce, splash, rad)
    );

    this.particlePool = new ObjectPool<Particle>(
        () => new Particle(new Vector2(0,0), ''),
        (p, pos, col, speed, size, txt) => p.reset(pos, col, speed, size, txt)
    );

    // Set canvas size
    this.updateCanvasSize();

    // Listen for resize
    window.addEventListener('resize', () => {
        this.updateCanvasSize();
    });

    // Start loop
    requestAnimationFrame(this.loop.bind(this));
  }

  private updateCanvasSize() {
      // For a "responsive" canvas that keeps aspect ratio or fits window
      // We will actually keep internal resolution fixed at GAME_WIDTH/GAME_HEIGHT for logic simplicity,
      // but we can scale the canvas CSS or just adopt the window size if we want a truly larger map.
      // Given "mapa maior", we likely want to see more.

      // However, our path is defined in fixed coordinates.
      // So we must stick to the fixed logic size, but ensure it scales via CSS.
      // OR, we update GAME_WIDTH/HEIGHT to match window and scale path.

      // The simplest robust approach for this codebase is:
      // Fixed Logic Resolution (High Res), scaled via CSS to fit screen.

      this.canvas.width = GAME_WIDTH;
      this.canvas.height = GAME_HEIGHT;

      // The CSS will handle the display size (width: 100%; height: 100%; object-fit: contain;)
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
    this.state.waveActive = true;
    this.spawnQueue = this.waveManager.getWave(this.state.wave);
    this.spawnTimer = 0;
    this.notifyState();
  }

  setPreview(pos: Vector2 | null, type: TowerType | null) {
      this.previewPos = pos;
      this.previewType = type;
  }

  canPlaceTower(pos: Vector2): boolean {
      // Check Bounds (keep tower fully inside)
      const margin = 20;
      if (pos.x < margin || pos.x > this.canvas.width - margin || pos.y < margin || pos.y > this.canvas.height - margin) {
          return false;
      }

      // Check collision with other towers
      for (const t of this.towers) {
        if (pos.distanceTo(t.position) < 40) return false;
      }

      // Check collision with path
      for (let i=0; i<PATH_WAYPOINTS.length-1; i++) {
           const p1 = PATH_WAYPOINTS[i];
           const p2 = PATH_WAYPOINTS[i+1];
           const dist = this.pointToSegmentDistance(pos, p1, p2);
           if (dist < 30) return false;
      }
      return true;
  }

  placeTower(pos: Vector2, type: TowerType): boolean {
    const cost = TOWERS[type].cost;
    if (this.state.money >= cost && this.canPlaceTower(pos)) {
      this.state.money -= cost;
      this.towers.push(new Tower(pos, type));

      // Visual feedback
      this.createExplosion(pos, TOWERS[type].color, 10, 2);

      this.notifyState();
      return true;
    }
    return false;
  }

  sellTower(tower: Tower) {
      this.state.money += Math.floor(TOWERS[tower.type].cost * 0.5);
      this.createExplosion(tower.position, '#F87171', 8, 1.5);
      this.towers = this.towers.filter(t => t.id !== tower.id);
      this.notifyState();
  }

  upgradeTower(tower: Tower) {
      const cost = tower.upgradeCost;
      if (this.state.money >= cost && tower.level < 3) {
          this.state.money -= cost;
          tower.upgrade();
          this.createFloatingText(tower.position, "LEVEL UP!", "#FCD34D");
          this.createExplosion(tower.position, "#FCD34D", 10, 1.5);
          soundManager.playShoot('BASIC'); // Generic sound for now
          this.notifyState();
      }
  }

  activateAbility(name: string) {
      if (name === 'ORBITAL_STRIKE') {
          const COST = 500;
          if (this.state.money >= COST) {
              this.state.money -= COST;

              // Effect
              this.enemies.forEach(e => {
                  e.takeDamage(500); // Massive damage
                  this.createExplosion(e.position, '#FFF', 5, 1);
              });

              // Global flash (can simply add many particles or handle in draw)
              // Let's add big particles
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
              soundManager.playExplosion(); // Reuse explosion sound

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

  private loop() {
    // Delta time calculation
    // const deltaTime = (timestamp - this.lastTime) / 1000;
    // this.lastTime = timestamp;

    if (this.state.gameStarted && !this.state.isGameOver && !this.state.isPaused) {
      this.update();
    }
    this.draw();

    requestAnimationFrame(this.loop.bind(this));
  }

  private update() {
    // Spawning
    if (this.state.waveActive) {
      if (this.spawnQueue.length > 0) {
        this.spawnTimer++;
        const nextInterval = this.spawnQueue[0].interval;

        if (this.spawnTimer >= nextInterval) {
          const instruction = this.spawnQueue.shift()!;
          this.enemies.push(new Enemy(instruction.type));
          this.spawnTimer = 0;
        }
      } else if (this.enemies.length === 0) {
        // Wave complete
        this.state.waveActive = false;
        this.state.wave++;
        this.notifyState(); // UI can show "Next Wave" button
      }
    }

    // Update Enemies
    this.enemies.forEach(e => e.update());

    // Check lives and removal
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].reachedEnd) {
        this.state.lives--;
        this.createFloatingText(this.enemies[i].position, "-1 HP", "#F43F5E");
        this.shakeIntensity = 10; // Shake when taking damage
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

      // Special Logic for Towers that return target but handle things differently
      if (target) {
          if (t.type === 'LASER') {
              // Laser damage is handled in Tower.update (or we could do it here)
              // We just need to draw the laser beam later.
              // We can add a "Laser Particle" or just store the beam state?
              // Simplest: Add a transient particle/effect for this frame
              // But for now, we will handle visual in draw() by checking targetId
              // Sound?
              if (Math.random() < 0.1) soundManager.playShoot(t.type);
          } else {
            // Standard Projectile
            const isSplash = t.type === 'SPLASH';
            const splashRadius = isSplash ? 60 : 0;
            this.projectiles.push(this.projectilePool.get(t.position, target.position, t.damage, t.color, t.damageType, t.pierce, isSplash, splashRadius));
            soundManager.playShoot(t.type);
            // Add shoot particle
            this.createExplosion(t.position, t.color, 3, 0.5);
          }
      }
    });

    // Update Projectiles
    this.projectiles.forEach(p => p.update());

    // Collision Detection (Projectile vs Enemy)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.active) {
        this.projectiles.splice(i, 1);
        this.projectilePool.release(p);
        continue;
      }

      for (const e of this.enemies) {
        if (e.isDead || p.hitList.has(e.id)) continue;

        if (p.position.distanceTo(e.position) < e.radius + 5) {
            // Hit logic
            p.hitList.add(e.id);

            // Calculate Damage
            const finalDamage = DamageSystem.calculateDamage(p.damage, p.damageType, e.defenseType);

            if (p.isSplash) {
                // Splash Damage - Explode immediately
                this.enemies.forEach(nearby => {
                    if (nearby.isDead) return;
                    if (nearby.position.distanceTo(p.position) <= p.splashRadius) {
                         const splashDmg = DamageSystem.calculateDamage(p.damage, p.damageType, nearby.defenseType);
                         nearby.takeDamage(splashDmg);
                         if (splashDmg <= 0) this.createFloatingText(nearby.position, "IMMUNE", "#fff");
                    }
                });
                this.createExplosion(p.position, p.color, 20, 1.5);
                soundManager.playExplosion();
                p.active = false; // Splash always dies
            } else {
                // Single Target
                e.takeDamage(finalDamage);
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

            // If splash, we broke early via p.active = false check next loop, but we should break inner loop
            if (!p.active) break;
        }
      }

      // If we finished checking all enemies and projectile died
      if (!p.active) {
          this.projectiles.splice(i, 1);
          this.projectilePool.release(p);
      }
    }

    // Cleanup Dead Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].isDead) {
        this.state.money += this.enemies[i].reward;
        this.createFloatingText(this.enemies[i].position, `+$${this.enemies[i].reward}`, '#FCD34D');
        this.createExplosion(this.enemies[i].position, '#FFF', 15, 1.5);
        soundManager.playExplosion();
        this.shakeIntensity = Math.min(this.shakeIntensity + 2, 10);
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

  private createExplosion(pos: Vector2, color: string, count: number, scale: number = 1) {
    for (let i = 0; i < count; i++) {
      this.particles.push(this.particlePool.get(pos, color, scale, scale));
    }
  }

  private createFloatingText(pos: Vector2, text: string, color: string) {
      this.particles.push(this.particlePool.get(pos, color, 1, 1, text));
  }

  private draw() {
    this.ctx.save();

    // Apply screenshake
    if (this.shakeIntensity > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity;
      const dy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(dx, dy);
    }

    // Clear
    this.ctx.fillStyle = '#0f172a'; // Deep blue/slate bg
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Grid
    this.drawGrid();

    // Draw Path with Glow
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#3b82f6'; // Blue glow
    this.ctx.beginPath();
    this.ctx.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y);
    for (let i = 1; i < PATH_WAYPOINTS.length; i++) {
      this.ctx.lineTo(PATH_WAYPOINTS[i].x, PATH_WAYPOINTS[i].y);
    }
    this.ctx.lineWidth = 20;
    this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)'; // Faint wide path
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#60a5fa'; // Bright center
    this.ctx.stroke();

    this.ctx.shadowBlur = 0; // Reset for other items

    // Draw Entities
    this.towers.forEach(t => {
        t.draw(this.ctx);
        // Draw Laser Beam if active
        if (t.type === 'LASER' && t.targetId) {
            const target = this.enemies.find(e => e.id === t.targetId);
            if (target && !target.isDead) {
                this.ctx.beginPath();
                this.ctx.moveTo(t.position.x, t.position.y);
                this.ctx.lineTo(target.position.x, target.position.y);
                this.ctx.lineWidth = 4;
                this.ctx.strokeStyle = t.color; // Fuchsia
                this.ctx.lineCap = 'round';
                this.ctx.stroke();

                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = '#fff';
                this.ctx.stroke();

                // Impact spark
                this.createExplosion(target.position, t.color, 1, 0.5);
            }
        }
    });

    // Draw Placement Preview
    if (this.previewPos && this.previewType) {
        const canPlace = this.canPlaceTower(this.previewPos) && this.state.money >= TOWERS[this.previewType].cost;
        const range = TOWERS[this.previewType].range;
        const color = TOWERS[this.previewType].color;

        this.ctx.beginPath();
        this.ctx.arc(this.previewPos.x, this.previewPos.y, range, 0, Math.PI * 2);
        this.ctx.fillStyle = canPlace ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)';
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = canPlace ? 'rgba(255, 255, 255, 0.5)' : 'rgba(239, 68, 68, 0.8)';
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw Ghost Tower
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillRect(this.previewPos.x - 15, this.previewPos.y - 15, 30, 30);
        this.ctx.globalAlpha = 1.0;
    }
    this.enemies.forEach(e => e.draw(this.ctx));

    // Glowing projectiles
    this.ctx.shadowBlur = 10;
    this.projectiles.forEach(p => {
        this.ctx.shadowColor = p.color;
        p.draw(this.ctx)
    });
    this.ctx.shadowBlur = 0;

    this.particles.forEach(p => p.draw(this.ctx));

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
      // Create a copy to trigger react updates
      this.onStateChange({ ...this.state });
  }

  // Method to handle clicks from React
  handleClick(x: number, y: number, selectedTowerType: TowerType | null): Tower | null {
      const clickPos = new Vector2(x, y);

      // Check if clicked on existing tower
      const existingTower = this.getTowerAt(clickPos);
      if (existingTower) return existingTower;

      // Else try to place tower if one is selected
      if (selectedTowerType) {
          this.placeTower(clickPos, selectedTowerType);
      }
      return null;
  }
}
