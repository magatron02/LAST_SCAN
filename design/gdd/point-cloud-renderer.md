# Point Cloud Renderer

> **Status**: In Design — **MAJOR REVISION NEEDED** (round-7 fresh-context `/design-review`, 2026-07-26),
> **partially addressed: CD track 2 (the Formula 2 rebuild) is DONE as of 2026-08-01. Track 3 has not
> run — 7 of the 10 blockers are still open and untouched in this document.**
>
> Round 7 recorded 8 blockers + 8 recommended, **+1 found post-review** (Formula 5 pins
> `#include <output_fragment>`, a chunk that does not exist in r171 — renamed `opaque_fragment` in r152;
> a literal `.replace()` silently no-ops and the flicker never renders, while AC-D08 still passes),
> **+1 from the perf prototype** = **10 blockers**. Verdict was MAJOR **by process, not by vision**:
> **5 of the 8 review blockers were introduced by round-6's own same-session fixes** (6 of 10 counting
> the addendum), so the creative-director ruled **no further same-session fixing on this document — no
> exceptions for "cheap" items**. Root cause named: **Formula 2 had been the primary blocker in 6 of 7
> rounds** and had to be rebuilt once from its real data sources, not patched a fifth time.
>
> **CLOSED by the 2026-08-01 Formula 2 rebuild (3 of 10):** blocker 1 (`f_cov` has no data source —
> `f_cov`, `ρ_base_eff` and `min_coverage_fraction` are deleted, and the baseline is now the tile's own
> **measured** sealed-point count); blocker 3 (the cost bound stated no tuning assumption — the derived
> arithmetic is deleted outright, replaced by a normative per-frame bound and AC-D11); and the perf
> prototype's blocker (the 31–37 ms un-amortized pass — now subsampled and swept across frames, bounded
> at 2,048 points/frame at defaults). Also closed en route: the round-4 recommended "ρ_base nominal vs
> runtime D" item, the round-4 recommended joint `k_noise ≥ 1/√ρ_base` guard (re-homed onto the sample
> size, AC-D09), and the recommended "surface the frustum gate's attention-proxy role". Two defects were
> found *by* the rebuild and fixed in it: the activity gate said "intersects the frustum" when it must
> say **fully inside** (an edge-straddling tile read as a large false deficit on every sweep — AC-D12),
> and `k_noise`'s Poisson rationale was false under a measured baseline (restated as a sensitivity
> coefficient; every number unchanged). **The perf claim is closed by design, not by measurement — Open
> Q#7's prototype must be re-run against the rebuilt formula before AC-P01 is believed.**
>
> **STILL OPEN (7 of 10), untouched here, for CD track 3:** blockers 2 (Formula 1b guard overshoot),
> 4 (`toneMapped=false` asymmetry), 5 (AC-P01 window (c) backwards + unbarred), 6 (`ghost_decimation_stride`
> spawn-time-only), 7 (`flicker_rate` violates accessibility A-V3), 8 (Level Design dependency undeclared),
> and the Formula 5 `output_fragment`/`opaque_fragment` addendum — plus the 6 remaining recommended items.
>
> **ADR-blocking prototypes have now been RUN (2026-07-26):**
> - **Open Q#1 (occluder depth-cull) — GATE PASS.** 100% cull inside the silhouette, zero colour written,
>   120/120 viewpoints clean. Numeric readback, so it also serves as **AC-C08 evidence**. No longer blocks
>   the ADR, pending the ADVISORY screenshot sign-off.
> - **Open Q#7 (min-spec perf) — FAILS AC-P01's max-frame bar in all three windows**, and inverts this
>   GDD's risk model: rendering is a non-issue (136 avg FPS with 3M points + jitter/flicker over the whole
>   merged buffer), but **Formula 2's CPU sampling pass costs 31–37 ms per pass** — ~2× the entire frame
>   budget, as one un-amortized lump every 0.5 s — on hardware *faster* than min-spec. AC-P01's max-frame
>   bar was unmeetable with Formula 2 **as specified at the time** on any hardware. *(Addressed by the
>   2026-08-01 rebuild — the pass no longer exists in that form. Re-run required before the numbers are
>   claimed; AC-P01's own text is untouched and still carries blocker 5.)*
>
> Full detail, including what the prototypes did **not** settle, in
> `design/gdd/reviews/point-cloud-renderer-review-log.md`. **Do NOT self-approve.**
> **Author**: magatron02 + agents
> **Last Updated**: 2026-08-01 (Formula 2 rebuilt — CD track 2; Formula 1b, Tuning Knobs and AC-D02/D02b/D06 updated with it, AC-D09–D12 added. Nothing else in this document was touched.)
> **Implements Pillar**: Diegetic Matterport UI · Horror from familiar made wrong

## Overview

The Point Cloud Renderer is the sole visual output layer of LAST SCAN. Every surface, object,
and entity the player perceives is rendered as a sparse cloud of coloured dots — a LIDAR point
cloud in the aesthetic of Matterport Pro3 spatial capture. There is no solid geometry visible
at any moment in the game.

The renderer maintains one or more `THREE.Points` objects per scene: a base room layer sampled
at configurable density per surface area, plus optional overlay layers for entity-type anomalies
(Type B density spikes rendered as impossibly dense clusters in the same BASE green; Type C
ghost geometry as a dim second-room offset). No entity type carries a distinguishing colour —
the anomaly itself is the only tell (Entity System: the player receives no colour or label
taxonomy of type. The three tells remain geometrically distinct by shape/scale — a void, a
cluster, an offset ghost-room — but the renderer never hands the player the game's own type
labels; whether shape alone is a tell is an Entity System design concern, not this renderer's).
Type A entities are expressed as deliberate absence — a humanoid boundary where surrounding
point data exists but the silhouette does not, producing the horror of a void that has shape.

This system is the foundation everything else builds on: the floor plan renders its geometry
through it, scan progress materialises as new point data, entity proximity manifests as density
anomalies, and all Matterport-style horror tells are expressed as corruption of this data layer.
The player never sees anything that is not a point cloud — the renderer is both infrastructure
and the entirety of the game's visual language.

## Player Fantasy

The point cloud is the player's only reality. It is rendered in green dots, clinical and distant
at first contact — data, not place. This distance is intentional and will be removed.

**Phase 1 — The Analyst.** The player reads the scan as information. Walls are surfaces. Rooms
are bounding geometries. The renderer provides comfortable abstraction: this is a recording of
a space, not the space itself. The player navigates and comprehends, using the dollhouse overlay
and the point density to orient. They are a competent operator reading their instrument.

**Phase 2 — The Witness.** A density gap resolves into a silhouette. Geometry appears from a
room that is not in this session. The instrument becomes evidence. The player is no longer
reading — they are watching what happened to the unit that came before them. Nothing in the
renderer has changed. Only the player's relationship to the data has.

The point cloud never breaks from LIDAR aesthetic. This is the game's core commitment to
found-footage: the player never sees a monster. They see the shape of where data should exist
and does not. The horror is structural — it lives in the geometry of absence.

*Anchor moment (round-6 revision)*: the first time the player notices a Type A void. This
renderer's own detection (Formula 2) confirms it shortly after with an error message — the
system cannot promise the player notices *before* the game does, only that the geometry was
there to be read first, and that confirmation follows an already-active ambiguous NEAR-tier
disturbance rather than pre-empting it (see Formula 2's confirmation-dwell gate). The deeper
promise — "the void has been there, the player has been looking past it," true self-discovery
well before any system confirms it — is a **placement** question: how long a void sits in a
node's sightline before that node captures it, and from what approach angle, is Level Design's
responsibility (scan-node placement), not something this renderer's formulas can deliver alone.
This GDD no longer claims to guarantee that pacing; it guarantees the void is geometrically
present and correctly detected once seen.

## Detailed Design

### Core Rules

1. **Single visual language**: All player-visible output is `THREE.Points`. No solid meshes are
   ever rendered to the player's camera. Occluder meshes for Type A voids render in the opaque
   queue with `colorWrite: false` — no colour output ever reaches the framebuffer, but the mesh
   is present in the depth buffer (see Core Rule 6 for the full material recipe).

2. **Layer stack**: The scene maintains independent point layers by category:

   | Layer | Color | Condition |
   |---|---|---|
   | BASE | `#4ade80` (green), opaque | Always active |
   | ENTITY_SPIKE | `#4ade80` (green — density is the tell, not colour), opaque | Type B entity present |
   | ENTITY_GHOST | `#4ade80` at 15% opacity — **`transparent: true` required** | Type C entity present |
   | VOID_MASK | Invisible occluder mesh (`colorWrite: false`), scaled by inbound `silhouette_scale` | Type A entity present |

   Layers add to the scene; they do not replace BASE. BASE is never removed during normal play.
   Every point layer's material carries `depthTest: true` (Three.js r171 default, asserted
   explicitly — see Core Rule 6) so the VOID_MASK occluder's depth writes actually cull points
   behind it.

   **Transparency (normative, round-3 fix):** Three.js r171 ignores `material.opacity` unless
   `transparent: true` (same fact Core Rule 6 relies on for the occluder). Any layer that renders
   below full opacity must therefore set `transparent: true` explicitly — this is **ENTITY_GHOST**
   (0.15) and the **SCAN_MATERIALIZING overlay** (Formula 4's 0→1 opacity ramp). Left at the
   `transparent: false` default they would render fully opaque and their horror read would fail
   silently while a material-flag assertion still passed. These two live in the **transparent render
   queue**, not the opaque queue — so Core Rule 6's "shares one opaque list" statement applies to
   BASE, ENTITY_SPIKE and the occluder only. This does **not** break the Type A cull: r171 always
   draws the entire opaque queue (including the occluder's depth writes) before any transparent
   object, regardless of `renderOrder`, so the depth buffer is already populated when ghost/
   materializing points draw — as long as they keep `depthTest: true` (required above).

3. **Point density**: Defined as points per square metre per surface. Room geometry is sampled
   uniformly across all 6 inner surfaces of each room AABB. Density is a tuning knob, not
   hardcoded per the technical-preferences.md constraint (no hardcoded gameplay values).

4. **Perspective attenuation**: All layers use `sizeAttenuation: true`. Point visual size
   scales with distance from camera.

5. **Room geometry source**: Room AABB dimensions are provided by the Floor Plan System at
   session load and on any floor plan update event. The renderer does not own spatial data
   — it consumes it.

6. **Type A void mechanics**: The void is not a gap in a `BufferGeometry`. It is an invisible
   occluder mesh (capsule, humanoid proportions — **base** ~1.8m tall, ~0.5m radius) placed at
   the entity position. It writes to depth only, blocking BASE points behind it. The surrounding
   point cloud remains intact — the void's silhouette shape emerges from what the occluder reveals
   by blocking.
   **Material recipe (Three.js r171)**: the occluder must stay in the **opaque render queue** —
   `transparent: false`, `depthWrite: true`, `colorWrite: false`, with an explicit **numeric**
   `renderOrder` lower than every point layer (contract: occluder `renderOrder = -1`; every point
   layer `renderOrder ≥ 0`) so it writes depth before any points draw. r171's opaque-list sort
   (`painterSortStable`) keys on `renderOrder` *before* material id / z, and `THREE.Mesh` and
   `THREE.Points` share one opaque list — so the negative `renderOrder` deterministically forces
   the occluder to draw first. The guarantee holds only while every point layer stays `≥ 0`; a
   layer added at the default `renderOrder = 0` is still safe, but any future layer set negative
   would break it (asserted by AC-C07). `opacity: 0` is NOT the mechanism: Three.js ignores
   `opacity` unless `transparent: true`, and a transparent-queue mesh draws *after* opaque points,
   culling nothing. `colorWrite: false` is what makes it invisible.
   **Depth-test dependency**: the occluder's `depthWrite` only culls points that themselves run
   the depth test. Every point layer's `PointsMaterial` must therefore keep `depthTest: true`
   (the r171 default). This is a load-bearing invariant, not incidental — a layer that disables
   `depthTest` (e.g. a future "see-through ghost" tweak) would render straight through the void
   with nothing to catch it. Asserted per point-layer material in AC-C07.
   **Silhouette scale**: the occluder mesh is uniformly scaled by an inbound `silhouette_scale`
   multiplier (default 1.0 = base proportions above). Entity System owns the growth curve
   (its Formula 1, dwell-based, asymptotic to ~1.75×) and the dwell state; the renderer does not
   compute growth — it applies whatever scale it is handed, re-scaling the occluder mesh in place
   without rebuilding it. See Interactions for the inbound `entity:transform {scale}` contract
   (**ratified, round-6** — Entity System's Core Rule 6/AC-ES17b now emits it; the Open
   Cross-System Item is closed).
   **Silhouette edge quality**: `GL_POINTS` carry per-vertex (not interpolated) depth, so at the
   0.018-unit point size the silhouette boundary pops binary (a point is fully culled or fully
   visible), not antialiased. This is expected and on-brand for the LIDAR aesthetic — noted here
   so it is not filed as a bug during the Open Q#1 prototype review.
   Prototype verification of the depth-cull behaviour remains required (Open Q#1).

7. **Scan materialization**: During an active scan sequence, new points for the node's capture
   area appear progressively (angle by angle: 0°→90°→180°→270°). These points animate from
   opacity 0 → 1 over ~0.5s per frame. Abort discards in-progress points. Completion merges
   them permanently into BASE.

### States and Transitions

States are not mutually exclusive; any combination may be active simultaneously.

| State | Description | Entry | Exit |
|---|---|---|---|
| `NORMAL` | BASE layer only, no distortion | Session start | Any entity spawns |
| `ENTITY_A` | Type A occluder placed at entity position | `entity:spawn (type A)` | `entity:despawn` |
| `ENTITY_B` | Green (`#4ade80`) density-spike cluster added at entity position — density is the tell, not colour | `entity:spawn (type B)` | `entity:despawn` |
| `ENTITY_C` | Ghost room geometry layer active, offset ±0.3m | `entity:spawn (type C)` | `entity:despawn` |
| `PROXIMITY_DISTURBED` | BASE points within entity radius shift ±0.02m/frame | `entity:proximity NEAR` | Tier leaves `NEAR`: `MEDIUM`/`FAR` → jitter ends; `ADJACENT` → `PROXIMITY_CORRUPTED` |
| `PROXIMITY_CORRUPTED` | Widespread jitter (Formula 3, ADJACENT envelope) + same-green **brightness flicker** (Formula 5) | `entity:proximity ADJACENT` | Tier leaves `ADJACENT`: `NEAR` → `PROXIMITY_DISTURBED`; `MEDIUM`/`FAR` → jitter + flicker end |
| `SCAN_MATERIALIZING` | New points appear progressively around scan node | `scan:capture_frame` | `scan:complete` or `scan:abort` |

### Interactions with Other Systems

| Source system | Data in | Effect on renderer |
|---|---|---|
| Floor Plan System | Room AABB(s), surface list | Rebuild BASE layer geometry |
| Entity System | `entity:spawn {type, position}` / `entity:despawn {}` (via Orchestrator) | Activate/deactivate matching entity layer; move it |
| Entity System | `entity:transform {scale}` (via Orchestrator) — **ratified, round-6** (Entity System Core Rule 6 / AC-ES17b) | Re-scale the active Type A VOID_MASK occluder in place to `scale` (Entity Formula 1's `silhouette_scale`), **clamped to `[1.0, 1.75)`** before being applied to the mesh — an out-of-range or garbage value is clamped to the nearest bound, never applied raw (AC-ST06). Continuous — emitted while a Type A void grows/decays with dwell. No type label beyond the already-active layer. |
| Entity System | `entity:position {position}` (via Orchestrator) — **new, round-6** (Entity System Core Rule 11 / AC-ES47) | Reposition the active ENTITY_SPIKE/ENTITY_GHOST layer to the new world position, and update the cached entity position Formula 3/5 use for the CPU-side distance `d` and the in-shader `uEntityPos` radius gate. Latest-value kind, emitted every tick while Type B or Type C is active; never emitted for Type A (stationary — `entity:spawn`'s position already suffices, see Formula 3's Distance source) or while no entity is active. |
| Orchestrator `entity:proximity {tier}` | Proximity tier (FAR/MEDIUM/NEAR/ADJACENT) | Set PROXIMITY state |
| Orchestrator `scan:capture_frame {angle, progress}` | Capture angle + progress % | Trigger SCAN_MATERIALIZING for current arc |
| Orchestrator `scan:complete` | Node ID | Seal materializing points into BASE |
| Orchestrator `scan:abort` | — | Discard in-progress materialization |

**Renderer → Orchestrator** (outbound events):
- `renderer:anomaly_density {sigma}` — emitted when rendered point density (`BASE + ENTITY_SPIKE`,
  not ENTITY_GHOST) in any active tile deviates beyond the anomaly threshold. `sigma` is the
  **magnitude only** (|σ| ≥ 0 — the sign is stripped before emission; see Formula 2 event-firing
  rule). The payload carries **no entity-type label and no direction** — a signed value would be a
  type oracle (deficit ⟺ Type A, spike ⟺ Type B), so consumers must be unable to tell the player
  which type they face (Entity System's core fantasy). UI/HUD subscribes to trigger Matterport-style
  error messages, keyed on magnitude alone.

## Formulas

### Formula 1 — Surface Point Count

The surface_point_count formula is defined as:

`N = floor( A × D × W_s )`

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Surface area | A | float | 0.1–200.0 m² | Inner surface area from Floor Plan AABB |
| Base density | D | int | 100–2000 pts/m² | Tuning knob — default 900 |
| Surface weight | W_s | float | 0.5–1.5 | Per-type multiplier (see table) |
| Output | N | int | ≥1 | Point count for this surface |

Surface weight table (`surface_type_weights` — tuning knob):
| Surface | W_s | Rationale |
|---|---|---|
| floor | 1.2 | Player's eye level — denser for spatial clarity |
| wall | 1.0 | Neutral reference |
| ceiling | 0.6 | Rarely examined; real LIDAR loses density overhead |

**Output range:** N ≥ 1 (floor-clamped — prevents zero-point surfaces).
Budget check: if total N across all surfaces exceeds `density_budget_ceiling`
(tuning knob, default 1,500,000), D is auto-scaled down uniformly at scene
load until total fits — but **never below `base_density_floor`** (tuning knob,
default 100 = D's safe-range minimum). If the scene still exceeds the ceiling at
D = `base_density_floor`, the layout is **rejected at load** (room set too large
for the point budget) rather than silently scaling into sub-legible or sub-1-point
surfaces. This floor is what keeps the N-floor-clamp (AC-E01) a defensive guard
against malformed data, not a path reachable by ordinary large rooms.

**Example:** floor 20m², D=900, W_s=1.2 → N = floor(20 × 900 × 1.2) = 21,600 pts

---

### Formula 1b — ENTITY_SPIKE Density (round-6 addition)

Round-5 found ENTITY_SPIKE (Type B's "impossibly dense cluster," Core Rule 2) had no density
spec anywhere in this GDD — no formula, no point count, no ceiling — making its worst-case memory
open-ended. This formula closes that gap.

The entity_spike_density formula is defined as:

`N_spike = floor( A_spike × ρ_base_local × M_spike )`

where `ρ_base_local` is the **nominal** density of the surface the spike sits on (`D × W_s` from
Formula 1), so a spike's "impossible density" is always relative to its surroundings, not a fixed
absolute count. *(This is a predicted value, used to size the cluster at spawn — it is **not**
Formula 2's `ρ_base`, which since the 2026-08-01 rebuild is the tile's own **measured** sealed-point
count. The two agree for a fully-sealed tile and diverge for a partially-sealed one; Formula 1b
wants the nominal value either way, because it is sizing geometry, not detecting it.)*

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Spike footprint area | A_spike | float | 0.25–4.0 m² | Cluster's occupied area — tuning knob, default 1.0 |
| Local baseline density | ρ_base_local | float | = D × W_s | **Nominal** density of the spike's surface (Formula 1). Distinct from Formula 2's **measured** per-tile `ρ_base` |
| Spike density multiplier | M_spike | float | 2.0–6.0 | "How impossible" the cluster reads — tuning knob, default 3.0 |
| Output | N_spike | int | ≥1 | Point count for the ENTITY_SPIKE cluster |

**Output range:** N_spike ≥ 1 (floor-clamped, same defensive guard as Formula 1's N).

**Example:** floor tile, D=900, W_s=1.2 (ρ_base_local = 1,080), A_spike=1.0, M_spike=3.0 →
N_spike = floor(1.0 × 1,080 × 3.0) = 3,240 pts. That same fully-sealed floor tile *measures*
`ρ_base` = 1,080 in Formula 2 at the default `A_tile` = 1.0 (denominator = 1,080×0.10×1 = 108,
threshold σ=2.5 → ≈270-pt deviation needed), so a 3,240-pt addition trivially registers as a spike —
satisfying the existing detection contract without further tuning.

**Combined layer budget (round-6 addition, performance-analyst finding):** `density_budget_ceiling`
(Formula 1, above) bounds BASE alone. Because only one entity type is active at a time (Entity
System Core Rule 3 — single entity, despawn-before-spawn), ENTITY_SPIKE and ENTITY_GHOST never
coexist; the only large addition to guard against is ENTITY_GHOST, a full rigid-translated
duplicate of BASE (Core Rule 2/AC-C04). **Guard:** at Type C spawn, if `BASE_count × 2 >
density_budget_ceiling` (BASE alone already exceeds half the ceiling), ENTITY_GHOST is built at a
fixed decimation stride (`ghost_decimation_stride`, tuning knob, default 1 = no decimation,
auto-raised only when this guard trips) so the combined total fits — at 15% opacity and this
game's sparse LIDAR aesthetic, a decimated duplicate is not perceptibly different from a 1:1 one.
ENTITY_SPIKE's `N_spike` (thousands, not millions) never approaches this guard and needs no
equivalent check.

---

### Formula 2 — Anomaly Density Sigma

The anomaly_density_sigma formula is defined as:

`σ = ( ρ_obs − ρ_base ) / ( ρ_base × k_noise × √(A_ref / A_tile) )`

> **REBUILT 2026-08-01 (CD track 2 — rebuilt once, from data sources up).** The formula *shape* and
> every worked number below are unchanged. What changed is **where the two densities come from**.
> Rounds 4–7 each patched `ρ_base` with a term whose data source did not exist yet (visible-set
> semantics → layer set → tile activity → `f_cov`), which is why this formula was the primary blocker
> in 6 of 7 rounds. Both densities are now read from data the renderer already holds.
> **`f_cov`, `ρ_base_eff` and the `min_coverage_fraction` knob are DELETED** — every case they were
> invented to handle is handled by the measured baseline below. The round-7 prototype's measured
> **31–37 ms sampling pass** (≈2× the whole frame budget) is addressed by subsampling + a per-frame
> sweep, also below.

**The detection tile index (normative — the one data structure this formula requires):** the renderer
maintains a spatial bin per detection tile (`A_tile` m², axis-aligned) holding the indices of the
`BASE` and `ENTITY_SPIKE` points inside it, plus two counts: `N_base` (sealed BASE points) and
`N_res` (`N_base` + any ENTITY_SPIKE points currently in the tile). Bins are written at the moments
points are: when a node's capture arc completes and its points are sealed into BASE (Core Rule 7),
when BASE is rebuilt on `floorplan:update`, and when an ENTITY_SPIKE cluster spawns or despawns.
**The index is built incrementally and is never required to complete within a single frame** — a tile
whose bin is not yet built is simply not active. This is the resolution of the prototype's measured
**87 ms full index build** against AC-E04's same-frame BASE rebuild: BASE geometry is replaced in one
frame, the index catches up over subsequent frames, and detection resumes tile by tile as it does.
`ENTITY_GHOST` is never binned (excluded from ρ_obs — see Sampling space).

**Baseline density (normative — measured, not predicted):**

`ρ_base = N_base / A_tile`

This is the density the tile **actually holds in the buffer**, not the density config predicts it
should hold. `ρ_base` is no longer `D × W_s`. Consequences — each of these was a separately-filed
defect under the predicted baseline:

- An **unscanned** tile has `N_base = 0`, fails the activity gate below, and cannot false-fire.
  (Round-5's confirmed σ ≈ −10.0 model failure — the detector screaming "void" across the unexplored
  map — is structurally impossible now, not compensated for.)
- A **partially-sealed** tile (one of a room's nodes complete, another not) reads its own real
  baseline, and `ρ_obs` matches it → σ ≈ 0. **No per-tile spatial coverage fraction is needed, or
  invented.** (Round-7 blocker 1: `f_cov` had no data source.)
- A tile that legitimately holds **fewer points than `D × W_s × A_tile`** — straddling a room
  boundary, or split across surfaces with different `W_s` — reads correctly instead of as a permanent
  deficit. (Not previously filed; it was latent in every predicted-baseline version.)
- `ρ_base` follows Formula 1's **auto-scale-down** and any `floorplan:update` automatically, because
  it is read from the buffer rather than from config. (Round-4 recommended item 1b, "ρ_base
  nominal-vs-runtime binding underspecified", closed.)

**Sampling space (normative — which layers count):** ρ_obs is measured over the points that are
**camera-visible and not occluded** in the current view. The counted set is the **additive detection
layers**: `BASE` **and `ENTITY_SPIKE`**. This is load-bearing and was the round-3 fix: because
`ENTITY_SPIKE` is a permanently separate layer that never merges into BASE (Core Rule 2), a sampler
that counted BASE alone would leave a Type B spike invisible to the detector (ρ_obs unchanged →
σ ≈ 0 → no event). Counting `BASE + ENTITY_SPIKE` is what lets a Type B spike register as a positive
deviation, symmetric to how the VOID_MASK occluder lets a Type A void register as a deficit (the
occluder leaves the buffer intact per Core Rule 6 but removes points from the visible set, so a tile
covering the silhouette reads a density deficit). **`ENTITY_GHOST` (Type C) is deliberately EXCLUDED
from ρ_obs** — the Type C tell is geometric/visual (an offset second room the player perceives
directly), not a density-anomaly event; counting its 15%-opacity duplicate points would flood the
scene with spurious room-wide positive-σ events. Type C therefore fires no `renderer:anomaly_density`
event by design.

**Active detection tiles (normative — the gate):** a tile is *active* iff **all four** hold:

1. **Its bin exists** — the index has been built for it (see above).
2. **Its AABB lies entirely inside the camera frustum** — *fully* inside, not merely intersecting.
   A tile straddling the frustum edge has most of its points failing the frustum test for a reason
   that has nothing to do with an entity, and would read as a large false deficit on every sweep, at
   every screen edge. *(Round-6 and earlier said "intersects"; that was wrong.)*
3. **Its centre is within `anomaly_sample_radius`** of the camera (tuning knob, default 12 m).
4. **`N_base ≥ N_min`**, where **`N_min = ceil(1 / k_noise²)`** (= 100 at the default
   `k_noise = 0.10`). A tile with fewer sealed points than this cannot support the sensitivity model —
   one culled point out of five is a 20% deficit — so it is not sampled. **This single gate replaces
   `min_coverage_fraction`, the unscanned-tile exclusion, AND the joint `k_noise ≥ 1/√ρ_base` guard
   open since round 4.** All three were the same requirement stated three ways. It is also this
   formula's division-by-zero guard: `ρ_base = 0` cannot reach the denominator because such a tile is
   never sampled.

The frustum condition is also, deliberately, an **attention proxy**: the renderer confirms only
anomalies the player could be looking at. It is *not* a pure proximity gate — a specialist misread it
as one in round 7, and it is the reason the confirmation dwell below is reachable rather than
vacuous.

**Sampling mechanism (normative — CPU-side, subsampled, swept across frames):** visibility is
determined on the CPU, never by reading back the GPU depth buffer (`gl.readPixels` / occlusion
queries stall the pipeline synchronously and are prohibited here).

For each active tile the renderer inspects `n = min(N_res, anomaly_tile_samples)` of its binned
points — **not all of them** — taking every `floor(N_res / n)`-th index in the bin: a **systematic
stride, never RNG**, so the pass is deterministic and unit-testable (coding-standards' determinism
rule) and the reads are cache-coherent. Each inspected point is tested for (a) frustum inclusion and
(b) obstruction by any active VOID_MASK occluder — the latter geometrically (point-to-camera segment
vs. the occluder capsule(s)), the same capsule data the renderer already holds. With `k` of the `n`
inspected points visible:

`ρ_obs = ( N_res × k / n ) / A_tile`

This remains an **approximation** of true rendered visibility (it ignores point-vs-point
self-occlusion, negligible for a sparse cloud) and it is the authoritative definition of ρ_obs.
Inspecting *every* point is what the round-7 prototype measured at **31–37 ms per pass** — roughly 2×
the entire frame budget, and the dominant cost in the whole system. Density estimation does not
require every point.

> `ponytail:` systematic stride over insertion order. Known ceiling: if BASE point insertion ever
> becomes periodic in a way that resonates with the stride (e.g. strict per-surface interleaving at a
> fixed period), the sample stops being representative. Upgrade path: a fixed-seed permutation of the
> bin, which keeps determinism. Not needed at the current generation order (surface by surface).

**Per-frame sweep (normative — no un-amortized lump):** the active set is swept at
`anomaly_tiles_per_frame` (tuning knob, default 16) tiles per frame, so that every active tile is
evaluated exactly once per `anomaly_sample_interval`. A tile's σ, its threshold test and its
confirmation-dwell counter update **once per sweep**, not once per frame. **The renderer must never
inspect more than `anomaly_tiles_per_frame × anomaly_tile_samples` points in a single frame** — 2,048
at defaults. If the active set exceeds one interval's sweep capacity, the sweep continues into the
next interval rather than bursting or skipping tiles: **the sweep rate is the hard bound; the
interval is the target.**

*Accepted approximation:* tiles are therefore sampled at different moments within an interval, so a
moving entity's tell can lag by up to one `anomaly_sample_interval` (0.5 s at defaults) depending on
where its tile falls in the sweep order. This is already inside the confirmation dwell's own 1.0 s
window and below the tell's design latency; it is accepted, not compensated for.

**Per-pass budget instead of derived arithmetic (normative absence):** this document deliberately
states **no** worst-case points-per-pass arithmetic. Two rounds derived that number and both
derivations broke (round-5's 1.77M; round-7's disputed 764k vs 2.12M — where the CD ruled *the
disagreement itself was the finding*). The normative statement is the per-frame bound above. Proving
that bound against the density budget, the tile count and the min-spec baseline belongs in the Point
Cloud ADR, whose input is the round-7 prototype's **measured** 418 active tiles / ~530k resident
points at default tuning.

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Observed density | ρ_obs | float | 0–∞ pts/m² | **Estimated** rendered (camera-visible, post-occlusion) density of `BASE + ENTITY_SPIKE` in the tile = `(N_res × k/n) / A_tile` (ENTITY_GHOST excluded — see Sampling space) |
| Baseline density | ρ_base | float | 0–∞ pts/m² | **Measured** = `N_base / A_tile` — the tile's own sealed BASE point count. **Not `D × W_s`.** Tiles with `N_base < N_min` are excluded from the active set, which is this formula's division-by-zero guard |
| Resident points in tile | N_res | int | ≥ 0 | Binned `BASE + ENTITY_SPIKE` point count |
| Sealed BASE points in tile | N_base | int | ≥ 0 | Binned BASE point count — the baseline's data source |
| Min. sealed count to sample | N_min | int | derived = `ceil(1/k_noise²)` | **Not a knob** — derived from `k_noise` (100 at default, 400 at the `k_noise` floor of 0.05) |
| Points inspected per tile | n | int | = `min(N_res, anomaly_tile_samples)` | Systematic stride over the bin |
| Visible among inspected | k | int | 0–n | Passed frustum ∧ not occluder-blocked |
| Sensitivity coefficient | k_noise | float | 0.05–0.30 | Tuning knob, default 0.10 — **the fractional deviation from baseline that equals 1σ** (see restatement below). **Load-time guards**: `k_noise > 0` (zero zeroes the denominator → ±∞/NaN, AC-D06) and `anomaly_tile_samples ≥ ceil(1/k_noise²)` (AC-D09) |
| Tile area | A_tile | float | 0.5–4.0 m² | Detection tile size — tuning knob, default 1.0. **Load-time guard**: `A_tile > 0` validated at load; `A_tile ≤ 0` zeroes/undefines the denominator (`√(A_ref/A_tile)` is NaN for negative `A_tile`) and is rejected (AC-D06) |
| Reference area | A_ref | float | const = 1.0 m² | Normalization constant |
| Output | σ | float | signed | Standard deviations from baseline |

**What `k_noise` means after the rebuild (honest restatement, no numeric change):** under the old
*predicted* baseline, `k_noise` modelled natural **Poisson** variance between a tile's expected and
actual point count. With a **measured** baseline that variance is already inside `ρ_base` — a normal,
fully-visible tile now reads σ = 0 *exactly*, not σ ≈ 0. `k_noise` is therefore a **sensitivity
coefficient**: the relative deviation that counts as one standard deviation. Numerically nothing
moves (at the default tile size σ = relative deviation ÷ `k_noise`), so every threshold, worked
example, AC and downstream consumer is unaffected — only the rationale is now true. Its remaining
noise sources are the subsample estimator (guarded below) and tile-boundary geometry, not Poisson
counting.

**Sampling-error guard (normative):** the estimator `k/n` has standard error `√(v(1−v)/n) ≤ 0.5/√n`,
which in σ units is `0.5 / (k_noise·√n)`. Requiring **`anomaly_tile_samples ≥ ceil(1/k_noise²)`**
(= `N_min`; 100 at default, 400 at the `k_noise` floor) holds that at or below **0.5σ** — a fifth of
the 2.5σ default threshold, and the confirmation dwell then requires two consecutive breaches, making
an estimator-driven false event vanishingly unlikely. Validated at load; a config violating it is
rejected (AC-D09). *(This is the round-4 recommended `k_noise ≥ 1/√ρ_base` guard, open for four
rounds, re-homed onto the quantity it actually constrains — the sample size, which is a knob, rather
than the tile population, which is not.)*

The `√(A_ref / A_tile)` denominator term (normalizes for tile size): a smaller tile holds
proportionally fewer points, so both its largest possible sample and the quantization of `k/n` are
coarser — a single culled point moves ρ_obs further. The expected-noise term must therefore **grow**
as `A_tile` shrinks, hence `√(A_ref / A_tile)`. This raises the effective firing threshold for small
tiles in proportion to their real estimator noise, suppressing false positives at fine resolution.
*(The earlier `√(A_tile / A_ref)` form had this inverted — it made small tiles more trigger-happy,
the opposite of the intent; corrected 2026-07-16. The direction is unchanged by this rebuild; only
the justification moved from Poisson counting noise to sampling/quantization noise, which scales the
same way.)* At the default `A_tile = A_ref = 1.0 m²` the term is exactly 1.0, so all default-tile
examples and ACs are unchanged.

**Event firing rule:**
- σ is computed **signed internally** (positive = spike, negative = deficit) for the threshold
  test, but the emitted payload carries **magnitude only**: |σ| ≥ `anomaly_sigma_threshold`
  (default 2.5) → emit `renderer:anomaly_density {sigma}` where `sigma = |σ|` (always ≥ 0).
  **The sign is stripped before emission (round-3 fix).** Rationale: a signed payload is a
  deterministic *type oracle* — negative can only ever mean Type A (deficit), positive only ever
  Type B (spike), so any subscriber logging the sign reconstructs the entity type, violating
  Entity System's "no type taxonomy" fantasy at the event-contract level. No documented subscriber
  (UI/HUD picks error-message intensity from magnitude) needs the direction; if a future feature
  genuinely does, restoring it must be a deliberate reviewed decision, not a latent leak.

**Confirmation dwell (normative):** a tile's `|σ|` must remain ≥ `anomaly_sigma_threshold` for
`anomaly_confirm_samples` (tuning knob, default 2) CONSECUTIVE **sweeps** before the event fires —
not on the first qualifying sweep alone. This buys a beat of unconfirmed exposure between a real
anomaly entering the sampled set and the game confirming it, so the renderer's own tell doesn't
pre-empt the player's chance to notice first (Player Fantasy §B). If `|σ|` drops below threshold on
any intervening sweep, the consecutive count resets to 0. **Ordering constraint:**
`anomaly_confirm_samples × anomaly_sample_interval` must be tuned so the confirming event cannot fire
before NEAR-tier jitter (Formula 3) has been active for at least one full `anomaly_sample_interval` —
escalation is sequenced (ambiguous doubt → confirmed witness), not just delayed. At defaults
(2 sweeps × 0.5 s = 1.0 s) this holds trivially, since NEAR triggers as soon as the entity crosses
8.0 m, well before a Type A tile at close range would typically be swept. Re-tune together if either
default changes.

**Output range:** σ is unbounded (signed). Values above 5.0 indicate entity-tier
anomaly. Values 2.5–5.0 are soft tells. Values below 2.5 are normal variance.

**Examples** (all at default `A_tile = 1.0 m²`, so `√(A_ref/A_tile)` = 1.0, and
`anomaly_tile_samples = 128`; `sigma` = emitted magnitude |σ|). The reference tile is a **wall** tile
(`W_wall = 1.0`) at `D = 900`, fully sealed → `N_base = 900` **measured**, `ρ_base = 900 pts/m²`,
denominator = 900 × 0.10 × 1 = 90:

- **Type B spike:** an ENTITY_SPIKE cluster puts 450 points in the tile → `N_res` = 1,350, none
  occluded → `k = n` → ρ_obs = 1,350 → σ = 450/90 = **+5.0** → emit `{sigma: 5.0}` ✓
- **Type A void:** an active occluder blocks 40% of the tile's points from the visible set → of
  `n = 128` inspected, `k = 77` pass (0.6016) → ρ_obs = 900 × 0.6016 ≈ 541 → σ ≈ **−3.98** → emit
  `{sigma: 3.98}` (sign stripped — indistinguishable from a +3.98 spike) ✓ *(whole-tile inspection
  gave exactly −4.0; the ±0.02 is the estimator's quantization, two orders below the threshold)*
- **Normal tile:** nothing occluding, no spike → `k = n` → ρ_obs = ρ_base → σ = **0.0** exactly →
  no event ✓ *(under the predicted baseline this case read σ ≈ 0 with Poisson scatter; under the
  measured baseline it is exact)*
- **Partially-sealed tile** (the case `f_cov` existed for): one of the two nodes contributing to the
  tile has completed → `N_base = 450` measured → ρ_base = 450, denominator = 45; all 450 resident
  points visible → ρ_obs = 450 → σ = **0.0** → no event ✓ **with no coverage fraction anywhere in the
  model**
- **Unscanned tile:** `N_base = 0 < N_min` (100) → not active, never swept, no event ✓
- **Too-sparse tile:** legal-minimum tuning `D = 100`, `W_s = 0.5`, `A_tile = 0.5` → 25 sealed points
  < `N_min` → not active ✓ *(this is the round-4 low-baseline noise-floor case, now excluded by
  construction instead of by an unenforced guard)*
- **Tile-size sanity** (Type B deviation +450 at `A_tile = 0.25 m²`, outside the current safe range —
  shown for direction only): denominator = 900 × 0.10 × √(1/0.25) = 180 → σ = 450/180 = 2.5 — the
  *same* absolute deviation registers as a **weaker** tell in a smaller tile. Correct direction ✓

---

### Formula 3 — Proximity Jitter Magnitude

The proximity_jitter_magnitude formula is defined as:

```
t = clamp( (d − d_min) / (d_max − d_min), 0, 1 )
J = J_min + (J_max − J_min) × (1 − t)²
```

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Entity distance | d | float | 0–∞ m | World-space distance from entity to player — computed CPU-side each frame from a cached entity position against `camera.position` (see Distance source, below); not received as a scalar event |
| Tier inner edge | d_min | float | per tier | Closest bound of tier band (m) |
| Tier outer edge | d_max | float | per tier | Furthest bound of tier band (m) |
| Normalised position | t | float | 0–1 | 0=closest to player, 1=at outer edge |
| Min jitter (tier floor) | J_min | float | per tier | Displacement at the tier's **outer** edge (d=d_max) — pinned to the *next tier out*'s J_max for cross-tier continuity |
| Max jitter | J_max | float | per tier | Max displacement at closest contact (d=d_min) |
| Output | J | float | J_min–J_max | Point displacement per frame (m) |

**Tier parameters** (tuning knobs):
| Tier | d_min | d_max | J_min | J_max | Design intent |
|---|---|---|---|---|---|
| NEAR (PROXIMITY_DISTURBED) | 3.0m | 8.0m | 0.000m | 0.020m | Subliminal — player suspects, doubts themselves |
| ADJACENT (PROXIMITY_CORRUPTED) | 0.0m | 3.0m | 0.020m | 0.180m | Data unreadable — spatial orientation breaks |

**Cross-tier continuity (normative):** each tier's `J_min` equals the next-tier-out's `J_max`,
so J is a **continuous, monotonically rising** function of *decreasing* absolute distance across
the whole NEAR+ADJACENT band. At the shared seam d=3.0m both tiers evaluate to 0.020m (NEAR at
its d_min, ADJACENT at its d_max). This fixes the earlier discontinuity where ADJACENT dropped to
0 at d=3.0 — which had made jitter *lowest* exactly as the entity entered the more dangerous tier,
inverting the dread ramp *(corrected 2026-07-16)*. `J_min NEAR = 0` because FAR/MEDIUM produce no
jitter, so NEAR's outer edge is the true floor of the effect.

**Load-time guards:** (1) `d_min < d_max` is validated per tier (equal bounds divide by zero →
NaN; swapped bounds silently invert the curve — mirrors Floor Plan's `D0 < D_max` guard, AC-D08).
(2) `J_min ≤ J_max` per tier, and each tier's `J_min` equals the adjacent tier's `J_max` (the
continuity invariant above) — a config violating either is rejected.

The (1−t)² quadratic: jitter rises sharply as entity closes, not linearly.
Makes the final metres of approach feel urgent and non-telegraphed.

**Distance source (normative, round-6 fix):** `d` is derived CPU-side, not received as a scalar
event. For a stationary Type A entity, `d` is computed every frame from `entity:spawn`'s one-time
position (cached — the position never changes, AC-ES13) against the current camera position. For
Type B/C, `d` is computed every frame from the latest cached `entity:position {position}` (Entity
System Core Rule 11 — emitted every tick while Type B or Type C is active; see Interactions)
against the current camera position. The renderer already holds a reference to the active
`THREE.PerspectiveCamera` to render the scene at all, so no additional upstream event beyond
`entity:position` itself is required. `camera.position` is FPS Movement's own render-frame image
of `player:position` — the two are not independently sourced, so no separate contract is needed
to keep them in sync. *(Closes round-5's "Formula 3/5 unimplementable" blocker — the prior gap was
that only `entity:proximity {tier}`, a 4-value enum, was available; `entity:position` supplies the
missing continuous position.)*

**Application mechanism (normative — GPU vertex shader, not CPU buffer rewrite):** jitter is a
GPU-side vertex displacement, **not** a per-frame CPU rewrite of point positions. The BASE
`PointsMaterial` is extended via `onBeforeCompile` to inject: a per-point pseudo-random unit
offset (hashed from the vertex's own index/position, stable per point), a `uTime` uniform
(advanced once per frame on the CPU), a per-frame `uJitter` uniform (= J, computed once from the
formula using the CPU-derived `d` above), and a per-frame `uEntityPos` vec3 uniform (the cached
world-space entity position above, used for the in-shader `entity_influence_radius` gate). The
vertex shader displaces each in-influence point (`distance(vertexWorldPos, uEntityPos) <
entity_influence_radius`) by `uJitter × hash(...) × noise(uTime)`. The CPU touches only three
small per-frame values (two scalars + one vec3) — **no `position` attribute is rewritten or
re-uploaded**. This keeps the effect off the ~100k-point/~1.2MB-per-frame CPU→GPU cost path (see
Performance / AC-P01); three floats/frame is categorically different from a buffer rewrite.
`entity_influence_radius` itself is a static uniform (set once, a tuning knob — not re-uploaded
per frame). *(Rationale: at defaults a 5 m radius over 900 pts/m² is ~70–100k points; rewriting+
uploading that every frame during proximity is not viable on the min-spec baseline — see
technical-preferences.md.)*

**Injection point (normative):** the displacement is applied to the `transformed` position vector
**before** `#include <project_vertex>`, so that `gl_PointSize`'s `sizeAttenuation` falloff
(computed from the post-jitter `-mvPosition.z`) stays consistent with the point's displaced
location. Displacing after projection (`gl_Position`) would attenuate using the pre-jitter distance
while the point visually moves — a subtle size/position mismatch. Use `transformed`.

**Program-cache-key isolation (normative, round-3 fix):** the jittered BASE material MUST override
`customProgramCacheKey()` to return a unique key. Three.js r171's `WebGLPrograms` cache key is
derived from *structural* material properties (`USE_SIZEATTENUATION`, map presence, vertex-colour
flag, etc.) and **not** from strings injected in `onBeforeCompile`. BASE, ENTITY_SPIKE and
ENTITY_GHOST are otherwise-identical `PointsMaterial` instances that hash to the same key — without
the override, r171 can silently share one compiled program across all three, either leaking the
jitter shader onto ENTITY_SPIKE/ENTITY_GHOST or dropping BASE's jitter (depending on compile order).
This failure is invisible to AC-D03 (which checks the CPU-side uniform value, not GPU program
identity), so the override is a hard requirement, asserted by AC-D03's cache-key clause.

**Output range:** J ∈ [J_min, J_max] within a tier; 0.0 when the entity is beyond NEAR's d_max
(8.0m) or no entity is present. Applied as an in-shader ±J displacement on each BASE point within
`entity_influence_radius` (tuning knob — see Tuning Knobs section).

**Examples:**
- NEAR, d=5.0m: t=0.40, J=0.000 + 0.020×0.36 = 0.0072m/frame (subliminal)
- NEAR, d=3.0m (seam): t=0.00, J=0.020m/frame — equals ADJACENT at the same distance ✓
- ADJACENT, d=1.5m: t=0.50, J=0.020 + 0.160×0.25 = 0.060m/frame (disorienting)
- ADJACENT, d=0.2m: t=0.067, J=0.020 + 0.160×0.871 ≈ 0.159m/frame (unreadable)

---

### Formula 4 — Scan Materialization Opacity

The scan_materialization_opacity formula is defined as:

`α = clamp( (t − h×T) / ((1−h) × T), 0.0, 1.0 )`

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Elapsed time | t | float | 0–T s | Time since capture frame started |
| Frame duration | T | float | 0.3–1.0 s | Duration of one capture angle — tuning knob, default 0.5s. **Load-time guard**: T > 0 (T = 0 zeroes the denominator `(1−h)×T`) |
| Hold fraction | h | float | 0.10–0.40 | Fraction held at α=0 before ramp — tuning knob, default 0.25. **Load-time guard**: h < 1 (h = 1 zeroes the denominator `(1−h)×T`) |
| Output | α | float | 0.0–1.0 | Opacity of materializing points |

**Load-time guard (normative, round-3 fix):** the denominator `(1−h)×T` is validated non-zero at
config load — `T > 0` **and** `h < 1` are required, mirroring the div-by-zero guards on Formulas 2
and 3. A config with `T ≤ 0` or `h ≥ 1` is rejected with an explicit error (no session starts with
it). Asserted by AC-D07.

Phase 1 (0 → h×T): α=0.0 — "acquiring" hold, no points visible.
Phase 2 (h×T → T): linear ramp α=0 → 1.0 — data populates, not fades.
The linear ramp (not sigmoid) reads as data transfer, not aesthetic motion.

4-frame scan cycle at defaults (T=0.5s, h=0.25):
- Total scan duration: 4 × 0.5s = 2.0s
- Hold per frame: 0.125s | Ramp per frame: 0.375s

**Output range:** α ∈ [0.0, 1.0]. Reaches 1.0 exactly at t=T.
After t=T, materializing points transfer to BASE layer at α=1.0 permanently.

**Abort behaviour:** On `scan:abort`, α interpolates linearly from its **current value → 0** over
`abort_fade_duration` (tuning knob, default 0.15s), then points are discarded.
The rapid reverse reads as "data lost", distinct from the forward-fill ramp.

**Example** (T=0.5s, h=0.25):
| t | α |
|---|---|
| 0.00s | 0.00 (hold) |
| 0.10s | 0.00 (hold) |
| 0.20s | 0.20 |
| 0.35s | 0.60 |
| 0.50s | 1.00 (sealed) |

---

### Formula 5 — Brightness Flicker (PROXIMITY_CORRUPTED)

The brightness_flicker formula is defined as:

`m = 1 − F_amp × (0.5 + 0.5 × sin(uTime × F_rate + φ_point))`

The rendered point colour is `#4ade80 × m` — a **per-point brightness multiplier on the SAME green
hue**. This is the round-3 respec of the previously-unspecified "random colour flickering": it is a
**value/brightness** disturbance only, never a hue shift, so it cannot leak entity type through a
new colour channel (the game's uniform-green "no colour taxonomy" commitment holds — see Overview).

**Fragment injection point (normative, round-6 fix):** the `× m` multiply is applied to
`outgoingLight` (equivalently `diffuseColor.rgb` for an unlit `PointsMaterial`) inside the
`#include <output_fragment>` block, strictly **before** `#include <tonemapping_fragment>` and
`#include <colorspace_fragment>` run. Both of those always execute on a material's fragment
colour in r171 (tonemapping unless `NoToneMapping`/`toneMapped:false`; colorspace encode always,
at the renderer's `outputColorSpace`) — injecting after them would apply the linear `m ∈ [0.4,
1.0]` range against an already-tonemapped/encoded value, changing the perceived brightness curve
away from the linear one this formula's variable table promises. To remove the ambiguity
entirely rather than rely only on injection order, BASE's material additionally sets
`material.toneMapped = false` explicitly (consistent with the "points are unlit" rule in
Visual/Audio Requirements). This is the same extension point Formula 3's jitter uses — one
`onBeforeCompile`, one `customProgramCacheKey()` override covering both.

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Flicker amplitude | F_amp | float | 0.0–0.6 | Depth of brightness dip — tuning knob `flicker_amplitude`, default 0.4 (→ m ∈ [0.4, 1.0]) |
| Flicker rate | F_rate | float | 5–40 rad/s | Angular flicker speed — tuning knob `flicker_rate`, default 18 |
| Per-point phase | φ_point | float | 0–2π | Stable per-point hashed phase (reuses Formula 3's per-point hash) — decorrelates points so the field shimmers, not pulses in unison |
| Time | uTime | float | ≥0 s | Shared frame-time uniform (same one Formula 3 advances) |
| Output | m | float | (1−F_amp)–1.0 | Per-point brightness multiplier on `#4ade80` |

**Scope & gating (normative):** applies **only to BASE points within `entity_influence_radius`
while PROXIMITY_CORRUPTED (ADJACENT tier) is active** — the same in-influence set Formula 3 jitters.
Outside ADJACENT, `F_amp` is driven to 0 (a uniform), so m = 1.0 and the flicker vanishes. It is a
**GPU fragment-side effect injected in the SAME `onBeforeCompile` material extension as the jitter**
(no separate material, no CPU per-frame colour rewrite; the `customProgramCacheKey()` override
covers this too). ENTITY_SPIKE, ENTITY_GHOST and materializing overlays are never flickered.

**Output range:** m ∈ [1−F_amp, 1.0]. At default F_amp=0.4, m ∈ [0.4, 1.0] — brightness dips to 40%
at the trough, never inverts, never changes hue.

**Example** (F_amp=0.4, F_rate=18): a point with φ=0 at uTime=0 → m = 1 − 0.4×(0.5+0.5×sin(0)) =
1 − 0.4×0.5 = 0.80; at the sine peak → m = 1 − 0.4×1.0 = 0.60; at the trough → m = 1 − 0 = 1.00.

## Edge Cases

- **If surface area A produces N < 1 after floor clamp**: hold N=1. Prevents empty
  `BufferGeometry` which throws on `Float32BufferAttribute` assignment in Three.js.

- **If room AABB updates mid-session** (floor plan desync event): BASE layer rebuilds
  immediately. Entity layers remain at their world positions — if they are now geometrically
  "outside" the updated room boundaries, the visual anomaly (a void or spike floating in
  empty space) is intentional horror, not a bug.

- **If total point count after rebuild exceeds `density_budget_ceiling`**: D is auto-scaled
  uniformly downward until total fits, but never below `base_density_floor` (default 100). If the
  scene cannot fit even at that floor, the layout is rejected at load (see Formula 1 budget check)
  rather than scaling D toward zero. The density change must not produce a visible pop — the
  rebuild replaces all BASE geometry in a single frame, not incrementally.

- **If two `renderer:anomaly_density` events fire in the same frame** (simultaneous tiles):
  events are independent per tile. Both fire. UI/HUD is responsible for deduplication and
  rate-limiting error message display — the renderer does not throttle its own events.

- **If `scan:abort` and `scan:complete` arrive in the same frame** (race condition):
  `scan:complete` takes priority. Once completion is registered, materializing points are
  sealed into BASE and abort is a no-op.

- **If `scan:capture_frame` is received for a node already in BASE**: Scan Mechanic is
  responsible for preventing re-scan of completed nodes. If a duplicate frame event arrives,
  renderer adds a new materialization overlay on top of existing BASE data. The resulting
  double density will fire `renderer:anomaly_density {sigma}` (positive) — reads as a ghost
  artefact. Acceptable behaviour, not a crash case.

- **If `PROXIMITY_CORRUPTED` and `SCAN_MATERIALIZING` are active simultaneously**: jitter
  applies only to BASE layer points. Materializing overlay points are not yet in BASE and
  receive no jitter — they continue their opacity ramp undisturbed. Scan feedback remains
  readable during maximum entity proximity.

- **If entity moves from ADJACENT tier back to FAR in a single frame** (entity retreats
  instantly): J drops to 0 immediately. No smoothing required — abrupt cessation of jitter
  reads as entity withdrawing, which is the correct horror signal.

- **If Type A occluder mesh overlaps the player camera** (entity enters scanner optics):
  depth-only occluder clips the near plane — solid black void fills the viewport. Acceptable;
  reads as optics being blocked. Preventing camera/entity overlap is Entity System's
  responsibility, not the renderer's.

## Dependencies

**Upstream — what this system consumes:**

| System | Dependency type | Interface |
|---|---|---|
| Floor Plan System | Soft (data consumer) | Room AABB list + surface definitions → consumed at session load and on `floorplan:update` events to rebuild BASE layer |
| Orchestrator | Event bus (required) | Receives: `entity:proximity {tier}`, `entity:spawn {type, position}`, `entity:despawn {}`, `entity:transform {scale}` *(ratified, round-6)*, `entity:position {position}` *(new, round-6)*, `scan:capture_frame {angle, progress}`, `scan:complete {nodeId}`, `scan:abort`. Emits: `renderer:anomaly_density {sigma}` |

The renderer has no hard structural upstream dependencies — it is Foundation layer.
The Floor Plan dependency is a data-consumer relationship: the renderer does not call
Floor Plan APIs directly; it receives AABB data via the Orchestrator event bus.

**Downstream — systems that depend on this:**

| System | What they need | Interface |
|---|---|---|
| Floor Plan System | Rendering capability for room geometry | Provides AABB data; this system renders it |
| Entity System | Rendering capability for entity types | Sends entity type + world position → this system activates/moves the correct layer (VOID_MASK / ENTITY_SPIKE / ENTITY_GHOST). For Type A, also sends the continuous `silhouette_scale` (its Formula 1) via `entity:transform {scale}` → this system re-scales the occluder (ratified, round-6 — Entity System Core Rule 6/AC-ES17b). For Type B/C, sends continuous position via `entity:position {position}` every tick → this system repositions the layer and feeds Formula 3/5's distance computation (new, round-6 — Entity System Core Rule 11/AC-ES47). Both contracts are now recorded on both sides; no Open Cross-System Item remains for either. |
| Scan Mechanic | Point materialization during scan sequence | Sends `scan:capture_frame` events; this system animates opacity ramp |
| UI/HUD | Anomaly density data for error messages | Subscribes to `renderer:anomaly_density {sigma}` |
| Found-Footage Layer | Rendered scene as compositing target | Applies post-processing artifacts on top of the renderer's Three.js scene output |

**Bidirectional note — Floor Plan System:**
The systems index lists Floor Plan as depending on Point Cloud Renderer (Floor Plan *uses* this
renderer to display geometry). This GDD records the inverse: this renderer *consumes* Floor Plan's
AABB data to know what to render. Floor Plan owns spatial data; Renderer owns the rendering
capability. Neither calls the other directly — both interact through the Orchestrator event bus.
This is a data-dependency pattern, not a circular dependency.

## Tuning Knobs

| Knob | Default | Safe Range | Too High | Too Low |
|---|---|---|---|---|
| `base_density` (D) | 900 pts/m² | 100–2000 | Performance budget exceeded; auto-scale triggers | Rooms too sparse to read as LIDAR |
| `density_budget_ceiling` | 1,500,000 pts | 500k–2M | GPU memory pressure on low-end hardware | D auto-scales too aggressively; rooms look bare |
| `base_density_floor` | 100 pts/m² | 50–100 | Auto-scale can't reduce enough; large scenes rejected at load | D can scale toward zero; sparse/sub-1-point surfaces (defeats the AC-E01 guard) |
| `surface_type_weights` | floor:1.2, wall:1.0, ceil:0.6 | 0.5–1.5 per surface | One surface dominates; imbalanced spatial read | Surface invisible at extreme low; rooms lose geometry |
| `k_noise` (sensitivity coefficient) | 0.10 | 0.05–0.30 | Tells require large deviations; subtle anomalies never fire | Small estimator/geometry deviations fire events. **Also raises `N_min` and the required `anomaly_tile_samples` (both = `ceil(1/k_noise²)`)** — at the 0.05 floor a tile needs 400 sealed points to be sampled at all, which excludes most tiles at low `base_density` (Formula 2, AC-D09) |
| `A_tile` (detection tile size) | 1.0 m² | 0.5–4.0 (narrowed, round-6) | Loses spatial resolution; Type A silhouette unlocalizable | Threshold over-raised + fewer sealed points per tile at fine resolution — genuine anomalies in a small tile struggle to register (Formula 2 normalizes per-tile estimator noise via `√(A_ref/A_tile)`), and more tiles fall below `N_min`; also more tiles to sweep |
| `anomaly_sigma_threshold` | 2.5 σ | 1.5–4.0 | Entity must be very dense/close to trigger tells; horror subdued | Noise-driven events fire constantly in normal rooms |
| `anomaly_sample_interval` | 0.5 s | 0.1–2.0 | Tells lag the entity's actual movement; feels unresponsive | Sweep cannot cover the active set within one interval, so the effective interval stretches anyway (the sweep rate is the hard bound — Formula 2) |
| `anomaly_sample_radius` | 12 m | 6–15 (narrowed, round-6) | More tiles in the active set, so a full sweep takes longer and tells lag; per-*frame* cost is unaffected (bounded by `anomaly_tiles_per_frame`) | Anomalies past the radius never register; distant tells go silent |
| `anomaly_tile_samples` | 128 points | 64–512, **and ≥ `ceil(1/k_noise²)`** (rejected at load otherwise — AC-D09) | Per-frame sampling cost rises linearly with no accuracy benefit past the guard | Estimator noise approaches the firing threshold; below the guard the config is rejected at load |
| `anomaly_tiles_per_frame` | 16 tiles | 4–64 | Bigger per-frame lump — at the top of the range this approaches the un-amortized pass the rebuild removed (prototype-measured 31–37 ms) | Sweep can't cover the active set within one `anomaly_sample_interval`; every tell lags |
| `anomaly_confirm_samples` | 2 sweeps | 1–5 | Confirmation lags real anomalies; feels unresponsive, undercuts entity tells too | Fires on the very first qualifying sweep; Anchor-moment pacing regresses to round-5's instant-confirm problem |
| `flicker_amplitude` (F_amp) | 0.4 | 0.0–0.6 | Points dim heavily during ADJACENT; approaches unreadable-black | No visible brightness disturbance; PROXIMITY_CORRUPTED loses its colour-channel tell (Formula 5) |
| `flicker_rate` (F_rate) | 18 rad/s | 5–40 | Strobe-fast flicker; reads as a bug / accessibility risk | Slow pulse; reads as intentional breathing, not corruption |
| `A_spike` (ENTITY_SPIKE footprint) | 1.0 m² | 0.25–4.0 | Cluster reads as a whole small room-feature rather than a point anomaly | Cluster too small to notice against BASE |
| `M_spike` (ENTITY_SPIKE multiplier) | 3.0× | 2.0–6.0 | Cluster becomes visually solid/blob-like, breaks point-cloud read | Cluster too close to normal density variance; doesn't register as "impossible" |
| `ghost_decimation_stride` | 1 (no decimation) | 1–8 (auto-raised only if the combined-budget guard trips) | N/A — only rises automatically near the density ceiling | N/A — this knob is a safety fallback, not a creative dial |
| `entity_influence_radius` | 5.0 m | 2.0–10.0 | Entire room jitters; entity location non-localizable | Jitter zone too small; player trivialises proximity |
| `J_max NEAR` | 0.020 m/frame | 0.005–0.035 | Jitter noticeable early; subliminal feel lost | NEAR state provides no feedback at all |
| `J_max ADJACENT` | 0.180 m/frame | 0.08–0.30 | Room unreadable instantly; too sudden | Player can navigate ADJACENT normally; entity loses threat |
| `J_min NEAR` | 0.000 m/frame | fixed | — | — (floor of the whole effect; FAR/MEDIUM produce no jitter) |
| `J_min ADJACENT` | 0.020 m/frame | = `J_max NEAR` | Seam jumps up entering ADJACENT | Seam dips (dread inverts) — must equal `J_max NEAR` for continuity (Formula 3, AC-D05) |
| `proximity_tier_distances` | NEAR: 3–8m, ADJ: 0–3m | ±1.0m on each edge | Wide NEAR band = constant disturbance at safe distances | Narrow warning window before ADJACENT; no time to react |
| `scan_frame_duration` (T) | 0.5 s | 0.3–1.0 | Scan tedious; entity approach during scan becomes certain | Scan trivial; vulnerable-state tension lost |
| `h` (hold fraction per frame) | 0.25 | 0.10–0.40 | Long acquiring pause; scan feels stalled | No "acquiring" beat; reads as aesthetic fade-in |
| `abort_fade_duration` | 0.15 s | 0.05–0.40 | Abort feels slow | Too abrupt; reads as a bug |

**Interaction notes:**
- `k_noise` and `A_tile`: Formula 2's `√(A_ref/A_tile)` term already compensates for tile size, so
  `k_noise` does not need to scale with it. `k_noise` is a shared global **sensitivity** dial — the
  relative deviation from a tile's measured baseline that counts as 1σ. Raise it to make tells
  harder to trigger, lower it to make them more sensitive. Tune after the tile-size normalization,
  not against it. *(Since the 2026-08-01 rebuild `k_noise` is no longer a Poisson-variance model —
  the measured baseline already contains that variance. See Formula 2's restatement.)*
- `k_noise`, `anomaly_tile_samples` and `base_density` are **coupled through `N_min =
  ceil(1/k_noise²)`**: lowering `k_noise` raises both the sample size the config must supply and the
  sealed-point count a tile must hold before it is sampled at all. At `k_noise = 0.05` with a low
  `base_density`, large parts of the map become undetectable by construction. Check the pair
  together, not separately.
- `anomaly_tiles_per_frame` × `anomaly_tile_samples` is the **per-frame cost of the whole detector**
  (2,048 points at defaults) and is the only quantity that touches the frame budget.
  `anomaly_sample_radius` and `A_tile` change how long a full sweep takes, not what a frame costs.
- `J_min`/`J_max` continuity: `J_min ADJACENT` is not a free knob — it is pinned to `J_max NEAR`
  to keep jitter continuous at the d=3.0m seam (Formula 3). Changing `J_max NEAR` requires changing
  `J_min ADJACENT` to match, or config validation rejects the set (AC-D05).
- `J_max NEAR` and `entity_influence_radius` interact: wider radius at low J_max = diffuse
  subliminal disturbance across room. Narrow radius at higher J_max = localizable spike.
- `scan_frame_duration` × 4 = total scan vulnerable window. At T=0.5s → 2.0s total.
  At T=0.8s → 3.2s. Longer increases tension but risks tedium on repeat plays.

## Visual/Audio Requirements

**Colour palette (authoritative):**

| Layer | Colour | Hex | Rationale |
|---|---|---|---|
| BASE (room geometry) | Green | `#4ade80` | Matterport LIDAR signature — clinical, not warm |
| ENTITY_SPIKE (Type B) | Green | `#4ade80` | Impossible density in the SAME clinical green — the familiar made wrong. No colour label may distinguish entity types (Entity System fantasy: the player never learns which type they face) |
| ENTITY_GHOST (Type C) | Green at 15% opacity | `#4ade80`, `material.opacity = 0.15`, **`transparent: true`** (else r171 ignores opacity — renders fully opaque) | Barely perceptible — corner-of-eye quality |
| VOID_MASK (Type A) | Invisible | `colorWrite: false`, opaque queue, `depthWrite: true`, low `renderOrder` | The void IS the horror — the occluder must never be visible (see Core Rule 6 recipe; `opacity: 0` alone does not work in r171) |
| Scene background | Near-black | `#0a0c10` | Scanner darkness — data is the only visual content |

**Point rendering spec:**
- Point size: 0.018 world units (calibrated in prototype, matches Matterport scan grain)
- `sizeAttenuation: true` on ALL layers — non-attenuated points destroy spatial depth
- Point shape: square sprite (WebGL default, not circular) — reads as data pixels, not sensor dots

**Prohibited visual outputs** — the renderer must never produce:
- Solid triangle polygons visible to player camera
- Ambient or directional lighting on point cloud data (points are unlit — colour only, no shading)
- Glow, bloom, or post-processing effects (→ Found-Footage Layer's responsibility)
- Any particle system not implemented as `THREE.Points`

**Audio requirements:** None. This system is visually-only. Sound responses to entity proximity and scan events are owned by the Audio System, which subscribes to Orchestrator events independently.

📌 **Asset Spec** — Visual/Audio requirements are defined. After the art bible is approved, run `/asset-spec system:point-cloud-renderer` to produce per-asset visual descriptions, dimensions, and generation prompts from this section.

## UI Requirements

This system has no direct UI output. The renderer produces point cloud visuals only — no HUD
elements, overlays, menus, or text are owned by this system.

Outbound interface to UI: `renderer:anomaly_density {sigma}` events are consumed by
UI/HUD, which owns the decision of whether and how to display Matterport-style error messages.
The renderer does not trigger UI directly.

*No `/ux-design` spec required — this system has no UI surface of its own.*

## Acceptance Criteria

37 criteria total (Formula 2 rebuild, 2026-08-01: +4 — AC-D09, AC-D10, AC-D11, AC-D12; AC-D02, AC-D02b and AC-D06 rewritten in place). Gate levels per coding-standards.md: Logic/Integration = BLOCKING, Visual/Performance = ADVISORY.

> **BLOCKING criteria are scene-graph/data/buffer assertions, never subjective pixel reads.** Per
> coding-standards.md "What NOT to Automate," visual *fidelity* is not automated: BLOCKING
> criteria assert scene-graph state, material configuration, geometry contents, or event payloads
> — checkable headlessly in Vitest — with one BLOCKING *integration* assertion (AC-C08) that reads
> back an offscreen render target numerically (a count, not a fidelity judgment) in a
> WebGL-capable `tests/integration/` context. Where a rule also has a subjective visual
> consequence (occluder invisibility at all angles, attenuation feel), that consequence is
> verified by prototype screenshot + lead sign-off (ADVISORY evidence in `production/qa/evidence/`),
> noted inline per criterion.

### Core Rules (Section C)

**AC-C01 — No solid meshes visible**
GIVEN the renderer is active and room geometry has loaded, WHEN the scene graph is inspected in any state, THEN every renderable object is a `THREE.Points`, EXCEPT meshes whose material has `colorWrite === false` (the Type A occluder) — no `THREE.Mesh` with `colorWrite` enabled exists in the scene. *(Visual confirmation that no polygon edges appear on screen is ADVISORY screenshot evidence, not part of this assertion.)* **BLOCKING**

**AC-C02 — BASE layer always active**
GIVEN the renderer has loaded a room AABB, WHEN the renderer is in any state or combination of states, THEN a `THREE.Points` object coloured `#4ade80` (BASE layer) is present and visible; no state transition removes or hides it. **BLOCKING**

**AC-C03 — ENTITY_SPIKE conditionality and colour**
GIVEN no Type B entity is present, WHEN `entity:spawn {type: B, position: P}` arrives, THEN a distinct `THREE.Points` cluster (the ENTITY_SPIKE layer object, separate from BASE) coloured `#4ade80` appears at P within the same frame; it is absent before the event and removed after `entity:despawn`. **BLOCKING**

**AC-C04 — ENTITY_GHOST opacity and offset**
GIVEN no Type C entity is present, WHEN `entity:spawn {type: C}` arrives, THEN a `THREE.Points` layer coloured `#4ade80` at exactly 15% opacity (`material.opacity === 0.15` **AND `material.transparent === true`** — without the latter, r171 ignores opacity and the layer renders fully opaque; see Layer-stack Transparency note) appears, whose geometry is the BASE room geometry displaced by a **single fixed rigid translation of magnitude 0.30m** (default vector `(0.30, 0, 0)` world units — a whole-layer offset, NOT per-vertex jitter and NOT a scalar magnitude the implementer must interpret); the layer is absent before the event and removed after `entity:despawn`. **BLOCKING**

**AC-C05 — Density formula and surface weight**
GIVEN a floor surface with A = 20 m², D = 900, W_s = 1.2, WHEN the BASE layer builds, THEN the floor `BufferGeometry` contains exactly 21,600 points (`floor(20 × 900 × 1.2)`). **BLOCKING**

**AC-C06 — Perspective attenuation on all layers**
GIVEN BASE, ENTITY_SPIKE, and ENTITY_GHOST layers are all active simultaneously, WHEN each layer's material is inspected, THEN `material.sizeAttenuation === true` on all three, and all three layers remain concurrently present in the scene (Core Rule 2: layers add, never replace). *(The visible grow-on-approach behaviour this produces is ADVISORY screenshot evidence.)* **BLOCKING**

**AC-C07 — Type A void: depth-only occluder configuration**
GIVEN ENTITY_A state with occluder mesh at position P, WHEN the occluder's material and render settings are inspected, THEN `transparent === false`, `depthWrite === true`, `depthTest === true` (a `depthWrite:true`/`depthTest:false` material silently writes no depth in GL — so the occluder's own depthTest is load-bearing too), `colorWrite === false`, and `renderOrder === -1` (the numeric contract from Core Rule 6); AND the two **opaque** point layers (BASE, ENTITY_SPIKE) have `renderOrder >= 0` — so the occluder deterministically draws (and writes depth) before them; AND **every point layer that can be culled by the void — BASE, ENTITY_SPIKE, ENTITY_GHOST, and the SCAN_MATERIALIZING overlay — has `depthTest === true`** so each actually runs the depth test the occluder's writes gate (ENTITY_GHOST and the materializing overlay are in the transparent queue, drawn after the whole opaque queue regardless of renderOrder, so the occluder's depth is already resolved when they draw — they need `depthTest`, not a `renderOrder` contract). *(That this configuration is invisible at all camera angles is verified by the Open Q#1 prototype — screenshot + lead sign-off, ADVISORY — which must exist before the Point Cloud ADR is marked Accepted. Functional cull is separately asserted headlessly by AC-C08.)* **BLOCKING**

**AC-C08 — Type A occluder functionally removes points from the rendered output**
GIVEN ENTITY_A state with the occluder placed between the camera and a populated BASE region, WHEN one frame is rendered to an offscreen `WebGLRenderTarget` and the silhouette region's pixels are read back via `readRenderTargetPixels`, THEN the count of BASE-coloured (`#4ade80`) pixels inside the silhouette region is strictly lower than the count in the same region rendered with the occluder absent — i.e. the occluder demonstrably removes points from the visible set, not just holds the right material flags. This is a numeric buffer assertion (a pixel *count*, not a fidelity judgment) in a WebGL-capable integration context (`tests/integration/`), not a screenshot judgment nor a pure-logic unit test. Runs in the **WebGL-integration test tier** sanctioned in `.claude/docs/technical-preferences.md` and `coding-standards.md` (round-3 doctrine amendment — this tier's harness must exist before the Point Cloud ADR is marked Accepted; until then AC-C08 is BLOCKING-pending-infrastructure, with Open Q#1's prototype screenshot as interim belt-and-suspenders). **BLOCKING (Integration)**

**AC-C09 — ENTITY_SPIKE/ENTITY_GHOST reposition on entity:position tick (round-6 addition)**
GIVEN ENTITY_B or ENTITY_C active at position P₀, WHEN `entity:position {position: P₁}` arrives, THEN the layer's world position updates to P₁ within the same frame, with no rebuild of the layer's geometry (a position update only, not a `BufferGeometry` re-allocation); AND the cached entity position Formula 3/5 use for the CPU-side distance `d` and the in-shader `uEntityPos` uniform also updates to P₁ that same frame. **BLOCKING**

**AC-C10 — ENTITY_SPIKE density formula (Formula 1b, round-6 addition)**
GIVEN a Type B entity active on a floor tile with D=900, W_s=1.2, A_spike=1.0, M_spike=3.0, WHEN the ENTITY_SPIKE cluster builds, THEN its `BufferGeometry` contains exactly 3,240 points (`floor(1.0 × 1,080 × 3.0)`); AND the combined-layer budget guard (Formula 1b) is evaluated at spawn time — GIVEN it would be exceeded, THEN `ghost_decimation_stride` is raised only for a subsequent Type C spawn, never applied to ENTITY_SPIKE. **BLOCKING**

---

### Formulas (Section D)

**AC-D01 — Budget ceiling auto-scale, single-frame rebuild**
GIVEN total point count at D = 900 would exceed 1,500,000 for the current room, WHEN the BASE layer builds at session load, THEN D is auto-scaled uniformly downward until total ≤ 1,500,000; AND the BASE `BufferGeometry` attribute swap completes in a single synchronous operation — no frame observes BASE point count as 0, nor as a partial (neither fully-old nor fully-new) value. *(Assertion is on point-count/geometry state across the swap, headlessly checkable — the "no visible pop" this produces is ADVISORY screenshot evidence, not part of this criterion.)* **BLOCKING**

**AC-D01b — Budget ceiling reject-at-load when floor cannot fit (round-6 addition)**
GIVEN total point count at `D = base_density_floor` (100) still exceeds `density_budget_ceiling` (1,500,000) for the current room set, WHEN the BASE layer attempts to build at session load, THEN the layout is rejected at load with an explicit error (no session starts with it) — the renderer does not silently scale D below `base_density_floor`, produce a partial/degenerate BASE layer, or render anything for that room set. **BLOCKING**

**AC-D02 — Anomaly sigma event threshold (magnitude-only payload) — rewritten for the measured baseline (2026-08-01)**
GIVEN `A_tile` = 1.0 m², `k_noise` = 0.10, `anomaly_tile_samples` = 128, and a fully-sealed tile whose bin holds `N_base` = 900 BASE points (so the **measured** `ρ_base` = 900 pts/m², denominator = 90), with ρ_obs estimated over `BASE + ENTITY_SPIKE` (ENTITY_GHOST excluded) — WHEN an ENTITY_SPIKE cluster places 450 points in the tile and none are occluded (`N_res` = 1,350, `k = n`, estimated ρ_obs = 1,350, internal σ = +5.0), THEN the renderer emits exactly one `renderer:anomaly_density {sigma}` with `sigma ≈ 5.0` (±0.05) and the payload contains **no type/label field and no sign** (`sigma ≥ 0`); WHEN an active VOID_MASK occluder blocks 40% of the tile's points so that `k` = 77 of `n` = 128 inspected points are visible (estimated ρ_obs ≈ 541, internal σ ≈ −3.98), THEN exactly one event with `sigma ≈ 3.98` (±0.05) — magnitude only, indistinguishable from a positive deviation of equal size (sign stripped per the round-3 type-oracle fix); WHEN nothing is occluded and no spike is present (`k = n`, ρ_obs = ρ_base), THEN σ = 0.0 **exactly** and no event is emitted. Both firing cases additionally require `anomaly_confirm_samples` (default 2) consecutive qualifying **sweeps** before firing (see AC-D02b). **BLOCKING**

**AC-D02b — Unsealed, sparse and partially-sealed tiles do not false-fire; confirmation dwell holds — rewritten for the measured baseline (2026-08-01)**
GIVEN `k_noise` = 0.10 (so `N_min` = 100): WHEN a sweep reaches a tile whose owning scan node has not completed (`N_base` = 0), THEN the tile is not in the active set, no σ is evaluated for it, and no event is emitted; WHEN a sweep reaches a tile holding only 25 sealed points (`N_base` = 25 < `N_min`), THEN likewise excluded — no σ, no event; GIVEN a tile fed by two scan nodes of which only one has completed, so `N_base` = 450 with no entity present and every resident point visible, THEN the measured `ρ_base` = 450, ρ_obs = 450, σ = **0.0**, and no event fires — **the baseline is the tile's own sealed count, and no coverage fraction is computed anywhere**; GIVEN a tile crosses `|σ| ≥ anomaly_sigma_threshold` on one sweep but drops below it on the next, THEN no `renderer:anomaly_density` event fires (the consecutive-sweep counter reset, `anomaly_confirm_samples` never satisfied). **BLOCKING**

**AC-D03 — Jitter magnitude is quadratic, not linear; deterministic uniform; cache-key isolated; no jitter on materializing layer**
GIVEN PROXIMITY_DISTURBED (NEAR: d_min=3.0m, d_max=8.0m, J_max=0.020m), WHEN the per-frame `uJitter` uniform (= J from Formula 3, computed CPU-side from `d` — see Formula 3's Distance source) is inspected, THEN at d = 5.0m (t=0.40) `uJitter ≈ 0.0072` (±10%) and at d = 3.5m (t=0.10) `uJitter ≈ 0.0162` (±10%); AND the per-frame `uEntityPos` uniform matches the cached entity position (from `entity:spawn` for Type A or the latest `entity:position` for Type B/C) within one frame of any update. *(The assertion is on the deterministic CPU-side `uJitter`/`uEntityPos` uniform values, NOT observed per-point GPU displacement — actual displacement is `uJitter × hash × noise(uTime)`, which is per-point and `uTime`-dependent and therefore not headlessly assertable per coding-standards' Determinism rule; the visible quadratic ramp is ADVISORY screenshot evidence.)* AND the jittered BASE material returns a `customProgramCacheKey()` distinct from ENTITY_SPIKE's and ENTITY_GHOST's (so the injected jitter program is not shared/dropped). AND materializing overlay points receive `uJitter` influence of 0 (they are outside BASE — 0×anything = 0). **BLOCKING**

**AC-D04 — Scan opacity hold-then-ramp curve**
GIVEN SCAN_MATERIALIZING with T = 0.5s, h = 0.25, WHEN time elapses from frame start, THEN: t=0.10s → α=0.00; t=0.20s → α=0.20 (±0.02); t=0.35s → α=0.60 (±0.02); t=0.50s → α=1.00 exactly, points sealed permanently into BASE layer. **BLOCKING**

**AC-D05 — Jitter band bounds and continuity validated at load**
GIVEN a proximity-tier config with `d_min = d_max` (or `d_min > d_max`) for any tier, OR with any tier's `J_min > J_max`, OR where a tier's `J_min` does not equal the next-tier-out's `J_max` (the cross-tier continuity invariant from Formula 3), WHEN config validation runs at load, THEN the config is rejected with an explicit error (no session starts with it); GIVEN the default bands and jitter floors (NEAR d 3.0–8.0m / J 0.000→0.020m, ADJACENT d 0.0–3.0m / J 0.020→0.180m), THEN load succeeds normally and jitter is continuous at the d=3.0m seam. **BLOCKING**

**AC-D06 — Formula 2 denominator division-by-zero guarded (load-time knobs + runtime baseline) — rewritten for the measured baseline (2026-08-01)**
GIVEN a config with `k_noise ≤ 0` OR `A_tile ≤ 0` — zero zeroes/undefines the denominator `ρ_base × k_noise × √(A_ref/A_tile)`, and a negative `A_tile` additionally makes `√(A_ref/A_tile)` undefined (NaN) even before the multiplication — WHEN config validation runs at load, THEN the config is rejected with an explicit error; GIVEN a config with `D ≤ 0` or any `surface_type_weights` entry `≤ 0`, THEN it is likewise rejected at load, **now as a Formula 1 geometry guard** (a zero or negative density generates no valid point set) rather than as a Formula 2 denominator guard — since the rebuild, `D` and `W_s` no longer feed Formula 2's denominator at all; GIVEN the defaults (D=900, weights 1.2/1.0/0.6, k_noise=0.10, A_tile=1.0), THEN load succeeds. AND — the runtime half of the same guard — GIVEN any tile with `N_base` = 0 (so a measured `ρ_base` of 0), WHEN a sweep runs, THEN that tile is excluded by the `N_base ≥ N_min` activity gate and `ρ_base = 0` is never substituted into the denominator, so Formula 2 cannot divide by zero or produce NaN from a runtime baseline either. **BLOCKING**

**AC-D09 — Sample size must satisfy the sensitivity coefficient (load-time guard, 2026-08-01)**
GIVEN a config with `anomaly_tile_samples < ceil(1 / k_noise²)` — e.g. `anomaly_tile_samples` = 128 with `k_noise` = 0.05, which requires 400 — WHEN config validation runs at load, THEN the config is rejected with an explicit error naming **both** knobs and the required minimum; GIVEN the defaults (`anomaly_tile_samples` = 128, `k_noise` = 0.10, requiring 100), THEN load succeeds. *(This is the round-4 recommended `k_noise ≥ 1/√ρ_base` guard, re-homed onto the sample size — the quantity that is actually a knob.)* **BLOCKING**

**AC-D10 — Subsample estimator: deterministic, and accurate against a known visible fraction (2026-08-01)**
GIVEN a tile whose bin holds `N_res` = 1,000 points of which exactly 600 pass the visibility test, and `anomaly_tile_samples` = 128, WHEN the sweep evaluates that tile twice with identical camera and occluder state, THEN both evaluations inspect the **same** 128 point indices (systematic stride over the bin — no RNG anywhere in the pass) and produce **bit-identical** σ; AND the estimated ρ_obs is within ±10% of the true visible density (600 / `A_tile`); AND `n` = `min(N_res, anomaly_tile_samples)`, so a tile holding fewer points than `anomaly_tile_samples` is inspected exhaustively rather than over-sampled. **BLOCKING**

**AC-D11 — Per-frame sampling bound and sweep completeness (2026-08-01)**
GIVEN an active set of 418 tiles with `anomaly_tiles_per_frame` = 16, `anomaly_tile_samples` = 128 and `anomaly_sample_interval` = 0.5 s, WHEN the renderer runs for 30 consecutive frames (one interval at 60 fps), THEN **no single frame inspects more than 2,048 points** (`anomaly_tiles_per_frame × anomaly_tile_samples`) and no frame performs a whole-active-set pass; AND every tile in the active set is evaluated at least once within 27 frames (⌈418/16⌉); AND each tile's confirmation-dwell counter advances at most once per sweep, not once per frame. *(This AC is the replacement for the deleted worst-case points-per-pass arithmetic — it bounds the cost by assertion instead of by derivation. It is also the direct answer to the round-7 prototype's measured 31–37 ms un-amortized pass.)* **BLOCKING**

**AC-D12 — Frustum-straddling tiles are excluded, not sampled (2026-08-01)**
GIVEN a fully-sealed tile with no entity present and every resident point in the buffer, positioned so its AABB **straddles** the camera frustum boundary (some corners inside, some outside), WHEN a sweep runs, THEN the tile is not in the active set and no σ is evaluated for it — it must not read as a deficit merely because part of it is off-screen; GIVEN the camera then rotates so the same tile's AABB lies entirely inside the frustum, THEN the tile becomes active and reads σ = 0.0 with no event. **BLOCKING**

**AC-D07 — Formula 4 (scan opacity) denominator division-by-zero guarded at load**
GIVEN a config with `T ≤ 0` or `h ≥ 1` — either of which zeroes the denominator `(1−h)×T` in Formula 4 — WHEN config validation runs at load, THEN the config is rejected with an explicit error; GIVEN the defaults (T=0.5s, h=0.25), THEN load succeeds and Formula 4 never divides by zero. **BLOCKING**

**AC-D08 — Brightness flicker (Formula 5): gated to PROXIMITY_CORRUPTED, same-green, hue-preserving**
GIVEN the BASE material extended with Formula 5, WHEN PROXIMITY_CORRUPTED (ADJACENT) is NOT active, THEN the flicker-amplitude uniform (`uFlickerAmp`) === 0 (m = 1.0, no brightness change); WHEN PROXIMITY_CORRUPTED becomes active, THEN `uFlickerAmp` === `flicker_amplitude` (default 0.4) within one frame and returns to 0 within one frame of the tier leaving ADJACENT; AND the material's base colour uniform remains `#4ade80` unchanged in all states (the effect is a brightness multiplier only — asserting the hue is never rewritten guards the uniform-green "no colour taxonomy" commitment). *(Assertion is on the deterministic `uFlickerAmp` uniform and the unchanged base-colour uniform; the visible shimmer is ADVISORY screenshot evidence.)* **BLOCKING**

---

### Edge Cases (Section E)

**AC-E01 — N floor clamp prevents empty geometry (defensive guard)**
GIVEN a surface whose inputs produce N < 1 — reachable only with out-of-range data (e.g. a degenerate authored surface of A = 0.001 m², below Formula 1's declared 0.1 m² minimum, with D = 100, W_s = 0.6), WHEN BASE builds, THEN that surface's `BufferGeometry` contains exactly 1 point and no Three.js error is thrown. *(This is a defensive guard against malformed layout data, not an in-range formula behaviour — within declared ranges, and because auto-scale never drops D below `base_density_floor` = 100, the minimum N is `floor(0.1 × 100 × 0.5) = 5`.)* **BLOCKING**

**AC-E02 — scan:complete takes priority over scan:abort in same frame**
GIVEN SCAN_MATERIALIZING with points at any opacity, WHEN both `scan:complete` and `scan:abort` arrive in the same frame's event queue, THEN materializing points are sealed into BASE at opacity 1.00; none are discarded; BASE geometry query after the frame shows the new points present. **BLOCKING**

**AC-E03 — Jitter uniform on BASE, none on materializing overlay, during PROXIMITY_CORRUPTED**
GIVEN PROXIMITY_CORRUPTED (ADJACENT: J_min=0.020m, J_max=0.180m) and SCAN_MATERIALIZING active simultaneously, WHEN entity is at d = 1.5m (t=0.50), THEN the BASE material's `uJitter` uniform ≈ 0.060 — `0.020 + (0.180−0.020)×(1−0.50)²` — (±10%); AND the materializing overlay material receives `uJitter` influence of 0.00 (not in BASE, so its opacity ramp is undisturbed). *(Assertion is on the deterministic `uJitter` uniform, not observed GPU displacement — see AC-D03.)* **BLOCKING**

**AC-E04 — BASE rebuild is single-frame; entity layers persist**
GIVEN a mid-session `floorplan:update` event with new AABB dimensions, WHEN the renderer processes it, THEN old BASE geometry is replaced and new geometry is visible within the same frame (no frame with zero BASE points); entity layers remain at their previous world positions unchanged; no console error thrown. **BLOCKING**

**AC-E05 — Two anomaly events in one sweep fire independently (no renderer throttle)**
GIVEN two separate detection tiles both cross `anomaly_sigma_threshold` within the same sweep — whether the sweep reaches them on the same frame or on different frames, since the sweep is spread across frames (Formula 2) — WHEN the renderer evaluates each, THEN it emits exactly two independent `renderer:anomaly_density {sigma}` events (one per tile), neither merged nor rate-limited by the renderer — deduplication/throttling is the subscriber's responsibility, not the renderer's. **BLOCKING**

**AC-E06 — Duplicate scan:capture_frame for an already-sealed node does not crash**
GIVEN a node whose points are already sealed into BASE, WHEN a duplicate `scan:capture_frame` for that node arrives, THEN the renderer adds a new materialization overlay on top of the existing BASE data with no thrown error, and the tile renders visibly denser (the duplicate points are drawn — a ghost artefact, acceptable, not a crash case); AND WHEN those duplicate points subsequently seal into BASE on `scan:complete`, THEN **no** `renderer:anomaly_density` event fires for that tile, because the tile's measured `ρ_base` (`N_base / A_tile`) rises in lockstep with its resident count, leaving σ ≈ 0. *(Changed by the 2026-08-01 rebuild — this AC previously asserted a positive-σ event. Under a measured baseline a duplicate scan is, correctly, not an anomaly: nothing is deviating from what the tile actually holds. The visual artefact is unchanged; only the detector's response is.)* **BLOCKING**

---

### State Transitions

**AC-ST01 — NORMAL ↔ ENTITY_B transition**
GIVEN NORMAL state, WHEN `entity:spawn {type: B}` arrives, THEN ENTITY_SPIKE layer appears same frame; WHEN `entity:despawn` arrives, THEN layer removed same frame and only BASE remains. **BLOCKING**

**AC-ST02 — PROXIMITY_DISTURBED → PROXIMITY_CORRUPTED → jitter-off transitions (all 4 tiers)**
GIVEN PROXIMITY_DISTURBED (NEAR), WHEN `entity:proximity {tier:"ADJACENT"}` arrives, THEN jitter shifts to the ADJACENT envelope (J_min 0.020m → J_max 0.180m) within one frame; WHEN `entity:proximity {tier:"MEDIUM"}` arrives instead, THEN displacement drops to 0.00m immediately (NEAR→MEDIUM ends jitter — exit does not require FAR); WHEN `entity:proximity {tier:"FAR"}` arrives, THEN displacement drops to 0.00m immediately with no smoothing; AND GIVEN PROXIMITY_CORRUPTED (ADJACENT), WHEN `entity:proximity {tier:"FAR"}` arrives (retreat straight from ADJACENT, skipping NEAR), THEN displacement drops to 0.00m immediately with no smoothing. **BLOCKING**

**AC-ST03 — SCAN_MATERIALIZING abort fade and discard**
GIVEN SCAN_MATERIALIZING with points at any opacity, WHEN `scan:abort` arrives, THEN materializing points fade linearly to α=0 over 0.15s, are discarded, and are NOT added to BASE; BASE geometry query confirms no new points present. **BLOCKING**

**AC-ST04 — NORMAL ↔ ENTITY_A occluder lifecycle (spawn/despawn)**
GIVEN NORMAL state (no VOID_MASK present), WHEN `entity:spawn {type: A, position: P}` arrives, THEN a depth-only occluder mesh (config per AC-C07) is created at P within the same frame and is the only non-`THREE.Points` renderable in the scene; WHEN `entity:despawn` arrives, THEN the occluder is removed within the same frame, the scene returns to points-only, and BASE points formerly culled by it become visible again. *(Mirrors AC-ST01's Type B lifecycle for the signature Type A void — its add/remove transition, previously untested.)* **BLOCKING**

**AC-ST05 — Type A occluder ships at static scale 1.0 when `entity:transform` never arrives (degraded-mode guard)**
GIVEN ENTITY_A active and NO `entity:transform {scale}` event is ever received this session (e.g. an event-bus hiccup, or a build predating the round-6 ratification), WHEN the occluder is inspected over the entity's lifetime, THEN its scale remains exactly 1.0 (base humanoid proportions) and the void renders as a static, valid, non-broken silhouette — this is a defined, tested, shippable state, NOT a missing-feature error. *(Asserts the fallback the doc relies on is legitimate even though the contract is now ratified in the normal case; the dwell-based growth flourish is simply absent, not broken.)* **BLOCKING**

**AC-ST06 — Out-of-range entity:transform scale is clamped, never applied raw (round-6 addition)**
GIVEN ENTITY_A active, WHEN an inbound `entity:transform {scale}` arrives with `scale ≤ 1.0`, `scale ≥ 1.75`, or a negative/garbage value, THEN the occluder's applied mesh scale is clamped to the nearest bound of `[1.0, 1.75)` and the raw out-of-range value is never assigned directly to the mesh; GIVEN `scale = 1.4` (in-range), THEN the occluder scale is set to exactly 1.4, unmodified. **BLOCKING**

---

### Performance

**AC-P01 — Frame rate at point budget ceiling (average + spike guard)**
GIVEN scene at maximum density (BASE ≤ 1,500,000 pts) with **ENTITY_GHOST active** (Type C — the
worst-case entity layer, a full BASE-sized duplicate per Core Rule 2/AC-C04) and
PROXIMITY_DISTURBED active, WHEN player navigates for 60 seconds on the project minimum-spec
baseline (2020-era integrated GPU — Intel Iris Xe / AMD Vega 8 class, 8 GB RAM, 1080p; pinned in
`.claude/docs/technical-preferences.md` Performance Budgets), THEN average FPS over 300 frames ≥ 55
(measured via `performance.now()` deltas) and no GPU out-of-memory error appears in browser
console; AND over a second 300-frame window with **PROXIMITY_CORRUPTED additionally active**
(worst-case jitter), no single frame exceeds 33 ms (the 1%-low / max-frame-time spike guard — an
average alone masks the transient hitches that are most immersion-breaking in a horror context,
and jitter/anomaly events are exactly transient spikes). **Round-6 addition:** a third window
repeats the same 60s pass with **ENTITY_SPIKE active instead** (Type B, Formula 1b's `N_spike` at
default `A_spike`/`M_spike`) — expected to pass trivially given its point count is orders of
magnitude below ENTITY_GHOST's, included so the smaller case isn't silently assumed. **ADVISORY**

## Open Questions

1. **Type A occluder depth-cull prototype verification (r171)** — the material recipe is now
   pinned in Core Rule 6 (opaque queue, `colorWrite: false`, `depthWrite: true`, low
   `renderOrder`; the earlier `opacity: 0` approach was wrong — ignored without
   `transparent: true`, and transparent-queue meshes draw after opaque points and cull
   nothing). What still needs prototype verification: that the recipe actually depth-culls
   `THREE.Points` behind the capsule while remaining invisible at all camera angles,
   including near-plane overlap. **Blocking: the Point Cloud ADR must not be marked Accepted
   and implementation must not start until this prototype passes.** *Owner:
   gameplay-programmer / engine-programmer.*

2. **Type C ghost offset (±0.3m)** — specified as a starting tuning value. Needs playtest to
   confirm it reads as "ghost second room" and not "misaligned duplicate". If too small it
   looks like jitter; if too large it visually detaches from room context.
   *Owner: playtester. Resolve during vertical slice.*

3. **Point size 0.018 at high-DPI — verify `renderer.setPixelRatio` usage** — Three.js's
   `sizeAttenuation` shader already scales `gl_PointSize` with the drawing-buffer height,
   which incorporates `devicePixelRatio` when `renderer.setPixelRatio(window.devicePixelRatio)`
   is called; manual DPR multiplication on top would double-compensate. The failure mode
   *without* `setPixelRatio` is blurry/upscaled points, not smaller ones. Action: confirm
   `setPixelRatio` is set once at renderer init **and re-called from the window resize handler**
   (a multi-monitor desktop can change `devicePixelRatio` at runtime when the window is dragged
   between differing-DPI displays — a static init-only call misses this); verify point grain on a
   2x display. No size formula change expected. *Owner: engine-programmer. Verify before first
   external playtest.*

4. **Mobile web target scope** — current spec targets desktop browsers only. If mobile is
   added, density_budget_ceiling and base_density will need separate tuning profiles.
   *Owner: producer. Decide before Alpha milestone.*

5. ~~**`entity:transform {scale}` ratification (Entity System) — CROSS-SYSTEM**~~ **RESOLVED,
   round-6.** Entity System's Core Rule 6/AC-ES17b now emits `entity:transform {scale}` for real
   (no longer provisional); this GDD's Interactions/Dependencies tables record it as ratified, and
   AC-ST06 asserts the `[1.0, 1.75)` clamp on the applied value. The **growing-void escalation
   tell** (dwell-based, sustained-proximity — distinct from the static-recognition Anchor moment in
   §B, which ships fully at `scale = 1.0` regardless) can now render. No Open Cross-System Item
   remains for this contract.

6. **Draw-call merge policy — and its tension with the jitter/flicker shader cost** —
   technical-preferences.md requires minimizing `THREE.Points` objects / draw calls, but this GDD
   does not yet state whether BASE's per-surface samples (floor/wall/ceiling × N rooms) merge into
   one `BufferGeometry` per layer or stay split per surface/room (AC-C05's "the floor
   `BufferGeometry`" phrasing allows a split that would multiply draw calls with room count).
   **Unresolved tension (round-3):** the natural fix — merge all BASE into a single
   `BufferGeometry`/`THREE.Points` per scene (~4 draw calls regardless of room count) — gives the
   merged object a *single* bounding sphere, so Three.js's frustum cull almost never rejects it,
   so the Formula 3 jitter **and** Formula 5 flicker vertex branches (GLSL has no per-vertex
   early-out — only a cost-bearing branch) execute for **all** ~1.5M points every frame regardless
   of which room the player or entity is in. The two options are genuinely in conflict and must be
   reconciled, not left implicit:
   - **(a) Single merged buffer** — minimal draw calls; accept that the jitter/flicker branch runs
     over the whole buffer. Viable only if AC-P01's prototype (Open Q#7) confirms the full-buffer
     vertex ALU cost fits the min-spec frame budget.
   - **(b) Per-room / chunked buffers** — reintroduces per-chunk frustum culling (jitter/flicker
     only runs on in-view chunks) at the cost of more draw calls, in tension with the
     draw-call-minimization goal.
   Recommend deciding this in the Point Cloud ADR **against the Open Q#7 perf-prototype numbers**,
   not before. If (a) is chosen, AC-C05's "the floor `BufferGeometry`" wording must be rewritten to
   count via a per-point surface-type attribute. **Round-6 addition:** whichever option is chosen
   must also account for ENTITY_GHOST (a full BASE-sized duplicate, Type C worst case) and
   ENTITY_SPIKE (Formula 1b, thousands of points, Type B) — neither was considered when this
   question was first raised. *Owner: engine-programmer + performance-analyst. Resolve in the Point
   Cloud ADR.*

7. **AC-P01 performance-thesis prototype (min-spec) — BLOCKS ADR, parallel to Q#1** — AC-P01 (1.5M
   attenuated `THREE.Points` + PROXIMITY_CORRUPTED jitter+flicker ≥ 55 avg FPS and no frame > 33 ms
   on the min-spec baseline: 2020-era integrated GPU / Intel Iris Xe / AMD Vega 8, 8 GB RAM, 1080p)
   is the single highest-consequence claim in the GDD — it validates the entire density budget
   (`density_budget_ceiling`), the tile-sampling design, the GPU jitter/flicker shaders, and the
   Q#6 merge decision. Yet it is (correctly) ADVISORY as an AC and has no cited benchmark. **Gate
   (round-3 fix, round-6 scope expansion): before the Point Cloud ADR is marked Accepted, prototype
   the full worst-case scene on actual min-spec hardware** — merged 1.5M-point BASE buffer, jitter +
   flicker shaders compiled and running over the whole buffer (the Q#6-(a) worst case), one active
   occluder, the CPU sampling sweep live **at the rebuilt Formula 2 (2026-08-01) — subsampled and
   spread across frames, not the whole-tile pass the 2026-07-26 run measured at 31–37 ms; that run
   does not carry over and the prototype must be re-run**, **and also (round-6) both entity-layer worst
   cases separately: a Type C ENTITY_GHOST full-buffer duplicate (the largest single addition) and
   a Type B ENTITY_SPIKE cluster at Formula 1b's defaults** — and confirm the AC-P01 numbers hold
   for both. If they don't, the density budget and/or the merge policy must change before
   implementation. Same blocking status as Q#1's occluder prototype: **ADR must not be Accepted
   until this passes.** *Owner: performance-analyst + engine-programmer.*
