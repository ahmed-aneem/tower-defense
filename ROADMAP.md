# 🗺️ ROADMAP

## 🚨 Critical Refactoring (Antigravity Audit)
- [ ] **Split `src/game/GameEngine.ts`** (Current: 1039 lines)
    - [ ] Extract `WaveManager`
    - [ ] Extract `InputSystem`
    - [ ] Extract `RenderSystem`
    - [ ] Extract `ProjectileSystem`
- [ ] **Split `src/App.tsx`** (Current: 235 lines)
    - [ ] Extract `GameHUD` components
    - [ ] Extract `ControlPanel`
- [ ] **Split `src/game/Constants.ts`** (Current: 229 lines)
    - [ ] `EnemyConstants`
    - [ ] `TowerConstants`

## ✨ New Features
- [ ] (Pending User Request)

## 🚀 DevOps
- [ ] Setup GitHub Actions (CI/CD)
- [ ] Fix pre-existing lint errors in ObjectPool, QuadTree, Tower.
- [ ] Extract RenderSystem from GameEngine.
- [ ] Extract ProjectileSystem from GameEngine.
