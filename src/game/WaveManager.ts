import { WAVES } from './WaveConfig';
import { type EnemyType } from '../types';

export interface SpawnInstruction {
    type: EnemyType;
    interval: number;
}

export class WaveManager {
    getWave(round: number): SpawnInstruction[] {
        const waveData = WAVES.find(w => w.round === round);
        const instructions: SpawnInstruction[] = [];

        if (waveData) {
            for (const group of waveData.groups) {
                for (let i = 0; i < group.count; i++) {
                    instructions.push({
                        type: group.type,
                        interval: group.interval
                    });
                }
            }
        } else {
            // Procedural generation for undefined rounds (infinite scaling)
            const count = Math.floor(10 + round * 1.5);

            // Difficulty scaling
            for(let i=0; i<count; i++) {
                let type: EnemyType = 'NORMAL';
                const rand = Math.random();

                if (round > 40) {
                     if (rand > 0.95) type = 'BOSS';
                     else if (rand > 0.8) type = 'TANK';
                     else if (rand > 0.6) type = 'ARMORED';
                     else if (rand > 0.4) type = 'FAST';
                } else if (round > 20) {
                     if (rand > 0.9) type = 'TANK';
                     else if (rand > 0.7) type = 'ARMORED';
                     else if (rand > 0.5) type = 'SWARM';
                } else if (round > 10) {
                     if (rand > 0.8) type = 'ARMORED';
                     else if (rand > 0.5) type = 'FAST';
                }

                instructions.push({
                    type: type,
                    interval: Math.max(15, 60 - round)
                });
            }
        }
        return instructions;
    }
}
