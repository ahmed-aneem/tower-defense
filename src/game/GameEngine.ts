import { Enemy } from './Enemy';
import { Tower } from './Tower';
import { Projectile } from './Projectile';
import { Particle } from './Particle';
import { ObjectPool } from './ObjectPool';
import { QuadTree } from './QuadTree';
import { Vector2 } from './Vector';
import { TOWERS, type TowerType, DamageType, DefenseType, ENEMIES } from './Constants';
import { soundManager } from './SoundManager';
import { type Mod, MODS } from './Mods';
import { WaveManager } from './systems/WaveManager';
import { InputManager } from './systems/InputManager';
import { ProjectileSystem } from './systems/ProjectileSystem';
import { RenderSystem } from './systems/RenderSystem';


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
    speed: number;
    autoStart: boolean;
}

export interface LightningBolt {
    points: Vector2[];
    life: number;
    maxLife: number;
    color: string;
    width: number;
}

export class GameEngine {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    enemies: Enemy[] = [];
    towers: Tower[] = [];
    towerMap: Map<string, Tower> = new Map();
    projectiles: Projectile[] = [];
    particles: Particle[] = [];
    lightningBolts: LightningBolt[] = [];

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
        modOptions: [],
        speed: 1,
        autoStart: false
    };

    path: Vector2[];
    public waveManager: WaveManager;
    public inputManager: InputManager;
    private projectileSystem: ProjectileSystem;
    private renderSystem: RenderSystem;

    private autoStartTimer: number = 0;
    modOptions: Mod[] = [];
    isRunning: boolean = true;
    placementMode: TowerType | null = null;
    mousePosition: Vector2 = new Vector2(0, 0);
    gridCanvas: HTMLCanvasElement | null = null;

    private lastModWave: number = 0;
    private lastTime: number = 0;
    private lastNotifyTime: number = 0;
    private accumulator: number = 0;
    private readonly TIMESTEP: number = 1000 / 60; // 60 FPS Logic
    private onStateChange: (state: GameState) => void;

    public speedMultiplier: number = 1;

    // Screen shake
    public shakeIntensity: number = 0;
    public shakeX: number = 0;
    public shakeY: number = 0;

    constructor(canvas: HTMLCanvasElement, mapPath: Vector2[], width: number, height: number, onStateChange: (state: GameState) => void) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.width = width;
        this.height = height;
        this.onStateChange = onStateChange;
        this.path = mapPath.map(p => new Vector2(p.x * width, p.y * height));
        this.waveManager = new WaveManager();
        this.inputManager = new InputManager();
        this.projectileSystem = new ProjectileSystem(this);
        this.renderSystem = new RenderSystem(this);

        // Init Pools
        this.projectilePool = new ObjectPool<Projectile>(
            () => new Projectile(new Vector2(0, 0), new Vector2(0, 0), 0, ''),
            (p, start, target, dmg, col, type, pierce, splash, rad, effect, isCluster, maxRange, sourceId) => p.reset(start as Vector2, target as Vector2, dmg as number, col as string, type as DamageType, pierce as number, splash as boolean, rad as number, effect as import('./StatusEffects').StatusEffect, isCluster as boolean, maxRange as number, sourceId as string)
        );

        this.particlePool = new ObjectPool<Particle>(
            () => new Particle(new Vector2(0, 0), ''),
            (p, pos, col, speed, size, txt, shape, gravity) => p.reset(pos as Vector2, col as string, speed as number, size as number, txt as string, shape as 'CIRCLE'|'SQUARE'|'STAR'|'POP', gravity as number)
        );

        // Init QuadTree
        this.quadTree = new QuadTree({ x: 0, y: 0, w: this.width, h: this.height }, 4);

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

    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.updateCanvasSize();
    }

    destroy() {
        this.isRunning = false;
        window.removeEventListener('resize', this.handleResize);
    }

    private updateCanvasSize() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.preRenderGrid();
    }

    private preRenderGrid() {
        if (!this.gridCanvas) {
            this.gridCanvas = document.createElement('canvas');
        }
        this.gridCanvas.width = this.width;
        this.gridCanvas.height = this.height;
        const ctx = this.gridCanvas.getContext('2d')!;

        ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
        ctx.lineWidth = 1;

        const cellSize = 40;
        for (let x = 0; x <= this.width; x += cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        for (let y = 0; y <= this.height; y += cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }

    startGame() {
        this.state.gameStarted = true;
        this.startWave();
        this.notifyState();
    }

    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        this.notifyState(true);
    }

    toggleAutoStart() {
        this.state.autoStart = !this.state.autoStart;
        this.notifyState(true);
    }

    setSpeed(multiplier: number) {
        this.speedMultiplier = multiplier;
        this.state.speed = multiplier;
        this.notifyState();
    }

        startWave() {
        if (this.state.wave > 1 && (this.state.wave - 1) % 5 === 0 && !this.state.choosingMod && this.lastModWave !== this.state.wave) {
            this.triggerModSelection();
            return;
        }

        this.waveManager.startNextWave();
        this.state.wave = this.waveManager.wave;
        this.state.waveActive = true;
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



    hasMod(id: string): boolean {
        return this.state.activeMods.some(m => m.id === id);
    }

    canPlaceTower(pos: Vector2): boolean {
        // Check collision with other towers
        for (const t of this.towers) {
            if (pos.distanceTo(t.position) < 40) return false;
        }

        // Check collision with path
        for (let i = 0; i < this.path.length - 1; i++) {
            const p1 = this.path[i];
            const p2 = this.path[i + 1];
            const dist = this.pointToSegmentDistance(pos, p1, p2);
            if (dist < 30) return false; // Path width + buffer
        }

        return true;
    }

    placeTower(pos: Vector2, type: TowerType): boolean {
        let cost: number = TOWERS[type].cost;
        // Apply Discount Mod
        if (this.hasMod('DISCOUNT')) {
            cost = Math.floor(cost * 0.9);
        }

        if (this.state.money >= cost && this.canPlaceTower(pos)) {
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
            this.towerMap.set(newTower.id, newTower);

            // Visual feedback
            this.createExplosion(pos, TOWERS[type].color, 10, 2);

            this.notifyState();
            return true;
        }
        return false;
    }

    sellTower(tower: Tower) {
        // Refund 70% of total amount spent on this tower and its upgrades
        const refund = Math.floor(tower.totalSpent * 0.7);

        this.state.money += refund;
        this.createFloatingText(tower.position, `+$${refund}`, "#F87171");
        this.createExplosion(tower.position, '#F87171', 8, 1.5);
        this.towers = this.towers.filter(t => t.id !== tower.id);
        this.towerMap.delete(tower.id);
        this.notifyState();
    }

    upgradeTower(tower: Tower, upgradePath: 'A' | 'B' = 'A') {
        let cost = tower.upgradeCost;
        if (this.hasMod('DISCOUNT')) {
            cost = Math.floor(cost * 0.9);
        }

        if (this.state.money >= cost && tower.level < 3) {
            this.state.money -= cost;
            tower.upgrade(upgradePath);
            tower.totalSpent += cost;

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

                for (let i = 0; i < 20; i++) {
                    this.particles.push(this.particlePool.get(
                        new Vector2(Math.random() * this.canvas.width, Math.random() * this.canvas.height),
                        '#FFF',
                        5,
                        5
                    ));
                }

                this.createFloatingText(new Vector2(this.canvas.width / 2, this.canvas.height / 2), "ORBITAL STRIKE", "#FFF");
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
            // Apply speed multiplier to accumulator
            this.accumulator += cappedDelta * this.speedMultiplier;

            if (this.accumulator > 200) {
                this.accumulator = 200;
            }

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
        // Wave Logic
        const newEnemyType = this.waveManager.update(16); // Assuming fixed step or passing dt
        if (newEnemyType) {
             // Spawn logic needs path.
             // But WaveManager returns EnemyType. We need to create Enemy here?
             // Or WaveManager returns Enemy object?
             // My previous WaveManager returned EnemyType | null.
             // So I need to spawn it here.
             const enemy = new Enemy(newEnemyType, this.path[0]);
             enemy.setPath(this.path);

             // Apply Freeplay HP multiplier
             if (this.waveManager.hpMultiplier > 1) {
                 enemy.hp = Math.floor(enemy.hp * this.waveManager.hpMultiplier);
                 enemy.maxHp = enemy.hp;
             }

             this.enemies.push(enemy);
        }

        // Check Wave Completion
        if (this.waveManager.checkWaveCompletion(this.enemies.length)) {
            this.state.waveActive = false;
            this.applyEndOfWaveMods();
            if (this.state.autoStart) {
                 this.startWave();
            }
        }

        // Sync State
        this.state.wave = this.waveManager.wave;

        // Auto Start Logic
        if (!this.state.waveActive && this.state.autoStart && this.state.gameStarted && !this.state.isGameOver && !this.state.choosingMod && !this.state.isPaused) {
            this.autoStartTimer++;
            if (this.autoStartTimer > 60) {
                this.startWave();
                this.autoStartTimer = 0;
            }
        } else {
            this.autoStartTimer = 0;
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

            if (t.type === 'FARM') {
                if (t.cooldownTimer <= 0) {
                    // Generate Money
                    const income = 15 + (t.level * 10);
                    this.state.money += income;
                    t.pops += income;
                    this.createFloatingText(t.position, `+$${income}`, '#FCD34D');
                    t.cooldownTimer = t.maxCooldown;
                    this.notifyState();
                }
                return;
            }

            if (target) {
                if (t.type === 'LASER') {
                    t.pops += t.damage;
                    if (Math.random() < 0.1) soundManager.playShoot(t.type);
                } else if (t.type === 'TESLA') {
                    this.fireTesla(t, target);
                    t.cooldownTimer = t.maxCooldown;
                } else if (t.type === 'TACK') {
                    // Shoot 8 projectiles in circle
                    const count = 8;
                    const angleStep = (Math.PI * 2) / count;
                    for (let i = 0; i < count; i++) {
                        const angle = i * angleStep;
                        const targetPos = new Vector2(
                            t.position.x + Math.cos(angle) * t.range,
                            t.position.y + Math.sin(angle) * t.range
                        );

                        const damage = t.damage;
                        const effect = t.statusEffect ? { ...t.statusEffect, sourceId: t.id } : undefined;

                        this.projectiles.push(this.projectilePool.get(t.position, targetPos, damage, t.color, t.damageType, t.pierce, false, 0, effect, false, t.range + 50, t.id));
                    }
                    soundManager.playShoot(t.type);
                } else {
                    const isSplash = t.type === 'SPLASH';
                    const splashRadius = isSplash ? 60 : 0;
                    const isCluster = isSplash && t.level >= 3;

                    // Check Critical Hit Mod
                    let damage = t.damage;
                    let color = t.color;
                    if (this.hasMod('CRITICAL_HIT') && Math.random() < 0.1) {
                        damage *= 2;
                        color = '#FFF'; // White flash for crit
                    }

                    const effect = t.statusEffect ? { ...t.statusEffect, sourceId: t.id } : undefined;

                    // Use anticipated position if available
                    const targetPos = target.anticipatedPosition || target.position;

                    this.projectiles.push(this.projectilePool.get(t.position, targetPos, damage, color, t.damageType, t.pierce, isSplash, splashRadius, effect, isCluster, t.range + 50, t.id));
                    soundManager.playShoot(t.type);
                    this.createExplosion(t.position, t.color, 3, 0.5);
                }
            }
        });

        // Rebuild QuadTree
        this.quadTree = new QuadTree({ x: 0, y: 0, w: this.width, h: this.height }, 4);
        this.enemies.forEach(e => {
            if (!e.isDead && !e.reachedEnd) {
                this.quadTree.insert(e);
            }
        });

        // Update Projectiles and Handle Collisions
        this.projectileSystem.update(this.projectiles, this.quadTree, this.particlePool, this.projectilePool);

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

        // Update Lightning
        for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
            this.lightningBolts[i].life--;
            if (this.lightningBolts[i].life <= 0) {
                this.lightningBolts.splice(i, 1);
            }
        }

        // Decay shake
        if (this.shakeIntensity > 0) {
            this.shakeIntensity *= 0.9;
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            if (this.shakeIntensity < 0.5) {
                 this.shakeIntensity = 0;
                 this.shakeX = 0;
                 this.shakeY = 0;
            }
        }
    }

    public createExplosion(pos: Vector2, color: string, count: number, scale: number = 1) {
        for (let i = 0; i < count; i++) {
            const shape = Math.random() > 0.5 ? 'SQUARE' : 'CIRCLE';
            // Occasional star for big explosions
            const finalShape = (scale > 1.5 && Math.random() > 0.7) ? 'STAR' : shape;

            // Gravity only for non-circle (debris)
            const gravity = finalShape === 'CIRCLE' ? 0 : 0.3;

            this.particles.push(this.particlePool.get(pos, color, scale, scale, undefined, finalShape, gravity));
        }
    }

    public createFloatingText(pos: Vector2, text: string, color: string) {
        this.particles.push(this.particlePool.get(pos, color, 1, 1, text));
    }

    private applyEndOfWaveMods() {
        if (this.hasMod('LIFE_REGEN')) {
            this.state.lives += 2;
            this.createFloatingText(new Vector2(this.width / 2, this.height / 2), "REPAIRED +2 HP", "#F43F5E");
        }
        if (this.hasMod('INTEREST')) {
            const interest = Math.min(500, Math.floor(this.state.money * 0.1));
            if (interest > 0) {
                this.state.money += interest;
                this.createFloatingText(new Vector2(this.width / 2, this.height / 2 + 30), `INTEREST +$${interest}`, "#FCD34D");
            }
        }
    }


    private fireTesla(tower: Tower, initialTarget: Enemy) {
        const targets: Enemy[] = [initialTarget];
        let current = initialTarget;

        // Damage initial
        const initialDmg = this.calculateDamage(tower.damage, tower.damageType, initialTarget.defenseType);
        initialTarget.takeDamage(initialDmg);
        tower.pops += initialDmg;
        if (tower.statusEffect) initialTarget.applyEffect(tower.statusEffect);
        if (initialDmg <= 0) {
             this.createFloatingText(initialTarget.position, "IMMUNE", "#fff");
        }

        // Chain
        for (let i = 0; i < tower.pierce; i++) {
            let bestCandidate: Enemy | null = null;
            let bestDist = 200; // Chain range

            // Query QuadTree for efficiency
            const candidates = this.quadTree.queryCircle(current.position, bestDist);

            for (const item of candidates) {
                const e = item as Enemy;
                if (e.isDead || targets.includes(e) || e.reachedEnd) continue;

                const dist = current.position.distanceTo(e.position);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestCandidate = e;
                }
            }

            if (bestCandidate) {
                // Create Bolt Segment
                const points: Vector2[] = [];
                const segments = 5;
                const start = current.position;
                const end = bestCandidate.position;

                points.push(start);
                for (let j = 1; j < segments; j++) {
                    const t = j / segments;
                    const bx = start.x + (end.x - start.x) * t;
                    const by = start.y + (end.y - start.y) * t;
                    // Jitter
                    const perpX = -(end.y - start.y);
                    const perpY = (end.x - start.x);
                    const len = Math.sqrt(perpX * perpX + perpY * perpY);
                    const jitter = (Math.random() - 0.5) * 20; // 20px jitter

                    points.push(new Vector2(
                        bx + (perpX / len) * jitter,
                        by + (perpY / len) * jitter
                    ));
                }
                points.push(end);

                this.lightningBolts.push({
                    points,
                    life: 10,
                    maxLife: 10,
                    color: tower.color,
                    width: 3
                });

                current = bestCandidate;
                targets.push(current);

                // Damage chained
                const dmg = this.calculateDamage(Math.floor(tower.damage * 0.8), tower.damageType, current.defenseType);
                current.takeDamage(dmg);
                tower.pops += dmg;
                if (tower.statusEffect) current.applyEffect(tower.statusEffect);
                if (dmg <= 0) {
                    this.createFloatingText(current.position, "IMMUNE", "#fff");
                } else {
                    this.createExplosion(current.position, tower.color, 2, 0.5);
                }
            } else {
                break;
            }
        }

        // Create initial bolt from tower to first target
        const points: Vector2[] = [];
        const segments = 6;
        const start = tower.position;
        const end = initialTarget.position;

        points.push(start);
        for (let j = 1; j < segments; j++) {
            const t = j / segments;
            const bx = start.x + (end.x - start.x) * t;
            const by = start.y + (end.y - start.y) * t;
            const perpX = -(end.y - start.y);
            const perpY = (end.x - start.x);
            const len = Math.sqrt(perpX * perpX + perpY * perpY);
            const jitter = (Math.random() - 0.5) * 15;

            points.push(new Vector2(
                bx + (perpX / len) * jitter,
                by + (perpY / len) * jitter
            ));
        }
        points.push(end);

        this.lightningBolts.push({
            points,
            life: 10,
            maxLife: 10,
            color: '#FFF', // Core beam white
            width: 4
        });
        this.lightningBolts.push({
            points: [...points], // Copy for outer glow
            life: 10,
            maxLife: 10,
            color: tower.color,
            width: 8
        });

        this.shakeIntensity = 5;
        soundManager.playShoot('BASIC'); // Placeholder sound
    }

    private calculateDamage(amount: number, type: DamageType, defense: DefenseType): number {
        if (defense === DefenseType.HEAVY) {
            if (type === DamageType.PHYSICAL) return 0; // Strict immunity (like BTD6 Lead)
            if (type === DamageType.EXPLOSIVE) return Math.floor(amount * 1.5);
        } else if (defense === DefenseType.SHIELDED) {
            if (type === DamageType.PHYSICAL) return amount;
            if (type === DamageType.EXPLOSIVE) return Math.floor(amount * 0.5);
            if (type === DamageType.ENERGY) return Math.floor(amount * 1.5);
        }
        return amount;
    }

    private draw() {
        this.renderSystem.draw();
    }

    private notifyState(immediate: boolean = false) {
        const now = performance.now();
        if (immediate || now - this.lastNotifyTime > 32) { // ~30 FPS throttle
            this.onStateChange({ ...this.state });
            this.lastNotifyTime = now;
        }
    }

        handleClick(x: number, y: number): Tower | null {
        this.inputManager.updateMouse(x, y);
        const action = this.inputManager.handleClick(this.towers, this.state.money);

        if (action) {
            if (action.action === 'PLACE') {
                if (this.placeTower(action.pos, action.type)) {
                    this.inputManager.setPlacementMode(null);
                    return null;
                }
            } else if (action.action === 'SELECT') {
                return action.tower;
            }
        }
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
