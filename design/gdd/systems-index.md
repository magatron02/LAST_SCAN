# Systems Index: LAST SCAN

> **Status**: Draft
> **Created**: 2026-06-26
> **Last Updated**: 2026-07-02
> **Source Concept**: design/gdd/LAST_SCAN_GDD.md
>
> **UX note** — Floor Plan System has a UI surface (the dollhouse map). In
> Pre-Production run `/ux-design` for `design/ux/dollhouse.md` before writing
> UI/HUD epics.

---

## Overview

LAST SCAN is a web-based (Three.js) found-footage LIDAR horror game. The player is
an autonomous scanning unit documenting a residential property; the core loop is
**navigate → scan nodes → survive an entity that must not enter the scan data**.
The mechanical scope is built around point-cloud rendering, a locked scan state
machine, an entity proximity system, and a deliberately unreliable floor plan
("perception stripping", §8) — the player progressively loses the ability to
predict the space and must rely on live scan data alone. The signature systems are
the **inverted reward** (100% coverage = bad ending) and the **found-footage
framing** (the player is viewing a recovered session). Pillars: diegetic Matterport
UI, no jump scares, horror from the familiar made wrong, a found-footage cycle.

---

## Systems Enumeration

| # | System Name | Category | Priority | Status | Design Doc | Depends On |
|---|-------------|----------|----------|--------|------------|------------|
| 1 | Point Cloud Renderer | Core | MVP | In Review — **round-7 MAJOR REVISION NEEDED** (2026-07-26, MAJOR-by-process not by vision: 8 blockers + 8 recommended, **5 of the 8 introduced by round-6's own same-session fixes** — 62% self-inflicted; CD ruled no further same-session fixing on this document). +1 post-review addendum (Formula 5 pins `#include <output_fragment>`, which does not exist in r171 — renamed `opaque_fragment` in r152; a literal `.replace()` silently no-ops so the flicker never renders while AC-D08 still passes) +1 from the perf prototype = **10 blockers**. Both ADR-blocking prototypes RUN 2026-07-26: **Open Q#1 (occluder) GATE PASS** — 100% cull, zero colour written, 120/120 viewpoints, numeric readback that doubles as AC-C08 evidence; no longer blocks the ADR. **Open Q#7 (perf) FAILED and inverted the risk model** — rendering is a non-issue (136 avg FPS, 3M pts + jitter/flicker over the whole merged buffer) but Formula 2's CPU sampling pass cost **31–37 ms/pass**, ~2× the frame budget, un-amortized, on hardware faster than min-spec. Also measured: tile-index build 87 ms (broke AC-E04's same-frame rebuild); memory concern RETIRED (40 MB vs 8 GB); Q#1 T4 found the near-plane Edge Case unachievable as written (`material.side` unspecified, r171 `FrontSide` → player sees through the void). **CD track 2 COMPLETE 2026-08-01 — Formula 2 rebuilt once from its data sources: 3 of 10 blockers closed.** `ρ_base` is now **measured** (`N_base / A_tile`, the tile's own sealed BASE count) instead of predicted from `D × W_s`; `ρ_obs` is **subsampled** (128 pts/tile, systematic stride, never RNG) and the active set is **swept at 16 tiles/frame** instead of one pass, bounded at 2,048 points inspected per frame. `f_cov`, `ρ_base_eff` and `min_coverage_fraction` **deleted** — one derived constant `N_min = ceil(1/k_noise²)` replaces all three plus the joint noise guard open since round 4. Closed: blocker 1 (`f_cov` data source), blocker 3 (cost-bound arithmetic — deleted, not corrected; ADR-0002 (f) owns it now), the perf-prototype blocker, + 3 long-open recommended items. Found *by* the rebuild: the activity gate said "intersects" the frustum when it must say **fully inside** (edge-straddling tiles read as false deficits since round 3 — new AC-D12), and `k_noise`'s Poisson rationale was false under a measured baseline (restated as a sensitivity coefficient, every number unchanged). AC count **33 → 37**. ADR-0002 (f) and ADR-0003 (a)/(b) amended to match — ADR-0002 also still carried a `{type}` field in `renderer:anomaly_density`, a live contradiction with the round-3 type-oracle fix, now removed. **⚠ Perf closed by design, not measurement — Open Q#7 must be re-run against the rebuilt formula.** **⚠ AC-E06's contract is reversed, not clarified** (a duplicate `scan:capture_frame` no longer fires a positive-σ event). **7 blockers still OPEN and untouched, for CD track 3:** #2 Formula 1b guard overshoot, #4 `toneMapped=false` asymmetry, #5 AC-P01 window (c) backwards + unbarred, #6 `ghost_decimation_stride` spawn-time-only, #7 `flicker_rate` violates accessibility A-V3, #8 Level Design dependency undeclared, + the Formula 5 addendum. Round 8 must be fresh-context; CD exit criteria: <5 blockers, none self-inflicted, **none in Formula 2**. See review log | design/gdd/point-cloud-renderer.md | — |
| 2 | FPS Movement | Core | MVP | Designed | design/gdd/fps-movement.md | — |
| 3 | Floor Plan System | Gameplay | MVP | Approved (round 4 independent re-review, 2026-06-30) | design/gdd/floor-plan-system.md | Point Cloud Renderer |
| 4 | Scan Node System | Gameplay | MVP | Approved (round 4 independent re-review, 2026-07-01) | design/gdd/scan-node-system.md | Floor Plan System |
| 5 | Persistence (localStorage) (inferred) | Persistence | Alpha | Not Started | — | — |
| 6 | Audio System | Audio | Vertical Slice | Not Started | — | Entity System |
| 7 | Session/Game State Orchestrator (inferred) | Core | MVP | Approved (round-4 independent re-review, 2026-07-02) | design/gdd/orchestrator.md | Point Cloud, FPS Movement, Scan Node |
| 8 | Scan Mechanic | Gameplay | MVP | Designed | design/gdd/scan-mechanic.md | FPS Movement, Scan Node, Point Cloud, Orchestrator |
| 9 | Entity System | Gameplay | MVP | In Review (round-4 fresh-context review 2026-07-25 **NEEDS REVISION** — 9 blockers + 12 recommended, full-mode w/ creative-director synthesis; **round-3's "narrowing to zero structural findings" claim falsified** — round-4 found 2 BLOCKING acceptance criteria (AC-ES21, AC-ES10b) that failed against a mathematically correct implementation, undetected across 3 prior rounds + this round's first 6 specialists, plus a 4th+5th instance of the recurring "declared invariant, no load guard" class (`SCALE_CAP`, `SPEED_BASE>0`); **all 9 blockers + 8 recommended fixed same session** — 2 arithmetic corrections (Formula 2 & Formula 4 worked examples + their ACs), `SCALE_CAP`/`SPEED_BASE`/`type_c_trail_delay` load guards, Formula 4 eligible-room-set interface clarified (`floorplan:update`, not incremental reveal-tracking), Type B/retarget same-tick RNG ordering + bounded re-roll fallback, Type C pursuit-audio gap closed, Rule 9 ruling extended (not reopened) to A/B mechanical stakes + cross-session tell erosion. AC 65→71. **CD process ruling: round-5, if needed, should be a narrow single-reviewer arithmetic/invariant audit, not another 6-specialist pass** — the format has missed pure-arithmetic defects for 4 rounds running. Pending a FOURTH fresh-context re-review before Approved per standing don't-self-approve doctrine — see review log) | design/gdd/entity-system.md | Point Cloud, Floor Plan, Orchestrator |
| 10 | Win/Lose & Ending | Gameplay | MVP | Designed | design/gdd/win-lose-ending.md | Scan Node, Entity System, Orchestrator |
| 11 | Cycle / Meta Layer | Meta | Alpha | Not Started | — | Persistence, Win/Lose, Orchestrator |
| 12 | UI / HUD | UI | MVP | In Review (round-7 independent re-review 2026-07-15, 4 blockers resolved, AC 60→60; **Approved gated on producer mechanical citation-check hook** per CD — 5th consecutive round the citation class slipped a manual pass; no round-8 manual pass) | design/gdd/ui-hud.md | Scan Mechanic, Entity, Scan Node, Orchestrator |
| 13 | Found-Footage Layer | UI | Vertical Slice | Not Started | — | UI / HUD, Orchestrator, Entity System |

---

## Categories

| Category | Description | Systems |
|----------|-------------|---------|
| **Core** | Foundation systems everything depends on | Point Cloud Renderer, FPS Movement, Orchestrator |
| **Gameplay** | Systems that make the game work | Floor Plan, Scan Node, Scan Mechanic, Entity, Win/Lose |
| **Persistence** | Save state and continuity | Persistence (localStorage) |
| **UI** | Player-facing information displays | UI / HUD, Found-Footage Layer |
| **Audio** | Sound and music systems | Audio System |
| **Meta** | Systems outside the core game loop | Cycle / Meta Layer |

---

## Priority Tiers

| Tier | Definition | Target Milestone | Design Urgency |
|------|------------|------------------|----------------|
| **MVP** | Required for the core loop to function — test "is scanning under threat fun?" | First playable prototype | Design FIRST |
| **Vertical Slice** | One complete, atmospheric property with full sound and found-footage framing | Vertical slice / demo | Design SECOND |
| **Alpha** | Cross-session cycle, persistence, full procedural property pool | Alpha milestone | Design THIRD |
| **Full Vision** | Polish, edge cases, EVP/log lore depth, accessibility | Beta / Release | Design as needed |

---

## Dependency Map

### Foundation Layer (no dependencies)

1. **Point Cloud Renderer** — renders the world as LIDAR points; everything visual sits on it
2. **FPS Movement** — PointerLock camera + WASD; independent input/camera layer
3. **Persistence (localStorage)** — thin wrapper over `localStorage`; no game deps

### Core Layer (depends on foundation)

1. **Floor Plan System** — depends on: Point Cloud Renderer (renders geometry as points). Static guide that degrades (§8).
2. **Scan Node System** — depends on: Floor Plan System (`floorplan:init` roster + estimated positions; `floorplan:reveal` gate). Owns live node state — the only ground truth.
3. **Session/Game State Orchestrator** — depends on: Point Cloud, FPS Movement, Scan Node. Central event bus / state machine all systems publish to and read from.
4. **Scan Mechanic** — depends on: FPS Movement (locks camera), Scan Node (writes validity), Point Cloud (capture), Orchestrator.
5. **Entity System** — depends on: Point Cloud (appears as point anomalies), Floor Plan (placement), Orchestrator.

### Feature Layer (depends on core)

1. **Win/Lose & Ending** — depends on: Scan Node (coverage %), Entity (captured-in-scan), Orchestrator. Implements the inverted reward (§9).
2. **Cycle / Meta Layer** — depends on: Persistence, Win/Lose (final outcome), Orchestrator. Incrementing unit ID, accreting log, house memory (§16-I).

### Presentation Layer (depends on features)

1. **UI / HUD** — depends on: Scan Mechanic, Entity (proximity), Scan Node, Orchestrator. Error escalation, proximity bar, redacted results, self-diagnostics.
2. **Found-Footage Layer** — depends on: UI / HUD, Orchestrator, Entity. Viewer reveal, excised footage, playback artifacts (§16-F).

### Audio (cross-cutting)

1. **Audio System** — depends on: Entity System (adaptive proximity audio, §16-J). Base SFX/ambient bus is standalone; adaptive layer reads proximity via Orchestrator.

---

## Recommended Design Order

| Order | System | Priority | Layer | Agent(s) | Est. Effort |
|-------|--------|----------|-------|----------|-------------|
| 1 | Point Cloud Renderer | MVP | Foundation | gameplay-programmer / technical-artist | M |
| 2 | FPS Movement | MVP | Foundation | gameplay-programmer | S |
| 3 | Floor Plan System | MVP | Core | level-designer / gameplay-programmer | M |
| 4 | Scan Node System | MVP | Core | game-designer / gameplay-programmer | M |
| 5 | Session/Game State Orchestrator | MVP | Core | lead-programmer | M |
| 6 | Scan Mechanic | MVP | Core | game-designer / gameplay-programmer | L |
| 7 | Entity System | MVP | Core | systems-designer / ai-programmer | L |
| 8 | Win/Lose & Ending | MVP | Feature | game-designer | M |
| 9 | UI / HUD | MVP | Presentation | ux-designer / ui-programmer | L |
| 10 | Audio System | Vertical Slice | Cross-cutting | audio-director / sound-designer | M |
| 11 | Found-Footage Layer | Vertical Slice | Presentation | ux-designer / ui-programmer | M |
| 12 | Persistence (localStorage) | Alpha | Foundation | gameplay-programmer | S |
| 13 | Cycle / Meta Layer | Alpha | Feature | narrative-director / game-designer | M |

> Effort: S = 1 session, M = 2-3 sessions, L = 4+ sessions. Systems at the same
> layer with no mutual dependency may be designed in parallel (e.g. Point Cloud
> and FPS Movement).

---

## Circular Dependencies

- **Entity System ↔ Scan Mechanic** — scanning while an entity is near triggers
  aggression (§5), and a scan can capture the entity into node data (§9). Neither
  should import the other directly.
  **Resolution:** mediate through the Orchestrator event bus. Scan Mechanic emits
  `scan:active` / `scan:capture`; Entity emits `entity:proximity`. Each reads the
  other's events via the Orchestrator — no direct reference, no cycle.

---

## High-Risk Systems

| System | Risk Type | Risk Description | Mitigation |
|--------|-----------|-----------------|------------|
| Point Cloud Renderer + Entity | Technical | Entity types are point-cloud-native: Type A = *absence* of points (humanoid void), Type C = ghost second-room geometry. Rendering "missing data" convincingly and performantly is unproven. | Prototype each entity type early against the §6 spec; verify perf with 1–2M points. |
| Floor Plan System (perception stripping) | Design | Dollhouse desync + looping geometry (§15-C) risk reading as *bugs* rather than intentional horror. | Playtest the "map you can't trust" feel early; tune desync onset so it escalates clearly. |
| Found-Footage Layer | Technical | Convincing fake frame-drops / rewinds / excised-footage jumps without breaking input state. | Prototype playback artifacts in isolation; gate behind Orchestrator state so input stays consistent. |
| Scan Mechanic (locked scan) | Design | The locked, abort-or-wait scan (§3.2) must stay tense, not tedious, on repeat. | Tune scan duration + entity behavior during scan; verify the vulnerable-state feel. |

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| Total systems identified | 13 |
| Design docs started | 9 |
| Design docs reviewed | 3 (Floor Plan — Approved 2026-06-30; Scan Node — Approved 2026-07-01; Orchestrator — Approved 2026-07-02) |
| Design docs approved | 3 (Floor Plan System, Scan Node System, Session/Game State Orchestrator) |
| MVP systems designed | **9 / 9 — all MVP systems designed** |
| Vertical Slice systems designed | 0 / 2 |

---

## Open Cross-System Items

> Read by `/design-system` Phase 2. Resolve each when the named system is designed.

- ~~**Entity System (#9) — canonical proximity-tier set.**~~ **RESOLVED 2026-07-02**
  by `design/gdd/entity-system.md` Core Rule 1: the 4-tier set `FAR / MEDIUM / NEAR /
  ADJACENT` (already load-bearing in Point Cloud Renderer and Floor Plan) is ratified
  as canonical. The concept doc §5's descriptive "Very near" state is not a discrete
  tier — it describes the felt experience partway through `ADJACENT`'s own quadratic
  jitter curve. `proximity_tier_medium_max` (12.0m, new) completes the FAR/MEDIUM
  boundary in `entities.yaml`.

- ~~**UI/HUD (#12) — `nodesCompleted` vs `coverage` denominator divergence.**~~
  **RESOLVED 2026-07-07** by `design/gdd/ui-hud.md` — the GDD does not reconcile the
  two denominators; both render as-is, per Scan Node's original intent (Scan Node
  Open Q#1).

- ~~**UI/HUD (#12) — inherited constraints from Scan Node's DEFERRED AC-SN31 + Trust
  ordering requirement.**~~ **RESOLVED 2026-07-07** by `design/gdd/ui-hud.md` Core
  Rule 4: `coverage_dominance_ratio` (default 1.5×, new tuning knob) gives AC-SN31 a
  measurable proxy — larger font-size ratio + DOM/reading-order precedence — closing
  it as `AC-UH09`–`AC-UH12`.

- ~~**Entity System (#9) ↔ Point Cloud Renderer (#1) — `entity:transform {scale}` contract (NEW,
  2026-07-16).**~~ **RESOLVED 2026-07-18** by the Entity System design-review revision: Entity
  System now emits `entity:transform {scale}` (Core Rule 6, AC-ES17b) carrying Formula 1's
  `silhouette_scale`; `entities.yaml` registers the event (provisional — Orchestrator's formal
  relay registration remains its own `/design-system` Phase 5 step). Point Cloud Renderer already
  records the inbound contract. The growing-void tell (Player-Fantasy Anchor moment) can now
  render. (Point Cloud Renderer Open Q#5.)

- ~~**Entity System (#9) → Point Cloud Renderer (#1) — `entity:position {position}` inbound contract
  UNRECORDED.**~~ **RESOLVED 2026-07-25** by Point Cloud Renderer's round-6 design-review revision:
  `entity:position` is now recorded inbound in point-cloud-renderer.md's Interactions/Dependencies
  tables and drives Formula 3/5's CPU-side distance computation (new AC-C09). Both directions of
  this contract are now bidirectionally recorded.

- **Point Cloud Renderer (#1) ↔ Accessibility (`design/ux/accessibility-requirements.md` A-V3) — flicker
  ceiling VIOLATED (NEW, 2026-07-26, round-7 design-review).** A-V3 mandates a **≤3 flashes/s**
  ceiling plus a **reduced-distortion toggle** for `PROXIMITY_CORRUPTED` flicker + jitter, and is
  priority-flagged as the one accessibility requirement with a safety dimension ("must be
  implemented before any external playtest"). Point Cloud Renderer's `flicker_rate` (Formula 5)
  declares a safe range of **5–40 rad/s** — the upper bound is **6.37 Hz, over 2× the A-V3 ceiling**
  (the default 18 rad/s = 2.86 Hz sits barely under it). The renderer GDD never cites A-V3, offers
  no reduced-distortion toggle, and has no AC for either. **Resolve by:** narrowing `flicker_rate`'s
  safe range to satisfy ≤3 flashes/s (≤ ~18.8 rad/s), cross-referencing A-V3 in Formula 5 + Tuning
  Knobs, and adding a BLOCKING AC for the flash ceiling and the toggle. Owner: Point Cloud Renderer
  GDD; A-V3 also names UI/HUD as a co-implementer.

- **Point Cloud Renderer (#1) → Level Design — UNDECLARED DEPENDENCY (NEW, 2026-07-26, round-7
  design-review).** Point Cloud Renderer §B's round-6 Anchor-moment softening explicitly hands the
  "player self-discovers the Type A void before the system confirms it" pacing promise to **Level
  Design's scan-node placement** — how long a void sits in a node's sightline before capture, and
  from what approach angle. But Level Design appears **nowhere in this systems index** (not in the
  enumeration, dependency map, or design order) and is absent from the renderer's own Dependencies
  section, violating the project's bidirectional-dependency rule. Consequence: every renderer AC can
  pass, the system ships "done," and the Analyst→Witness transition never lands — with no gate to
  catch it. **Resolve by:** deciding whether Level Design is a tracked system (add to the index) or
  whether the placement constraint belongs to Floor Plan / Scan Node, then recording the dependency
  in both directions. Owner: producer + creative-director.

- **Orchestrator (#5) — `scan:*` + `floorplan:*` contracts.** Scan Node (#4) emits
  authoritative `scan:complete` / `scan:abort` / `scan:coverage` /
  `scan:integrity_warning` / `scan:integrity_failure`, and consumes `scan:started` /
  `scan:captured` from Scan Mechanic (#6). Floor Plan now separates the complete
  internal roster (`floorplan:init`, once) from renderable geometry
  (`floorplan:update`, on init/reveal/actual geometry mutation), and consumes
  `player:position`, `session:tick`, plus scan-state events for desync and loop
  crossing. Orchestrator must formalise this whole family. (Floor Plan/Scan Node
  Dependencies §.)

---

## Immediate Next Steps (cross-machine)

1. Floor Plan System **Approved** (2026-06-30, round 4) — done.
2. Scan Node System **Approved** (2026-07-01, round 4, unanimous) — done.
3. Then `/consistency-check` across all 4 GDDs.
3. Then `/design-system` for **Orchestrator (#5)** — the event bus that formalises
   the `floorplan:*` / `scan:*` / `entity:proximity` contracts every designed GDD
   assumes. This is the convergence point for 4 systems' provisional event names.
4. Then Scan Mechanic (#6) — the scan *verb* (360° lock, abort) that drives Scan
   Node via `scan:started` / `scan:captured`.

---

## Next Steps

- [ ] Review and approve this systems enumeration
- [ ] Design MVP-tier systems in order (use `/design-system [system-name]`)
- [ ] Run `/design-review` on each completed GDD
- [ ] Run `/gate-check pre-production` when MVP systems are designed
- [ ] Prototype the high-risk Point Cloud + Entity rendering before committing to Production
