# ADR-0006: Floor Plan — Data Model, Desync & Loop Architecture

## Status
Proposed

## Date
2026-07-02

## Last Verified
2026-07-02

## Decision Makers
magatron02 (owner) + architecture-review follow-up

## Summary
Pins the implementation architecture of the Floor Plan System: how the authoritative layout is loaded/validated, the two-contract init, the dollhouse mask, the two separate desync structures (position ring buffer + discrete scan-state queue), and the per-door loop state machine with threshold-crossing detection. Formulas are the GDD's; this ADR fixes the code structure and the UI transport seam (deferred to the UI/HUD ADR). LOW engine risk.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Three.js r171 — pure logic system; no direct rendering |
| **Domain** | Core / Gameplay logic |
| **Knowledge Risk** | LOW — plain JS state + math; no engine API surface |
| **References Consulted** | `design/gdd/floor-plan-system.md` (Core Rules 1–9, Formulas 1–2, Interaction Matrix, 46 ACs), ADR-0001 (bus), ADR-0005 (data schema) |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | None (logic-only; validated by Vitest against the GDD ACs) |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (bus wiring), ADR-0005 (property data schema it loads + validates) |
| **Enables** | Floor Plan implementation stories; Point Cloud Renderer (consumes `floorplan:update`), Scan Node (consumes `floorplan:init`/`reveal`), FPS Movement (consumes bounds + `floorplan:loop`) |
| **Blocks** | First Floor Plan implementation |
| **Ordering Note** | Core layer; after ADR-0005 (needs the schema). UI transport for the dollhouse view model is finalised in the UI/HUD ADR |

## Context

### Problem Statement
The Floor Plan GDD is exhaustively specified (9 Core Rules, 2 formulas, an Interaction Matrix, 46 ACs) but leaves the code structure open: how the two desync surfaces are stored, how loop threshold-crossing is detected from `player:position` samples, how the dollhouse mask is applied, and how the view model reaches UI without a direct import (Core Rule 5). Left unpinned, implementers will invent incompatible internal structures for the most interaction-dense system in the game.

### Constraints
- Owns spatial data, renders nothing; all output via the bus (ADR-0001).
- Loads the ADR-0005 property schema; owns load-time validation.
- Session lifecycle `LOADING/ACTIVE/SEALED` is the Orchestrator's project-wide machine — Floor Plan mirrors, does not re-own it.
- Formulas 1–2 are normative; this ADR adds no math.

### Requirements
Covers TR-fp-002..007, TR-fp-009.

## Decision

### (a) `FloorPlan(bus, config)` — loads, validates, projects into the two contracts
On construction/load: select a property (random or seed → ADR-0005 (f)), **validate** it (ADR-0005 (d): door widths, node-in-AABB, exactly one `ANOMALY_FINAL`, ≥1 `STANDARD`, loop targets) — reject+reselect on failure, hard-fail on pool exhaustion. Then emit **`floorplan:init`** once (full roster incl. hidden metadata, projected from `nodes[]` per ADR-0005 (b)) and **`floorplan:update`** with `STANDARD` geometry only. (TR-fp-002, TR-fp-007)

### (b) Dollhouse mask = a pure projection over a per-room view-state
The dollhouse view model is a **pure function** of the authoritative layout + a per-room `viewState` mask + the desync structures. It emits `STANDARD` room outlines/labels/`estimatedPosition` nodes + per-node freshness + the lagged marker; it **never** includes `ANOMALY` rooms (even after reveal), entity position, or a room's true real-time scan state inside its desync window. `LOCKED` rooms render as `[?]`. Building the view model never mutates state. (TR-fp-003, TR-fp-009)

