# LAST SCAN — Work Log

Cross-machine running log. Newest entry on top. Updated on every `quicksave`
(see CLAUDE.md → Quicksave Protocol). Read the top entry first when resuming on
any machine.

---

## 2026-06-27 — Floor Plan GDD design-review (full) → MAJOR REVISION → revised

**What got done**
- Ran `/design-review design/gdd/floor-plan-system.md` in **full mode** — 4 adversarial
  specialists (game-designer, systems-designer, qa-lead, ux-designer) + creative-director
  synthesis. (Agents first died on a session-limit reset → resumed via SendMessage with
  context intact, not respawned.)
- **Verdict: MAJOR REVISION NEEDED.** Convergence across all 4 domains: Section B (Player
  Fantasy) promised horror the mechanics didn't deliver. Highest-confidence blocker (3/4
  reviewers): anomaly-reveal loop arm was permanent with no defined ARMED→DORMANT path.
- **Revised same session** (4 user decisions), then logged + index updated.

**Floor Plan revision — key decisions**
- Desync now lags the **player-position marker** (+ scan-state), not just the scan-state
  icon — this is what makes the anchor moment ("a room you already left") actually fire.
- Loop arming gated by **`loop_arm_floor`** (escalation floor, default 0.4); anomaly-reveal
  arm **re-arms above floor** after a **per-door** cooldown (was global → exploit closed).
- Desync curve **e² → e³** (truthful early, sharp late). Registry `desync_delay` expr updated.
- Weights made absolute (`w_t+w_c=1`, both-zero fallback). Coverage def pinned → closes
  floor-plan Open Q#2 (Scan Node owns `coverage = V/S`).
- **AC 23 → 34**: reworked untestable ACs (byte-identical / within-a-frame → unit-scope),
  added arm-by-reveal, clamp, normalization, per-door, position-marker, S=0/D0=0 guards.
- Deferred to dollhouse UX spec: access paradigm, KNOWN_STALE/CURRENT visual diff, marker
  visuals, colourblind coverage-ring. Open Q#6 added (§15-C2 loop-payload owner).

**State**
- Floor Plan status = **In Review (revised, re-review pending)**. Review log created:
  `design/gdd/reviews/floor-plan-system-review-log.md`.
