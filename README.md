# Neon Defense

A strategic Tower Defense game built with React, TypeScript, and HTML5 Canvas.

## Features

- **Strategic Gameplay**: Place towers to defend your core from waves of enemies.
- **Mobile & Desktop**: Fully responsive drag-and-drop controls optimized for both touch and mouse.
- **6 Tower Types**: Basic, Sniper, Minigun, Frost, Cannon, and Laser.
- **Advanced Mechanics**:
  - **Structured Wave System**: Carefully crafted rounds with scaling difficulty (inspired by BTD6).
  - **Damage Types**: Physical, Explosive, Energy, Cold.
  - **Defense System**: Armored (Heavy) and Shielded enemies require specific counters.
  - **Targeting Priorities**: Configure each tower to target First, Last, Strongest, Weakest, or Closest.
- **Tower Upgrades**: Upgrade towers to increase damage, range, and fire rate (up to Level 3).
- **Special Abilities**: Call down an **Orbital Strike** to decimate enemies.
- **Diverse Enemies**: Face off against fast swarms, armored tanks, and massive bosses.
- **Retro-Modern Visuals**: Clean, flat neon aesthetic with particle effects.
- **Performance Optimized**: Object pooling ensures smooth gameplay on mobile and desktop.
- **Synthesized Audio**: No external assets; all sound is generated procedurally.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
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
