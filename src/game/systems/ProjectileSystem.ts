import { Projectile } from '../Projectile';
import { Enemy } from '../Enemy';
import { QuadTree } from '../QuadTree';
import { Particle } from '../Particle';
import { ObjectPool } from '../ObjectPool';
import { DamageType, DefenseType } from '../Constants';
import { soundManager } from '../SoundManager';
import { Vector2 } from '../Vector';

import { type GameEngine } from '../GameEngine';

export class ProjectileSystem {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    update(projectiles: Projectile[], quadTree: QuadTree, particlePool: ObjectPool<Particle>, projectilePool: ObjectPool<Projectile>) {
        // Update Projectiles
        projectiles.forEach(p => p.update());

        // Collision Detection (Projectile vs Enemy)
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            if (!p.active) {
                projectiles.splice(i, 1);
                projectilePool.release(p);
                continue;
            }

            // Query QuadTree for potential collisions
            const searchRadius = 30; // Max enemy radius + buffer
            const candidates = quadTree.queryCircle(p.position, searchRadius);

            for (const item of candidates) {
                const e = item as Enemy;
                if (e.isDead || p.hitList.has(e.id)) continue;

                if (p.position.distanceTo(e.position) < e.radius + 5) { // 5 is projectile size buffer
                    p.hitList.add(e.id);
                    const finalDamage = this.calculateDamage(p.damage, p.damageType, e.defenseType);

                    if (p.isSplash) {
                        // For splash, query again for the splash radius
                        const splashCandidates = quadTree.queryCircle(p.position, p.splashRadius);
                        splashCandidates.forEach(splashItem => {
                            const nearby = splashItem as Enemy;
                            if (nearby.isDead) return;
                            // Exact circle check
                            if (nearby.position.distanceTo(p.position) <= p.splashRadius + nearby.radius) {
                                const splashDmg = this.calculateDamage(p.damage, p.damageType, nearby.defenseType);
                                nearby.takeDamage(splashDmg);
                                if (p.sourceId) {
                                    const tower = this.engine.towerMap.get(p.sourceId);
                                    if (tower) tower.pops += splashDmg;
                                }
                                if (p.statusEffect) nearby.applyEffect(p.statusEffect);
                                if (splashDmg <= 0) this.engine.createFloatingText(nearby.position, "IMMUNE", "#fff");
                            }
                        });
                        this.engine.createExplosion(p.position, p.color, 20, 1.5);
                        soundManager.playExplosion();

                        // Cluster Bomb Logic
                        if (p.isCluster) {
                            for (let j = 0; j < 5; j++) {
                                const angle = (Math.PI * 2 * j) / 5;
                                const clusterTarget = new Vector2(
                                    p.position.x + Math.cos(angle) * 100,
                                    p.position.y + Math.sin(angle) * 100
                                );
                                // Spawn smaller bombs
                                projectiles.push(projectilePool.get(
                                    p.position,
                                    clusterTarget,
                                    Math.floor(p.damage * 0.3),
                                    '#fca5a5',
                                    DamageType.EXPLOSIVE,
                                    1,
                                    true, // isSplash
                                    30, // smaller radius
                                    undefined,
                                    false, // not cluster again
                                    200 // max range for cluster
                                ));
                            }
                        }

                        p.active = false;
                    } else {
                        e.takeDamage(finalDamage);
                        if (p.sourceId) {
                            const tower = this.engine.towerMap.get(p.sourceId);
                            if (tower) tower.pops += finalDamage;
                        }
                        // Pop Effect
                        this.engine.particles.push(particlePool.get(e.position, e.color, 1, e.radius / 10, undefined, 'POP'));

                        if (p.statusEffect) e.applyEffect(p.statusEffect);

                        if (finalDamage <= 0) {
                            this.engine.createFloatingText(e.position, "IMMUNE", "#fff");
                        } else {
                            this.engine.createExplosion(p.position, p.color, 5, 0.5);
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
                projectiles.splice(i, 1);
                projectilePool.release(p);
            }
        }
    }

    private calculateDamage(amount: number, type: DamageType, defense: DefenseType): number {
        if (defense === DefenseType.HEAVY) {
            if (type === DamageType.PHYSICAL) return 0; // Strict immunity
            if (type === DamageType.EXPLOSIVE) return Math.floor(amount * 1.5);
        } else if (defense === DefenseType.SHIELDED) {
            if (type === DamageType.PHYSICAL) return amount;
            if (type === DamageType.EXPLOSIVE) return Math.floor(amount * 0.5);
            if (type === DamageType.ENERGY) return Math.floor(amount * 1.5);
        }
        return amount;
    }
}
