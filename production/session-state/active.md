# Active Session State

**Task:** Systems decomposition (map-systems)
**Status:** Systems index created — 13 systems enumerated, dependencies + priorities set
**File:** design/gdd/systems-index.md

## Key decisions this session
- Project stack: Godot template → **Three.js/WebGL** (web game per GDD)
- Main repo: github.com/magatron02/LAST_SCAN, branch `ls_main`
- GDD expanded v0.1 → v0.3 (§15 + §16 expansion mechanics)
- Inverted reward: 100% scan coverage = bad ending; deliberate incompletion = escape (§9)
- Perception stripping principle: Floor Plan = degrading guide, Scan Node = sole truth (§8) → kept as separate systems
- Entity ↔ Scan circular dep resolved via Orchestrator event bus

## Systems (13)
- MVP (9): Point Cloud, FPS Movement, Floor Plan, Scan Node, Orchestrator, Scan Mechanic, Entity, Win/Lose, UI/HUD
- Vertical Slice (2): Audio, Found-Footage Layer
- Alpha (2): Persistence, Cycle/Meta

## Prototype status
- Slice 1 done: point cloud room + FPS PointerLock movement (Vite + Three.js), build passes, runs at localhost:5173

## Next
- Design MVP GDDs in order: `/design-system` starting with Point Cloud Renderer (or Scan Mechanic = core verb)
- High-risk to prototype early: Point Cloud + Entity rendering (Type A void, Type C ghost geometry)
