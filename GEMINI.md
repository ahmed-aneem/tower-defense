# Neon Defense
**Project Overview**

This is a modern Tower Defense game built with React, TypeScript, and HTML5 Canvas. It features a "Flat" neon visual style using a Slate/Dark theme.

## Architecture

- **Game Engine**: `src/game/GameEngine.ts` manages the core game loop, canvas rendering, and entity management.
- **Entities**: Towers, Enemies, Projectiles, and Particles are classes in `src/game/`.
- **UI**: The HUD overlay is a React component (`src/components/HUD.tsx`) that communicates with the engine via a Ref and State callbacks.
- **State Management**: The Engine notifies React of state changes (money, lives, wave) to update the HUD.
- **Performance**: Uses `ObjectPool` for high-frequency entities (Projectiles, Particles) to ensure 60FPS on mobile.

## Features

- **Towers**: 6 Types (Basic, Sniper, Rapid, Frost, Splash, Laser).
- **Upgrades**: Towers can be upgraded to Level 3, gaining stats and visual changes.
- **Targeting**: Towers have configurable targeting priorities (First, Last, Strongest, Weakest, Closest).
- **Mechanics**:
    - **Damage Types**: Physical, Explosive, Energy, Cold.
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
