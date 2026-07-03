# Architecture Traceability Index

- **Last Updated:** 2026-07-02 (re-run — 7 ADRs)
- **Engine:** Three.js r171 (WebGL2) — pinned at `docs/engine-reference/three/VERSION.md`
- **Source review:** `docs/architecture/architecture-review-2026-07-02-rerun.md` (verdict CONCERNS)
- **Registry:** `docs/architecture/tr-registry.yaml` (42 TR-IDs, v2)

## Coverage Summary
- Total requirements: **42**
- Covered (an ADR addresses it): **42** (100%)
- Partial: **0**
- Gaps: **0**

By ADR readiness: **9** TRs via the Accepted ADR-0001; **33** via Proposed ADRs 0002–0007.

## Full Matrix

| TR-ID | System | Requirement | ADR | ADR Status |
|-------|--------|-------------|-----|-----------|
| TR-pc-001 | Point Cloud | `THREE.Points`-only rendering | ADR-0002 | Proposed |
| TR-pc-002 | Point Cloud | Additive layer stack | ADR-0002 | Proposed |
| TR-pc-003 | Point Cloud | Type A depth-only occluder (OQ1 gate) | ADR-0002 | Proposed |
| TR-pc-004 | Point Cloud | Budget + auto-scale + single-frame rebuild | ADR-0002, ADR-0003 | Proposed |
| TR-pc-005 | Point Cloud | 60 FPS at ceiling | ADR-0002, ADR-0003 | Proposed |
| TR-pc-006 | Point Cloud | Consume floor-plan AABB → BASE | ADR-0002 | Proposed |
| TR-pc-007 | Point Cloud | Per-frame jitter mutation | ADR-0002, ADR-0003 | Proposed |
| TR-pc-008 | Point Cloud | Scan materialization + seal | ADR-0002 | Proposed |
| TR-pc-009 | Point Cloud | Emit `renderer:anomaly_density` | ADR-0002 | Proposed |
| TR-mov-001 | FPS Movement | Two-state machine | ADR-0004 | Proposed |
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
| TR-fp-009 | Floor Plan | Dollhouse view model (transport deferred) | ADR-0006 | Proposed |
| TR-sn-001 | Scan Node | Node registry + state machine | ADR-0007 | Proposed |
| TR-sn-002 | Scan Node | Roster + authoritative positions | ADR-0005 | Proposed |
| TR-sn-003 | Scan Node | `coverage = V/S` pure function | ADR-0007 | Proposed |
| TR-sn-004 | Scan Node | Canonical `scan:*` emission + atomic delivery | ADR-0007, ADR-0001 | Proposed / Accepted |
| TR-sn-005 | Scan Node | Integrity accumulator + threshold | ADR-0007 | Proposed |
| TR-sn-006 | Scan Node | `entityCaptured` recording | ADR-0007 | Proposed |
| TR-sn-007 | Scan Node | `nodesCompleted` vs `coverage` divergence | ADR-0007 | Proposed |
| TR-sn-008 | Scan Node | Node-ledger view model (transport deferred) | ADR-0007 | Proposed |
| TR-or-001 | Orchestrator | Event registry (names + shapes) | ADR-0001 | **Accepted** |
| TR-or-002 | Orchestrator | Session state machine + tick/end | ADR-0001 + GDD | **Accepted** |
| TR-or-003 | Orchestrator | Deterministic delivery ordering | ADR-0001 | **Accepted** |
| TR-or-004 | Orchestrator | Latest-value cache vs discrete + reentrancy | ADR-0001 + GDD | **Accepted** |
| TR-or-005 | Orchestrator | Capped-dt game-time `elapsedSeconds` | ADR-0001 + GDD | **Accepted** |
| TR-or-006 | Orchestrator | DI composition-root wiring | ADR-0001 (a) | **Accepted** |
| TR-or-007 | Orchestrator | Core Rule 5 import-boundary enforcement | ADR-0001 (c) | **Accepted** |
| TR-or-008 | Orchestrator | Delivery-before-render + perf tripwire | ADR-0001 (d), ADR-0003 | **Accepted** |
| TR-or-009 | Orchestrator | Override-table storage location | ADR-0001 (b) | **Accepted** |

## Known Gaps

**No coverage gaps** — every TR maps to an ADR. Remaining concerns are readiness, not coverage:
1. ADR-0002 Proposed, self-gated on the OQ1 depth-occluder prototype (r171, HIGH).
2. ADR-0003..0007 Proposed, awaiting independent review before Accepted.
3. View-model transport (TR-fp-009 / TR-sn-008) deferred to a future UI/HUD ADR — implies an unregistered `floorplan:viewmodel`-class event.
4. 4 MVP systems undesigned (Scan Mechanic, Entity, Win/Lose, UI/HUD) — no TRs yet; design-phase item.

## Superseded Requirements
None.
