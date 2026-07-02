# Point Cloud Renderer

> **Status**: In Design
> **Author**: magatron02 + agents
> **Last Updated**: 2026-06-26
> **Implements Pillar**: Diegetic Matterport UI · Horror from familiar made wrong

## Overview

The Point Cloud Renderer is the sole visual output layer of LAST SCAN. Every surface, object,
and entity the player perceives is rendered as a sparse cloud of coloured dots — a LIDAR point
cloud in the aesthetic of Matterport Pro3 spatial capture. There is no solid geometry visible
at any moment in the game.

The renderer maintains one or more `THREE.Points` objects per scene: a base room layer sampled
at configurable density per surface area, plus optional overlay layers for entity-type anomalies
(Type B density spikes rendered in amber; Type C ghost geometry as a dim second-room offset).
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

*Anchor moment*: the first time the player notices a Type A void — not a sudden reveal but a
slow recognition. The void has been there. The player has been looking past it.

## Detailed Design

### Core Rules

1. **Single visual language**: All player-visible output is `THREE.Points`. No solid meshes are
   ever rendered to the player's camera. Occluder meshes for Type A voids use zero-opacity
   material — invisible, but present in depth buffer.

2. **Layer stack**: The scene maintains independent point layers by category:

   | Layer | Color | Condition |
   |---|---|---|
   | BASE | `#4ade80` (green) | Always active |
   | ENTITY_SPIKE | `#fbbf24` (amber) | Type B entity present |
   | ENTITY_GHOST | `#4ade80` at 15% opacity | Type C entity present |
   | VOID_MASK | Invisible occluder mesh | Type A entity present |

   Layers add to the scene; they do not replace BASE. BASE is never removed during normal play.

3. **Point density**: Defined as points per square metre per surface. Room geometry is sampled
   uniformly across all 6 inner surfaces of each room AABB. Density is a tuning knob, not
   hardcoded per the technical-preferences.md constraint (no hardcoded gameplay values).

4. **Perspective attenuation**: All layers use `sizeAttenuation: true`. Point visual size
   scales with distance from camera.

5. **Room geometry source**: Room AABB dimensions are provided by the Floor Plan System at
   session load and on any floor plan update event. The renderer does not own spatial data
   — it consumes it.

6. **Type A void mechanics**: The void is not a gap in a `BufferGeometry`. It is an invisible
   occluder mesh (capsule, humanoid proportions ~1.8m tall, ~0.5m radius) placed at the entity
   position. It writes to depth only, blocking BASE points behind it. The surrounding point
   cloud remains intact — the void's silhouette shape emerges from what the occluder reveals
   by blocking.

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
| `ENTITY_B` | Amber spike cluster added at entity position | `entity:spawn (type B)` | `entity:despawn` |
| `ENTITY_C` | Ghost room geometry layer active, offset ±0.3m | `entity:spawn (type C)` | `entity:despawn` |
| `PROXIMITY_DISTURBED` | BASE points within entity radius shift ±0.02m/frame | `entity:proximity NEAR` | `entity:proximity FAR` |
| `PROXIMITY_CORRUPTED` | Widespread jitter; random colour flickering | `entity:proximity ADJACENT` | proximity drops below ADJACENT |
| `SCAN_MATERIALIZING` | New points appear progressively around scan node | `scan:capture_frame` | `scan:complete` or `scan:abort` |

### Interactions with Other Systems

| Source system | Data in | Effect on renderer |
|---|---|---|
| Floor Plan System | Room AABB(s), surface list | Rebuild BASE layer geometry |
| Entity System | Entity type + world position | Activate matching entity layer; move it |
| Orchestrator `entity:proximity {tier}` | Proximity tier (FAR/MEDIUM/NEAR/ADJACENT) | Set PROXIMITY state |
| Orchestrator `scan:capture_frame {angle, progress}` | Capture angle + progress % | Trigger SCAN_MATERIALIZING for current arc |
| Orchestrator `scan:complete` | Node ID | Seal materializing points into BASE |
| Orchestrator `scan:abort` | — | Discard in-progress materialization |

