# Floor Plan System

> **Status**: In Design
> **Author**: magatron02 + agents
> **Last Updated**: 2026-06-26
> **Implements Pillar**: Perception Stripping (§8) · Horror from the familiar made wrong

## Overview

The Floor Plan System is the authoritative source of spatial truth-on-file for a
session: it selects a property layout, exposes its rooms as axis-aligned bounding
boxes (AABBs) with per-surface definitions (floor / wall / ceiling), and broadcasts
that geometry over the Orchestrator event bus for the Point Cloud Renderer to draw
and the Scan Node System to anchor nodes against. Every room the player walks
through, and every wall the renderer paints as green points, originates here.

But the system is built to lie. What it hands the player — the **dollhouse map**, a
simplified top-down view shown at session start — is deliberately incomplete and
progressively wrong. It omits anomaly rooms entirely, falls out of sync with the
real space as the session escalates (Dollhouse Desync), and can fold the geometry
back on itself (Looping Geometry) once entity proximity or the anomaly reveal
triggers it. The floor plan gives confident, legible orientation in the first
minutes precisely so its later failure lands harder. This is the game's central
horror lever — **perception stripping** (§8): the player is slowly stripped of any
reliable way to predict the space ahead, until live scan data is the only ground
truth left. The system owns the spatial data; it does not own the rendering of it
or the live scan state — those are separate systems, talking only through the
event bus.

## Player Fantasy

**The emotional target: the slow vertigo of a map you used to trust.**

The Floor Plan System sells competence first. In the opening minutes the dollhouse
is a gift — a clean top-down read of the property, room labels, node markers, walls
where walls should be. The player feels like an operator in control of their
instrument: *I know this space, I can see the whole shape of it, I just need to work
the nodes.* That confidence is the setup, and it has to feel genuinely good, not
flimsy — the fall is only as far as the height you build.

Then the map starts being wrong, and the horror is that **it's wrong quietly**. No
alarm, no jump — a room the player physically just scanned still reads as un-scanned
on the dollhouse (Desync). A corridor that should end at the bedroom delivers them
back to the kitchen (Loop). A door opens onto a room the map never admitted existed
(anomaly reveal). Each disagreement between the map and the space is small enough to
rationalize once — *I misremembered* — and that self-doubt is the point. The player
is not being startled; they are being **stripped of the ability to predict what's
around the corner**, one quiet contradiction at a time, until they stop reaching for
the map at all and navigate on live scan data alone, blind to everything they
haven't lit up themselves.

**Reference feeling:** the disorientation of *P.T.*'s looping hallway and the
dawning-wrongness of found-footage horror — not "a monster appeared" but "the space
itself stopped obeying its own floor plan." The familiar domestic layout (§1 tone)
made untrustworthy is the whole effect.

**Anchor moment:** the first time the player glances at the dollhouse to orient, and
it shows them standing in a room they know they already left. Not a glitch they
report — a quiet "...that's not right" they sit with alone.

> *Note: `creative-director` not consulted — Lean mode. Review this framing manually
> before production.*

## Detailed Design

### Data Model

**`PropertyLayout`** — authored, immutable for the session (one per pool entry;
selected at random or by seed code §16-H2):

| Field | Type | Description |
|---|---|---|
| `propertyId` | string | Pool key / seed-resolvable id |
| `propertyType` | enum | `condo` \| `townhouse` \| `detached` (drives pacing, §16-H1) |
| `rooms[]` | Room[] | All rooms, including hidden anomaly rooms |
| `doors[]` | Door[] | Connections between rooms |

**`Room`**: `{ id, label, type: STANDARD|ANOMALY|LOCKED, aabb:{min[x,y,z],
max[x,y,z]}, surfaces[] (floor/wall/ceiling defs for the renderer),
estimatedNodePositions[] }`

**`Door`**: `{ id, roomA, roomB, threshold (world AABB), width (≥ 0.71 m),
loopable:bool, loopTarget?:roomId, loopSpawn?:{position, yaw} }`

- `ANOMALY` rooms carry `revealTriggerNodeId` — the standard node whose completion
  reveals them.
- `LOCKED` rooms are the `[?]` storage spaces (§8 table): present in geometry but
  their node returns null; never scannable, never revealed as traversable.

