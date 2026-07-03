# Architecture Traceability Index

- **Last Updated:** 2026-07-02
- **Engine:** Three.js (WebGL2) — vanilla JS ES modules + Vite
- **Source review:** `docs/architecture/architecture-review-2026-07-02.md`
- **Registry:** `docs/architecture/tr-registry.yaml` (42 TR-IDs, v2)

## Coverage Summary
- Total requirements: **42**
- Covered: **4** (9.5%)
- Partial: **5** (11.9%)
- Gaps: **33** (78.6%)

Only ADR-0001 (Orchestrator Bus Wiring, `Proposed`) exists. It covers four Orchestrator wiring requirements (TR-or-006/007/008/009) and partially touches three more (TR-or-001/003, and the bus-injection side of TR-mov-005 / TR-fp-008 / TR-sn-004).

## Full Matrix

| TR-ID | System | Requirement | ADR | Status |
|-------|--------|-------------|-----|--------|
| TR-pc-001 | Point Cloud | `THREE.Points`-only rendering, no visible meshes | — | ❌ |
| TR-pc-002 | Point Cloud | Additive layer stack | — | ❌ |
| TR-pc-003 | Point Cloud | Type A depth-only occluder (r171 OQ1, HIGH) | — | ❌ |
| TR-pc-004 | Point Cloud | Point budget ceiling + auto-scale + single-frame rebuild | — | ❌ |
| TR-pc-005 | Point Cloud | 60 FPS at budget ceiling | — | ❌ |
| TR-pc-006 | Point Cloud | Consume floor-plan AABB via bus → BASE | — | ❌ |
| TR-pc-007 | Point Cloud | Per-frame BufferGeometry jitter mutation | — | ❌ |
| TR-pc-008 | Point Cloud | Scan materialization overlay + seal | — | ❌ |
| TR-pc-009 | Point Cloud | Emit `renderer:anomaly_density` | — | ❌ |
| TR-mov-001 | FPS Movement | Two-state machine NAVIGATE/SCAN_LOCKED | — | ❌ |
| TR-mov-002 | FPS Movement | Kinematic WASD + PointerLock, no physics | — | ❌ |
| TR-mov-003 | FPS Movement | AABB clamp + dt-cap anti-tunnel | — | ❌ |
| TR-mov-004 | FPS Movement | PointerLock lifecycle | — | ❌ |
| TR-mov-005 | FPS Movement | Bus integration (`player:position`, scan/loop) | ADR-0001 | ⚠️ |
| TR-mov-006 | FPS Movement | YXZ camera rotation + ±80° pitch clamp | — | ❌ |
| TR-mov-007 | FPS Movement | `dt` injected parameter (testability) | — | ❌ |
| TR-fp-001 | Floor Plan | Authoritative PropertyLayout data + pool/seed | — | ❌ |
| TR-fp-002 | Floor Plan | Two-contract init/update | — | ❌ |
| TR-fp-003 | Floor Plan | Dollhouse derived view mask | — | ❌ |
| TR-fp-004 | Floor Plan | Desync ring buffer + snapshot queue | — | ❌ |
| TR-fp-005 | Floor Plan | Loop per-door state machine + threshold crossing | — | ❌ |
| TR-fp-006 | Floor Plan | Escalation + desync formulas | — | ❌ |
| TR-fp-007 | Floor Plan | Layout validation at load | — | ❌ |
| TR-fp-008 | Floor Plan | `floorplan:*` bus integration | ADR-0001 | ⚠️ |
| TR-fp-009 | Floor Plan | Dollhouse view model to UI/HUD | — | ❌ |
| TR-sn-001 | Scan Node | Node registry + per-node state machine | — | ❌ |
| TR-sn-002 | Scan Node | Roster from init + authoritative positions (Q#4) | — | ❌ |
| TR-sn-003 | Scan Node | `coverage = V/S` pure function | — | ❌ |
| TR-sn-004 | Scan Node | Canonical `scan:*` emission, state-before-emit | ADR-0001 | ⚠️ |
| TR-sn-005 | Scan Node | Integrity accumulator + threshold single-fire | — | ❌ |
| TR-sn-006 | Scan Node | `entityCaptured`/`entityEverCaptured` recording | — | ❌ |
| TR-sn-007 | Scan Node | `nodesCompleted` vs `coverage` divergence | — | ❌ |
| TR-sn-008 | Scan Node | Node-ledger view model to UI/HUD | — | ❌ |
| TR-or-001 | Orchestrator | Event registry (names + shapes in `entities.yaml`) | ADR-0001 | ⚠️ |
| TR-or-002 | Orchestrator | Session state machine + `session:tick`/`session:end` | — | ❌ |
| TR-or-003 | Orchestrator | Deterministic delivery ordering (override + stable sort) | ADR-0001 | ⚠️ |
| TR-or-004 | Orchestrator | Latest-value cache vs discrete + reentrancy | — | ❌ |
| TR-or-005 | Orchestrator | Capped-dt game-time `elapsedSeconds` | — | ❌ |
| TR-or-006 | Orchestrator | DI composition-root wiring | ADR-0001 (a) | ✅ |
| TR-or-007 | Orchestrator | Core Rule 5 import-boundary enforcement | ADR-0001 (c) | ✅ |
| TR-or-008 | Orchestrator | Delivery-before-render + perf tripwire | ADR-0001 (d) | ✅ |
| TR-or-009 | Orchestrator | Override-table storage location | ADR-0001 (b) | ✅ |

## Known Gaps (suggested ADRs)

1. **Point Cloud Renderer architecture** (TR-pc-001..009) — Foundation, **HIGH** (resolve r171 depth-occluder OQ1).
2. **Per-frame budget allocation** (TR-pc-004/005/007, TR-or-008) — Foundation/Core, MEDIUM.
3. **Kinematic movement + PointerLock input** (TR-mov-001..004/006/007) — Foundation, LOW.
4. **Session data + authoritative node-position pipeline** (TR-sn-002, TR-fp-001) — Core/data, LOW, blocks Production.
5. **Floor Plan data model + desync/loop architecture** (TR-fp-001..007/009) — Core, LOW.
6. **Scan Node registry + coverage authority** (TR-sn-001/003..008) — Core, LOW.
7. **Orchestrator core semantics** (TR-or-002/004/005) — Core, LOW (may fold into ADR-0001 acceptance or a follow-up ADR).

## Superseded Requirements
None — first registry population (v2).