**Renderer → Orchestrator** (outbound events):
- `renderer:anomaly_density {type, sigma}` — emitted when point density in any region exceeds
  anomaly threshold; UI/HUD subscribes to trigger Matterport-style error messages

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
load until total fits.

**Example:** floor 20m², D=900, W_s=1.2 → N = floor(20 × 900 × 1.2) = 21,600 pts

---

### Formula 2 — Anomaly Density Sigma

The anomaly_density_sigma formula is defined as:

`σ = ( ρ_obs − ρ_base ) / ( ρ_base × k_noise × √(A_tile / A_ref) )`

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Observed density | ρ_obs | float | 0–∞ pts/m² | Point density in detection tile |
| Baseline density | ρ_base | float | 0.1–∞ pts/m² | Expected density = D × W_s from Formula 1 |
| Noise coefficient | k_noise | float | 0.05–0.30 | Natural variance model — tuning knob, default 0.10 |
| Tile area | A_tile | float | 0.25–4.0 m² | Detection tile size — tuning knob, default 1.0 |
| Reference area | A_ref | float | const=1.0 m² | Normalization constant |
| Output | σ | float | signed | Standard deviations from baseline |

**Event firing rule:**
- σ ≥ `anomaly_sigma_threshold` (default 2.5) → emit `renderer:anomaly_density {type:"spike", sigma}`
- σ ≤ −`anomaly_sigma_threshold` → emit `renderer:anomaly_density {type:"void", sigma}`

The `√(A_tile / A_ref)` denominator term: smaller tiles have fewer points and
higher natural variance, so their effective threshold is raised proportionally
to suppress noise-driven false positives.

**Output range:** σ is unbounded (signed). Values above 5.0 indicate entity-tier
anomaly. Values 2.5–5.0 are soft tells. Values below 2.5 are normal variance.

**Example:**
- Type B spike: ρ_obs=1350 (50% above baseline 900) → σ=5.0 → event fires ✓
- Type A void: ρ_obs=540 (40% below baseline) → σ=−4.0 → event fires (void) ✓
- Normal noise: ρ_obs=970 → σ≈0.78 → no event ✓

---

### Formula 3 — Proximity Jitter Magnitude

The proximity_jitter_magnitude formula is defined as:

```
t = clamp( (d − d_min) / (d_max − d_min), 0, 1 )
J = J_max × (1 − t)²
```

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Entity distance | d | float | 0–∞ m | World-space distance from entity to player |
| Tier inner edge | d_min | float | per tier | Closest bound of tier band (m) |
| Tier outer edge | d_max | float | per tier | Furthest bound of tier band (m) |
| Normalised position | t | float | 0–1 | 0=closest to player, 1=at outer edge |
| Max jitter | J_max | float | per tier | Max displacement at closest contact (m) |
| Output | J | float | 0–J_max | Point displacement per frame (m) |

**Tier parameters** (tuning knobs):
| Tier | d_min | d_max | J_max | Design intent |
|---|---|---|---|---|
| NEAR (PROXIMITY_DISTURBED) | 3.0m | 8.0m | 0.020m | Subliminal — player suspects, doubts themselves |
| ADJACENT (PROXIMITY_CORRUPTED) | 0.0m | 3.0m | 0.180m | Data unreadable — spatial orientation breaks |

The (1−t)² quadratic: jitter rises sharply as entity closes, not linearly.
Makes the final metres of approach feel urgent and non-telegraphed.

**Output range:** J ∈ [0.0, J_max]. Zero when entity is at or beyond d_max.
Applied per-frame as random ±J offset on each BASE point within
`entity_influence_radius` (tuning knob — see Tuning Knobs section).

**Examples:**
- NEAR, d=5.0m: t=0.40, J=0.020 × 0.36 = 0.0072m/frame (subliminal)
- ADJACENT, d=1.5m: t=0.50, J=0.180 × 0.25 = 0.045m/frame (disorienting)
- ADJACENT, d=0.2m: t=0.067, J≈0.157m/frame (unreadable)