### Core Rules

1. **Session init.** Select a `PropertyLayout` (random from the curated pool, or
   resolved from a seed code). Emit geometry for all `STANDARD` rooms via
   `floorplan:update`. `ANOMALY` and `LOCKED` rooms are withheld from the initial
   emission.
2. **Authoritative, never-rendering.** This system owns all world-space AABBs and
   surface defs. It never draws and never repositions anything itself — it emits
   geometry/events to the Orchestrator; the renderer draws, Scan Node anchors, FPS
   Movement clamps and teleports. (Mirrors the renderer GDD's data-dependency
   pattern.)
3. **Single source of truth + derived dollhouse.** There is one authoritative
   layout. The dollhouse map is a *derived view* produced by filtering that layout
   through a per-room **view-state mask**. The dollhouse shows `STANDARD` room
   outlines, labels, and `estimatedNodePositions`; it never shows `ANOMALY` rooms,
   entity position, or true scan-state except as the mask permits.
4. **WALL_MARGIN compliance (authoring constraint).** Every door
   `width ≥ 2 × WALL_MARGIN + 0.01 = 0.71 m`; every room AABB interior must be
   navigable by the FPS clamp. Validated at load (see Edge Cases).
5. **Anomaly reveal.** When the Orchestrator reports `scan:complete {nodeId}` for an
   anomaly room's `revealTriggerNodeId`: unseal that room's door, emit its geometry
   via `floorplan:update`, and add it to the navigable set. **The dollhouse is not
   updated** — the room stays off the map (perception stripping).
6. **Dollhouse desync.** The mask's reflection of a room's scanned-state lags real
   `scan:complete` by `desync_delay` seconds, which grows over the session by
   `desync_growth`. A room the player just scanned reads as un-scanned on the
   dollhouse for the delay window. Desync only ever makes the map *more stale*,
   never wrong-in-the-player's-favor.
7. **Looping geometry (threshold teleport).** A `loopable` door **arms** when its
   trigger condition is met (entity proximity ≥ `loop_trigger_tier`, or an anomaly
   room has been revealed). When the player crosses an armed door's threshold, emit
   `floorplan:loop {targetPosition, targetYaw, toRoom}`; FPS Movement applies the
   reposition to the `loopTarget` room's entrance. A loop event flags the
   destination for **subtle-difference injection** (owned by renderer/entity,
   §15-C2). The door then enters `COOLDOWN` for `loop_cooldown` before it can
   re-arm.
8. **Estimated ≠ actual nodes.** The dollhouse shows `estimatedNodePositions`; the
   Scan Node System owns real node positions and may differ. The floor plan supplies
   estimates only — it never claims node truth.
9. **All geometry mutations go through `floorplan:update`.** Reveal and any geometry
   change emit the full current room set so the renderer rebuilds BASE in a single
   frame (no partial/incremental geometry — matches renderer AC-E04).

### States and Transitions

**Session lifecycle:**

| State | Description | Entry | Exit |
|---|---|---|---|
| `LOADING` | Layout selected, geometry not yet emitted | Session start | Initial `floorplan:update` sent |
| `ACTIVE` | Geometry live; reveals and loops may mutate it | Initial emit done | Session-end signal |
| `SEALED` | No further mutations; layout frozen for upload/ending | `session:end` | — |

**Per-room reveal state** (`STANDARD` rooms start `REVEALED`; `LOCKED` stay
`HIDDEN` forever):

| State | Description | Entry | Exit |
|---|---|---|---|
| `HIDDEN` | In layout, not emitted, not navigable, absent from dollhouse | Anomaly/Locked at init | `scan:complete` of `revealTriggerNodeId` (anomaly only) |
| `REVEALED` | Emitted, navigable, rendered | Init (standard) or reveal | — (terminal) |

**Per-door loop state:**

| State | Description | Entry | Exit |
|---|---|---|---|
| `DORMANT` | Normal door, leads to its real neighbour | Init | Trigger condition met |
| `ARMED` | Crossing it will loop the player | `entity:proximity ≥ loop_trigger_tier` OR anomaly revealed | Player crosses / condition clears |
| `TRIGGERED` | Loop event emitted this frame | Player crosses threshold | Next frame → `COOLDOWN` |
| `COOLDOWN` | Cannot re-arm yet | After trigger | `loop_cooldown` elapsed → `DORMANT` |

