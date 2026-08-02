# ADR-0002: Point Cloud Renderer Architecture

## Status
Proposed

## Date
2026-07-02

## Last Verified
2026-08-01 (decision (f) rewritten for the Formula 2 rebuild; rest of the ADR unreviewed since 2026-07-02)

## Decision Makers
magatron02 (owner) + architecture-review follow-up

## Summary
Pins the implementation architecture for the sole visual layer of LAST SCAN — how the point cloud is structured as `THREE.Points` layers, how BASE geometry is built/rebuilt/mutated within the 1–2M-point budget, and how the Type A "void" occluder is rendered depth-only. The Type A occluder (r171 depth-only-invisible combo) is the one **prototype-gated, HIGH-risk** decision and blocks this ADR reaching `Accepted`.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Three.js r171 (WebGL2 via `WebGLRenderer`) — vanilla JS ES modules + Vite |
| **Domain** | Rendering |
| **Knowledge Risk** | MEDIUM — r171 is in training data, but the depth-only-invisible occluder behaviour and point-size-at-DPI need live verification against r171 |
| **References Consulted** | `design/gdd/point-cloud-renderer.md`, `docs/engine-reference/three/VERSION.md`, `.claude/docs/technical-preferences.md` (draw-call/memory budgets), ADR-0001 (bus injection) |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | (1) `MeshBasicMaterial {colorWrite:false, depthWrite:true}` occluder blocks `THREE.Points` behind it while itself invisible in r171 (renderer OQ1); (2) `PointsMaterial` point size stability across `devicePixelRatio` (OQ3) |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (bus wiring) — the renderer receives all its input events via the injected `bus`; must be Accepted first |
| **Enables** | Point Cloud Renderer implementation stories; the Entity System GDD (Type A/B/C rendering contract) |
| **Blocks** | First renderer implementation; the per-frame budget ADR (ADR-0003) tunes the costs this ADR creates |
| **Ordering Note** | Foundation layer. OQ1 occluder prototype must pass before this ADR flips to `Accepted` — the decision is written now so implementers align, but the Type A path stays flagged until verified |

## Context

### Problem Statement
The renderer GDD specifies *what* the point cloud must look and behave like (layer stack, colours, formulas, budget ceiling) but deliberately leaves the *implementation architecture* open: how many `THREE.Points`/`BufferGeometry` objects exist, how BASE is rebuilt in a single frame, how per-frame jitter mutates 1–2M points without blowing the frame budget, and how the Type A void is rendered. Left unpinned, implementers will diverge on draw-call structure and the depth-occluder technique (renderer OQ1 is explicitly unresolved).

### Constraints
- **Draw calls kept low** (`technical-preferences.md`) — point cloud in as few `THREE.Points` objects as possible.
- **Memory ceiling ~1–2M points/scene**; `density_budget_ceiling` default 1.5M with load-time auto-scale.
- **60 FPS / 16.6 ms** budget; AC-P01 ≥55 FPS at ceiling.
- **No post-processing/lighting in this system** — bloom/glow is the Found-Footage Layer's; points are unlit.
- Bus events only (no direct imports) — ADR-0001 injection contract.

### Requirements
Covers TR-pc-001..009: `THREE.Points`-only output, additive layer stack, Type A depth-occluder, budget + auto-scale + single-frame rebuild, 60 FPS, floor-plan-driven BASE build, per-frame jitter, scan materialization, `renderer:anomaly_density` emission.

## Decision

Six decisions.

### (a) One `THREE.Points` object per layer category; VOID_MASK is a Mesh
The scene holds at most: **BASE** (one `THREE.Points`), **BASE_SEALED** (one `THREE.Points`, accreted scan detail — same material/colour as BASE, see (d)), **ENTITY_SPIKE** (one `THREE.Points`, amber), **ENTITY_GHOST** (one `THREE.Points`, green @0.15), and per active Type A entity a **VOID_MASK** `THREE.Mesh`. Each Points layer is backed by a **single merged `BufferGeometry`** spanning all rooms/surfaces — not one geometry per surface (satisfies the low-draw-call constraint: BASE for a whole property is 1 draw call). (TR-pc-001, TR-pc-002)