---

### Formula 4 — Scan Materialization Opacity

The scan_materialization_opacity formula is defined as:

`α = clamp( (t − h×T) / ((1−h) × T), 0.0, 1.0 )`

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Elapsed time | t | float | 0–T s | Time since capture frame started |
| Frame duration | T | float | 0.3–1.0 s | Duration of one capture angle — tuning knob, default 0.5s |
| Hold fraction | h | float | 0.10–0.40 | Fraction held at α=0 before ramp — tuning knob, default 0.25 |
| Output | α | float | 0.0–1.0 | Opacity of materializing points |

Phase 1 (0 → h×T): α=0.0 — "acquiring" hold, no points visible.
Phase 2 (h×T → T): linear ramp α=0 → 1.0 — data populates, not fades.
The linear ramp (not sigmoid) reads as data transfer, not aesthetic motion.

4-frame scan cycle at defaults (T=0.5s, h=0.25):
- Total scan duration: 4 × 0.5s = 2.0s
- Hold per frame: 0.125s | Ramp per frame: 0.375s

**Output range:** α ∈ [0.0, 1.0]. Reaches 1.0 exactly at t=T.
After t=T, materializing points transfer to BASE layer at α=1.0 permanently.

**Abort behaviour:** On `scan:abort`, α interpolates linearly 0 → 0 over
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

## Edge Cases

- **If surface area A produces N < 1 after floor clamp**: hold N=1. Prevents empty
  `BufferGeometry` which throws on `Float32BufferAttribute` assignment in Three.js.

- **If room AABB updates mid-session** (floor plan desync event): BASE layer rebuilds
  immediately. Entity layers remain at their world positions — if they are now geometrically
  "outside" the updated room boundaries, the visual anomaly (a void or spike floating in
  empty space) is intentional horror, not a bug.

- **If total point count after rebuild exceeds `density_budget_ceiling`**: D is auto-scaled
  uniformly downward until total fits. The density change must not produce a visible pop —
  the rebuild replaces all BASE geometry in a single frame, not incrementally.

- **If two `renderer:anomaly_density` events fire in the same frame** (simultaneous tiles):
  events are independent per tile. Both fire. UI/HUD is responsible for deduplication and
  rate-limiting error message display — the renderer does not throttle its own events.

- **If `scan:abort` and `scan:complete` arrive in the same frame** (race condition):
  `scan:complete` takes priority. Once completion is registered, materializing points are
  sealed into BASE and abort is a no-op.

- **If `scan:capture_frame` is received for a node already in BASE**: Scan Mechanic is
  responsible for preventing re-scan of completed nodes. If a duplicate frame event arrives,
  renderer adds a new materialization overlay on top of existing BASE data. The resulting
  double density will fire `renderer:anomaly_density {type:"spike", sigma}` — reads as a ghost
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
| Orchestrator | Event bus (required) | Receives: `entity:proximity {tier}`, `scan:capture_frame {angle, progress}`, `scan:complete {nodeId}`, `scan:abort`. Emits: `renderer:anomaly_density {type, sigma}` |

The renderer has no hard structural upstream dependencies — it is Foundation layer.
The Floor Plan dependency is a data-consumer relationship: the renderer does not call
Floor Plan APIs directly; it receives AABB data via the Orchestrator event bus.

**Downstream — systems that depend on this:**

