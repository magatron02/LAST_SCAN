# ADR-0004: Kinematic Movement + PointerLock Input

## Status
Proposed

## Date
2026-07-02

## Last Verified
2026-07-02

## Decision Makers
magatron02 (owner) + architecture-review follow-up

## Summary
Pins how FPS Movement is structured for implementation and testability: a `FpsMovement(bus, camera, config)` class with an injected-`dt` `update()`, driving the camera transform via the **native PointerLock API** (not `PointerLockControls`) so the GDD's exact yaw/pitch formulas and their ACs stay directly testable. Covers the two-state machine, AABB union-bounds collision, and dt-cap anti-tunnelling. LOW engine risk.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Three.js r171 (WebGL2) + native PointerLock API |
| **Domain** | Input / Core |
| **Knowledge Risk** | LOW — native PointerLock + `camera.rotation` YXZ are stable and in training data |
| **References Consulted** | `design/gdd/fps-movement.md` (Formulas 1–4, ACs), `docs/engine-reference/three/VERSION.md`, ADR-0001 (bus injection) |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | Native PointerLock `movementX/Y` sign/scale matches the GDD's rad/px sensitivity on the target browsers |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (bus wiring) — receives collision bounds and scan events via the injected bus |
| **Enables** | FPS Movement implementation stories; Scan Mechanic (drives camera during SCAN_LOCKED) |
| **Blocks** | First movement implementation |
| **Ordering Note** | Foundation layer, parallelisable with ADR-0002 |

## Context

### Problem Statement
The FPS Movement GDD fully specifies the math (yaw/pitch, AABB clamp, dt-cap) and 18 ACs, but leaves the implementation architecture open: which library owns the camera, how `dt` and input reach the update loop (the ACs demand synthetic `movementX`, injected oversized `dt`), and how the two-state machine is wired. Left unpinned, an implementer might reach for `PointerLockControls`, whose internal euler/sensitivity model differs from the GDD's formulas and would make AC-MOV03/F03/F04 untestable as written.

### Constraints
- No physics engine — kinematic only (`technical-preferences.md`).
- The GDD's formulas are normative: YXZ order, `MOUSE_SENSITIVITY` in rad/px, ±80° = ±1.3963 rad, dt cap 0.1 s **before** the delta.
- ACs require `dt` and input to be injectable (AC-EC03 "dt must be a parameter, not an internal clock read"; AC-MOV03/F03/F04 inject synthetic mouse deltas).
- Bus events only (ADR-0001).

### Requirements
Covers TR-mov-001..004, TR-mov-006, TR-mov-007.

## Decision

### (a) Native PointerLock API, not `PointerLockControls`
FPS Movement owns the `PerspectiveCamera` transform directly and drives it with the **browser-native PointerLock API** (`element.requestPointerLock()`, `pointerlockchange`, `mousemove` → `movementX/movementY`) plus the GDD's own Formula 3/4 applied to `camera.rotation` under `rotation.order = 'YXZ'`. `PointerLockControls` is *not* used: its euler handling and `pointerSpeed`/polar-angle model don't match the GDD's rad/px sensitivity and ±80° pitch clamp, and it would abstract away the exact values the ACs assert. Native API is also the lazier correct choice — no library wrapper for what is a few lines. (TR-mov-002, TR-mov-006)

### (b) `FpsMovement` class with injected-`dt`, injectable input source
```
new FpsMovement(bus, camera, config)
  update(dt)            // called each frame from main.js; dt is a PARAMETER
```
- `dt` is passed in and **capped to `config.dtCap` (0.1 s) as the first line**, before Formula 1 — never read from an internal clock (TR-mov-007, AC-EC03; matches the existing BUG-0001 fix in the prototype).
- Input is read through an **injectable input source** (default: real DOM `keydown`/`keyup` state map + accumulated `mousemove` deltas). Tests substitute a fake source to feed synthetic `movementX/Y` and key states — no real browser needed (AC-MOV03/F03/F04/EC03).
- `update()` in NAVIGATE: apply Formula 1 (delta) → Formula 2 (AABB clamp) → Formula 3/4 (yaw/pitch), write `camera.position`/`camera.rotation`, then publish `player:position {x,y,z}`. (TR-mov-001)

### (c) AABB union-bounds collision held locally, refreshed on `floorplan:update`
FpsMovement keeps `navigableBounds` (the union of accessible room AABBs) built from `floorplan:update` payloads and applies Formula 2's clamp each frame, including the degenerate-corridor guard (clamp to room centre when `effective_min > effective_max`). It never queries Floor Plan directly. `floorplan:loop {targetPosition, targetYaw, toRoom}` applies a one-frame reposition (position + yaw only; `toRoom` ignored here). (TR-mov-003)

### (d) Two-state machine driven by bus events
`NAVIGATE ⇄ SCAN_LOCKED`:
- `movement:scan_triggered {nodePosition}` → SCAN_LOCKED, snap `camera.position` to `nodePosition` once. Re-trigger while locked is a no-op (AC-TR02).
- In SCAN_LOCKED, `update()` is a **no-op on the transform** — all WASD/mouse ignored; camera *rotation* during the scan is Scan Mechanic's to drive later (undesigned), FpsMovement simply stops writing. `Escape` publishes `scan:abort` (AC-MOV08).
- `scan:complete` / `scan:abort` → NAVIGATE. (TR-mov-001)

