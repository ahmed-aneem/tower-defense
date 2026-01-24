import { DamageType, DefenseType } from './Constants';

export class DamageSystem {
    static calculateDamage(amount: number, type: DamageType, defense: DefenseType): number {
        // Heavy Armor (Lead equivalent)
        // Resistant to Physical, Weak to Explosive
        if (defense === DefenseType.HEAVY) {
            if (type === DamageType.PHYSICAL) return Math.floor(amount * 0.5);
            if (type === DamageType.EXPLOSIVE) return Math.floor(amount * 1.5);
            if (type === DamageType.COLD) return amount; // Cold works normal
            if (type === DamageType.ENERGY) return Math.floor(amount * 0.8); // Energy slightly resisted
        }
        // Shielded (Purple/Energy Shield)
        // Resistant to Explosive/Energy? Or just Energy?
        // Usually Shields (Blue/Energy) take extra from Energy.
        else if (defense === DefenseType.SHIELDED) {
            if (type === DamageType.PHYSICAL) return amount;
            if (type === DamageType.EXPLOSIVE) return Math.floor(amount * 0.5);
            if (type === DamageType.ENERGY) return Math.floor(amount * 1.5); // Bonus vs Shields
            if (type === DamageType.COLD) return amount;
        }

        return amount;
    }
}