**Dollhouse mask, per room:** `UNKNOWN → KNOWN_STALE → KNOWN_CURRENT`. Desync holds
a room in `KNOWN_STALE` for `desync_delay`; anomaly rooms never leave `UNKNOWN`.

### Interactions with Other Systems

| System | Direction | Interface |
|---|---|---|
| **Point Cloud Renderer** | out | `floorplan:update {rooms:[{id, aabb, surfaces}]}` at load and on every reveal/loop. Renderer rebuilds BASE. Renderer never calls back. |
| **Scan Node System** | out + in | **Out:** room membership + `estimatedNodePositions` at load. **In:** listens for `scan:complete {nodeId}` to fire anomaly reveals. Scan Node owns actual node state. |
| **FPS Movement** | out | Consumes the emitted room AABB set as the **navigable union-bounds** for its clamp; on loop, applies `floorplan:loop {targetPosition, targetYaw}` (FPS Movement owns the player transform — floor plan only requests). |
| **Orchestrator** | in + out | **Subscribes:** `scan:complete {nodeId}`, `entity:proximity {tier}`, `session:end`. **Emits:** `floorplan:update`, `floorplan:reveal {roomId}`, `floorplan:loop {targetPosition, targetYaw, toRoom}`. |
| **UI / HUD** | out | Provides the dollhouse **view model** (room outlines, labels, estimated nodes, per-room mask state) for the dollhouse panel. UI renders it; floor plan supplies data only. |
| **Entity System** | out | Provides room AABBs + door graph for entity placement/pathing (anomaly room = highest-proximity zone, §8). Consumed via Orchestrator, not a direct call. |

## Formulas

### Formula 1 — Session Escalation Level

The `session_escalation` formula is defined as:

`e = clamp( w_t × (t / T_session) + w_c × coverage, 0, 1 )`

A single 0–1 dial that every perception-stripping effect reads (desync width, loop
arming aggressiveness). Blends how long the session has run with how much has been
scanned — so a fast or a thorough player both escalate.

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Elapsed time | t | float | 0–T_session s | Seconds since session start |
| Nominal length | T_session | float | 900–2400 s | Tuning knob — default 1500 s (25 min, §1) |
| Coverage | coverage | float | 0–1 | Scan coverage fraction (from Scan Node via Orchestrator) |
| Time weight | w_t | float | 0–1 | Tuning knob — default 0.5 |
| Coverage weight | w_c | float | 0–1 | Tuning knob — default 0.5 (`w_t + w_c = 1`) |
| Output | e | float | 0–1 | Escalation level |

**Output Range:** 0 (session start, nothing scanned) → 1 (full session elapsed or
fully covered). Clamped so overrun time can't push e > 1.
**Example:** t=375 s, T_session=1500, coverage=0.25, w_t=w_c=0.5 → e = 0.5×0.25 +
0.5×0.25 = **0.25**.

---

### Formula 2 — Dollhouse Desync Delay

The `desync_delay` formula is defined as:

`desync_delay = D0 + (D_max − D0) × e²`

How long the dollhouse lags real scan-state. Quadratic in `e` so the map stays
nearly truthful early (the reliability the §8 fall depends on) and degrades sharply
late.

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Escalation | e | float | 0–1 | From Formula 1 |
| Base delay | D0 | float | 0–10 s | Tuning knob — default 2.0 s |
| Max delay | D_max | float | 10–120 s | Tuning knob — default 25.0 s |
| Output | desync_delay | float | D0–D_max s | Seconds the map lags behind reality |

**Output Range:** D0 (2.0 s) at e=0 → D_max (25.0 s) at e=1. Monotonic; a
just-scanned room reads un-scanned on the map for this long.
**Example:** e=0.5 → 2.0 + 23.0 × 0.25 = **7.75 s**. e=0.9 → 2.0 + 23.0 × 0.81 =
**20.6 s**.

