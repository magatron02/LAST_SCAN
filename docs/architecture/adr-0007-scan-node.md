# ADR-0007: Scan Node — Registry + Coverage Authority

## Status
Proposed

## Date
2026-07-02

## Last Verified
2026-07-02

## Decision Makers
magatron02 (owner) + architecture-review follow-up

## Summary
Pins the implementation architecture of the Scan Node System: the node registry + per-node state machine, `coverage = V/S` as a pure derivation, the synchronous state-update-before-emit ordering that makes `scan:coverage` and `scan:complete.coverage` equal in a tick (AC-SN29), the integrity accumulator, and the deliberately-divergent `nodesCompleted` vs `coverage` metrics. Node-ledger view-model transport defers to the UI/HUD ADR. LOW engine risk.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Three.js r171 — pure logic system; renders nothing |
| **Domain** | Core / Gameplay logic |
| **Knowledge Risk** | LOW — plain JS state machine + integer ratio; no engine API surface |
| **References Consulted** | `design/gdd/scan-node-system.md` (Core Rules 1–9, Formula 1, Cross-System Invariants, 26 ACs), ADR-0001 (bus), ADR-0005 (authoritative positions), ADR-0006 (Floor Plan seam) |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | None (logic-only; Vitest against the GDD ACs; AC-SN30 composition test with real `floorplan:init`) |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (bus), ADR-0005 (reads `authoritativePosition`), ADR-0006 (consumes `floorplan:init`/`reveal`, emits `scan:complete` Floor Plan reads) |
| **Enables** | Scan Node implementation stories; Win/Lose (reads coverage/flags), Point Cloud Renderer (`scan:complete` → materialization), FPS Movement (`scan:complete`/`abort` unlock) |
| **Blocks** | First Scan Node implementation; the deferred AC-SN22/SN30 contract tests |
| **Ordering Note** | Core layer; the project's most densely-connected hub (5 downstream consumers) |

## Context

### Problem Statement
The Scan Node GDD specifies the state machine, coverage math, and 26 ACs, plus a Cross-System Invariants table naming every shared assumption — but leaves the code structure open: how the registry is stored, how coverage stays a *pure* function while counters are read hot, and how the synchronous "state-updated-before-emit" ordering (AC-SN29) is implemented so `scan:coverage` and `scan:complete.coverage` are provably equal in a tick. As the hub with 5 consumers, an ad-hoc internal structure here propagates breakage widely.

### Constraints
- Single source of node truth; renders nothing; all flow via the bus (ADR-0001).
- `coverage` must be a **pure function of node states**, derivable from the registry, no side effects (GDD testability requirement).
- `S = count(STANDARD)+1` fixed at init, invariant under `floorplan:reveal`.
- Scan Node **emits the canonical** `scan:complete`/`scan:abort`; internal state must be updated before emission (AC-SN29).

### Requirements
Covers TR-sn-001, TR-sn-003..008. (TR-sn-002 authoritative positions is ADR-0005.)

## Decision

### (a) `ScanNode(bus, config)` — registry as `Map<nodeId, NodeState>`
Roster built from `floorplan:init.nodeRoster`: one `NodeState { nodeId, roomId, type, status, scannable, position, entityCaptured }` per entry. `position` adopts `authoritativePosition` (ADR-0005 (b)), falling back to `estimatedPosition`. `ANOMALY_FINAL` starts `scannable=false`; `NULL` is permanent. Geometry-only `floorplan:update` never touches the registry. (TR-sn-001)

### (b) `coverage()` is a pure derivation; `S` fixed once at init
`S = count(type===STANDARD) + 1` (the single `ANOMALY_FINAL`; `NULL` excluded) computed **once at init** and never changed by reveal. `coverage()` returns `countValid() / S` where `countValid()` counts `status===VALID` over the registry — a pure recompute each call (≤16 nodes; trivial). No cached mutable counter to drift from the registry (satisfies "pure function of node states"). `S=0` guard: return `0.0` + one `console.error` (AC-SN15). (TR-sn-003)

