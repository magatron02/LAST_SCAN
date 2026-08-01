# Architecture Traceability Index

- **Last Updated:** 2026-08-01 (`/architecture-review` full — 9 GDDs, 7 ADRs)
- **Engine:** Three.js r171 (WebGL2) — pinned at `docs/engine-reference/three/VERSION.md`
- **Source review:** `docs/architecture/architecture-review-2026-08-01.md` (verdict **FAIL**)
- **Registry:** `docs/architecture/tr-registry.yaml` (72 TR-IDs, v3)

> **What changed since the 2026-07-02 index.** That index reported *"42 requirements, 100% covered,
> 0 gaps."* It was accurate against a five-system project. Four MVP systems have been designed since
> — Scan Mechanic, Entity System, Win/Lose, UI/HUD — and none had TRs or an owning ADR. Their 30
> requirements are registered here for the first time, all as gaps. Coverage did not fall; the
> denominator was stale.

## Coverage Summary

- Total requirements: **72**
- Covered (an ADR addresses it): **42** (58%)
- Partial: **0**
- **Gaps (no owning ADR): 30** (42%)

By ADR readiness: **9** TRs via the Accepted ADR-0001; **33** via Proposed ADRs 0002–0007;
**30** uncovered.

## Full Matrix

### Covered

| TR-ID | System | Requirement | ADR | ADR Status |
|-------|--------|-------------|-----|-----------|
| TR-pc-001 | Point Cloud | `THREE.Points`-only rendering | ADR-0002 | Proposed |
| TR-pc-002 | Point Cloud | Additive layer stack | ADR-0002 | Proposed |
| TR-pc-003 | Point Cloud | Type A depth-only occluder (OQ1 gate **passed** 2026-07-26, unrecorded in ADR; `material.side` unspecified) | ADR-0002 | Proposed |
| TR-pc-004 | Point Cloud | Budget + auto-scale + single-frame rebuild | ADR-0002, ADR-0003 | Proposed |
| TR-pc-005 | Point Cloud | 60 FPS at ceiling | ADR-0002, ADR-0003 | Proposed |
| TR-pc-006 | Point Cloud | Consume floor-plan AABB → BASE | ADR-0002 | Proposed |
| TR-pc-007 | Point Cloud | Per-frame jitter mutation | ADR-0002, ADR-0003 | Proposed |
| TR-pc-008 | Point Cloud | Scan materialization + seal | ADR-0002 | Proposed |
| TR-pc-009 | Point Cloud | Emit `renderer:anomaly_density {sigma}` (magnitude only) — **revised 2026-08-01** | ADR-0002 | Proposed |
| TR-mov-001 | FPS Movement | Two-state machine — ⚠️ **C1**: ADR-0004 omits `movement:scan_released` | ADR-0004 | Proposed |
| TR-mov-002 | FPS Movement | Kinematic WASD + PointerLock, no physics | ADR-0004 | Proposed |
| TR-mov-003 | FPS Movement | AABB clamp + dt-cap | ADR-0004 | Proposed |
| TR-mov-004 | FPS Movement | PointerLock lifecycle | ADR-0004 | Proposed |
| TR-mov-005 | FPS Movement | Bus integration | ADR-0001 | **Accepted** |
| TR-mov-006 | FPS Movement | YXZ camera + ±80° clamp | ADR-0004 | Proposed |
| TR-mov-007 | FPS Movement | Injected `dt` testability | ADR-0004 | Proposed |
| TR-fp-001 | Floor Plan | Authoritative PropertyLayout + pool/seed | ADR-0005 | Proposed |
| TR-fp-002 | Floor Plan | Two-contract init/update | ADR-0006 | Proposed |
| TR-fp-003 | Floor Plan | Dollhouse derived-view mask | ADR-0006 | Proposed |
| TR-fp-004 | Floor Plan | Desync ring buffer + scan-state queue | ADR-0006 | Proposed |
| TR-fp-005 | Floor Plan | Loop per-door FSM + crossing detector | ADR-0006 | Proposed |
| TR-fp-006 | Floor Plan | Escalation + desync formulas | ADR-0006 | Proposed |
| TR-fp-007 | Floor Plan | Layout validation at load | ADR-0005, ADR-0006 | Proposed |
| TR-fp-008 | Floor Plan | `floorplan:*` bus integration | ADR-0001 | **Accepted** |
| TR-fp-009 | Floor Plan | Dollhouse view model — ⚠️ **C4**: ADR-0006 (g) recommends a transport UI/HUD rejected | ADR-0006 | Proposed |
| TR-sn-001 | Scan Node | Node registry + state machine | ADR-0007 | Proposed |
| TR-sn-002 | Scan Node | Roster + authoritative positions | ADR-0005 | Proposed |
| TR-sn-003 | Scan Node | `coverage = V/S` pure function | ADR-0007 | Proposed |
| TR-sn-004 | Scan Node | Canonical `scan:*` emission + atomic delivery | ADR-0007, ADR-0001 | Proposed / Accepted |
| TR-sn-005 | Scan Node | Integrity accumulator + threshold | ADR-0007 | Proposed |
| TR-sn-006 | Scan Node | `entityCaptured` recording | ADR-0007 | Proposed |
| TR-sn-007 | Scan Node | `nodesCompleted` vs `coverage` divergence | ADR-0007 | Proposed |
| TR-sn-008 | Scan Node | Node-ledger view model — ⚠️ **C4**: transport deferred to a nonexistent ADR | ADR-0007 | Proposed |
| TR-or-001 | Orchestrator | Event registry (names + shapes) | ADR-0001 | **Accepted** |
| TR-or-002 | Orchestrator | Session state machine + tick/end | ADR-0001 + GDD | **Accepted** |
| TR-or-003 | Orchestrator | Deterministic delivery ordering | ADR-0001 | **Accepted** |
| TR-or-004 | Orchestrator | Latest-value cache vs discrete + reentrancy | ADR-0001 + GDD | **Accepted** |
| TR-or-005 | Orchestrator | Capped-dt game-time `elapsedSeconds` | ADR-0001 + GDD | **Accepted** |
| TR-or-006 | Orchestrator | DI composition-root wiring | ADR-0001 (a) | **Accepted** |
| TR-or-007 | Orchestrator | Core Rule 5 import-boundary enforcement | ADR-0001 (c) | **Accepted** |
| TR-or-008 | Orchestrator | Delivery-before-render + perf tripwire | ADR-0001 (d), ADR-0003 | **Accepted** |
| TR-or-009 | Orchestrator | Override-table storage location | ADR-0001 (b) | **Accepted** |

