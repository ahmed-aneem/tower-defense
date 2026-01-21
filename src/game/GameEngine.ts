import { Enemy } from './Enemy';
import { Tower } from './Tower';
import { Projectile } from './Projectile';
import { Particle } from './Particle';
import { Vector2 } from './Vector';
import { GAME_WIDTH, GAME_HEIGHT, PATH_WAYPOINTS, TOWERS, type TowerType } from './Constants';
import { type EnemyType } from '../types';

export interface GameState {
  money: number;
  lives: number;
  wave: number;
  isGameOver: boolean;
  gameStarted: boolean; // Has the user clicked "Start Game"?
  waveActive: boolean; // Are enemies spawning/alive?
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
    waveActive: false
  };

  // private lastTime: number = 0;
  private spawnTimer: number = 0;
  private enemiesToSpawn: EnemyType[] = [];
  private onStateChange: (state: GameState) => void;

  constructor(canvas: HTMLCanvasElement, onStateChange: (state: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;

    // Set canvas size
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;

    // Start loop
    requestAnimationFrame(this.loop.bind(this));
  }

  startGame() {
    this.state.gameStarted = true;
    this.startWave();
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
        if (waveNum % 5 === 0 && i < waveNum / 5) {
             enemies.push('TANK');
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
      this.notifyState();
      return true;
    }
    return false;
  }

  sellTower(tower: Tower) {
      this.state.money += Math.floor(TOWERS[tower.type].cost * 0.5);
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

  private loop(_timestamp: number) {
    // const deltaTime = timestamp - this.lastTime;
    // this.lastTime = timestamp;

    if (this.state.gameStarted && !this.state.isGameOver) {
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
        this.enemies.splice(i, 1);
        this.notifyState();
        if (this.state.lives <= 0) {
          this.state.isGameOver = true;
          this.notifyState();
        }
      }
    }

    // Update Towers
    this.towers.forEach(t => {
      const target = t.update(this.enemies);
      if (target) {
        // Shoot
        this.projectiles.push(new Projectile(t.position, target.position, t.damage, t.color));
        // Add shoot particle
         this.createExplosion(t.position, t.color, 3);
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
          e.takeDamage(p.damage);
          hit = true;
          this.createExplosion(p.position, p.color, 5);
          break; // Projectile hits one enemy
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
        this.createExplosion(this.enemies[i].position, '#FFF', 10);
        this.enemies.splice(i, 1);
        this.notifyState();
      }
    }

    // Update Particles
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => p.life > 0);
  }

  private createExplosion(pos: Vector2, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(pos, color));
    }
  }

  private draw() {
    // Clear
    this.ctx.fillStyle = '#1F2937'; // Dark gray bg
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Path
    this.ctx.beginPath();
    this.ctx.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y);
    for (let i = 1; i < PATH_WAYPOINTS.length; i++) {
      this.ctx.lineTo(PATH_WAYPOINTS[i].x, PATH_WAYPOINTS[i].y);
    }
    this.ctx.lineWidth = 40;
    this.ctx.strokeStyle = '#374151'; // Slightly lighter path
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    // Path centerline
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#4B5563';
    this.ctx.stroke();

    // Draw Entities
    this.towers.forEach(t => t.draw(this.ctx));
    this.enemies.forEach(e => e.draw(this.ctx));
    this.projectiles.forEach(p => p.draw(this.ctx));
    this.particles.forEach(p => p.draw(this.ctx));
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