### (c) State machine + rejection gates
Per-node `UNSCANNED → SCANNING → (VALID | INVALID)`; `NULL` terminal. Transitions driven only by Scan Mechanic events:
- `scan:started {nodeId}` → SCANNING, **rejected** (no-op) for NULL, already-VALID, or hidden `ANOMALY_FINAL` (`scannable=false`).
- `scan:captured {nodeId, valid, entityInFrame}` on a SCANNING node → VALID or INVALID; **rejected** for any non-SCANNING node.
- `floorplan:reveal {roomId}` flips the room's `ANOMALY_FINAL` `scannable=true` (idempotent). (TR-sn-001)

### (d) Synchronous state-before-emit; both coverage events equal in-tick
On `scan:captured {valid:true}`, the handler **mutates registry state first** (status→VALID, record `entityCaptured`), **then** recomputes `coverage()`, **then** emits `scan:coverage {coverage}` and `scan:complete {nodeId, valid, entityCaptured, coverage}` synchronously in the same handler — both carrying the identical freshly-computed value (AC-SN29). A listener reading state synchronously inside its `scan:complete` handler observes VALID + updated coverage. The bus's registered atomic-adjacency override (`{scan:coverage, scan:complete}`, ADR-0001 / Orchestrator Rule 4) guarantees no unrelated event interleaves on delivery. `scan:coverage` is the **canonical** broadcast; `scan:complete.coverage` is the guaranteed-equal same-tick snapshot. (TR-sn-004)

### (e) Integrity accumulator — monotonic, single-fire threshold
`integrityCount` increments on each INVALID capture; at `corruption_threshold` (default 4) emit `scan:integrity_failure` **once**; further invalids increment but never re-emit. Below threshold each invalid emits `scan:integrity_warning {count}`. Win/Lose owns the ending. (TR-sn-005)

