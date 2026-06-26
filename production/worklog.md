# LAST SCAN — Work Log

Cross-machine running log. Newest entry on top. Updated on every `quicksave`
(see CLAUDE.md → Quicksave Protocol). Read the top entry first when resuming on
any machine.

---

## 2026-06-26 — Two MVP GDDs designed (Point Cloud Renderer + FPS Movement)

**What got done**
- `/design-system` (lean review mode) ran end-to-end for two systems back-to-back.
- **Point Cloud Renderer GDD** — COMPLETE: `design/gdd/point-cloud-renderer.md`. All 8
  required sections + Visual/Audio + UI + Open Questions. 19 acceptance criteria.
  4 formulas (scan materialize opacity ramp, anomaly sigma, proximity jitter, density).
- **FPS Movement GDD** — COMPLETE: `design/gdd/fps-movement.md`. All 8 sections +
  Open Questions. 18 acceptance criteria (qa-lead spawned). 4 formulas (frame delta
  with dt cap 0.1s, AABB clamp union-bounds, yaw, pitch with YXZ sign convention).
  Two modes: NAVIGATE (WASD 1.6 m/s + PointerLock) and SCAN_LOCKED (input revoked).

**Registry** (`design/registry/entities.yaml`)
- Point Cloud: 7 constants (base_density 900, density_budget_ceiling 1.5M,
  anomaly_sigma 2.5, scan_frame_duration 0.5, entity_influence_radius 5.0,
  proximity_tier_near, proximity_tier_adjacent).
- FPS Movement: 5 constants (MOVE_SPEED 1.6, EYE_HEIGHT 1.5, WALL_MARGIN 0.35,
  MOUSE_SENSITIVITY 0.0010, PITCH_LIMITS ±1.3963 rad).

**Key design decisions**
- Type A entity = invisible depth-only occluder mesh (not removed points) — Open
  Question, needs Three.js r171 prototype.
- Multi-room AABB = union of accessible room bounds (single rect); notched rooms =
  level-designer invisible blockers.
- Pitch ±80° not ±90° (gimbal). movementY negated (Three.js YXZ convention).
- dt hard-capped 0.1s (tab-restore anti-tunnelling; max 0.16m < WALL_MARGIN 0.35m).
- qa-lead flagged: dt must be a PARAMETER to update fn (testability for AC-EC03);
  AC-F04 pitch-sign is the likely first-pass inversion bug — test first.

**Pipeline position:** 2/9 MVP systems designed. systems-index.md updated.

**Next step:** `/design-system` for **Floor Plan System** (#3, Core layer, depends on
Point Cloud Renderer). Then Scan Node (#4), Orchestrator (#5). Eventually
`/design-review` on both completed GDDs in a fresh session.

---

## 2026-06-26 — Quicksave checkpoint (protocol live)

- Quicksave protocol confirmed operational and pushed (`ls_main`). No code/design
  changes since the previous entry — this is a continuity checkpoint.
- **Pipeline position:** `/map-systems` complete. Nothing in progress.
- **Next step:** `/design-system` for the first MVP system — start with **Point
  Cloud Renderer** (high-risk, prototype underway) or **Scan Mechanic** (core verb).
  Optional `/gate-check systems-design` first.

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
