# 🗼 Neon Defense (Tower Defense)

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

> A modern, high-performance Tower Defense game built with React 19, HTML5 Canvas, and a stunning "Flat Neon" aesthetic.

## ✨ Features

- **Neon Engine**: Custom high-frequency Canvas rendering engine for 60FPS performance.
- **Roguelite Mods**: Dynamic upgrade system offered every 5 waves for deep strategic variety.
- **Deep Tower Upgrades**: 9 tower types with branching Level 3 upgrades (e.g., Path A vs Path B for Railgun, Plasma Overdrive, etc.).
- **Complex Mechanics**: Damage types (Physical, Energy, Cold), Resistances, Pierce, and Status Effects (SLOW, BURN, STUN).
- **Procedural Audio**: Dynamic sound effects generated via Web Audio API.

## 🛠️ Tech Stack

- **Game Logic**: HTML5 Canvas + TypeScript
- **Framework**: React 19 (for HUD/UI)
- **Styling**: TailwindCSS 4.x
- **Build**: Vite 7.x

## 🚀 Play Now

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

## 🛡️ Antigravity Protocol

This project follows the **Antigravity** code standards:
- **Object Pooling**: Mandatory for projectiles and particles to ensure performance.
- **180-Line Limit**: Large files are split into specialized modules (e.g., `StatusEffects.ts`, `Maps.ts`).
- **Strict Typing**: Full typing for all game entities and engine states.
- **Neon Aesthetic**: Maintain flat visuals and vector-based rendering.

---

*"Strategy is just another word for survival."*
