# LAST SCAN — Work Log

Cross-machine running log. Newest entry on top. Updated on every `quicksave`
(see CLAUDE.md → Quicksave Protocol). Read the top entry first when resuming on
any machine.

---

## 2026-06-26 — Project setup, stack pivot, GDD expansion, systems decomposition

**Repo / infra**
- Cloned `Donchitos/Claude-Code-Game-Studios` template into `last_scan project`.
- Main repo set to **github.com/magatron02/LAST_SCAN**, working branch **`ls_main`**
  (repo default; deleted the leftover `main` branch). `origin` points here.
- Multi-machine workflow: desktop + Legion laptop on the same repo.

**Stack pivot (Godot template → Three.js web game)**
- The template ships configured for Godot 4.6; the game (per GDD) is a **Three.js /
  WebGL web game**. Reconfigured `.claude/docs/technical-preferences.md` to the web
  stack and noted Godot/Unity/Unreal specialist agents are NOT used (route to
  engine-agnostic programmer agents). Updated CLAUDE.md Technology Stack too.

**Prototype — slice 1 (DONE, builds + runs)**
- Vite + Three.js scaffold. Files: `index.html`, `styles/ui.css`, `src/main.js`
  (PointerLock FPS + WASD, robot-gait speed, AABB room clamp), `src/pointcloud.js`
  (samples points on 6 inner box surfaces = LIDAR look). `vite.config.js` aliases
  `three/addons`. `npm run build` passes; dev server at localhost:5173. Title
  screen verified in preview (PointerLock can't engage in sandbox iframe — test in
  a real browser by clicking).

**GDD — expanded v0.1 → v0.3** (`design/gdd/LAST_SCAN_GDD.md`)
- v0.2 §15: depth-only preview, dollhouse desync, looping geometry, timestamp
  drift, auto-typed log, signal decay, redacted scan results, **inverted reward**.
- Inverted reward reworked §9/§10: **100% coverage = bad ending (Completion Trap)**
  via the §8 anomaly-room final node; **deliberately leaving the anomaly room
  unscanned = Escape**. UI never tells the player which ending they got.
- v0.3 §16: found-footage framing (viewer reveal, excised footage `[FOOTAGE
  MISSING]`, playback artifacts), scanner identity (self-diagnostic creep,
  mechanical memory), property variety/replay (personality, seed code),
  cross-session cycle meta via **localStorage** (incrementing unit ID, accreting
  log, house memory), audio depth (servo-whir heartbeat, EVP, silence-as-tell).
- §8 added the **Perception Stripping** principle: the floor plan is a rough early
  guide that degrades into unreliability; live scan data is the only ground truth.
  The unknown is the core horror lever.

**Systems decomposition (DONE)** — `design/gdd/systems-index.md`
- 13 systems, dependency-layered. Priorities: **MVP (9)** Point Cloud, FPS
  Movement, Floor Plan, Scan Node, Orchestrator, Scan Mechanic, Entity, Win/Lose,
  UI/HUD · **Vertical Slice (2)** Audio, Found-Footage Layer · **Alpha (2)**
  Persistence (localStorage), Cycle/Meta.
- Floor Plan (static degrading guide) and Scan Node (live authoritative state) kept
  as **separate** systems — per the perception-stripping principle.
- Circular dep **Entity ↔ Scan Mechanic** resolved via the Orchestrator event bus
  (publish/subscribe, no direct import).
- High-risk to prototype early: **Point Cloud + Entity rendering** (Type A = void of
  points, Type C = ghost second-room geometry), perception-stripping feel,
  found-footage artifacts.

**State**
- Done: repo set up, stack pivoted, prototype slice 1, GDD v0.3, systems index.
- Pending commit at time of writing: GDD §8 update, systems-index.md, CLAUDE.md
  edits, this worklog (being committed now on quicksave).

**Next step**
- Pipeline position: finished `/map-systems`. Next is `/design-system` for MVP
  systems in design order — start with **Point Cloud Renderer** (high-risk,
  prototype already underway) or **Scan Mechanic** (the core verb).
- Optional: `/gate-check systems-design` for a director sign-off before authoring GDDs.
