# Neon Defense

A strategic Tower Defense game built with React, TypeScript, and HTML5 Canvas.

## Features

- **Strategic Gameplay**: Place towers to defend your core from waves of enemies.
- **9 Tower Types**: Basic, Sniper, Minigun, Frost, Cannon, Laser, Tack, Farm, and **Plasma**.
- **Multiple Maps**: Choose from 3 distinct sectors (Serpent, Fortress, Crossing).
- **Roguelite Mods**: Every 5 waves, choose a system upgrade to boost your defenses or economy.
- **Advanced Mechanics**:
  - **Damage Types**: Physical, Explosive, Energy.
  - **Enemy Properties**: Watch out for **Camo** (Invisible) and **Regen** (Healing) enemies.
  - **Status Effects**: Slow enemies with Cold, Burn them with Lasers, or Stun them with Explosions.
  - **Defense System**: Armored and Shielded enemies require specific counters.
  - **Targeting Priorities**: Configure each tower to target First, Last, Strongest, Weakest, or Closest.
- **Deep Tower Upgrades**: Unlock powerful Level 3 abilities like **Railgun**, **Double Tap**, **Cluster Bombs**, and **Plasma Overdrive**.
- **Special Abilities**: Call down an **Orbital Strike** to decimate enemies.
- **Diverse Enemies**: Face off against fast swarms, armored tanks, and massive bosses.
- **Retro-Modern Visuals**: Clean, flat neon aesthetic with particle effects.
- **Performance Optimized**: Object pooling, offscreen grid buffering, and state throttling ensure smooth gameplay on mobile and desktop.
- **Game Speed Control**: Toggle between 1x, 2x, and 4x game speed.
- **Synthesized Audio**: No external assets; all sound is generated procedurally.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- HTML5 Canvas API
- Web Audio API

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```