### (b) BASE built from pre-sized typed arrays; rebuild is dispose-and-swap in one frame
On `floorplan:update`, compute `N` per surface (Formula 1), sum to `N_total`, apply the `density_budget_ceiling` auto-scale to `D` **before allocation**, allocate one `Float32Array(N_total*3)` (+ colour if needed), fill by sampling each surface's inner face, build the `BufferGeometry`, and swap it onto the BASE `Points` in the same frame — then `dispose()` the old geometry. No per-point `array.push`; no incremental add. A frame never shows zero BASE points. (TR-pc-004, TR-pc-006; renderer AC-D01/AC-E04)

### (c) Type A void — depth-only invisible occluder Mesh ⚠️ prototype-gated
A `THREE.Mesh` with `CapsuleGeometry` (~1.8 m tall, ~0.5 m radius) at the entity position, `MeshBasicMaterial { colorWrite: false, depthWrite: true, depthTest: true }`, drawn **before** the Points layers (lower `renderOrder`, e.g. `renderOrder = -1`) so it populates the depth buffer and the Points behind it fail the depth test. It writes depth, never colour → invisible silhouette that carves the cloud. **This exact combination is renderer OQ1 and MUST be prototype-verified against r171 before this ADR is Accepted.** Fallback ladder if the combo misbehaves: (1) explicit `renderOrder` + `depthFunc` tuning; (2) a separate depth-prepass; (3) discard BASE points inside the capsule volume on the CPU (last resort — breaks the "surrounding cloud intact" property, so only if GPU path fails). (TR-pc-003)

### (d) Scan materialization: transient overlay → accrete into BASE_SEALED (no full rebuild per scan)
Materializing points live in a small transient `THREE.Points` (MATERIALIZING) with per-point opacity ramp (Formula 4). On `scan:complete`, the sealed points are appended to **BASE_SEALED** (a persistent Points layer, visually identical to BASE), **not** merged by rebuilding the 1.5M-point BASE geometry every scan. On `scan:abort`, the transient overlay fades and is discarded. "Permanently in BASE" (GDD) is satisfied visually and semantically by BASE_SEALED sharing BASE's material; it avoids an O(N_total) rebuild on every capture. Jitter (see (e)) applies to BASE and BASE_SEALED points, never to the transient MATERIALIZING overlay (renderer AC-E03). (TR-pc-008)

### (e) Per-frame jitter operates on a precomputed affected-index subset, not a full-cloud scan
Each BASE/BASE_SEALED point keeps an immutable **rest position** (a parallel `Float32Array`). When `entity:proximity` enters a jitter tier, precompute **once** the index list of points within `entity_influence_radius` (via a coarse uniform spatial grid over the cloud, not a per-frame O(N) distance test). Each frame, write `rest + random(±J)` (Formula 3) into the live position attribute for only those indices and set `needsUpdate` on the affected range. On proximity dropping to FAR, restore rest positions once. This bounds per-frame cost to the affected subset — the detailed ms budget is ADR-0003's. (TR-pc-007)

### (f) Anomaly density sampled by a bounded per-frame sweep over a subsampled tile index
*(Rewritten 2026-08-01 — the prior text, "sampled on change events, throttled, not per frame", was invalidated by the Formula 2 rebuild. It also still carried a `{type}` field in the event payload, which the GDD's round-3 type-oracle fix removed; that was a live contradiction with Entity System's "no type taxonomy" invariant, independent of the rebuild.)*

