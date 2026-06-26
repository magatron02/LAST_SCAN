# Technical Preferences

<!-- Populated by /setup-engine. Updated as the user makes decisions throughout development. -->
<!-- All agents reference this file for project-specific standards and conventions. -->

## Engine & Language

- **Engine**: Three.js (WebGL) — no game engine; vanilla JS + Vite
- **Language**: JavaScript (ES modules). TypeScript optional later, not now.
- **Rendering**: Three.js `WebGLRenderer`, point-cloud-first (`THREE.Points` / `BufferGeometry`)
- **Physics**: None — no physics engine. Movement is kinematic; collision via simple AABB/raycast against floor-plan walls.

## Input & Platform

- **Target Platforms**: Web browser (desktop-first). Static host (Vercel / Cloudflare Pages).
- **Input Methods**: Keyboard/Mouse
- **Primary Input**: Mouse (PointerLock look) + WASD
- **Gamepad Support**: None
- **Touch Support**: None
- **Platform Notes**: Requires PointerLock API (click-to-start). WebGL2 assumed.

## Naming Conventions

- **Classes**: PascalCase (`Scanner`, `EntityController`)
- **Variables**: camelCase
- **Signals/Events**: custom event names in SCREAMING_SNAKE or `'scan:complete'` namespaced strings (EventTarget)
- **Files**: lowercase, single-word where possible (`scanner.js`, `pointcloud.js`)
- **Scenes/Prefabs**: N/A — floor plans are JSON data, room geometry is GLTF
- **Constants**: SCREAMING_SNAKE_CASE in a shared `constants.js`

## Performance Budgets

- **Target Framerate**: 60 FPS desktop
- **Frame Budget**: 16.6 ms
- **Draw Calls**: Keep low — point cloud in as few `THREE.Points` objects as possible; merge geometry
- **Memory Ceiling**: Point cloud ≤ ~1–2M points per scene

## Testing

- **Framework**: Vitest (unit, logic-only — state machine, proximity math, scan validation)
- **Minimum Coverage**: Logic systems (scanner state machine, entity proximity, win/lose) must have unit tests
- **Required Tests**: Scan state transitions, entity proximity tiers, win/lose condition evaluation

## Forbidden Patterns

- No physics engine (kinematic only)
- No external HUD — all UI is diegetic (Matterport-style overlay)
- No jump scares — horror via error messages / point cloud distortion only
- No hardcoded gameplay values — proximity thresholds, scan timings, node counts live in config/data

## Allowed Libraries / Addons

- `three` (core)
- `three/examples/jsm/controls/PointerLockControls`
- `three/examples/jsm/loaders/GLTFLoader`
- Vite (dev server + build)
- Vitest (testing)
- Web Audio API (native — no audio lib)

## Architecture Decisions Log

<!-- Quick reference linking to full ADRs in docs/architecture/ -->
- [No ADRs yet — use /architecture-decision to create one]

## Engine Specialists

<!-- No Three.js-specific specialist agents exist in this template (it ships Godot/Unity/Unreal specialists). -->
<!-- Route web/JS work to the engine-agnostic programmer agents instead. -->

- **Primary**: gameplay-programmer (engine-agnostic)
- **Language/Code Specialist**: lead-programmer
- **Shader Specialist**: technical-artist (GLSL shaders for point cloud effects)
- **UI Specialist**: ui-programmer
- **Additional Specialists**: engine-programmer (Three.js render loop / point cloud perf)
- **Routing Notes**: Godot/Unity/Unreal specialist agents are NOT used on this project. Engine reference docs for Godot are also not authoritative here.

### File Extension Routing

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| Game code (`.js` modules) | gameplay-programmer |
| Shader / material files (`.glsl`, inline GLSL) | technical-artist |
| UI / screen files (`ui.js`, `.css`, `index.html`) | ui-programmer |
| Scene / level files (floor-plan `.json`, room `.gltf`) | level-designer |
| Render loop / point cloud core (`pointcloud.js`, `main.js`) | engine-programmer |
| General architecture review | Primary |
