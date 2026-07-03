# Architecture Review Report

- **Date:** 2026-07-02
- **Mode:** full (`/architecture-review`)
- **Engine:** Three.js (WebGL2) — vanilla JS ES modules + Vite (no game engine)
- **GDDs Reviewed:** 5 designed systems (Point Cloud Renderer, FPS Movement, Floor Plan, Scan Node, Orchestrator) + concept doc
- **ADRs Reviewed:** 1 (ADR-0001, status `Proposed`)
- **Note:** First architecture-review run — the TR registry was empty. This pass establishes the requirements baseline (42 TR-IDs) and the ADR backlog.

---

## Traceability Summary

| | Count |
|---|---|
| Total requirements | **42** |
| ✅ Covered | **4** |
| ⚠️ Partial | **5** |
| ❌ Gap | **33** |

Only **ADR-0001 (Orchestrator Bus Wiring)** exists, and it is still `Proposed`. It covers four wiring decisions: (a) composition-root DI, (b) override-table storage, (c) import-boundary enforcement, (d) delivery-before-render + perf tripwire. Every other requirement — all of the Foundation layer (Point Cloud Renderer, FPS Movement) and all of the Core gameplay systems (Floor Plan, Scan Node) plus the Orchestrator's own registry/state-machine/caching semantics — is uncovered.

## Full Traceability Matrix

### Point Cloud Renderer (Foundation)
| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-pc-001 | Player-visible output is `THREE.Points` only; no visible meshes | — | ❌ |
| TR-pc-002 | Additive layer stack (BASE/ENTITY_SPIKE/ENTITY_GHOST/VOID_MASK) | — | ❌ |
| TR-pc-003 | Type A void = depth-only invisible occluder (r171 OQ1, **HIGH engine risk, unresolved**) | — | ❌ |
| TR-pc-004 | Point budget ceiling (~1.5M) + auto-scale + single-frame rebuild | — | ❌ |
| TR-pc-005 | 60 FPS at budget ceiling (AC-P01 ≥55) | — | ❌ |
| TR-pc-006 | Consume floor-plan AABB/surfaces via bus → build BASE | — | ❌ |
| TR-pc-007 | Per-frame BufferGeometry jitter mutation | — | ❌ |
| TR-pc-008 | Scan materialization overlay + seal into BASE | — | ❌ |
| TR-pc-009 | Emit `renderer:anomaly_density` | — | ❌ |