| System | What they need | Interface |
|---|---|---|
| Floor Plan System | Rendering capability for room geometry | Provides AABB data; this system renders it |
| Entity System | Rendering capability for entity types | Sends entity type + world position → this system activates/moves the correct layer (VOID_MASK / ENTITY_SPIKE / ENTITY_GHOST) |
| Scan Mechanic | Point materialization during scan sequence | Sends `scan:capture_frame` events; this system animates opacity ramp |
| UI/HUD | Anomaly density data for error messages | Subscribes to `renderer:anomaly_density {type, sigma}` |
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
| `surface_type_weights` | floor:1.2, wall:1.0, ceil:0.6 | 0.5–1.5 per surface | One surface dominates; imbalanced spatial read | Surface invisible at extreme low; rooms lose geometry |
| `k_noise` (noise coefficient) | 0.10 | 0.05–0.30 | False positives in empty rooms; constant error messages | Entity anomalies require extreme deviation; tells too subtle |
| `A_tile` (detection tile size) | 1.0 m² | 0.25–4.0 | Loses spatial resolution; Type A silhouette unlocalizable | High false positive rate from natural per-tile variance |
| `anomaly_sigma_threshold` | 2.5 σ | 1.5–4.0 | Entity must be very dense/close to trigger tells; horror subdued | Noise-driven events fire constantly in normal rooms |
| `entity_influence_radius` | 5.0 m | 2.0–10.0 | Entire room jitters; entity location non-localizable | Jitter zone too small; player trivialises proximity |
| `J_max NEAR` | 0.020 m/frame | 0.005–0.035 | Jitter noticeable early; subliminal feel lost | NEAR state provides no feedback at all |
| `J_max ADJACENT` | 0.180 m/frame | 0.08–0.30 | Room unreadable instantly; too sudden | Player can navigate ADJACENT normally; entity loses threat |
| `proximity_tier_distances` | NEAR: 3–8m, ADJ: 0–3m | ±1.0m on each edge | Wide NEAR band = constant disturbance at safe distances | Narrow warning window before ADJACENT; no time to react |
| `scan_frame_duration` (T) | 0.5 s | 0.3–1.0 | Scan tedious; entity approach during scan becomes certain | Scan trivial; vulnerable-state tension lost |
| `h` (hold fraction per frame) | 0.25 | 0.10–0.40 | Long acquiring pause; scan feels stalled | No "acquiring" beat; reads as aesthetic fade-in |
| `abort_fade_duration` | 0.15 s | 0.05–0.40 | Abort feels slow | Too abrupt; reads as a bug |

**Interaction notes:**
- `k_noise` and `A_tile` interact: smaller tiles require higher `k_noise` to compensate for
  greater per-tile variance. Tune them together during playtesting.
- `J_max NEAR` and `entity_influence_radius` interact: wider radius at low J_max = diffuse
  subliminal disturbance across room. Narrow radius at higher J_max = localizable spike.
- `scan_frame_duration` × 4 = total scan vulnerable window. At T=0.5s → 2.0s total.
  At T=0.8s → 3.2s. Longer increases tension but risks tedium on repeat plays.

## Visual/Audio Requirements

**Colour palette (authoritative):**

| Layer | Colour | Hex | Rationale |
|---|---|---|---|
| BASE (room geometry) | Green | `#4ade80` | Matterport LIDAR signature — clinical, not warm |
| ENTITY_SPIKE (Type B) | Amber | `#fbbf24` | High-visibility anomaly — reads as sensor alert |
| ENTITY_GHOST (Type C) | Green at 15% opacity | `#4ade80`, `material.opacity = 0.15` | Barely perceptible — corner-of-eye quality |
| VOID_MASK (Type A) | Invisible | `material.opacity = 0` | The void IS the horror — the occluder must never be visible |
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

Outbound interface to UI: `renderer:anomaly_density {type, sigma}` events are consumed by
UI/HUD, which owns the decision of whether and how to display Matterport-style error messages.
The renderer does not trigger UI directly.

*No `/ux-design` spec required — this system has no UI surface of its own.*

## Acceptance Criteria

19 criteria total. Gate levels per coding-standards.md: Logic/Integration = BLOCKING, Visual/Performance = ADVISORY.

### Core Rules (Section C)

**AC-C01 — No solid meshes visible**
GIVEN the renderer is active and room geometry has loaded, WHEN the player camera renders any frame, THEN every visible scene element is a `THREE.Points` object; no `THREE.Mesh` with a visible material is present in the render output, and no solid polygon edges are visible. (Depth-only Type A occluder does not count as visible output — material opacity = 0.) **BLOCKING**