Maintain a **detection tile index**: one spatial bin per tile (`A_tile` default 1.0 m²) holding the indices of the `BASE`/`BASE_SEALED` and `ENTITY_SPIKE` points inside it, plus `N_base` (sealed BASE count) and `N_res` (resident count). Bins are written where points are written — on scan seal (d), on BASE rebuild (b), on ENTITY_SPIKE add/remove. **The index build is incremental and explicitly NOT same-frame-bound** (the Q#7 prototype measured a full build at 87 ms over 1,156 tiles / 5.8 MB, which would otherwise break renderer AC-E04's same-frame BASE rebuild); a tile whose bin is not yet built is simply not in the active set.

Formula 2's `ρ_base` is read from the index (`N_base / A_tile`) — **measured, not derived from `D × W_s`**. `ρ_obs` is estimated from a subsample of `anomaly_tile_samples` (default 128) points per tile taken on a systematic stride — **never RNG**, so the pass is deterministic and unit-testable. The active set is swept at `anomaly_tiles_per_frame` (default 16) tiles **per frame**, completing once per `anomaly_sample_interval`; this replaces the throttled whole-set pass the Q#7 prototype measured at **31–37 ms**, ~2× the entire frame budget. Per-frame cost is bounded by `anomaly_tiles_per_frame × anomaly_tile_samples` (2,048 points) — see ADR-0003 (a) for the ms slice.

Emit `renderer:anomaly_density {sigma}` per tile crossing the threshold — **magnitude only, no `type` field and no sign**; a signed or typed payload is a deterministic entity-type oracle. The renderer does not dedupe/rate-limit (UI/HUD's job, per GDD). (TR-pc-009)

**This ADR owes the arithmetic the GDD deliberately no longer states:** the worst-case points-per-sweep at legal-extreme tuning, proven against the density budget and the min-spec baseline. Input: the Q#7 prototype's measured 418 active tiles / ~530k resident points at default tuning. **That run predates the rebuild and must be repeated against the subsample+sweep model before this ADR is Accepted.**

### Architecture Diagram
```
   bus (injected, ADR-0001)
     │ floorplan:update            │ entity:spawn/proximity     │ scan:capture_frame/complete/abort
     ▼                             ▼                            ▼
  ┌──────────────── PointCloudRenderer ─────────────────────────────┐
  │ BASE (Points, 1 merged geom)  ← build/rebuild (b), jitter (e)   │
  │ BASE_SEALED (Points)          ← accreted scan detail (d)        │
  │ ENTITY_SPIKE / ENTITY_GHOST (Points)                            │
  │ VOID_MASK (Mesh, colorWrite:false depthWrite:true) ⚠️OQ1 (c)    │
  │ MATERIALIZING (transient Points, opacity ramp) (d)              │
  │ tile-grid density sampler → renderer:anomaly_density (f)        │
  └─────────────────────────────────────────────────────────────────┘
     rAF: bus.deliverTick() (ADR-0001 d) → renderer.render(scene, camera)
```

### Key Interfaces
- `new PointCloudRenderer(bus, scene, { baseDensity, densityBudgetCeiling, surfaceTypeWeights, pointSize, aTile, anomalySigmaThreshold, entityInfluenceRadius, ... })` — constructor-injected bus + tuning config (no hardcoded gameplay values).
- Subscribes: `floorplan:update`, `entity:spawn`/`entity:despawn`, `entity:transform`, `entity:position`, `entity:proximity`, `scan:capture_frame`, `scan:complete`, `scan:abort`.
  - `entity:transform {scale}` — re-scales the Type A VOID_MASK occluder in place (the growing-void tell). Held as last-applied while Type A is active; **resets to 1.0 on `entity:despawn`** so a stale scale never replays onto the next Type A (`entities.yaml`, `kind: discrete` — deliberately not latest-value).
  - `entity:position {position}` — positions ENTITY_SPIKE (Type B) / ENTITY_GHOST (Type C) after the spawn frame; `entity:spawn` carries only the initial position. Drives the renderer's Formula 3/5 CPU-side distance math (GDD AC-C09, BLOCKING).

  *Added 2026-08-01: both events were absent from this ADR entirely (zero mentions), though `point-cloud-renderer.md` records both inbound (round-6) and TR-ent-005 names this system as their consumer. Same defect class as ADR-0004 vs `movement:scan_released`.*
- Publishes: `renderer:anomaly_density {sigma}` — **magnitude only, `sigma >= 0`; no `type` field, no sign** (see (f); a signed or typed payload is a deterministic entity-type oracle). *Corrected 2026-08-01: this line still carried `{type, sigma}` after the 2026-08-01 C5 fix amended only (f)'s prose — the review marked C5 resolved while the Key Interfaces contract an implementer copies was still wrong.*

### Implementation Guidelines
- Layers are added to the scene, never swapped — BASE is never hidden (AC-C02).
- All Points layers `sizeAttenuation: true`, `size: 0.018`, unlit, square sprites; scene background `#0a0c10`.
- Pre-size all typed arrays; never grow by `push` in the render path.
- Keep the spatial grid (used by (e) and (f)) as one shared structure rebuilt with BASE.

## Alternatives Considered

### Alternative 1: One `BufferGeometry` per surface/room
- **Description**: each room surface is its own `THREE.Points`.
- **Pros**: simpler per-surface rebuild.
- **Cons**: hundreds of draw calls for a ~20-room property; violates the low-draw-call constraint; per-surface `THREE.Points` overhead.
- **Rejection Reason**: merged geometry per layer is the standard point-cloud perf pattern and what `technical-preferences.md` mandates.

### Alternative 2: Rebuild whole BASE to seal each scan
- **Description**: on `scan:complete`, rebuild BASE including the newly sealed points.
- **Pros**: literally "one BASE layer."
- **Cons**: O(1.5M) array rebuild on every scan completion — a periodic frame spike during the core loop.
- **Rejection Reason**: BASE_SEALED accretion (d) gives the same visual result without the per-scan rebuild.

### Alternative 3: CPU point-deletion for Type A void
- **Description**: remove BASE points inside the capsule volume on the CPU instead of depth-blocking.
- **Pros**: no depth-buffer trickery; deterministic.
- **Cons**: destroys the "surrounding cloud intact, silhouette emerges from blocking" property the GDD's horror depends on; requires editing the merged BASE geometry live.
- **Rejection Reason**: kept only as the last-resort fallback if the GPU depth-only path (c) fails verification.

## Consequences

### Positive
- Whole-property BASE renders in ~1 draw call per layer; predictable memory.
- Single-frame rebuild + accretion avoid visible pops and per-scan spikes.
- Jitter cost scales with the affected subset, not the whole cloud.

### Negative
- The Type A occluder is a real engine-behaviour bet (OQ1) — gated, with a fallback ladder.
- BASE_SEALED means "BASE" is conceptually two Points objects; anyone querying "all base points" must union them.

### Neutral
- Tuning values (density, tile size, thresholds) stay external config, not in this ADR.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| r171 depth-only occluder not invisible/blocking as specced | Medium | High | Prototype-gate before Accepted; fallback ladder (c) |
| Per-frame jitter on large subset spikes frame time | Medium | Medium | Subset-only writes; ADR-0003 budgets it; perf tripwire |
| Point size wrong at high-DPI (OQ3) | Low | Low | Verify `devicePixelRatio` scaling before external playtest |

## Performance Implications
| Metric | Expected | Budget |
|--------|----------|--------|
| CPU frame (steady) | jitter subset write + render | within 16.6 ms (detailed split → ADR-0003) |
| CPU frame (BASE rebuild) | one-time on `floorplan:update` | single frame, no incremental pop |
| Memory | ≤ ~1.5M pts × (pos+colour) ≈ ~18–36 MB geometry | ≤ 1–2M point ceiling |
| Load Time | one BASE build + auto-scale at session load | negligible |

## Migration Plan
No existing renderer code — this defines the first implementation's structure.

**Rollback plan**: if the depth-only occluder path fails verification, switch Type A to the CPU-deletion fallback (Alternative 3) without changing the rest of the ADR.

## Validation Criteria
- [ ] BASE + entity layers render as `THREE.Points` only; no visible mesh (AC-C01).
- [ ] BASE = ~1 draw call per property; rebuild is single-frame (AC-D01/E04).
- [ ] **OQ1 prototype**: occluder blocks points behind it and is itself invisible in r171.
- [ ] Jitter matches Formula 3 on the affected subset; MATERIALIZING overlay unaffected (AC-D03/E03).
- [ ] `renderer:anomaly_density` fires per Formula 2 threshold (AC-D02).
- [ ] ≥55 FPS avg at 1.5M ceiling on min-spec desktop (AC-P01).

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/point-cloud-renderer.md` | Point Cloud Renderer | TR-pc-001/002 — `THREE.Points`-only, additive layer stack | (a) one Points per category, VOID_MASK is Mesh |
| " | " | TR-pc-003 — Type A depth-only occluder | (c) invisible depth-writing Mesh (prototype-gated) |
| " | " | TR-pc-004/006 — budget + auto-scale + single-frame rebuild from floor-plan AABBs | (b) pre-sized arrays, dispose-and-swap |
| " | " | TR-pc-007 — per-frame jitter | (e) affected-index subset writes on rest-position baseline |
| " | " | TR-pc-008 — scan materialization + seal | (d) transient overlay → BASE_SEALED accretion |
| " | " | TR-pc-009 — anomaly density emission | (f) tile-grid sampled on change events |
| " | " | TR-pc-005 — 60 FPS at ceiling | (a)+(b)+(e) draw-call/alloc/subset discipline; measured by AC-P01 |

## Related
- ADR-0001 (bus wiring) — dependency.
- ADR-0003 (per-frame budget) — will allocate the ms this ADR's jitter/render/materialization consume.
- `design/gdd/point-cloud-renderer.md` OQ1/OQ3 — verification items carried here.
