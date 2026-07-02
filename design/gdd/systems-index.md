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
| 1 | Point Cloud Renderer | Core | MVP | Designed | design/gdd/point-cloud-renderer.md | — |
| 2 | FPS Movement | Core | MVP | Designed | design/gdd/fps-movement.md | — |
| 3 | Floor Plan System | Gameplay | MVP | Approved (round 4 independent re-review, 2026-06-30) | design/gdd/floor-plan-system.md | Point Cloud Renderer |
| 4 | Scan Node System | Gameplay | MVP | Approved (round 4 independent re-review, 2026-07-01) | design/gdd/scan-node-system.md | Floor Plan System |
| 5 | Persistence (localStorage) (inferred) | Persistence | Alpha | Not Started | — | — |
| 6 | Audio System | Audio | Vertical Slice | Not Started | — | Entity System |
| 7 | Session/Game State Orchestrator (inferred) | Core | MVP | In Review (round-3 NEEDS REVISION 2026-07-02, revised same session; round-4 entry condition MET — `npm run verify:registry` passes 14/0/5) | design/gdd/orchestrator.md | Point Cloud, FPS Movement, Scan Node |
| 8 | Scan Mechanic | Gameplay | MVP | Not Started | — | FPS Movement, Scan Node, Point Cloud, Orchestrator |
| 9 | Entity System | Gameplay | MVP | Not Started | — | Point Cloud, Floor Plan, Orchestrator |
| 10 | Win/Lose & Ending | Gameplay | MVP | Not Started | — | Scan Node, Entity System, Orchestrator |
| 11 | Cycle / Meta Layer | Meta | Alpha | Not Started | — | Persistence, Win/Lose, Orchestrator |
| 12 | UI / HUD | UI | MVP | Not Started | — | Scan Mechanic, Entity, Scan Node, Orchestrator |
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
| Design docs started | 5 |
| Design docs reviewed | 2 (Floor Plan — Approved 2026-06-30; Scan Node — Approved 2026-07-01) |
| Design docs approved | 2 (Floor Plan System, Scan Node System) |
| MVP systems designed | 5 / 9 |
| Vertical Slice systems designed | 0 / 2 |

---

## Open Cross-System Items

> Read by `/design-system` Phase 2. Resolve each when the named system is designed.

- **Entity System (#9) — canonical proximity-tier set.** The concept doc §5 lists
  **5** descriptive proximity states (Far / Medium / Near / Very near / Adjacent),
  but the `entity:proximity {tier}` event contract used by Point Cloud Renderer and
  Floor Plan (`loop_trigger_tier`) uses **4** tiers: `FAR / MEDIUM / NEAR /
  ADJACENT`. When designing Entity (#9), **declare the authoritative tier set** so
  every consumer agrees, and register it in `entities.yaml`. (Surfaced by
  `/consistency-check` 2026-06-27 — informational, not a conflict.)

- **UI/HUD (#12) — `nodesCompleted` vs `coverage` denominator divergence.** Scan
  Node (#4) intentionally uses a **standard-only** denominator for the `NODES
  COMPLETED X/Y` counter while `coverage` uses `N+1` (incl. anomaly node). The two
  numbers diverge on purpose (escape player sees `12/12` + `92%`). Confirm the
  player-experience framing with `creative-director` when designing the HUD, and do
  not "reconcile" the two denominators. (Scan Node Open Q#1.)

- **UI/HUD (#12) — inherited constraints from Scan Node's DEFERRED AC-SN31 + Trust
  ordering requirement.** Scan Node's UI Requirements specify `coverage` must be the
  visually **dominant** element over `nodesCompleted` (integer-completeness bias
  otherwise makes "12/12" read as more authoritative than "92.3%," backwards from the
  Inverted Reward's intent). AC-SN31 (DEFERRED (design)) tracks this as a priority but
  has **no measurable proxy** — the HUD GDD must write its own AC with one (font-size
  ratio, DOM order, contrast, or a playtest-verified trust read) rather than treat
  AC-SN31 as already-testable. Do not satisfy this with a technically-larger-but-
  psychologically-inert visual difference.

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
