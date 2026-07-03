# ADR-0003: Per-Frame Budget Allocation

## Status
Proposed

## Date
2026-07-02

## Last Verified
2026-07-02

## Decision Makers
magatron02 (owner) + architecture-review follow-up

## Summary
Splits the 16.6 ms/60 FPS frame across every per-frame consumer so no single system silently eats the budget, and defines how breaches are detected (dev-only frame monitor + ADR-0001's queue tripwire). Establishes an ~8 ms CPU main-thread soft budget with per-system sub-budgets, leaving the rest for the GPU point-cloud draw that is the real FPS ceiling.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Three.js r171 (WebGL2) — single `requestAnimationFrame` loop |
| **Domain** | Core / Performance |
| **Knowledge Risk** | LOW — `performance.now()` deltas and rAF are baseline; no engine API surface at risk |
| **References Consulted** | ADR-0001 (delivery pass + tripwire), ADR-0002 (renderer costs), `design/gdd/point-cloud-renderer.md` AC-P01, `design/gdd/fps-movement.md` AC-PERF01, `.claude/docs/technical-preferences.md` (16.6 ms budget) |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | Measured frame-time split on min-spec desktop at the 1.5M-point ceiling |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (owns the delivery pass + queue tripwire), ADR-0002 (defines the renderer's per-frame jitter cost) |
| **Enables** | Per-system ADVISORY performance ACs (AC-P01, AC-PERF01) to be judged against concrete sub-budgets |
| **Blocks** | None — governance ADR; does not block implementation, guides it |
| **Ordering Note** | Foundation/Core. Budgets are advisory tuning targets, revisited once real profiling exists |

## Context

### Problem Statement
Four systems do per-frame work in one rAF loop (FPS Movement update, bus delivery, point-cloud jitter, Floor Plan desync sampling), plus the GPU render of up to 1.5M points. The GDDs give two isolated performance ACs (renderer AC-P01 ≥55 FPS; movement AC-PERF01 ≤0.2 ms) but nothing ties the whole frame together. Without an allocation, each system is individually "fine" while the frame collectively misses 60 FPS — and there's no shared definition of who overspent.

### Constraints
- 16.6 ms total wall budget at 60 FPS; the frame includes GPU draw + browser compositing, not just CPU.
- No worker threads assumed (kinematic, single-threaded main loop per `technical-preferences.md`).
- GPU draw of 1.5M points is the dominant, least-compressible cost.

### Requirements
Covers TR-pc-004/005/007 and TR-or-008: a bounded, observable per-frame cost with a fixed ordering, and a diagnostic when a system overspends.

## Decision

### (a) Frame budget split
Fixed ordering per rAF (from ADR-0001 d): **delivery pass → `renderer.render()`**. Budget (targets, not hard caps):

| Slice | Per-frame consumer | Target | Source |
|-------|--------------------|--------|--------|
| Input + FPS Movement update | AABB clamp, camera yaw/pitch | **≤ 0.2 ms** | movement AC-PERF01 |
| Bus delivery pass | snapshot + stable sort + dispatch | **≤ 0.3 ms** (typical n 2–20) | ADR-0001 |
| Point-cloud jitter (when a proximity tier is active) | subset write + attribute upload flag | **≤ 2.0 ms** | ADR-0002 (e) |
| Floor Plan per-tick | desync ring sample + escalation eval | **≤ 0.5 ms** | floor-plan Formula 1/2 |
| Other discrete handling | scan state, event handlers | **≤ 0.5 ms** | — |
| **CPU main-thread soft budget** | sum + GC/reserve headroom | **≤ 8.0 ms** | this ADR |
| GPU draw + compositing | 1.5M-point render, ~1 draw call/layer | **remainder (~8.6 ms)** | AC-P01 is the ceiling test |

The **~8 ms CPU soft budget** deliberately leaves ~half the frame for GPU submit/draw and the browser compositor. The GPU point draw — not CPU — is what AC-P01 (≥55 FPS at ceiling) actually stresses; the CPU sub-budgets exist so a CPU regression can't be mistaken for a GPU limit.

### (b) What is explicitly *off* the per-frame budget
- **Anomaly density sampling** (ADR-0002 f) — event-driven/throttled, never per-frame.
- **BASE rebuild** (ADR-0002 b) — one-time on `floorplan:update`, a deliberate single-frame spike, not steady-state.
- **Scan materialization** — active only during a scan (a few seconds), bounded to the small MATERIALIZING overlay.

### (c) Breach detection — dev-only, stripped in prod
Two diagnostics, both gated behind the same dev flag as ADR-0001's `warnOnDroppedEvent` (compiled to `false` in the prod build):
1. **Queue tripwire** (ADR-0001 d): `console.warn` once when a tick's delivered-queue length exceeds `PERF_TRIPWIRE_QUEUE_MAX` (default 64).
2. **Frame-time monitor**: measure CPU main-thread time (`performance.now()` around the delivery pass + gameplay updates, before `render()`); when it exceeds the 8.0 ms soft budget, `console.warn` (throttled) naming the largest slice that frame. Diagnostic only — never drops work or caps rate.

### Architecture Diagram
```
rAF callback:
  t0 ─ input + FPS movement (≤0.2ms)
     ─ bus.deliverTick()      (≤0.3ms)   ── player:position, session:tick, queued events
     ─ point-cloud jitter     (≤2.0ms)   ── subset write when proximity active
     ─ floor-plan per-tick    (≤0.5ms)
     ─ other discrete         (≤0.5ms)
  t1 ─ [CPU main-thread ≤ 8.0ms]  ← frame-time monitor warns if exceeded (dev)
     ─ renderer.render()      (GPU-bound, ~8.6ms headroom) ← AC-P01 ceiling test
  t2 ─ frame end (target ≤16.6ms)
```

### Implementation Guidelines
- Sub-budgets are **advisory tuning targets**, not assertions — the only BLOCKING perf gate stays AC-P01/AC-PERF01 (both ADVISORY per coding-standards).
- Revisit numbers after first real profiling; treat this table as v1 baseline.

## Alternatives Considered

### Alternative 1: No allocation — rely on the two per-system ACs
- **Description**: keep only renderer AC-P01 and movement AC-PERF01.
- **Pros**: nothing to maintain.
- **Cons**: no shared definition of "who overspent"; the whole-frame regression the review flagged stays invisible until FPS drops.
- **Rejection Reason**: the tripwire needs a budget to trip against.

### Alternative 2: Hard per-system caps (drop work over budget)
- **Description**: cap each slice and drop overflow work.
- **Pros**: guarantees frame time.
- **Cons**: dropping jitter/delivery mid-frame breaks correctness (ADR-0001 delivery must complete); visible artefacts.
- **Rejection Reason**: correctness over frame-rate for this game; diagnostics, not caps.

## Consequences

### Positive
- A CPU regression is attributable to a named slice before it costs FPS.
- Clean separation: CPU soft budget vs the GPU point-draw ceiling.

### Negative
- Numbers are estimates until profiled; risk of false confidence if never measured.

### Neutral
- All diagnostics are dev-only; zero prod cost.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| GPU point draw misses 60 FPS regardless of CPU budget | Medium | High | Merged geometry (ADR-0002 a), auto-scale ceiling, AC-P01 gate; lower `density_budget_ceiling` if needed |
| Sub-budgets never profiled, stay guesses | Medium | Low | v1 baseline; revisit after vertical slice |

## Performance Implications
| Metric | Expected | Budget |
|--------|----------|--------|
| CPU (frame time) | sum of slices | ≤ 8.0 ms main-thread |
| GPU (frame time) | 1.5M-point draw | ≤ ~8.6 ms (AC-P01 ≥55 FPS) |
| Total | | ≤ 16.6 ms |

## Migration Plan
No existing code — defines the budget the first implementations target.

**Rollback plan**: budgets are advisory; loosening or removing the frame monitor has no correctness impact.

## Validation Criteria
- [ ] Dev frame monitor warns (named slice) when CPU main-thread > 8.0 ms.
- [ ] Queue tripwire fires per ADR-0001.
- [ ] AC-P01 ≥55 FPS at 1.5M ceiling holds with all slices active.
- [ ] Density sampling and BASE rebuild confirmed off the steady-state per-frame path.

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/point-cloud-renderer.md` | Point Cloud Renderer | TR-pc-005 — 60 FPS at ceiling; TR-pc-007 — per-frame jitter cost | (a) jitter sub-budget + GPU ceiling framing; (c) monitor |
| `design/gdd/orchestrator.md` | Orchestrator | TR-or-008 — bounded, observable per-tick delivery cost | (a) 0.3 ms slice; (c) queue tripwire (ADR-0001) |
| `design/gdd/fps-movement.md` | FPS Movement | AC-PERF01 — movement update ≤0.2 ms | (a) input slice |

## Related
- ADR-0001 (delivery pass + tripwire), ADR-0002 (renderer per-frame costs).