### (e) PointerLock loss — world does not pause; suppress-vs-blind is a config flag
On `pointerlockchange` to unlocked, set an internal `pointerLocked=false`; mouse deltas read 0. Whether WASD is suppressed or allowed (blind retreat) during lock loss is **FPS Movement Open Q#1 (design, owner game-designer)** — the architecture exposes it as `config.suppressMoveOnLockLoss` so either behaviour ships without rework. The world/entity never pauses on lock loss (GDD Core Rule 5).

### Architecture Diagram
```
   bus (injected, ADR-0001)
     │ floorplan:update / floorplan:loop     │ movement:scan_triggered   │ scan:complete/abort
     ▼                                       ▼                           ▼
  ┌──────────────────── FpsMovement(bus, camera, config) ───────────────────┐
  │ state: NAVIGATE ⇄ SCAN_LOCKED                                           │
  │ inputSource (injectable): keys + mousemove movementX/Y                  │
  │ update(dt):  cap dt → Formula1 delta → Formula2 clamp(navigableBounds)  │
  │              → Formula3/4 yaw/pitch (YXZ) → write camera → publish       │
  └────────────────────────────────────────────────────────────────────────┘
     publishes: player:position {x,y,z} each frame; scan:abort on Escape
```

### Key Interfaces
- `new FpsMovement(bus, camera, { moveSpeed, eyeHeight, wallMargin, mouseSensitivity, pitchMin, pitchMax, dtCap, invertY, suppressMoveOnLockLoss })`
- `update(dt)` — frame tick from `main.js`.
- Subscribes: `floorplan:update`, `floorplan:loop`, `movement:scan_triggered`, `scan:complete`, `scan:abort`.
- Publishes: `player:position` (per frame), `scan:abort` (Escape in SCAN_LOCKED).

### Implementation Guidelines
- Extract yaw as `camera.rotation.y` under YXZ — never `getWorldDirection()` (GDD Formula 1 note).
- All tuning values from `config`, none hardcoded.

## Alternatives Considered

### Alternative 1: `three/examples/jsm/controls/PointerLockControls`
- **Description**: use the stock controls for lock + look.
- **Pros**: less boilerplate for the lock lifecycle.
- **Cons**: its euler/`pointerSpeed`/polar-angle model differs from the GDD's rad/px + ±80° YXZ formulas; would make AC-MOV03/F03/F04 untestable as written and hide the exact sensitivity.
- **Rejection Reason**: the GDD math is normative; native API matches it 1:1 with fewer lines.

### Alternative 2: `dt` read from an internal clock inside `update()`
- **Description**: `update()` calls `performance.now()` itself.
- **Pros**: caller passes nothing.
- **Cons**: directly violates AC-EC03; the oversized-`dt` tunnelling test can't inject a 0.5 s frame.
- **Rejection Reason**: testability requirement is explicit.

## Consequences

### Positive
- Every movement AC is headless-testable via injected `dt` + fake input source.
- Sensitivity/clamp exactly as specced; no library abstraction drift.

### Negative
- We hand-roll the small PointerLock boilerplate instead of using the stock control.

### Neutral
- Camera rotation during SCAN_LOCKED is left to Scan Mechanic — a deliberate seam, not a gap.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Browser `movementX/Y` scale/sign varies | Low | Medium | Verify against target browsers; `invertY` + sensitivity config |
| suppress-vs-blind design flip late | Low | Low | Already a config flag (e) |

## Performance Implications
| Metric | Expected | Budget |
|--------|----------|--------|
| CPU (frame) | Formula 1–4 + clamp | ≤ 0.2 ms (AC-PERF01 / ADR-0003 slice) |

## Migration Plan
No existing production movement module (only prototype `src/main.js`). This defines the first real module; the prototype's dt-cap fix (BUG-0001) carries forward as decision (b).

**Rollback plan**: none needed — foundational.

## Validation Criteria
- [ ] Two states only, never a third (AC-MOV01).
- [ ] `dt` injected + capped before delta; oversized `dt` cannot tunnel (AC-EC03).
- [ ] Synthetic `movementX=+100` → `rotation.y += 0.1000 rad` (AC-MOV03); pitch hard-clamps ±80° (AC-MOV04).
- [ ] AABB clamp holds wall margin; corridor degenerate guard clamps to centre (AC-F02, AC-EC).
- [ ] `player:position` published each frame; `movement:scan_triggered` snaps + locks (AC-TR01).

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/fps-movement.md` | FPS Movement | TR-mov-001 — two-state machine | (d) bus-event-driven NAVIGATE/SCAN_LOCKED |
| " | " | TR-mov-002 — kinematic WASD + PointerLock, no physics | (a) native PointerLock + Formula 1 |
| " | " | TR-mov-003 — AABB clamp + dt-cap | (b) capped dt, (c) union-bounds clamp |
| " | " | TR-mov-004 — PointerLock lifecycle, world doesn't pause | (e) native lifecycle + config flag |
| " | " | TR-mov-006 — YXZ camera + ±80° clamp | (a) direct `camera.rotation` YXZ |
| " | " | TR-mov-007 — injected `dt` testability | (b) `update(dt)` + injectable input source |

## Related
- ADR-0001 (bus wiring), ADR-0003 (movement per-frame slice).
- `design/gdd/fps-movement.md` Open Q#1 (suppress-vs-blind — deferred, exposed as config).