### FPS Movement (Foundation)
| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-mov-001 | Two-state machine NAVIGATE / SCAN_LOCKED | — | ❌ |
| TR-mov-002 | Kinematic WASD + PointerLock, no physics engine | — | ❌ |
| TR-mov-003 | AABB clamp vs union-bounds + dt-cap anti-tunnel | — | ❌ |
| TR-mov-004 | PointerLock lifecycle (world doesn't pause on loss) | — | ❌ |
| TR-mov-005 | Bus integration (`player:position` out; scan/loop in) | ADR-0001 | ⚠️ (injection pattern only) |
| TR-mov-006 | Camera yaw/pitch via `rotation` YXZ + ±80° clamp | — | ❌ |
| TR-mov-007 | `dt` injected as parameter (testability) | — | ❌ |

### Floor Plan System (Core)
| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-fp-001 | Owns authoritative PropertyLayout data; pool/seed selection | — | ❌ |
| TR-fp-002 | Two-contract init (`floorplan:init` once + `floorplan:update`) | — | ❌ |
| TR-fp-003 | Dollhouse derived view via per-room mask | — | ❌ |
| TR-fp-004 | Position ring buffer + snapshotted scan-state desync queue | — | ❌ |
| TR-fp-005 | Loop per-door state machine + threshold crossing | — | ❌ |
| TR-fp-006 | `session_escalation` + `desync_delay` formulas | — | ❌ |
| TR-fp-007 | Layout validation at load (widths, 1× ANOMALY_FINAL, guards) | — | ❌ |
| TR-fp-008 | `floorplan:*` bus integration | ADR-0001 | ⚠️ (injection only) |
| TR-fp-009 | Dollhouse view model to UI/HUD | — | ❌ |

### Scan Node System (Core)
| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-sn-001 | Node registry + per-node state machine | — | ❌ |
| TR-sn-002 | Roster from init + authoritative positions (`data/sessions/`, **pipeline unspecified Q#4**) | — | ❌ |
| TR-sn-003 | `coverage = V/S` pure function (S = STANDARD+1) | — | ❌ |
| TR-sn-004 | Canonical `scan:*` emission, state-before-emit (AC-SN29) | ADR-0001 | ⚠️ (ordering guarantee only) |
| TR-sn-005 | Integrity accumulator + threshold single-fire | — | ❌ |
| TR-sn-006 | `entityCaptured` / `entityEverCaptured` recording | — | ❌ |
| TR-sn-007 | `nodesCompleted` (N) vs `coverage` (N+1) divergence | — | ❌ |
| TR-sn-008 | Node-ledger view model to UI/HUD | — | ❌ |

### Session/Game State Orchestrator (Core)
| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-or-001 | Event registry (names + shapes in `entities.yaml`) | ADR-0001 | ⚠️ (references, doesn't own schema) |
| TR-or-002 | Session state machine + `session:tick`/`session:end` | — | ❌ |
| TR-or-003 | Deterministic delivery ordering (override compile + stable sort) | ADR-0001 | ⚠️ ((b)+(d); compile algorithm GDD-owned) |
| TR-or-004 | Latest-value cache vs discrete + `subscribe()` reentrancy | — | ❌ |
| TR-or-005 | Capped-dt game-time `elapsedSeconds` | — | ❌ |
| TR-or-006 | DI composition-root wiring, no singleton | ADR-0001 (a) | ✅ |
| TR-or-007 | Core Rule 5 import-boundary enforcement | ADR-0001 (c) | ✅ |
| TR-or-008 | Delivery-before-render + perf tripwire | ADR-0001 (d) | ✅ |
| TR-or-009 | Override-table storage location | ADR-0001 (b) | ✅ |

## Coverage Gaps (no ADR exists)

Prioritised by layer (most foundational first). Engine risk per gap.

- ❌ **Point Cloud Renderer** (TR-pc-001..009) → Foundation. Suggested ADR: *"Point Cloud rendering architecture"* — layer stack, BufferGeometry lifecycle, **Type A depth-only occluder (resolve OQ1)**, 1–2M budget + auto-scale. **Engine Risk: HIGH.**
- ❌ **Frame-budget allocation** (spans TR-pc-004/005/007, TR-or-008) → Foundation/Core. Suggested ADR: *"Per-frame budget allocation"* — 16.6 ms split across jitter, bus delivery (≤0.3 ms), render, materialization. **Engine Risk: MEDIUM.**
- ❌ **FPS Movement** (TR-mov-001..004, 006, 007) → Foundation. Suggested ADR: *"Kinematic movement + PointerLock input"* — AABB clamp, dt-cap, no-physics assertion, YXZ camera. **Engine Risk: LOW.**
- ❌ **Session data / node-position pipeline** (TR-sn-002, TR-fp-001) → Core/data. Suggested ADR: *"Session data + authoritative node-position pipeline"* — `data/sessions/` schema, PropertyLayout pool format (Scan Node Q#4 / Floor Plan Q#3). **Blocks Production. Engine Risk: LOW.**
- ❌ **Floor Plan System** (TR-fp-001..007, 009) → Core. Suggested ADR: *"Floor Plan data model + desync/loop architecture."* **Engine Risk: LOW.**
- ❌ **Scan Node System** (TR-sn-001, 003..008) → Core. Suggested ADR: *"Scan Node registry + coverage authority."* **Engine Risk: LOW.**
- ❌ **Orchestrator core semantics** (TR-or-002, 004, 005) → Core. Partly GDD-owned; consider folding into the ADR-0001 acceptance or a follow-up ADR covering the override-compile algorithm + latest-value cache + capped-dt tick. **Engine Risk: LOW.**

## Cross-ADR Conflicts

**None** — only one ADR exists, so no ADR-vs-ADR contradiction is possible. Cross-GDD consistency is out of scope for this skill; the systems-index logs one open cross-system item (4-vs-5 proximity-tier vocabulary) deferred to Entity System — not an architecture conflict.

## ADR Dependency Order

**Foundation (no dependencies):**
1. ADR-0001: Orchestrator Bus Wiring & Override-Table Storage — **status `Proposed`.**

⚠️ ADR-0001's own Ordering Note: it must reach `Accepted` before `/create-epics` / `/create-stories` run for any bus-dependent system, or those stories embed an unresolved wiring pattern. No unresolved dependencies, no cycles (single ADR).

## GDD Revision Flags

**None** — all GDD assumptions are consistent with verified engine behaviour. The one engine-risk item (renderer OQ1, depth-only occluder in Three.js r171) is already self-flagged in the renderer GDD as an *open prototype question*, not an assumption asserting verified behaviour — and no Three.js reference exists to verify it against. No systems-index status change is warranted.

## Engine Compatibility Issues

- **No Three.js engine reference exists.** `docs/engine-reference/` holds only Godot/Unity/Unreal snapshots, all explicitly non-authoritative per `technical-preferences.md`. `CLAUDE.md`'s "Engine Version Reference" still points at `docs/engine-reference/godot/VERSION.md`. The renderer GDD pins a specific runtime (**Three.js r171**, OQ1/OQ3) that is version-pinned nowhere. Engine-compatibility auditing therefore has no authoritative ground truth to check ADRs against.
- **Engine-specialist consultation skipped (justified):** the sole ADR declares Knowledge Risk **LOW — "no engine API surface"** (it is a JS module-wiring decision). There is nothing engine-specific for a specialist to challenge. Re-enable this consultation once a rendering / point-cloud ADR with real Three.js API surface exists.

## Architecture Document Coverage

`docs/architecture/architecture.md` does not exist (expected — `/create-architecture` has not run). 5 of 13 systems designed; no orphaned architecture.

---

## Verdict: **FAIL**

Not a quality judgment on the GDDs (which are unusually rigorous and have survived multiple independent review rounds). FAIL per the skill's definition: **Foundation- and Core-layer requirements are uncovered, and the one existing ADR is not yet `Accepted`.** This is the correct and expected state for a first architecture review — it means the ADR-authoring phase has not started. The verdict is advisory.

### Blocking Issues (must resolve before PASS)
1. **ADR-0001 is `Proposed`, not `Accepted`** — stories against the bus are auto-blocked until it flips.
2. **Foundation layer has zero ADR coverage** — Point Cloud Renderer (incl. the HIGH-risk r171 depth-occluder, OQ1) and FPS Movement.
3. **No Three.js engine reference / version pin** — `CLAUDE.md` and `engine-reference/` still describe Godot; r171 is unpinned.

### Required ADRs (prioritised, most foundational first)
1. **Point Cloud Renderer architecture** — layer stack, BufferGeometry lifecycle, Type A depth-only occluder (resolve OQ1), 1–2M budget + auto-scale. *HIGH.*
2. **Per-frame budget allocation** — 16.6 ms split across jitter / bus delivery (≤0.3 ms) / render / materialization. *MEDIUM.*
3. **Kinematic movement + PointerLock input** — AABB clamp, dt-cap, no-physics. *LOW.*
4. **Session data + authoritative node-position pipeline** — `data/sessions/` schema + PropertyLayout pool (blocks Production). *LOW.*
5. **Floor Plan** and **Scan Node** system ADRs (per `coding-standards.md`: every system needs one). *LOW.*

Plus non-ADR actions: **pin the engine** — add `docs/engine-reference/three/VERSION.md` (r171) and fix `CLAUDE.md`'s Engine Version Reference pointer; and flip **ADR-0001 → Accepted**.

### Pre-gate checklist
- ❌ `tests/unit/` + `tests/integration/` — run `/test-setup`
- ❌ `.github/workflows/tests.yml` — run `/test-setup`
- ❌ `design/ux/accessibility-requirements.md` — run `/ux-design`
- ❌ `design/ux/interaction-patterns.md` — run `/ux-design`

All four ❌ → `/gate-check pre-production` is not yet available.

---

*Re-run `/architecture-review` after each new ADR is written to verify coverage improves.*
