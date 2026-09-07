import { type EnemyType } from '../../types';

export class WaveManager {
    public wave: number = 0;
    public waveActive: boolean = false;
    public enemiesToSpawn: EnemyType[] = [];
    public spawnTimer: number = 0;

    // Config
    private spawnIntervalBase: number = 1000;

    constructor() {}

    public hpMultiplier: number = 1;
    public speedMultiplier: number = 1;

    startNextWave(): void {
        this.wave++;
        this.waveActive = true;
        this.enemiesToSpawn = this.generateWave(this.wave);
        this.spawnTimer = 0;
    }

    update(dt: number): EnemyType | null {
        if (!this.waveActive) return null;

        if (this.enemiesToSpawn.length > 0) {
            this.spawnTimer += dt;
            const currentInterval = Math.max(200, this.spawnIntervalBase - (this.wave * 10));

            if (this.spawnTimer >= currentInterval) {
                this.spawnTimer = 0;
                return this.enemiesToSpawn.shift() || null;
            }
        }
        return null;
    }

    checkWaveCompletion(activeEnemyCount: number): boolean {
        // If no enemies left to spawn AND no active enemies alive
        return this.waveActive && this.enemiesToSpawn.length === 0 && activeEnemyCount === 0;
    }

    private generateWave(waveNum: number): EnemyType[] {
        const enemies: EnemyType[] = [];

        // Freeplay scaling
        if (waveNum > 50) {
            this.hpMultiplier = 1 + ((waveNum - 50) * 0.2); // +20% HP per wave after 50
            this.speedMultiplier = 1 + ((waveNum - 50) * 0.05); // +5% Speed per wave after 50
        } else {
            this.hpMultiplier = 1;
            this.speedMultiplier = 1;
        }

        // Endless scaling count
        let count = 5 + Math.floor(waveNum * 1.5);
        if (waveNum > 50) count = Math.min(150, Math.floor(count * 1.5)); // Cap spawn count

        for (let i = 0; i < count; i++) {
            // Hardcoded BTD6-like Milestones
            if (waveNum === 24) {
                 if (i < 5) enemies.push('FAST'); // First Camo equivalent
                 else enemies.push('NORMAL');
            } else if (waveNum === 28) {
                 if (i < 3) enemies.push('TANK'); // First Lead equivalent
                 else enemies.push('NORMAL');
            } else if (waveNum === 40) {
                 if (i === 0) enemies.push('BOSS'); // First MOAB equivalent
                 else enemies.push('NORMAL');
            } else if (waveNum === 60) {
                 if (i < 3) enemies.push('BOSS'); // BFB equivalent (Multiple bosses)
                 else enemies.push('ARMORED');
            } else {
                // Standard generation
                if (waveNum % 10 === 0 && i < Math.max(1, waveNum / 20)) {
                    enemies.push('BOSS');
                } else if (waveNum % 5 === 0 && i < waveNum / 3) {
                    enemies.push('TANK');
                } else if (waveNum > 3 && i % 4 === 0) {
                    enemies.push('FAST');
                } else if (waveNum > 2 && i % 3 === 0) {
                    enemies.push('ARMORED');
                } else {
                    if (waveNum > 50 && i % 5 === 0) {
                        enemies.push('BOSS'); // Add random bosses in freeplay
                    } else {
                        enemies.push('NORMAL');
                    }
                }
            }
        }
        return enemies;
    }

    reset() {
        this.wave = 1;
        this.waveActive = false;
        this.enemiesToSpawn = [];
        this.spawnTimer = 0;
    }
}
