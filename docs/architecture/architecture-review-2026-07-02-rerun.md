# Architecture Review Report (re-run)

- **Date:** 2026-07-02 (re-run, after ADR-0002..0007 authored + ADR-0001 Accepted)
- **Mode:** full (`/architecture-review`) — focused re-verification against the prior baseline
- **Engine:** Three.js r171 (WebGL2) — now pinned at `docs/engine-reference/three/VERSION.md`
- **GDDs Reviewed:** 5 designed systems
- **ADRs Reviewed:** 7 (ADR-0001 Accepted; ADR-0002..0007 Proposed)
- **Prior report:** `docs/architecture/architecture-review-2026-07-02.md` (verdict FAIL)

---

## Traceability Summary

| | First run | This run |
|---|---|---|
| Total requirements | 42 | 42 |
| ✅ Covered (an ADR addresses it) | 4 | **42** |
| ⚠️ Partial | 5 | 0 |
| ❌ Gap (no ADR) | 33 | **0** |

Every one of the 42 TRs now maps to an ADR. Split by ADR readiness:
- **9 via the Accepted ADR-0001**: TR-or-001..009, TR-mov-005, TR-fp-008, TR-sn-004 (bus/atomic-delivery aspects). Orchestrator core semantics (TR-or-002/004/005) are covered by the Approved Orchestrator GDD + ADR-0001 — no separate ADR needed (no open architectural choice remained).
- **33 via Proposed ADRs 0002–0007**: all Point Cloud, FPS Movement, Floor Plan, and Scan Node requirements.

## Coverage by ADR

| ADR | Status | TRs covered |
|-----|--------|-------------|
| ADR-0001 Orchestrator Bus Wiring | **Accepted** | TR-or-001..009, TR-mov-005, TR-fp-008, TR-sn-004 (delivery/atomic) |
| ADR-0002 Point Cloud Renderer | Proposed (OQ1 gate) | TR-pc-001..009 |
| ADR-0003 Per-Frame Budget | Proposed | TR-pc-004/005/007, TR-or-008 (budget aspect) |
| ADR-0004 Movement + Input | Proposed | TR-mov-001..004/006/007 |
| ADR-0005 Session Data Pipeline | Proposed | TR-fp-001, TR-sn-002 |
| ADR-0006 Floor Plan | Proposed | TR-fp-002..007/009 |
| ADR-0007 Scan Node | Proposed | TR-sn-001/003..008 |

## Cross-ADR Conflicts

**None.** All seams checked across the 7 ADRs:
- ADR-0002 (jitter cost) ↔ ADR-0003 (frame budget) — complementary; slice sum (3.5 ms) < 8 ms CPU soft budget.
- ADR-0002 (`floorplan:update` consumer, single-frame rebuild) ↔ ADR-0006 (one full-set update emitter) — consistent.
- ADR-0004 (applies `floorplan:loop` position/yaw) ↔ ADR-0006 (emits loop, never mutates transform) — clean ownership split.
- ADR-0005 (schema + validation owner = Floor Plan) ↔ ADR-0006 (does validation) ↔ ADR-0007 (reads `authoritativePosition`) — consistent, drift-proof single source.
- ADR-0006 (`floorplan:init`/`reveal`) ↔ ADR-0007 (`scan:complete` reveal trigger) — bidirectional, matches the GDDs' recorded contracts.

**Non-conflict flags (tracked, not blocking):**
- ADR-0006 (g) and ADR-0007 (h) both defer the view-model transport to a future **UI/HUD ADR** and both imply a new `floorplan:viewmodel` / node-ledger latest-value event **not yet in `entities.yaml`**. They agree to defer — no conflict — but the registry addition + Orchestrator Rule 1 registration is owed when UI/HUD is designed.

## ADR Dependency Order (topological, no cycles)

```
Foundation (no deps):   ADR-0001 (Accepted)   ·   ADR-0005
Depends on 0001:        ADR-0002  ·  ADR-0004
Depends on 0001+0002:   ADR-0003
Depends on 0001+0005:   ADR-0006
Depends on 0001+0005+0006: ADR-0007
```

**Unresolved-dependency flags:** every system ADR (0002–0007) is still `Proposed`. ADR-0003 depends on the Proposed ADR-0002; ADR-0006 on the Proposed ADR-0005; ADR-0007 on Proposed 0005+0006. Consequence: only ADR-0001-grounded work (the bus itself) is truly unblocked; all system implementation inherits a Proposed-ADR block until each flips to Accepted.

## GDD Revision Flags

**None** — all GDD assumptions remain consistent with the (now pinned) Three.js r171 reference and the accepted decisions.

## Engine Compatibility Issues

**Resolved.** `docs/engine-reference/three/VERSION.md` (r171) now exists and `CLAUDE.md`'s Engine Version Reference points at it. All 7 ADRs cite Three.js r171 consistently; no version drift, no deprecated-API references (the Godot/Unity/Unreal dirs remain non-authoritative). One open verification item remains: **ADR-0002 OQ1** (depth-only occluder in r171, HIGH) — self-gated, blocks ADR-0002 Accepted, does not block the review.

## Architecture Document Coverage

`docs/architecture/architecture.md` still absent (expected — `/create-architecture` not run; optional at this stage). 5 of 13 systems designed.

---

## Verdict: **CONCERNS** (up from FAIL)

Coverage is complete, there are no cross-ADR conflicts, and the engine reference is consistent. Not yet PASS because:

1. **6 of 7 ADRs are `Proposed`** — ADR-0002 is self-gated on the OQ1 depth-occluder prototype (r171, HIGH); ADR-0003..0007 await independent review before Accepted (owner decision this session).
2. **View-model transport deferred** — the dollhouse and node-ledger transports (ADR-0006 g / ADR-0007 h) route to an unwritten UI/HUD ADR and imply an unregistered `floorplan:viewmodel`-class event.
3. **4 MVP systems undesigned** — Scan Mechanic (#8), Entity (#9), Win/Lose (#10), UI/HUD (#12) have neither GDD nor ADR. This is a **design-phase** gap (they produce no TRs to cover), not an architecture FAIL for the designed systems — tracked separately toward the pre-production gate.

### Path to PASS
- Prototype OQ1 → flip ADR-0002 Accepted.
- Independent-review ADR-0003..0007 → flip to Accepted.
- Design the 4 remaining MVP GDDs (+ their ADRs, incl. the UI/HUD view-model transport).

### Pre-gate checklist (unchanged this run)
- ❌ `tests/unit/` + `tests/integration/` → `/test-setup`
- ❌ `.github/workflows/tests.yml` → `/test-setup`
- ❌ `design/ux/accessibility-requirements.md` → `/ux-design`
- ❌ `design/ux/interaction-patterns.md` → `/ux-design`

---

*Re-run whenever an ADR flips to Accepted or a new MVP GDD/ADR lands.*