### (c) Two independent desync structures, advanced on `session:tick`
- **Position ring buffer**: on each `player:position`, append `{t, x, y, z}`; retain ≥ `D_max + 1 s`. The dollhouse marker is sampled at `now − desync_delay(now)` with linear interpolation between adjacent samples; if the session is younger than the delay, use the oldest sample; hidden entirely while the player is in a map-absent (anomaly) room.
- **Discrete scan-state queue**: on each `scan:complete`, snapshot `delayAtEvent` and enqueue `{nodeId, applyAt = eventTime + delayAtEvent}`. A node is `KNOWN_STALE` while any update for it is pending; a room is `KNOWN_STALE` while any child node is stale. The same room cycles `CURRENT → STALE → CURRENT` per completed node.
Both are advanced in timestamp order on `session:tick`; at `desync_delay = 0` the effect is same-handler (no-op queue). (TR-fp-004)

### (d) Per-door loop state machine with an explicit crossing detector
Each `loopable` door holds `DORMANT/ARMED/TRIGGERED/COOLDOWN` (GDD state table). A **crossing detector** tracks, per door, whether the previous `player:position` sample was inside the door's threshold AABB and from which side; a loop fires only on a fresh outside→inside crossing from the non-loop side while `ARMED`, `loopTarget REVEALED`, and not `SCAN_LOCKED`. On fire: emit `floorplan:loop {targetPosition, targetYaw, toRoom}`, enter per-door `COOLDOWN` (`loop_cooldown`), emit **zero** `floorplan:update`. Arming: `(entity:proximity ≥ loop_trigger_tier OR anomaly revealed) AND e ≥ loop_arm_floor`. Reveal-while-cooldown queues (sets the permanent flag, never interrupts the timer — AC-L12). (TR-fp-005)

### (e) Formulas as pure functions reading latest-value inputs
`session_escalation(e)` and `desync_delay(e)` are pure functions (GDD Formulas 1–2). `e` reads the latest `scan:coverage` (a latest-value event, cached by the bus — ADR-0001/Orchestrator Rule 7) and the `session:tick` `elapsedSeconds` as `t`. Weight/curve guards (`w_t≤0.8`, `w_c≥0.2`, `D0<D_max`, sum=1) validate against **config** at load, separate from property validation. (TR-fp-006)

### (f) Reveal & mutation emit exactly one full-set `floorplan:update`; loops never do
Any geometry mutation (anomaly reveal) emits exactly **one** `floorplan:update` carrying the full current room set (renderer rebuilds BASE once, AC-E04/C06). The dollhouse is **not** updated on reveal (anomaly stays off the map). Reveal + loop in the same tick → reveal's `floorplan:update` before `floorplan:loop` (registered override, Orchestrator AC-OR10). (part of TR-fp-002/005)

### (g) View model transport to UI — method now, bus event deferred to UI/HUD ADR
FloorPlan exposes `getDollhouseViewModel()` (pure, (b)). The **transport** to UI/HUD (a latest-value `floorplan:viewmodel` bus event vs. the composition root wiring the read) is **deferred to the UI/HUD ADR** to preserve Core Rule 5 (no direct import). Recommended path: a latest-value `floorplan:viewmodel` event re-emitted on change (incl. per-tick marker movement) — flagged provisional, to be registered when UI/HUD is designed. This ADR does not finalise it. (TR-fp-009)

### Architecture Diagram
```
  ADR-0005 property JSON ──load+validate──▶ FloorPlan(bus, config)
                                             │ emit floorplan:init (once) + floorplan:update (STANDARD)
  bus in:  player:position ─▶ ring buffer (c)      ┌── viewState mask (b) ──▶ getDollhouseViewModel()
           session:tick    ─▶ advance queues, e/delay (c,e)
           scan:coverage   ─▶ e input (e)
           scan:complete   ─▶ reveal (f) + scan-state queue (c)
           entity:proximity─▶ loop arm (d)
           session:end     ─▶ SEALED
  bus out: floorplan:init / update / reveal / loop
```

### Key Interfaces
- `new FloorPlan(bus, { propertyIdOrSeed, T_session, w_t, w_c, D0, D_max, loop_trigger_tier, loop_cooldown, loop_arm_floor })`
- `getDollhouseViewModel()` → pure view model (rooms, labels, estimated nodes, freshness, lagged marker).
- Subscribes: `player:position`, `session:tick`, `scan:coverage`, `scan:started`, `scan:complete`, `scan:abort`, `entity:proximity`, `session:end`.
- Publishes: `floorplan:init`, `floorplan:update`, `floorplan:reveal`, `floorplan:loop`.