### Gaps — no owning ADR (all registered 2026-08-01)

| TR-ID | System | Requirement | ADR | Note |
|-------|--------|-------------|-----|------|
| TR-sm-001 | Scan Mechanic | Direct read of the ADR-0005 property file for `authoritativePosition` | ❌ | 🔴 **C2** — ADR-0005 (a) states two readers; this is a third |
| TR-sm-002 | Scan Mechanic | 5-phase state machine, one scan in flight | ❌ | |
| TR-sm-003 | Scan Mechanic | Trigger radius + rebindable interact key | ❌ | depends on TR-sm-001 |
| TR-sm-004 | Scan Mechanic | Lock boundary + `movement:scan_released` | ❌ | 🔴 **C1** — contradicts ADR-0004 |
| TR-sm-005 | Scan Mechanic | Camera rotation during CAPTURING (reuses `T`/`h`) | ❌ | ADR-0004 calls this "a deliberate seam" |
| TR-sm-006 | Scan Mechanic | `entityInFrame` from cached proximity tier | ❌ | |
| TR-sm-007 | Scan Mechanic | `scan:started` / `scan:captured` emission | ❌ | consumed by the Accepted bus |
| TR-sm-008 | Scan Mechanic | `scan:processing` / `scan:uploading` progress events | ❌ | provisional in `entities.yaml` |
| TR-ent-001 | Entity | Canonical proximity-tier vocabulary + computation | ❌ | every system's thresholds depend on it |
| TR-ent-002 | Entity | Single entity, mutable manifestation | ❌ | |
| TR-ent-003 | Entity | Escalation-driven cadence + weighted room selection | ❌ | |
| TR-ent-004 | Entity | Per-type A/B/C behaviour + speed bounds | ❌ | |
| TR-ent-005 | Entity | `entity:spawn`/`despawn`/`transform`/`position` emission | ❌ | 🟠 **C3** — per-tick, unbudgeted in ADR-0003 |
| TR-ent-006 | Entity | Config-invariant load guards | ❌ | |
| TR-ent-007 | Entity | Scanning aggression (Type C) | ❌ | |
| TR-ent-008 | Entity | Deterministic RNG ordering | ❌ | |
| TR-wl-001 | Win/Lose | Ending taxonomy + 4 triggers | ❌ | |
| TR-wl-002 | Win/Lose | Same-tick precedence resolution | ❌ | |
| TR-wl-003 | Win/Lose | Single-fire guarantee | ❌ | |
| TR-wl-004 | Win/Lose | Ending record + one-shot delivery at SEALED | ❌ | |
| TR-wl-005 | Win/Lose | Reads Scan Node coverage + `entityEverCaptured` | ❌ | ADR-0007 (f) anticipates this reader |
| TR-ui-001 | UI/HUD | Composition-root DI + two polled getters | ❌ | 🟠 **C4** — resolves ADR-0006 (g) / ADR-0007 (h) |
| TR-ui-002 | UI/HUD | Per-tick full-depth dirty check, skip DOM write | ❌ | 🟠 **C3** — per-frame, no ADR-0003 slice |
| TR-ui-003 | UI/HUD | Panel structure (instrument view + one modal) | ❌ | |
| TR-ui-004 | UI/HUD | Never expose producer-forbidden data | ❌ | |
| TR-ui-005 | UI/HUD | Coverage visually dominant over `nodesCompleted` | ❌ | measurable proxy for Scan Node's AC-SN31 |
| TR-ui-006 | UI/HUD | `anomaliesLogged` cumulative count | ❌ | UI owns dedup; renderer does not throttle |
| TR-ui-007 | UI/HUD | Session gating + terminal ending copy | ❌ | |
| TR-ui-008 | UI/HUD | Error escalation + one alert tone per tick | ❌ | |
| TR-ui-009 | UI/HUD | DOM test harness required, not in Allowed Libraries | ❌ | project-standards gap |