- Scan Node (#4) still unreviewed.

**Next step**
- `/clear` → `/design-review design/gdd/floor-plan-system.md` (independent re-review, fresh
  session — expected to clear). Then review Scan Node (#4), `/consistency-check`, then
  `/design-system` Orchestrator (#5).

---

## 2026-06-27 — Scan Node System GDD complete (MVP 4/9)

**Cross-machine note**
- #4 was started in a separate session (Legion) but **never pushed**; that session was
  abandoned. #4 re-done fresh on **desktop** from scratch. If the old Legion session is
  still open, do NOT push from it — close it. No repo artifact from it exists to delete.

**What got done**
- `/design-system` (lean mode) authored **Scan Node System GDD** end-to-end:
  `design/gdd/scan-node-system.md`. All 8 sections + Visual/Audio + UI + Open Questions.
  **22 acceptance criteria** (18 Logic + 4 Integration), 1 formula + 2 derived metrics.
- Section D (systems-designer) + Section H (qa-lead) spawned per lean high-risk rule.

**Key design decisions (Scan Node)**
- Scan Node = **sole node-state authority**. It (not Scan Mechanic) emits the canonical
  `scan:complete` / `scan:abort` everyone listens for. Scan Mechanic only reports
  `scan:started` / `scan:captured`. (Provisional — confirm at Orchestrator #5 / Scan Mechanic #6.)
- **coverage = V / S**, S = count(STANDARD) + 1 anomaly node (NULL excluded), **fixed at init**.
  Escape (all standard, anomaly unscanned) tops at N/(N+1) < 100% (UI flags "incomplete");
  100% only by scanning the anomaly node = Completion Trap (§9). **This answers floor-plan Open Q#2.**
- **nodesCompleted UI counter uses a STANDARD-ONLY denominator** — deliberately diverges from
  coverage (escape player sees `12/12` AND `92%`). Flagged for creative-director at HUD GDD.
- Node types: STANDARD / ANOMALY_FINAL (scannable only after room reveal) / NULL (locked `[?]`).
- entityInFrame is RECORDED not detected — a valid scan that captures the entity STILL counts
  (the trap working as designed); sets entityEverCaptured for Win/Lose.
- `corruption_threshold` = 4 invalids → `scan:integrity_failure` (single fire).

**Registry** (`design/registry/entities.yaml`)
- NEW formula: `coverage` (source scan-node; referenced_by floor-plan `session_escalation`).
- NEW constant: `corruption_threshold` = 4.

**Systems index**
- #4 Scan Node → **Designed**. MVP designed = **4/9**. Added 3 Open Cross-System Items
  (nodesCompleted divergence for HUD, `scan:*` family for Orchestrator, plus existing entity-tier).
- Also committing untracked `.claude/agent-memory/ux-designer/` (dollhouse UX review from the
  floor-plan session — follows the already-tracked lead-programmer memory convention).

**rtk note (desktop):** `rtk` hook still broken (`rtk: command not found`) — all git run via
`/mingw64/bin/git` to bypass the hook rewrite.

**Next step**
- `/design-review` (fresh session) on floor-plan + scan-node (both unreviewed).
- `/consistency-check` across the 4 GDDs.
- Then `/design-system` **Orchestrator (#5)** — formalises `floorplan:*` / `scan:*` /
  `entity:proximity` event contracts (convergence point for 4 systems). Then Scan Mechanic (#6).

---

## 2026-06-27 — Floor Plan System GDD complete (MVP 3/9) + consistency PASS

**What got done**
- `/design-system` (lean mode) authored the **Floor Plan System GDD** end-to-end:
  `design/gdd/floor-plan-system.md`. All 8 required sections + Visual/Audio + UI +
  Open Questions. **23 acceptance criteria**, 2 formulas, 7 tuning knobs.
- `/consistency-check` full scan → **PASS, 0 conflicts** across all 3 GDDs.

**Key design decisions (Floor Plan)**
- Layout source: **curated pool of authored layouts** + runtime perception-stripping
  mutations (NOT procedural geometry). Seed code (§16-H2) selects a specific one.
- Divergence model: **one true layout + per-room view-state mask** — the dollhouse
  is a derived, lagging view (UNKNOWN → KNOWN_STALE → KNOWN_CURRENT).
- Looping geometry (§15-C2): **threshold teleport** — Floor Plan emits
  `floorplan:loop {targetPosition, targetYaw}`, FPS Movement applies the reposition.
- Anomaly reveal (§8): a **designated adjacent node completing**
  (`scan:complete {revealTriggerNodeId}`) unseals the room; dollhouse never shows it.
- Formulas: `session_escalation` e = clamp(w_t·t/T_session + w_c·coverage, 0,1);
  `desync_delay` = D0+(D_max−D0)·e² (quadratic — truthful early, degrades late).

**QA pass (qa-lead spawned for Acceptance Criteria)**
- Caught 3 coverage gaps + 5 untestable criteria. Added AC-D04 (desync growth),
  AC-E05 (SEALED freeze), AC-L05 (retroactive-loop suppression), AC-E06 (loopSpawn
  clamp), AC-E07 (chained reveals), AC-E08 (overlap AABBs). Rewrote AC-C02/C03/C06/
  C07/D02/D03 for testable observables. 17 → 23 criteria.

**Cross-system side-effects written**
- **FPS Movement GDD patched** — added `floorplan:loop` to its inbound interface
  (bidirectional consistency fix).
- **Registry** (`design/registry/entities.yaml`): +2 formulas (session_escalation,
  desync_delay), +2 constants (T_session 1500s, loop_trigger_tier NEAR);
  referenced_by += floor-plan on WALL_MARGIN, EYE_HEIGHT, proximity_tier_near.
- **Systems index**: Floor Plan → Designed; MVP 3/9; dollhouse UX note added.

**Flags**
- 📌 UX: dollhouse map needs `/ux-design` (`design/ux/dollhouse.md`) before UI/HUD epics.
- creative-director + CD-GDD-ALIGN pillar review skipped (lean) — review Player
  Fantasy manually before production.
- Entity tier vocabulary: concept §5 lists 5 proximity states; the event contract
  uses 4 (FAR/MEDIUM/NEAR/ADJACENT). Declare the canonical set when Entity (#9) is
  designed. (Not a conflict — informational.)

**Provisional contracts** (deps undesigned): Orchestrator `floorplan:*` events,
Scan Node `scan:complete`/node positions, Entity placement.

**Pipeline position:** 3/9 MVP systems designed.

**Next step:** `/design-review design/gdd/floor-plan-system.md` in a **fresh session**
(independent critique). Then `/design-system` for **Scan Node System** (#4, depends
on Floor Plan), then Orchestrator (#5).

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