### (f) `entityCaptured` recorded, not surfaced
On `scan:captured {valid:true, entityInFrame:true}` the node still becomes VALID (the trap working as designed); record per-node `entityCaptured=true` and session-level `entityEverCaptured=true`. **Not exposed** in the view model — surfacing waits on §15-D3/§16-J2 (Open Q#5, deferred). Win/Lose reads the flag directly. (TR-sn-006)

### (g) Two distinct derived metrics — never reconciled
`coverage()` uses the `N+1` denominator (b). `nodesCompleted()` returns `{X: countValidStandard(), Y: countStandard()}` — a **standard-only** denominator, `ANOMALY_FINAL` absent until revealed. The two intentionally diverge (escape player sees `12/12` + `92.3%`); implementers must not "fix" the mismatch. Both are pure derivations. (TR-sn-007)

### (h) Node-ledger view model — method now, transport deferred
`getNodeLedgerViewModel()` returns `{ nodes:[{nodeId, roomId, status, displayPosition}], coverage, nodesCompleted:{X,Y}, integrityCount }` (excludes `entityCaptured` per (f)). Same transport deferral as Floor Plan (ADR-0006 (g)): the UI/HUD ADR finalises whether this rides a latest-value bus event or composition-root wiring — Core Rule 5 forbids UI importing ScanNode. The GDD's "coverage dominant + non-colour channel" is a UI-render constraint carried into the UI/HUD GDD/ADR, not implemented here. (TR-sn-008)

### Architecture Diagram
```
  bus in:  floorplan:init ─▶ build Map<nodeId,NodeState>, S = count(STANDARD)+1 (a,b)
           floorplan:reveal ─▶ flip ANOMALY_FINAL scannable (c)
           scan:started ─▶ gate → SCANNING (c)
           scan:captured ─▶ mutate state → coverage() → emit both (d)
  ┌──────────────── ScanNode(bus, config) ────────────────┐
  │ registry (Map) · coverage()/nodesCompleted() pure (b,g)│
  │ integrityCount (e) · entityEverCaptured (f)            │
  │ getNodeLedgerViewModel() (h)                           │
  └────────────────────────────────────────────────────────┘
  bus out: scan:complete / scan:abort / scan:coverage(canonical) /
           scan:integrity_warning / scan:integrity_failure
```

### Key Interfaces
- `new ScanNode(bus, { corruption_threshold })`
- `coverage()`, `nodesCompleted()`, `getNodeLedgerViewModel()` — pure reads.
- Subscribes: `floorplan:init`, `floorplan:reveal`, `scan:started`, `scan:captured`.
- Publishes: `scan:complete`, `scan:abort`, `scan:coverage`, `scan:integrity_warning`, `scan:integrity_failure`.

### Implementation Guidelines
- `scan:started`/`scan:captured`/`floorplan:*` injectable via the bus in Vitest (no real Scan Mechanic/Floor Plan). Coverage asserts `toBeCloseTo(_, 10)`.
- Keep `coverage()`/`nodesCompleted()` side-effect free — the testability contract depends on it.
- Emit order in (d) is one synchronous handler — do not defer either emission to a later tick.

## Alternatives Considered

### Alternative 1: Cached mutable `V` counter incremented on transition
- **Description**: keep a running valid-count instead of recomputing.
- **Pros**: O(1) coverage read.
- **Cons**: a second source of truth that can drift from the registry; breaks "coverage is a pure function of node states."
- **Rejection Reason**: registry is ≤16 nodes — recompute is free; purity is the explicit requirement.

### Alternative 2: Emit `scan:complete` then compute coverage in a follow-up tick
- **Description**: fire completion first, broadcast coverage later.
- **Cons**: violates AC-SN29; a consumer reading state in its `scan:complete` handler sees stale coverage; the two coverage values could differ across ticks.
- **Rejection Reason**: synchronous state-before-emit is a normative guarantee.

## Consequences

### Positive
- The 5-consumer hub has one pinned structure; coverage purity keeps every consumer's read consistent.
- AC-SN29's equality is structural (one synchronous handler), not hoped-for.

### Negative
- View-model transport deferred (h) — a tracked seam shared with Floor Plan.

### Neutral
- `entityCaptured` is dark data until D-3/EVP — intentional, per Open Q#5.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| A consumer diffs successive `coverage` values as a delta | Low | Medium | GDD contract "read as level"; idempotent re-completes rejected (AC-SN09) |
| `S` invariant broken by a malformed init payload | Low | High | ADR-0005 validation + AC-SN30 composition test on the real seam |

## Performance Implications
| Metric | Expected | Budget |
|--------|----------|--------|
| CPU (per scan event) | O(nodes) coverage recompute (~16) | negligible; off the per-frame path |

## Migration Plan
No existing Scan Node module. Defines the first implementation.

**Rollback plan**: none — foundational logic system.

## Validation Criteria
- [ ] Roster built from `floorplan:init`; `S=count(STANDARD)+1` fixed, invariant under reveal (AC-SN01/03/14).
- [ ] State machine + all rejection gates (NULL, VALID, hidden ANOMALY_FINAL, non-SCANNING) (AC-SN08–11).
- [ ] `coverage` pure; escape=0.923, trap=1.000; `S=0` guard (AC-SN12/13/15).
- [ ] `scan:coverage` == `scan:complete.coverage` same-tick; state VALID before emit (AC-SN29).
- [ ] `nodesCompleted` standard-only, diverges from coverage (AC-SN16).
- [ ] Integrity fires exactly once at threshold (AC-SN18); entity-in-frame keeps node VALID (AC-SN17).

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/scan-node-system.md` | Scan Node | TR-sn-001 — registry + state machine | (a)/(c) Map + gated transitions |
| " | " | TR-sn-003 — coverage=V/S pure | (b) pure derivation, S fixed at init |
| " | " | TR-sn-004 — canonical emission, state-before-emit | (d) synchronous mutate→compute→emit both |
| " | " | TR-sn-005 — integrity accumulator | (e) monotonic + single-fire |
| " | " | TR-sn-006 — entityCaptured recording | (f) recorded, not surfaced |
| " | " | TR-sn-007 — nodesCompleted vs coverage divergence | (g) two pure derivations, never reconciled |
| " | " | TR-sn-008 — node-ledger view model | (h) pure method, transport deferred |

## Related
- ADR-0001 (bus + atomic override), ADR-0005 (authoritative positions), ADR-0006 (Floor Plan seam).
- `design/gdd/scan-node-system.md` AC-SN22/SN30 (deferred contract/composition tests).
- UI/HUD ADR (future) — node-ledger transport + coverage-dominant render.