## Known Gaps

1. **4 MVP systems have no owning ADR** — Scan Mechanic, Entity System, Win/Lose, UI/HUD (30 TRs).
   Priority order for authoring: **UI/HUD → Entity → Scan Mechanic → Win/Lose**. UI/HUD first
   because ADR-0006 (g) and ADR-0007 (h) both explicitly block on "the UI/HUD ADR (future)".
2. **No `docs/architecture/architecture.md`** — `/create-architecture` has never run; nothing ties
   the ADRs into a system-level view.
3. **ADR-0002 self-gated on the OQ1 prototype — which passed on 2026-07-26** but the ADR does not
   record it, and its material recipe still omits `side: DoubleSide` (prototype T4).
4. **ADRs 0002–0007 remain Proposed**, so per `docs/CLAUDE.md` no implementation story can be
   written for any system except the bus.
5. **Engine reference is a stub** — `docs/engine-reference/three/` has only `VERSION.md`; the
   deprecated-API check has no source. `docs/CLAUDE.md` still points at the Godot reference.

## Superseded Requirements

None. TR-pc-009's requirement text was **revised** 2026-08-01 (payload corrected to magnitude-only);
the ID is unchanged and no TR has been deprecated or renumbered.

## History

| Date | Total | Covered | Gaps | Verdict |
|------|-------|---------|------|---------|
| 2026-07-02 | 42 | 42 (100%) | 0 | CONCERNS |
| 2026-08-01 | 72 | 42 (58%) | 30 | **FAIL** |
