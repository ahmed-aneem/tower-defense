# Neon Defense
**Project Overview**

This is a modern Tower Defense game built with React, TypeScript, and HTML5 Canvas. It features a "Flat" neon visual style using a Slate/Dark theme.

## Architecture

- **Game Engine**: `src/game/GameEngine.ts` manages the core game loop, canvas rendering, and entity management.
- **Entities**: Towers, Enemies, Projectiles, and Particles are classes in `src/game/`.
- **UI**: The HUD overlay is a React component (`src/components/HUD.tsx`) that communicates with the engine via a Ref and State callbacks.
- **State Management**: The Engine notifies React of state changes (money, lives, wave, active mods) to update the HUD.
- **Maps**: Maps are defined in `src/game/Maps.ts`. The Engine is re-initialized when the map changes.
- **Mods**: A roguelite system where players pick upgrades every 5 waves. Logic in `src/game/Mods.ts` and `GameEngine.ts`.
- **Performance**: Uses `ObjectPool` for high-frequency entities, removed expensive Canvas shadows, and throttles React state updates to ensure 60FPS on mobile.

## Features

- **Game Speed**: Adjustable game speed (1x, 2x, 4x).

- **Towers**: 9 Types (Basic, Sniper, Rapid, Frost, Splash, Laser, Tack, Farm, Plasma).
- **Upgrades**: Deep Level 3 upgrades (e.g., Railgun, Double Tap, Cluster Bomb, Plasma Overdrive).
- **Targeting**: Towers have configurable targeting priorities (First, Last, Strongest, Weakest, Closest).
- **Maps**: 3 distinct layouts with different strategies.
- **Mods**: System upgrades (Damage, Range, Economy, etc.) offered periodically.
- **Mechanics**:
    - **Damage Types**: Physical, Explosive, Energy, Cold.
    - **Enemy Properties**: Camo (Invisible) and Regen (Healing) mechanics.
    - **Status Effects**: Robust system (`src/game/StatusEffects.ts`) for SLOW, BURN, STUN, WEAKEN.
    - **Resistances**: Enemies can be Heavy (Armored) or Shielded.
    - **Pierce**: Projectiles can hit multiple enemies.
- **Abilities**: "Orbital Strike" (Nuke) ability to clear enemies.
- **Enemies**: Various types with different speeds, health, and defenses.
- **Wave System**: Progressive difficulty.
- **Audio**: Procedural sound generation via `SoundManager` (Web Audio API).

## Development

- **Build**: Vite + Tailwind CSS v4.
- **Styling**: Tailwind for UI, Canvas API for game world.
- **Icons**: `lucide-react`.

## Agent Instructions

- When modifying game logic, prioritize `GameEngine.ts` and Entity classes.
- Ensure `notifyState()` is called in the Engine when game data changes that the UI needs to reflect.
- Keep the "Flat Neon" aesthetic. Avoid realistic textures.
- Maintain object pooling pattern for new projectile/particle types.