> Looping is a state condition (Detailed Design rule 7: arms on
> `entity:proximity ≥ loop_trigger_tier` or anomaly reveal), not a formula — no math
> beyond the threshold compare.
>
> *Note: `systems-designer` not consulted — authored inline (Lean mode, no agent
> spawn). Validate these curves in playtest or spawn the specialist before
> production.*

## Edge Cases

- **If a loop door is armed while the player is mid-scan (`SCAN_LOCKED`)**: the loop
  does not fire. Movement is locked during a scan, so no threshold can be crossed;
  the door stays armed and fires on the next crossing *after* the scan ends or
  aborts. Loops never interrupt an active scan.

- **If the anomaly room's `revealTriggerNodeId` is never scanned** (the player
  deliberately avoids it — the §9 escape): the room stays `HIDDEN` forever, never
  emitted, never navigable. This is correct behaviour, not a failure — it is the win
  path.

- **If `scan:complete` arrives for a `revealTriggerNodeId` whose anomaly room is
  already `REVEALED`** (duplicate event): no-op. Reveal is idempotent; no second
  `floorplan:update` is emitted.

- **If a reveal exposes a node that triggers a further anomaly room** (chained
  reveals): allowed. Reveals are processed independently per `scan:complete`;
  chaining deeper anomaly rooms is a valid authoring pattern.

- **If the player crosses an armed loop door whose `loopTarget` is still `HIDDEN`**:
  the loop is suppressed and the door behaves normally (leads to its real neighbour)
  until the target is `REVEALED`. Prevents teleporting into un-emitted geometry.

- **If two loop doors would fire in rapid succession** (ping-pong): a global
  `loop_cooldown` blocks any new loop firing within the cooldown window of the last
  one. Caps teleport chains; prevents a disorienting softlock.

- **If `entity:proximity` arms a loop while the player already overlaps the
  threshold**: the loop does **not** fire retroactively. A loop fires only on a
  fresh crossing entered from the non-loop side; standing in the doorway at arm-time
  is safe until the player steps through.

- **If a reveal (`floorplan:update`) and a loop (`floorplan:loop`) resolve in the
  same frame**: process the reveal first (geometry added, single consolidated
  `floorplan:update` so the renderer rebuilds once per AC-E04), then the loop
  reposition. The player is never teleported into geometry that hasn't been emitted
  that frame.

- **If `desync_delay` is so large the room never reaches `KNOWN_CURRENT` before
  session end**: acceptable. The room shows un-scanned on the final dollhouse — this
  feeds the §10 coverage-as-false-comfort ending. Not a bug.