**AC-C02 — BASE layer always active**
GIVEN the renderer has loaded a room AABB, WHEN the renderer is in any state or combination of states, THEN a `THREE.Points` object coloured `#4ade80` (BASE layer) is present and visible; no state transition removes or hides it. **BLOCKING**

**AC-C03 — ENTITY_SPIKE conditionality and colour**
GIVEN no Type B entity is present, WHEN `entity:spawn {type: B, position: P}` arrives, THEN a `THREE.Points` cluster coloured `#fbbf24` appears at P within the same frame; it is absent before the event and removed after `entity:despawn`. **BLOCKING**

**AC-C04 — ENTITY_GHOST opacity and offset**
GIVEN no Type C entity is present, WHEN `entity:spawn {type: C}` arrives, THEN a `THREE.Points` layer coloured `#4ade80` at exactly 15% opacity (material.opacity = 0.15) appears offset ±0.3m from base room geometry; absent before event, removed after `entity:despawn`. **BLOCKING**

**AC-C05 — Density formula and surface weight**
GIVEN a floor surface with A = 20 m², D = 900, W_s = 1.2, WHEN the BASE layer builds, THEN the floor `BufferGeometry` contains exactly 21,600 points (`floor(20 × 900 × 1.2)`). **BLOCKING**

**AC-C06 — Perspective attenuation on all layers**
GIVEN BASE, ENTITY_SPIKE, and ENTITY_GHOST layers are all active, WHEN the player camera moves closer to and then farther from a point cluster, THEN rendered point pixel size increases on approach and decreases on retreat, consistently across all three layers. **BLOCKING**

**AC-C07 — Type A void: depth-only occluder**
GIVEN ENTITY_A state with occluder mesh at position P, WHEN the scene renders from a camera angle where BASE points exist behind the occluder, THEN those BASE points are absent from the render output (depth-blocked), the occluder itself has zero visible colour or opacity, and BASE points outside the silhouette remain fully visible in `#4ade80`. **BLOCKING**

---

### Formulas (Section D)

**AC-D01 — Budget ceiling auto-scale, single-frame rebuild**
GIVEN total point count at D = 900 would exceed 1,500,000 for the current room, WHEN the BASE layer builds at session load, THEN D is auto-scaled uniformly downward until total ≤ 1,500,000; rebuild completes in a single frame with no incremental pop. **BLOCKING**

**AC-D02 — Anomaly sigma event threshold**
GIVEN A_tile = 1.0 m², k_noise = 0.10, ρ_base = 900 pts/m², WHEN ρ_obs = 1,350 (σ = 5.0), THEN renderer emits exactly one `renderer:anomaly_density {type:"spike", sigma}` with `sigma ≈ 5.0` (±0.01 tolerance); WHEN ρ_obs = 970 (σ ≈ 0.78), no event is emitted. **BLOCKING**

**AC-D03 — Jitter magnitude is quadratic, not linear; no jitter on materializing layer**
GIVEN PROXIMITY_DISTURBED (NEAR: d_min=3.0m, d_max=8.0m, J_max=0.020m), WHEN entity is at d = 5.0m (t=0.40), THEN BASE point displacement per frame ≈ 0.0072m (±10%); at d = 3.5m (t=0.10) ≈ 0.0162m (±10%); materializing overlay points receive 0.00m displacement in both cases. **BLOCKING**

**AC-D04 — Scan opacity hold-then-ramp curve**
GIVEN SCAN_MATERIALIZING with T = 0.5s, h = 0.25, WHEN time elapses from frame start, THEN: t=0.10s → α=0.00; t=0.20s → α=0.20 (±0.02); t=0.35s → α=0.60 (±0.02); t=0.50s → α=1.00 exactly, points sealed permanently into BASE layer. **BLOCKING**

---

### Edge Cases (Section E)

**AC-E01 — N floor clamp prevents empty geometry**
GIVEN surface A = 0.001 m², D = 100, W_s = 0.6 (formula yields 0), WHEN BASE builds, THEN that surface's `BufferGeometry` contains exactly 1 point and no Three.js error is thrown. **BLOCKING**