### Implementation Guidelines
- Never mutate the player transform — emit `floorplan:loop`; FPS Movement applies it (AC-C02).
- Position ring buffer and scan-state queue are separate structures, processed in timestamp order.
- All tuning from `config`; per-property authoring (`loopable`, `revealTriggerNodeId`) from the ADR-0005 file.

## Alternatives Considered

### Alternative 1: One combined desync structure for position + scan-state
- **Description**: a single timeline of both continuous and discrete updates.
- **Pros**: one structure.
- **Cons**: the two have different semantics (interpolated continuous vs snapshot-delayed discrete); merging them tangles the `CURRENT→STALE→CURRENT` cycling with marker interpolation.
- **Rejection Reason**: GDD Core Rule 6 explicitly separates them; two structures are clearer and match the ACs.

### Alternative 2: UI imports FloorPlan directly for the view model
- **Description**: UI/HUD calls `getDollhouseViewModel()` by importing the module.
- **Pros**: no new event.
- **Cons**: violates Core Rule 5 (no cross-system imports; ESLint zone rule, ADR-0001 (c)).
- **Rejection Reason**: transport must be the bus or composition-root-mediated — deferred to UI/HUD ADR.

## Consequences

### Positive
- The most interaction-dense system gets one pinned internal structure; the Interaction Matrix maps onto explicit components.
- Pure view model + pure formulas are directly Vitest-testable (no rendering).

### Negative
- The dollhouse view-model transport is left open (g) — a known, tracked seam, not a gap.

### Neutral
- Session lifecycle is mirrored from the Orchestrator, not re-owned.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Crossing detector misfires on fast frames / teleport | Medium | Medium | Detector keyed on per-door prev-inside + side; AC-L01/L05 cover it; dt-capped positions |
| View-model event emitted per tick is heavy | Low | Low | View model is small (KB); or debounce marker; finalised in UI/HUD ADR |

## Performance Implications
| Metric | Expected | Budget |
|--------|----------|--------|
| CPU (frame) | ring append + queue advance + e/delay eval | ≤ 0.5 ms (ADR-0003 Floor Plan slice) |
| Memory | ring buffer ≥ D_max+1s of positions (~seconds × 60) | negligible |

## Migration Plan
No existing Floor Plan module. Defines the first implementation.

**Rollback plan**: none — foundational logic system.

## Validation Criteria
- [ ] One `floorplan:init` (full roster) + first `floorplan:update` (STANDARD only) at load (AC-C01).
- [ ] Dollhouse view model excludes ANOMALY rooms before and after reveal (AC-C03).
- [ ] Desync marker lags per Formula 2; scan-state cycles CURRENT→STALE→CURRENT (AC-D04/D05/C08).
- [ ] Loop fires only on fresh crossing while ARMED; per-door cooldown; no BASE rebuild (AC-L01/L02/C06).
- [ ] Escalation `e` and `desync_delay` match Formulas 1–2 end-to-end (AC-D01/D06).

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/floor-plan-system.md` | Floor Plan | TR-fp-002 — two-contract init | (a) init once + update geometry |
| " | " | TR-fp-003 — dollhouse mask | (b) pure projection over view-state |
| " | " | TR-fp-004 — desync structures | (c) ring buffer + scan-state queue |
| " | " | TR-fp-005 — loop state machine | (d) per-door FSM + crossing detector |
| " | " | TR-fp-006 — escalation/desync formulas | (e) pure functions on latest-value inputs |
| " | " | TR-fp-007 — layout validation | (a) load-time validation per ADR-0005 (d) |
| " | " | TR-fp-009 — dollhouse view model | (b)+(g) pure view model, transport deferred |

## Related
- ADR-0001 (bus), ADR-0005 (data schema), ADR-0007 (Scan Node — reciprocal `scan:*`/`floorplan:*` seam).
- UI/HUD ADR (future) — finalises the dollhouse view-model transport (g).