- **If two `floorplan:update`-relevant rooms have overlapping AABBs** (intentional
  ghost/anomaly overlap): allowed. Overlap is intentional horror (matches the
  renderer's "void/spike floating in empty space" edge case) — the floor plan does
  not deduplicate or separate them.

- **If layout validation fails at load** (a door `width < 0.71 m`, a room interior
  not navigable by the FPS clamp, or a node position outside its room AABB): reject
  that `PropertyLayout` and select another from the pool. If the pool is exhausted
  with no valid layout, **hard-fail with an explicit console error** — this is an
  authoring bug that must not ship, not a runtime condition to swallow.

- **If a seed code resolves to a `propertyId` not in the pool**: fall back to random
  selection and log a warning. A bad/old shared seed degrades to a normal random
  session rather than crashing.

- **If `loopSpawn` would place the player outside the target room's navigable
  AABB**: clamp the spawn to the target room's interior centre at `EYE_HEIGHT`.
  `loopSpawn` positions are validated at load (same check as rule 4); the clamp is
  the runtime safety net.

## Dependencies

**Upstream — what this system consumes:**

| System | Dependency type | Interface |
|---|---|---|
| Orchestrator | Event bus (**hard**) | Receives `scan:complete {nodeId}` (anomaly reveals), `entity:proximity {tier}` (arms loops), `session:end`. Emits `floorplan:update`, `floorplan:reveal`, `floorplan:loop`. ⚠️ *Provisional — Orchestrator undesigned; event names are this GDD's proposed contract.* |
| Scan Node System | Soft (event consumer) | Listens for `scan:complete {nodeId}` to fire reveals. ⚠️ *Provisional — Scan Node undesigned.* |

Floor Plan has **no hard structural upstream** beyond the Orchestrator bus — it owns
its layout data outright (curated pool). It does not call any system directly.

**Downstream — systems that depend on this:**

| System | What they need | Interface |
|---|---|---|
| Point Cloud Renderer | Room geometry to render | `floorplan:update {rooms:[{id, aabb, surfaces}]}` at load + on mutation. *(Renderer GDD already records this as its upstream data source — bidirectionally consistent ✅.)* |
| Scan Node System | Initial node anchors | Room membership + `estimatedNodePositions` at load. Scan Node owns actual node state. ⚠️ *Provisional contract.* |
| FPS Movement | Navigable bounds + loop reposition | Consumes the room AABB set as clamp **union-bounds** *(FPS Movement GDD records this ✅)*. **Loop reposition** via `floorplan:loop {targetPosition, targetYaw}` *(added to FPS Movement GDD inbound interface)*. |
| Entity System | Room AABBs + door graph | For placement/pathing; anomaly room = highest-proximity zone (§8). Via Orchestrator. ⚠️ *Provisional — Entity undesigned.* |

**Hard vs. soft:** the only hard dependency is the **Orchestrator event bus**
(without it, reveals/loops/geometry can't propagate). Everything else is a soft
data-provider relationship mediated by events — no direct imports, consistent with
the renderer GDD's pattern.

**Bidirectional actions:**
1. **FPS Movement GDD** — `floorplan:loop {targetPosition, targetYaw}` added to its
   inbound interface (done with this GDD).
2. **Orchestrator GDD (when authored)** — must register the `floorplan:*` event
   family.

## Tuning Knobs

| Knob | Default | Safe Range | Too High | Too Low |
|---|---|---|---|---|
| `T_session` (nominal length) | 1500 s | 900–2400 | Time component of `e` ramps slowly; perception stripping never peaks in a real playthrough | `e` saturates early; map degrades before the player has learned to trust it |
| `w_t` (time weight) | 0.5 | 0–1 | Escalation driven by clock alone; a cautious slow player escalates even while barely scanning | Time stops mattering; idling never raises dread |
| `w_c` (coverage weight) | 0.5 | 0–1 | Escalation driven by scanning alone; a fast non-scanner never escalates | Coverage stops mattering; thorough play isn't punished with dread |
| `D0` (base desync delay) | 2.0 s | 0–10 | Map is unreliable from the first minute — no trust to lose, §8 fall has no height | Map is perfectly live early; fine, but no "instrument lag" texture |
| `D_max` (max desync delay) | 25.0 s | 10–120 | Map effectively frozen late; reads as broken rather than degrading | Late-game map still trustworthy; perception-stripping payoff never lands |
| `loop_trigger_tier` | `NEAR` | `MEDIUM`–`ADJACENT` | At `MEDIUM`/`FAR` loops fire constantly; disorientation becomes noise, not dread | At `ADJACENT` loops almost never arm; §15-C2 looping rarely seen |
| `loop_cooldown` (global) | 8.0 s | 2–30 | Loops too rare; the "corridor returns you" effect underused | Loop ping-pong; rapid re-teleport causes nausea / near-softlock |

**Per-layout authoring values** (not global knobs — set per `PropertyLayout` in the
pool): `revealTriggerNodeId` (which node reveals each anomaly room), which doors are
`loopable` and their `loopTarget`/`loopSpawn`, `propertyType` (drives §16-H1
pacing). These are content, tuned by the level designer per property, not global
sliders.

**Interaction notes:**
- `w_t` + `w_c` are normalised to sum to 1 at load (raw values are relative
  weights). Setting both to 0 is invalid → falls back to 0.5 / 0.5.
- `D0` and `D_max` set the desync envelope; the `e²` curve (Formula 2) governs the
  *shape* of the growth between them — there is no separate growth knob.
- `loop_trigger_tier` and `loop_cooldown` interact: an aggressive tier with a short
  cooldown is the chaos zone — tune them as a pair in playtest.
- `loop_trigger_tier` reads the same proximity tiers the renderer/entity use
  (`FAR/MEDIUM/NEAR/ADJACENT`) — it does not define its own bands.

## Visual/Audio Requirements

This system produces **no pixels or audio directly**. Its footprint is delegated;
this section specifies what it requires of the systems that do render/sound its
events.

- **Anomaly reveal** must read as *new space silently appearing*, never a pop-in
  glitch. The renderer's single-frame BASE rebuild (renderer AC-E04) handles it;
  Floor Plan requests **no transition flourish** — the silent appearance is the
  horror.
- **Loop teleport** must be instantaneous and seamless: no fade, no camera lerp
  (FPS Movement applies the reposition in one frame). The wrongness comes from the
  player *recognizing the room*, not from a visible cut. An optional single-frame
  playback hitch to mask the cut is deferred to the Found-Footage Layer (§16-F3).
- **Subtle-difference injection** on loop re-entry (§15-C2): Floor Plan only flags
  "this room is a loop instance, inject differences"; the actual differences (moved
  point cluster, altered prop) are owned by the renderer/Entity System. The count
  of differences is a tuning knob there, not here.
- **Audio:** Floor Plan owns none. It *requests* (via Orchestrator) an optional
  servo/stutter cue on `floorplan:loop` and a faint cue on `floorplan:reveal`; the
  Audio System (§13) decides whether/how to sound them. No audio is required for the
  system to function.

*No own assets — geometry belongs to the renderer, the map to UI/HUD. `/asset-spec`
for this system is **not** required.*

## UI Requirements

Floor Plan supplies the **dollhouse view model** to UI/HUD, which renders the
dollhouse panel. Floor Plan owns the data; UI owns the pixels.

- **View model (per update):** for each `STANDARD` room — a 2D outline (top-down
  projection of its AABB), room label, `estimatedNodePositions` with each node's
  **mask state** (`KNOWN_STALE`/`KNOWN_CURRENT` → un-scanned/scanned visual), plus
  the player-position marker. `LOCKED` rooms render as `[?]` with no interior.
- **Must NEVER expose:** `ANOMALY` rooms (even after reveal — they stay off the
  map), entity position, or a room's *true* real-time scan state while it's inside
  its `desync_delay` window (show the stale state instead).
- **Coverage framing:** Floor Plan supplies raw room/node counts; the UI's coverage
  ring (§10) reads them and — per §15-H — frames higher coverage as "good." Floor
  Plan provides numbers, UI owns the (misleading) framing.
- **Update triggers:** `floorplan:update`, `scan:complete` (applied only after
  `desync_delay`), and player movement.

> **📌 UX Flag — Floor Plan System**: the dollhouse map is a UI surface. In
> Pre-Production, run `/ux-design` for the dollhouse panel before writing epics; UI
> stories should cite `design/ux/dollhouse.md`, not this GDD directly. (Note in
> systems index.)

## Acceptance Criteria

> 23 criteria. Logic/Integration = **BLOCKING**, Visual/Perf = **ADVISORY** — *no
> ADVISORY items in this system: Floor Plan emits data and renders no pixels (visual
> outcomes live in the renderer/FPS/UI GDDs).*

### Core Rules

**AC-C01 — Init emits standard rooms, withholds hidden rooms**
GIVEN a layout with `STANDARD`, `ANOMALY`, and `LOCKED` rooms, WHEN the session
initialises, THEN the first `floorplan:update` contains exactly the `STANDARD`
rooms; no `ANOMALY`/`LOCKED` geometry is present. **BLOCKING**

**AC-C02 — Floor Plan emits, never mutates the player transform**
GIVEN a loop fires, WHEN Floor Plan resolves it in frame F, THEN it emits
`floorplan:loop {targetPosition, targetYaw}` and the player transform is
**byte-identical before and after Floor Plan's handler in frame F**; the position
changes only on FPS Movement's subsequent tick. **BLOCKING**

**AC-C03 — Dollhouse view model excludes anomaly rooms**
GIVEN an anomaly room transitioned to `REVEALED` via its trigger, WHEN the dollhouse
view model is queried that frame and any later frame, THEN it contains **zero**
entries of `type: ANOMALY` (outline, label, and nodes all absent). **BLOCKING**

**AC-C04 — WALL_MARGIN validation at load**
GIVEN a layout with a door `width = 0.60 m` (< 0.71), WHEN validated at load, THEN
it is rejected and another pool layout is selected; the invalid layout is never
emitted. **BLOCKING**

**AC-C05 — Anomaly reveal on trigger node**
GIVEN an anomaly room with `revealTriggerNodeId = N`, WHEN `scan:complete {nodeId:
N}` arrives, THEN within the same frame the door unseals, a `floorplan:update` with
its geometry is emitted, and `floorplan:reveal {roomId}` fires; the dollhouse is
**not** updated. **BLOCKING**

**AC-C06 — Mutations emit one full-set update**
GIVEN any geometry mutation (reveal or loop), WHEN Floor Plan emits, THEN it emits
exactly **one** `floorplan:update` carrying the **full current room set** (not a
delta/partial) within a single frame. *(Renderer single-frame BASE rebuild is
covered by renderer AC-E04.)* **BLOCKING**

**AC-C07 — Dollhouse holds estimated node positions under real-node movement**
GIVEN a room whose `estimatedNodePositions[i]` differs from the Scan Node System's
actual node position by a known delta, WHEN the dollhouse view model is queried,
THEN the marker is at `estimatedNodePositions[i]` (±0.001 m); AND a subsequent
`scan:complete` that moves the actual node does **not** change the dollhouse marker.
**BLOCKING**

### Formulas

**AC-D01 — Escalation level**
GIVEN `T_session=1500`, `w_t=w_c=0.5`, WHEN `t=375`, `coverage=0.25`, THEN `e=0.25`
(±0.001). **BLOCKING**

**AC-D02 — Desync delay curve, with monotonicity**
GIVEN `D0=2.0`, `D_max=25.0`, WHEN `e=0.5` THEN `desync_delay=7.75 s` (±0.01); WHEN
`e=0.9` THEN `=20.63 s` (±0.01); AND for sample pairs `(e=0.2 → 2.92)` < `(e=0.6 →
10.28)` < `(e=0.9 → 20.63)`, confirming `e1<e2 ⇒ delay(e1)<delay(e2)`. **BLOCKING**

**AC-D03 — Desync defers map update (boundary inclusive)**
GIVEN a room scanned at `t0` with current `desync_delay=8 s`, WHEN the dollhouse is
queried at `t0+5 s` THEN it reads un-scanned (`KNOWN_STALE`); WHEN queried at `t ≥
t0+8 s` THEN it reads scanned (`KNOWN_CURRENT`). **BLOCKING**

**AC-D04 — Desync is derived from escalation and grows over the session**
GIVEN Formula 1/2 defaults, WHEN a room is scanned at escalation `e=0.25` and another
at `e=0.90`, THEN the first holds `KNOWN_STALE` for `desync_delay ≈ 3.44 s` (±0.01)
and the second for `≈ 20.63 s` (±0.01), confirming a later (higher-`e`) scan lags
strictly longer. **BLOCKING**

### Looping

**AC-L01 — Armed loop teleports on threshold crossing**
GIVEN an `ARMED` loop door (proximity ≥ `loop_trigger_tier`, `loopTarget`
`REVEALED`), WHEN the player crosses from the non-loop side, THEN `floorplan:loop`
is emitted with the target `loopSpawn`, and the door enters `COOLDOWN`. **BLOCKING**

**AC-L02 — Cooldown prevents ping-pong**
GIVEN a loop fired at `t0`, `loop_cooldown=8 s`, WHEN any loop would fire at `t0+3 s`
THEN none is emitted; at `t0+8 s` or later it is allowed. **BLOCKING**

**AC-L03 — Loop suppressed during active scan**
GIVEN an `ARMED` door and `SCAN_LOCKED`, WHEN the scan is in progress, THEN no
`floorplan:loop` fires; it fires only on the first crossing after the scan
ends/aborts. **BLOCKING**

**AC-L04 — Loop suppressed when target hidden**
GIVEN an `ARMED` door whose `loopTarget` is `HIDDEN`, WHEN the player crosses it,
THEN no loop fires and the door routes to its real neighbour. **BLOCKING**

**AC-L05 — No retroactive loop for a player already on the threshold**
GIVEN a player standing inside a `loopable` door's threshold AABB, WHEN that door
ARMS without the player having exited and re-entered, THEN no `floorplan:loop` fires;
it fires only on a subsequent fresh crossing from the non-loop side. **BLOCKING**

### State & Edge

**AC-E01 — Reveal is idempotent**
GIVEN an already-`REVEALED` anomaly room, WHEN a duplicate `scan:complete
{revealTriggerNodeId}` arrives, THEN no second `floorplan:update`/`reveal` is
emitted. **BLOCKING**

**AC-E02 — Unscanned trigger keeps anomaly hidden (escape path)**
GIVEN the player reaches session end without scanning the anomaly's
`revealTriggerNodeId`, WHEN the state reaches `SEALED`, THEN the anomaly room was
never emitted, never navigable, never on the dollhouse. **BLOCKING**

**AC-E03 — Pool exhaustion hard-fails loudly**
GIVEN every pool layout fails validation, WHEN init runs, THEN an explicit console
error is raised and no session starts with an invalid layout. **BLOCKING**

**AC-E04 — Bad seed degrades to random**
GIVEN a seed resolving to a `propertyId` not in the pool, WHEN init runs, THEN a
random valid layout is selected, a warning logged, and the session starts normally.
**BLOCKING**

**AC-E05 — SEALED freezes all mutations**
GIVEN state = `SEALED` (after `session:end`), WHEN a `scan:complete` for an
un-revealed anomaly's trigger OR an `entity:proximity ≥ loop_trigger_tier` arrives,
THEN Floor Plan emits **no** `floorplan:update`/`reveal`/`loop`; geometry and
dollhouse are frozen. **BLOCKING**

**AC-E06 — loopSpawn clamp safety net**
GIVEN a `loopable` door whose `loopSpawn.position` lies outside the target room's
navigable AABB, WHEN the loop fires, THEN the emitted `targetPosition` is clamped to
the target room interior centre at `EYE_HEIGHT` (inside the AABB by ≥ `WALL_MARGIN`).
**BLOCKING**

**AC-E07 — Chained reveals fire independently**
GIVEN anomaly room X whose reveal emits geometry containing node `N2`, where `N2` is
anomaly room Y's `revealTriggerNodeId`, WHEN `scan:complete {nodeId: N2}` later
arrives, THEN room Y reveals independently (door unseals, `floorplan:update`,
`floorplan:reveal`). **BLOCKING**

**AC-E08 — Overlapping AABBs are kept, not deduplicated**
GIVEN two `REVEALED` rooms with intentionally overlapping AABBs, WHEN
`floorplan:update` is emitted, THEN both rooms' geometry is present in the room set;
Floor Plan does not merge, dedup, or separate them. **BLOCKING**

## Open Questions

1. **Loop teleport comfort / motion sickness** — threshold teleport is
   instantaneous; repeated loops may disorient or nauseate. Needs playtest to
   validate `loop_cooldown` (8 s) and loop frequency feel comfortable, and whether a
   masking playback hitch (Found-Footage §16-F3) is *required* vs. optional.
   *Owner: playtester. Resolve during vertical slice.*
2. **Escalation inputs (`e`)** — Formula 1 reads `coverage` (from Scan Node) and
   elapsed `t`. Open: does `t` pause during scans/menus, and exactly how is
   `coverage` defined (standard nodes only, or all)? Depends on Orchestrator + Scan
   Node contracts. *Owner: lead-programmer. Resolve when the Orchestrator GDD is
   authored.*
3. **Curated-pool authoring pipeline** — §8 sources layouts from real Matterport
   scans. How a scan becomes a `PropertyLayout` (rooms, AABBs, door graph, node
   positions, anomaly/loop tags) is unspecified — manual authoring vs. tooling.
   *Owner: producer / tools-programmer. Resolve before Production.*
4. **Multi-level / non-rectangular properties** — the dollhouse is a top-down AABB
   projection. Townhouses/detached houses (§16-H1) have stairs and non-box rooms.
   Does MVP assume single-level, axis-aligned rooms? *Owner: level-designer. Resolve
   before expanding the pool beyond condos.*
5. **`floorplan:loop` application owner** — this GDD assigns the teleport to FPS
   Movement. Confirm against the Orchestrator design (could route through it
   instead). *Owner: lead-programmer. Resolve when the Orchestrator GDD is authored.*