**AC-E02 — scan:complete takes priority over scan:abort in same frame**
GIVEN SCAN_MATERIALIZING with points at any opacity, WHEN both `scan:complete` and `scan:abort` arrive in the same frame's event queue, THEN materializing points are sealed into BASE at opacity 1.00; none are discarded; BASE geometry query after the frame shows the new points present. **BLOCKING**

**AC-E03 — No jitter on materializing overlay during PROXIMITY_CORRUPTED**
GIVEN PROXIMITY_CORRUPTED (ADJACENT, J_max=0.180m) and SCAN_MATERIALIZING active simultaneously, WHEN entity is at d = 1.5m, THEN BASE points within entity_influence_radius show up to 0.045m displacement per frame (±10%); materializing overlay points show 0.00m displacement. **BLOCKING**

**AC-E04 — BASE rebuild is single-frame; entity layers persist**
GIVEN a mid-session `floorplan:update` event with new AABB dimensions, WHEN the renderer processes it, THEN old BASE geometry is replaced and new geometry is visible within the same frame (no frame with zero BASE points); entity layers remain at their previous world positions unchanged; no console error thrown. **BLOCKING**

---

### State Transitions

**AC-ST01 — NORMAL ↔ ENTITY_B transition**
GIVEN NORMAL state, WHEN `entity:spawn {type: B}` arrives, THEN ENTITY_SPIKE layer appears same frame; WHEN `entity:despawn` arrives, THEN layer removed same frame and only BASE remains. **BLOCKING**

**AC-ST02 — PROXIMITY_DISTURBED → PROXIMITY_CORRUPTED → NORMAL transition**
GIVEN PROXIMITY_DISTURBED (NEAR), WHEN `entity:proximity {tier:"ADJACENT"}` arrives, THEN jitter shifts to ADJACENT J_max envelope (max 0.180m) within one frame; WHEN `entity:proximity {tier:"FAR"}` arrives, THEN displacement drops to 0.00m immediately with no smoothing. **BLOCKING**

**AC-ST03 — SCAN_MATERIALIZING abort fade and discard**
GIVEN SCAN_MATERIALIZING with points at any opacity, WHEN `scan:abort` arrives, THEN materializing points fade linearly to α=0 over 0.15s, are discarded, and are NOT added to BASE; BASE geometry query confirms no new points present. **BLOCKING**

---

### Performance

**AC-P01 — Frame rate at point budget ceiling**
GIVEN scene at maximum density (BASE ≤ 1,500,000 pts) with ENTITY_SPIKE active and PROXIMITY_DISTURBED active, WHEN player navigates for 60 seconds on minimum-spec desktop hardware, THEN average FPS over 300 frames ≥ 55 (measured via `performance.now()` deltas) and no GPU out-of-memory error appears in browser console. **ADVISORY**

## Open Questions

1. **Type A occluder depth-write in Three.js r171** — the spec requires a `depthWrite: true`,
   `opacity: 0` mesh that blocks `THREE.Points` behind it via the depth buffer. Needs early
   prototype verification: Three.js r171 may require specific `renderOrder` or
   `material.colorWrite = false` to achieve depth-only behaviour without the occluder being
   visible. *Owner: gameplay-programmer. Resolve before Entity System GDD is authored.*

2. **Type C ghost offset (±0.3m)** — specified as a starting tuning value. Needs playtest to
   confirm it reads as "ghost second room" and not "misaligned duplicate". If too small it
   looks like jitter; if too large it visually detaches from room context.
   *Owner: playtester. Resolve during vertical slice.*

3. **Point size 0.018 at high-DPI** — prototype verified at standard desktop DPI. High-DPI
   (2x retina, 4K) will render physically smaller points. Should point size scale with
   `devicePixelRatio`? *Owner: engine-programmer. Decide before first external playtest.*

4. **Mobile web target scope** — current spec targets desktop browsers only. If mobile is
   added, density_budget_ceiling and base_density will need separate tuning profiles.
   *Owner: producer. Decide before Alpha milestone.*
