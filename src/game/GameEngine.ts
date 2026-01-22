import { Enemy } from './Enemy';
import { Tower } from './Tower';
import { Projectile } from './Projectile';
import { Particle } from './Particle';
import { Vector2 } from './Vector';
import { GAME_WIDTH, GAME_HEIGHT, PATH_WAYPOINTS, TOWERS, type TowerType } from './Constants';
import { type EnemyType } from '../types';
import { soundManager } from './SoundManager';

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
  private enemiesToSpawn: EnemyType[] = [];
  private onStateChange: (state: GameState) => void;

  // Screen shake
  private shakeIntensity: number = 0;

  constructor(canvas: HTMLCanvasElement, onStateChange: (state: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;

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
    this.enemiesToSpawn = this.generateWave(this.state.wave);
    this.spawnTimer = 0;
    this.notifyState();
  }

  generateWave(waveNum: number): EnemyType[] {
    const enemies: EnemyType[] = [];
    const count = 5 + Math.floor(waveNum * 1.5);

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

  placeTower(pos: Vector2, type: TowerType): boolean {
    const cost = TOWERS[type].cost;
    if (this.state.money >= cost) {
      // Check collision with path (simple check: distance to path segments)
      // For now, just check if it's too close to other towers
      for (const t of this.towers) {
        if (pos.distanceTo(t.position) < 40) return false;
      }

      // Check collision with path (very basic box check around waypoints)
      // Ideally we would do line segment distance checks
      for (let i=0; i<PATH_WAYPOINTS.length-1; i++) {
           const p1 = PATH_WAYPOINTS[i];
           const p2 = PATH_WAYPOINTS[i+1];
           const dist = this.pointToSegmentDistance(pos, p1, p2);
           if (dist < 30) return false; // Too close to path
      }

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
      if (this.enemiesToSpawn.length > 0) {
        this.spawnTimer++;
        if (this.spawnTimer > 60) { // Spawn every 60 frames approx
          const type = this.enemiesToSpawn.shift()!;
          this.enemies.push(new Enemy(type));
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
            this.projectiles.push(new Projectile(t.position, target.position, t.damage, t.color, isSplash, splashRadius));
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
        continue;
      }

      let hit = false;
      for (const e of this.enemies) {
        if (e.isDead) continue;
        if (p.position.distanceTo(e.position) < e.radius + 5) {
            hit = true;

            if (p.isSplash) {
                // Splash Damage
                this.enemies.forEach(nearby => {
                    if (nearby.isDead) return;
                    if (nearby.position.distanceTo(p.position) <= p.splashRadius) {
                        // Falloff damage? No, full damage for now.
                        nearby.takeDamage(p.damage);
                    }
                });
                this.createExplosion(p.position, p.color, 20, 1.5); // Bigger explosion
                soundManager.playExplosion();
            } else {
                // Single Target
                e.takeDamage(p.damage);
                this.createExplosion(p.position, p.color, 5, 0.5);
            }
            break;
        }
      }

      if (hit) {
        this.projectiles.splice(i, 1);
      }
    }

    // Cleanup Dead Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].isDead) {
        this.state.money += this.enemies[i].reward;
        this.createExplosion(this.enemies[i].position, '#FFF', 15, 1.5);
        soundManager.playExplosion();
        this.shakeIntensity = Math.min(this.shakeIntensity + 2, 10);
        this.enemies.splice(i, 1);
        this.notifyState();
      }
    }

    // Update Particles
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => p.life > 0);

    // Decay shake
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.9;
      if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
    }
  }

  private createExplosion(pos: Vector2, color: string, count: number, scale: number = 1) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(pos, color, scale, scale));
    }
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
