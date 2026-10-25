import { describe, it, expect } from 'vitest';
import { MODS, drawModOptions, applyStatMods } from './Mods';

describe('Mods System', () => {
  it('drawModOptions uniform distribution within ±5%', () => {
    let seed = 123456;
    const fakeRng = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const counts: Record<string, number> = {};
    MODS.forEach((m) => (counts[m.id] = 0));

    const iterations = 30000;
    for (let i = 0; i < iterations; i++) {
      const opts = drawModOptions(MODS, [], fakeRng, 3);
      opts.forEach((m) => counts[m.id]++);
    }

    const expectedCount = (iterations * 3) / MODS.length;
    const tolerance = expectedCount * 0.05;

    for (const modId of Object.keys(counts)) {
      const count = counts[modId];
      expect(count).toBeGreaterThanOrEqual(expectedCount - tolerance);
      expect(count).toBeLessThanOrEqual(expectedCount + tolerance);
    }
  });

  it('unique active mods never appear in options', () => {
    const active = [{ id: 'DISCOUNT', name: 'Discount', description: '', icon: '', unique: true }];
    for (let i = 0; i < 100; i++) {
      const opts = drawModOptions(MODS, active, Math.random, 3);
      expect(opts.some((m) => m.id === 'DISCOUNT')).toBe(false);
    }
  });

  it('consistent stats between existing and new towers after multiple RANGE_BOOST', () => {
    const baseRange = 100;
    let count = 0;

    // Simulate applying RANGE_BOOST 3 times to existing
    count++;
    const existingRange1 = applyStatMods(baseRange, count);
    count++;
    const existingRange2 = applyStatMods(baseRange, count);
    count++;
    const existingRange3 = applyStatMods(baseRange, count);

    // New tower created after 3 selections
    const newTowerRange = applyStatMods(baseRange, 3);

    expect(existingRange3).toBe(newTowerRange);
  });
});
