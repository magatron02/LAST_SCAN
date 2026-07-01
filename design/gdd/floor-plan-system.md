# Floor Plan System

> **Status**: Approved (round 4 independent re-review, 2026-06-30; amended same day — AC-E17 added during Scan Node System review, no re-review required)
> **Author**: magatron02 + agents
> **Last Updated**: 2026-06-30
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
alarm, no jump — the dollhouse shows the player standing in a room they know they
already left, its position marker lagging seconds (then tens of seconds) behind the
real body (Desync). A corridor that should end at the bedroom delivers them
back to the kitchen (Loop). A door opens onto a room the map never admitted existed
(anomaly reveal). Each disagreement between the map and the space is small enough to
rationalize once — *I misremembered* — and that self-doubt is the point. The player
is not being startled; they are being **stripped of the ability to predict what's
around the corner**, one quiet contradiction at a time, until they stop reaching for
the map at all and navigate on live scan data alone, blind to everything they
haven't lit up themselves.

These are two distinct kinds of wrongness, not one compounding glitch: the lagging
position marker is a *slow* erosion of trust in mundane, already-explored rooms, while
the anomaly reveal (which hides the marker outright rather than lying about it — see
Edge Cases) is a *sudden* admission of instrument failure. Both serve the same fall, on
different timers.

**Reference feeling:** the disorientation of *P.T.*'s looping hallway and the
dawning-wrongness of found-footage horror — not "a monster appeared" but "the space
itself stopped obeying its own floor plan." The familiar domestic layout (§1 tone)
made untrustworthy is the whole effect.

**Anchor moment:** the first time the player glances at the dollhouse to orient, and
it shows them standing in a room they know they already left. Not a glitch they
report — a quiet "...that's not right" they sit with alone.

> *Note: `creative-director` consulted in re-review (2026-06-30, full mode) — synthesis
> confirmed the anchor moment is now mechanically delivered; flagged that the desync and
> loop-disorientation beats aren't sequenced relative to each other (see Tuning Knobs
> interaction notes) for vertical-slice playtest attention.*

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
estimatedNodePositions:[{nodeId, nodeType:STANDARD|ANOMALY_FINAL|NULL,
position:[x,y,z]}] }`

**`Door`**: `{ id, roomA, roomB, threshold (world AABB), width (≥ 0.71 m),
loopable:bool, loopTarget?:roomId, loopSpawn?:{position, yaw} }`

- `ANOMALY` rooms carry `revealTriggerNodeId` — the standard node whose completion
  reveals them.
- `LOCKED` rooms are the `[?]` storage spaces (§8 table): present in authored layout
  metadata and the dollhouse view, but withheld from navigable/renderable geometry;
  their nodes are `NULL`, never scannable, and never revealed as traversable.

**Init metadata vs. renderable geometry:** hidden-room metadata must reach internal
logic without leaking hidden surfaces to the renderer or UI. At session init Floor
Plan therefore emits two distinct contracts:

- `floorplan:init {propertyId, roomMeta:[{id,type}], nodeRoster:[{nodeId,nodeType,
  roomId,estimatedPosition}]}` exactly once. It includes STANDARD, ANOMALY_FINAL,
  and NULL node metadata, but no AABBs or surfaces for hidden rooms.
- `floorplan:update {rooms:[{id,aabb,surfaces}]}` contains only the currently
  revealed, renderable room geometry. Point Cloud Renderer consumes this event;
  Scan Node does not use it to build the roster.

### Core Rules

1. **Session init.** Select a `PropertyLayout` (random from the curated pool, or
   resolved from a seed code). Emit `floorplan:init` once with the complete internal
   node roster (including hidden ANOMALY_FINAL and NULL metadata), then emit geometry
   for all `STANDARD` rooms via `floorplan:update`. `ANOMALY` and `LOCKED` AABBs and
   surfaces are withheld from the renderable update.
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
6. **Dollhouse desync (continuous position + discrete scan-state).** Both surfaces
   use `desync_delay`, but they have separate storage semantics:
   - **Position marker:** on every `player:position {x,y,z}` event, append a
     timestamped sample to a ring buffer retaining at least `D_max + 1s`. At query
     time render the linearly interpolated position at `now − desync_delay(now)`.
     If the session is younger than the requested delay, use the oldest sample.
   - **Scan-state:** on each `scan:complete`, snapshot the delay at event time and
     enqueue the node update with `applyAt = eventTime + delayAtEvent`. While any
     node update for a room is pending, its derived room freshness is
     `KNOWN_STALE`; after all pending updates mature it returns to `KNOWN_CURRENT`.
     A later scan can therefore transition the room `CURRENT → STALE → CURRENT`
     repeatedly.
   At `desync_delay = 0` the sample/update is reflected in the same handler (no-op
   queue). Position history and scan-state queues are separate and processed in
   timestamp order.
7. **Looping geometry (threshold teleport).** A `loopable` door **arms** when its
   trigger condition is met — `(entity proximity ≥ loop_trigger_tier OR anomaly room
   revealed) AND session escalation e ≥ loop_arm_floor`. The escalation floor means
   no loop can fire before the player has built enough trust in the space to lose
   ("the fall is only as far as the height you build"). When the player crosses an
   armed door's threshold, emit `floorplan:loop {targetPosition, targetYaw, toRoom}`;
   FPS Movement applies the reposition to the `loopTarget` room's entrance. A loop
   event flags the destination for **subtle-difference injection** (owned by
   renderer/entity — §15-C2, see Open Q#6). The door then enters a **per-door**
   `COOLDOWN` for `loop_cooldown`; on exit it re-arms only if its condition still
   holds and `e ≥ loop_arm_floor` (anomaly-revealed doors stay condition-eligible
   permanently, so late-session they re-arm each cycle by design). A reveal that
   arrives while the door is already in `COOLDOWN` does **not** interrupt or shorten
   the timer — it only sets the room's permanent revealed flag, which the next
   cooldown-elapsed re-evaluation reads like any other re-arm check (the reveal is
   queued, never lost — AC-L12).
8. **Estimated ≠ actual nodes.** The dollhouse shows `estimatedNodePositions`; the
   Scan Node System owns real node positions and may differ. The floor plan supplies
   estimates only — it never claims node truth.
9. **All actual geometry mutations go through `floorplan:update`.** Init, reveal,
   and any future change to AABBs/surfaces emit the full current room set so the
   renderer rebuilds BASE in a single frame (no partial/incremental geometry —
   matches renderer AC-E04). A loop teleport does **not** mutate base geometry and
   emits only `floorplan:loop`; it never triggers a redundant BASE rebuild.

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
| `DORMANT` | Normal door, leads to its real neighbour | Init; or COOLDOWN elapsed with condition no longer met | Arm condition met (see below) |
| `ARMED` | Crossing it will loop the player | `(entity:proximity ≥ loop_trigger_tier OR anomaly revealed) AND e ≥ loop_arm_floor` | Player crosses → `TRIGGERED`; OR proximity drops below tier (anomaly-armed doors don't clear this way) → `DORMANT` |
| `TRIGGERED` | Loop event emitted this frame | Player crosses threshold while `ARMED` | Next frame → `COOLDOWN` |
| `COOLDOWN` | This door cannot re-arm yet (per-door, not global) | After trigger | `loop_cooldown` elapsed → re-evaluate: condition (proximity OR permanent-reveal flag) + `e ≥ floor` still met → `ARMED`, else `DORMANT`. A reveal arriving mid-COOLDOWN does not interrupt the timer (AC-L12). |

**Dollhouse freshness, per visible node/room:** STANDARD nodes/rooms start
`KNOWN_CURRENT` (their displayed UNSCANNED state matches reality). A pending
scan-state update makes that node `KNOWN_STALE`; the room is derived as
`KNOWN_STALE` while any child node is stale, otherwise `KNOWN_CURRENT`. The same
room may cycle `CURRENT → STALE → CURRENT` for every completed node. ANOMALY rooms
never enter the dollhouse view; `UNKNOWN` is internal-only and never rendered.

### Interactions with Other Systems

| System | Direction | Interface |
|---|---|---|
| **Point Cloud Renderer** | out | `floorplan:update {rooms:[{id, aabb, surfaces}]}` at load and on actual geometry mutation (including reveal, excluding loop). Renderer rebuilds BASE. Renderer never calls back. |
| **Scan Node System** | out + in | **Out:** `floorplan:init` provides the complete internal node roster + room mapping + estimates once. **In:** listens for `scan:complete {nodeId}` to fire anomaly reveals. Scan Node owns actual node state and ignores geometry-only `floorplan:update` for roster creation. |
| **FPS Movement** | out | Consumes the emitted room AABB set as the **navigable union-bounds** for its clamp; on loop, applies `floorplan:loop {targetPosition, targetYaw}` (FPS Movement owns the player transform — floor plan only requests). |
| **Orchestrator** | in + out | **Subscribes:** `player:position {x,y,z}` (history + threshold crossing), `session:tick {elapsedSeconds}` (authoritative `t`), `scan:coverage {coverage}`, `scan:started`, `scan:complete`, `scan:abort` (scan lock + reveals), `entity:proximity {tier}`, `session:end`. **Emits:** `floorplan:init`, `floorplan:update`, `floorplan:reveal {roomId}`, `floorplan:loop {targetPosition, targetYaw, toRoom}`. Event names are provisional until Orchestrator (#5) is authored. |
| **UI / HUD** | out | Provides the dollhouse **view model** (room outlines, labels, estimated nodes, per-room mask state) for the dollhouse panel. UI renders it; floor plan supplies data only. |
| **Entity System** | out | Provides room AABBs + door graph for entity placement/pathing (anomaly room = highest-proximity zone, §8). Consumed via Orchestrator, not a direct call. |

### Interaction Matrix

Every blocking finding across three review rounds (2026-06-27, 2026-06-28, 2026-06-30)
has lived at the **interaction between two individually-correct rules**, not a flaw in
either rule alone. This table is the structural fix: enumerate the surface once instead
of re-discovering it round by round. Extend it when a new load-bearing state is added
(e.g. at Orchestrator/Entity System authoring) rather than waiting for the next review
to find the gap.

| Interaction | Resolved by | AC |
|---|---|---|
| Desync active (any `D>0`) × Loop fires | Marker doesn't snap to `loopTarget`; stays on pre-loop lagged trail until the delay elapses | AC-E13 |
| Loop `ARMED` × `SEALED` | Crossing an already-armed door after SEALED emits no loop | AC-E05 |
| Loop `COOLDOWN` × Anomaly reveal | Reveal queues (sets the permanent condition flag); never interrupts or shortens the timer | AC-L12 |
| Loop `COOLDOWN` × Proximity drop | Condition no longer met at re-evaluation → `DORMANT`, not `ARMED` | AC-L11 |
| Scan-state pending (`KNOWN_STALE`) × multi-node room | Room reads `STALE` while any child node is pending | AC-C08 |
| Scan-state pending × `SEALED` | Pending update never applies; room stays `STALE` at session end, no error | AC-E12 |
| `SCAN_LOCKED` × Loop `ARMED` | Loop event suppressed until scan ends/aborts (door's `ARMED` status itself is not separately re-asserted, only the suppression + post-unlock firing) | AC-L03 |
| Reveal × Loop crossing, same tick | Reveal's `floorplan:update` emitted before `floorplan:loop` | AC-L09 |
| `w_t`/`w_c` config × `D_max` reachability | `w_t` capped at 0.8 — `e=1.0` (and `D_max`) unreachable without scanning | AC-D03 |
| `D0`/`D_max` config × curve shape | `D0 < D_max` enforced at load — prevents flat-curve degeneration | AC-D08 |
| Dollhouse panel open × Entity proximity / Loop arming | World simulation does **not** pause — proximity, loop-arm conditions, and desync queues all continue normally while the panel is open; only the player's *view* of the room is occluded | AC-E16 |

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
| Coverage | coverage | float | 0–1 | Scan coverage fraction = `V/S`, owned by Scan Node System (registry: `coverage`; S = count(STANDARD)+1 anomaly node); consumed via Orchestrator. |
| Time weight | w_t | float | 0–0.8 | Tuning knob — default 0.5. **Absolute weight**: `w_t + w_c = 1` enforced (not relative; no renormalization). Capped at 0.8 so coverage always retains nonzero pull on `e` (see Edge Cases). |
| Coverage weight | w_c | float | 0.2–1 | Tuning knob — default 0.5; `w_c = 1 − w_t`. Both-zero is invalid → fallback 0.5/0.5 + warning. Floor of 0.2 mirrors the `w_t` cap. |
| Output | e | float | 0–1 | Escalation level |

**Output Range:** 0 (session start, nothing scanned) → 1 (full session elapsed or
fully covered). Clamped so overrun time can't push e > 1.
**Example:** t=375 s, T_session=1500, coverage=0.25, w_t=w_c=0.5 → e = 0.5×0.25 +
0.5×0.25 = **0.25**.
**Escape-player ceiling:** an escape player (anomaly never scanned, coverage ≤ `N/(N+1)`
≈ 0.923) reaches at most `e ≈ 0.5×1.0 + 0.5×0.923 = 0.962` at full session length under
default weights. **Structural guarantee:** because `w_t` is capped at 0.8 (`w_c ≥ 0.2`),
even the most time-weighted legal config caps a non-scanning player's `e` at
`0.8×1.0 + 0.2×0 = 0.8` — `e = 1.0` is reachable **only** via the Completion Trap
(coverage = 1.0) at *every* legal weight configuration, not just defaults. The registry
`desync_delay` top (25.0 s) therefore applies only to the trap ending — the escape
ceiling at default weights is ~22.5 s (Formula 2).

---

### Formula 2 — Dollhouse Desync Delay

The `desync_delay` formula is defined as:

`desync_delay = D0 + (D_max − D0) × e³`

How long the dollhouse lags reality (both the player-position marker and scan-state,
Core Rule 6). **Cubic** in `e` so the map stays genuinely truthful early — the
reliability the §8 fall depends on — and degrades steeply only late.

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Escalation | e | float | 0–1 | From Formula 1 |
| Base delay | D0 | float | 0–10 s | Tuning knob — default 2.0 s |
| Max delay | D_max | float | 10–120 s | Tuning knob — default 25.0 s (reached only at e=1, the Completion Trap). Must be `> D0` (see Edge Cases) — at `D_max = D0` the curve degenerates to a flat constant. |
| Output | desync_delay | float | D0–D_max s | Seconds the map lags behind reality |

**Output Range:** D0 (2.0 s) at e=0 → D_max (25.0 s) at e=1. Monotonic. At `D0=0`,
`desync_delay=0` at e=0 (instantaneous update — valid degenerate case, Core Rule 6).
**Examples:** e=0.5 → 2.0 + 23.0 × 0.125 = **4.88 s**. e=0.9 → 2.0 + 23.0 × 0.729 =
**18.77 s**. Escape-player ceiling (e≈0.962) → 2.0 + 23.0 × 0.891 ≈ **22.5 s** (never
the full 25 s).

> Looping is a state condition (Detailed Design rule 7: arms on
> `(entity:proximity ≥ loop_trigger_tier OR anomaly revealed) AND e ≥ loop_arm_floor`),
> not a formula — the only math is the threshold/floor compare.
>
> *Note: `systems-designer` consulted in re-review (2026-06-27); curve changed e²→e³,
> per-door cooldown and escalation floor added. Re-consulted 2026-06-30: `w_t` capped
> at 0.8 and `D0 < D_max` now enforced at load — both close degenerate configurations
> that previously let a non-default weight/tuning choice silently break the "D_max
> only via Completion Trap" guarantee. Validate the curve feel in playtest.*

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

- **If the same loop door would fire in rapid succession** (ping-pong): a **per-door**
  `loop_cooldown` blocks that door from re-firing within its cooldown window. Each
  door cools independently — triggering one door does NOT "safe" the others (closes
  the global-cooldown exploit). Caps single-door teleport chains; prevents a
  disorienting softlock.

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

- **If the player is inside a room absent from the dollhouse** (an `ANOMALY` room
  after reveal — never on the map): the dollhouse **hides the player-position marker**
  entirely; the instrument reports it has lost the player. No marker is drawn at a
  fabricated position — the absence is the horror.

- **If a loop teleport fires while the position marker is lagged** (`desync_delay > 0`):
  the real position jumps to `loopTarget`, but the lagged marker keeps rendering the
  pre-loop trail until the delay elapses. The map is briefly wrong about *both* which
  room the player is in and how they got there — intended, not corrected.

- **If a `loopable` door is already `ARMED` when `session:end` fires** (state →
  `SEALED`): crossing it after SEALED emits **no** `floorplan:loop`. SEALED freezes
  loops regardless of prior arm state (AC-E05).

- **If a `PropertyLayout` has zero `STANDARD` rooms** (coverage denominator
  degenerate): reject at load, same path as a door-width failure — guarantees `S ≥ 1`
  for the coverage formula. (Mirrors Scan Node AC-SN15's S=0 guard.)

- **If a `PropertyLayout` has zero or more than one `ANOMALY_FINAL` node across all
  rooms' `estimatedNodePositions`**: reject at load, same path as other guards.
  Scan Node's coverage formula (`S = count(STANDARD)+1`) and the Completion Trap (§9)
  assume exactly one trap node per property — chained anomaly reveals (AC-E07) may
  expose additional `ANOMALY` rooms or `STANDARD` nodes, but never a second
  `ANOMALY_FINAL`. A chained-reveal room may itself be `ANOMALY`-typed (hidden until
  its trigger fires); given the layout's single `ANOMALY_FINAL` node already lives
  somewhere in the layout (possibly in this very room), a chained room simply must
  not contain an *additional* `ANOMALY_FINAL` beyond that one — the trap node is not
  barred from living behind a chain, only from being duplicated.

- **If `w_t` and `w_c` are both 0** (invalid weights): fall back to 0.5/0.5 and log a
  warning at load. Weights are absolute; every other configuration must satisfy
  `abs((w_t + w_c) − 1) ≤ 1e-6` or fail layout/config validation.

- **If `w_t > 0.8`** (equivalently `w_c < 0.2`): reject at load, same path as other
  weight-validation failures. This guarantees coverage always retains nonzero pull on
  `e`, so `desync_delay` cannot reach `D_max` from elapsed time alone — the Completion
  Trap remains the only path to maximum desync at every legal configuration.

- **If `D0 ≥ D_max`** (invalid tuning — degenerate flat curve): reject at load, same
  path as other guards. `desync_delay = D0 + (D_max−D0)×e³` collapses to a constant
  `D0` when `D_max=D0`, silently defeating the "truthful early, sharp late" design
  intent the cubic exists to deliver. `D_max > D0` is enforced; the defaults
  (2.0 / 25.0) already satisfy this.

## Dependencies

**Upstream — what this system consumes:**

| System | Dependency type | Interface |
|---|---|---|
| Orchestrator | Event bus (**hard**) | Receives `player:position`, `session:tick`, `scan:coverage`, `scan:started`, `scan:complete`, `scan:abort`, `entity:proximity`, and `session:end`. Emits `floorplan:init`, `floorplan:update`, `floorplan:reveal`, and `floorplan:loop`. ⚠️ *Provisional — Orchestrator undesigned; event names are this GDD's proposed contract.* |
| Scan Node System | Soft (event consumer) | Receives the complete node roster through `floorplan:init`; Floor Plan listens for authoritative `scan:complete {nodeId}` and `scan:coverage {coverage}`. Scan Node GDD exists and records the reciprocal contract. |

Floor Plan has **no hard structural upstream** beyond the Orchestrator bus — it owns
its layout data outright (curated pool). It does not call any system directly.

**Downstream — systems that depend on this:**

| System | What they need | Interface |
|---|---|---|
| Point Cloud Renderer | Room geometry to render | `floorplan:update {rooms:[{id, aabb, surfaces}]}` at load + on mutation. *(Renderer GDD already records this as its upstream data source — bidirectionally consistent ✅.)* |
| Scan Node System | Initial node anchors | `floorplan:init` once with all node ids/types, room membership, and `estimatedPosition` values. Scan Node owns actual node state; hidden-room geometry remains private. |
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
   family plus the inbound `player:position`, `session:tick`, and `scan:*` contracts.

## Tuning Knobs

| Knob | Default | Safe Range | Too High | Too Low |
|---|---|---|---|---|
| `T_session` (nominal length) | 1500 s | 900–2400 | Time component of `e` ramps slowly; perception stripping never peaks in a real playthrough | `e` saturates early; map degrades before the player has learned to trust it |
| `w_t` (time weight) | 0.5 | 0–0.8 | Escalation driven mostly by clock; a cautious slow player escalates even while barely scanning | Time stops mattering; idling never raises dread |
| `w_c` (coverage weight) | 0.5 | 0.2–1 | Escalation driven mostly by scanning; a fast non-scanner barely escalates | Coverage stops mattering; thorough play isn't punished with dread |
| `D0` (base desync delay) | 2.0 s | 0–10 | Map is unreliable from the first minute — no trust to lose, §8 fall has no height | Map is perfectly live early; fine, but no "instrument lag" texture |
| `D_max` (max desync delay) | 25.0 s | 10–120 | Map effectively frozen late; reads as broken rather than degrading | Late-game map still trustworthy; perception-stripping payoff never lands |
| `loop_trigger_tier` | `NEAR` | `MEDIUM`–`ADJACENT` | At `MEDIUM`/`FAR` loops fire constantly; disorientation becomes noise, not dread | At `ADJACENT` loops almost never arm; §15-C2 looping rarely seen |
| `loop_cooldown` (per-door) | 8.0 s | 2–30 | Loops too rare; the "corridor returns you" effect underused | Loop ping-pong; rapid re-teleport causes nausea / near-softlock |
| `loop_arm_floor` (min `e` to arm any loop) | 0.4 | 0–0.7 | Loops arm only very late; §15-C2 looping rarely seen | Loops arm almost immediately — fire before the player has trust to lose, read as a bug |

**Per-layout authoring values** (not global knobs — set per `PropertyLayout` in the
pool): `revealTriggerNodeId` (which node reveals each anomaly room), which doors are
`loopable` and their `loopTarget`/`loopSpawn`, `propertyType` (drives §16-H1
pacing). These are content, tuned by the level designer per property, not global
sliders.

**Interaction notes:**
- `w_t` + `w_c` are **absolute weights**. Valid configuration requires
  `abs((w_t + w_c) − 1) ≤ 1e-6`; any other non-zero sum is a load-time error and is
  never silently renormalized. The special both-zero case falls back to 0.5 / 0.5
  and logs a warning. `w_t` is capped at 0.8 (`w_c ≥ 0.2`) so coverage always retains
  pull — without this cap, `w_t=1.0` would let `e` (and therefore `desync_delay`)
  reach its maximum from elapsed time alone, contradicting the Completion-Trap-only
  guarantee.
- `D0` and `D_max` set the desync envelope (`D0 < D_max` enforced at load); the `e³`
  curve (Formula 2) governs the *shape* of the growth between them — there is no
  separate growth knob.
- `loop_trigger_tier` and `loop_cooldown` interact: an aggressive tier with a short
  cooldown is the chaos zone — tune them as a pair in playtest.
- `loop_trigger_tier` reads the same proximity tiers the renderer/entity use
  (`FAR/MEDIUM/NEAR/ADJACENT`) — it does not define its own bands. Its proximity-arm
  path is intentionally **independent of anomaly rooms**: a loop can fire anywhere
  the entity wanders close, not only in the anomaly room. This deliberately widens
  beyond `LAST_SCAN_GDD.md` §8's "anomaly room = locus of wrongness" framing — the
  anomaly room stays the locus of *narrative* wrongness (hidden room, trap node),
  while proximity-armed loops are a separate, space-wide *mechanical* wrongness
  lever. Not a contradiction, but noted so it isn't read as an oversight.
- `loop_arm_floor` gates the *first* loop on escalation `e` (Formula 1), independent
  of proximity — a fast non-scanner reaches it via time, a thorough one via coverage.
  Keep it ≥ 0.3 so loops never precede the trust they subvert.
- `D_max` sanity: if `D_max > T_session / 10` the dollhouse updates fewer than ~10
  times across a full session (reads as frozen). Log a warning at load; verify it is
  intentional — the range allows up to 120 s but that is rarely sane.
- **Desync ramp × loop-arm floor — interacting pair, tune jointly, not individually.**
  At default values, dramatic desync (`e≈0.9` → ~18.77s lag) only arrives in the same
  late-session window where `loop_arm_floor=0.4` has already let loops fire for a
  while — the two "quiet contradiction" beats Player Fantasy describes as escalating
  in *sequence* risk landing simultaneously instead, reading as noise rather than
  escalating dread. **Concrete falsifiable anchor**: at `e=loop_arm_floor=0.4`, the
  first loops can already arm while `desync_delay = 2.0 + 23.0×0.4³ ≈ 3.47s` — barely
  perceptible lag. If playtest shows the dramatic desync (≥10s) and the first loops
  landing within the same few minutes of each other rather than clearly staggered,
  that's the pairing failing; raise `loop_arm_floor` or lower `D0` to widen the gap.

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
  displayed scan status plus **freshness** (`KNOWN_STALE`/`KNOWN_CURRENT`), a
  room-level freshness derived as stale while any child update is pending, plus the
  player-position marker. `LOCKED` rooms render as `[?]` with no interior.
- **Must NEVER expose:** `ANOMALY` rooms (even after reveal — they stay off the
  map), entity position, or a room's *true* real-time scan state while it's inside
  its `desync_delay` window (show the stale state instead).
- **Coverage framing:** Floor Plan supplies raw room/node counts; the UI's coverage
  ring (§10) reads them and — per §15-H — frames higher coverage as "good." Floor
  Plan provides numbers, UI owns the (misleading) framing.
- **Access paradigm (toggle key) — GDD-level constraint, not deferred to UX spec:**
  the dollhouse panel opens/closes on a dedicated toggle keypress, not a persistent
  overlay and not a deliberate multi-step menu. The tension is **divided attention**,
  not input friction: while the panel is open, the player is not watching the room
  (mirrors the "vulnerable state" pattern `SCAN_LOCKED` uses in FPS Movement, though
  dollhouse-open does not lock movement — only attention is the cost). This sets how
  often the player witnesses desync, which sets the felt pacing of the entire
  perception-stripping lever — too load-bearing to leave fully to `design/ux/
  dollhouse.md`. Exact keybind and panel transition animation remain UX-spec scope.
  The panel is **fullscreen-blocking** — the player cannot see the room while it's
  open (a picture-in-picture or translucent overlay would defeat the divided-attention
  rationale above). Unlike `SCAN_LOCKED`, world simulation does **not** pause: entity
  proximity, loop-arm conditions, and desync queues all continue normally while the
  panel is open (AC-E16) — only the player's *view* is cut, not the world's state. This
  is the source of the real risk: a player who lingers on the dollhouse can walk into
  an armed loop door, or close the gap with the entity, without seeing it coming.
  Intentional vulnerability, consistent with the no-jump-scare horror-from-quiet-
  wrongness pillar — not an oversight.
- **Update triggers:** `floorplan:update`; `scan:complete` (enqueue a discrete
  scan-state update with delay snapshotted at event time); `player:position`
  (append a timestamped history sample); `session:tick` (advance queues and
  re-evaluate `e`/current position delay); and `scan:coverage` (authoritative
  coverage input for Formula 1).
- **Position marker (lagged):** the dollhouse player-position marker is sampled
  from Floor Plan's ring buffer at `now − desync_delay(now)` (Core Rule 6 / Formula
  2), not from the live transform. Linear interpolation between adjacent samples
  avoids frame-rate-dependent jumps. Hidden entirely while the live player is in a
  room absent from the map (anomaly).
- **Diegetic "instrument, not bug" priming (requirement):** because the map lies, the
  player must read inaccuracy as *instrument failure* (found-footage), not a software
  bug. The HUD / Found-Footage layer MUST provide a diegetic frame for stale data —
  e.g. a `SPATIAL DATA: CACHED (LAST SYNC …)` label or session-start log. Floor Plan
  *requires this framing exist*; the visual execution is owned by the dollhouse UX spec.
- **`nodesCompleted` 12/12 + `coverage` 92% dissonance** (from Scan Node) likewise
  needs a diegetic treatment (e.g. a `SPATIAL INDEX MISMATCH` log) so it reads as
  scanner corruption, not a math error. Resolve in the HUD GDD with `creative-director`.
- **Room freshness derivation:** Floor Plan owns freshness, not scan truth. Each
  node starts `KNOWN_CURRENT`; receipt of a new `scan:complete` marks that node
  `KNOWN_STALE` until its queued update matures. A room is `KNOWN_STALE` if any
  child node is stale and `KNOWN_CURRENT` otherwise. UI owns only the visual
  treatment of those values in `design/ux/dollhouse.md`.
- **Coverage ring deception must carry a non-colour channel** (fill level / label) so
  the false comfort lands for colourblind players. Owned by the dollhouse UX spec.

> **📌 UX Flag — Floor Plan System**: the dollhouse map is a UI surface. In
> Pre-Production, run `/ux-design` for the dollhouse panel before writing epics; UI
> stories should cite `design/ux/dollhouse.md`, not this GDD directly. (Note in
> systems index.)

## Acceptance Criteria

> 46 criteria (2026-06-30 round 3 added AC-C08, AC-D08, AC-L10–L12, AC-E12–E15;
> round 4 added AC-L13, AC-E16; amended same day for Scan Node System review (AC-E17 —
> exactly one ANOMALY_FINAL node enforced at load, closes a cross-GDD invariant gap
> Scan Node's coverage formula depends on); reworked AC-C03/D06/L01/E09/E07 for
> testability/clarity). Logic/Integration =
> **BLOCKING**; no ADVISORY items — Floor Plan emits data and renders no pixels.
> **Coverage contract:** the end-to-end test that `session_escalation` consumes the
> exact `coverage` Scan Node emits is **AC-SN22** (owned by Scan Node; write once #5/#6
> exist). Any story gating on `e` is blocked until AC-SN22 passes.

### Core Rules

**AC-C01 — Init separates complete node metadata from renderable geometry**
GIVEN a layout with 12 STANDARD nodes, 1 ANOMALY_FINAL, and 3 NULL nodes across
`STANDARD`, `ANOMALY`, and `LOCKED` rooms, WHEN the session initialises, THEN
exactly one `floorplan:init` contains all 16 node metadata entries with room mapping
and estimates but no hidden-room AABBs/surfaces; AND the first `floorplan:update`
contains exactly the `STANDARD` room geometry with zero `ANOMALY`/`LOCKED`
geometry. **BLOCKING**

**AC-C02 — Floor Plan emits, never mutates the player transform**
GIVEN a loop fires, WHEN Floor Plan's loop handler runs, THEN it emits
`floorplan:loop {targetPosition, targetYaw}` and the passed-in player transform
(`position` x/y/z and `rotation`/yaw) is **unchanged after the handler returns** —
equal field-by-field to the values before the call; the position changes only on FPS
Movement's subsequent tick. *(Unit-testable: snapshot `{x,y,z,yaw}` before/after the
synchronous handler.)* **BLOCKING**

**AC-C03 — Dollhouse view model excludes anomaly rooms**
GIVEN an anomaly room transitioned to `REVEALED` via its trigger, WHEN the dollhouse
view model is queried immediately after the reveal handler returns, AND again after a
subsequent unrelated `floorplan:update` and `session:tick` have been processed, THEN
both queries return **zero** entries of `type: ANOMALY` (outline, label, and nodes all
absent). **BLOCKING**

**AC-C04 — WALL_MARGIN validation at load**
GIVEN a layout with a door `width = 0.60 m` (< 0.71), WHEN validated at load, THEN
it is rejected and another pool layout is selected; the invalid layout is never
emitted. **BLOCKING**

**AC-C05 — Anomaly reveal on trigger node**
GIVEN an anomaly room with `revealTriggerNodeId = N`, WHEN `scan:complete {nodeId:
N}` arrives, THEN **synchronously within the handler** the door unseals, a
`floorplan:update` with its geometry is emitted, and `floorplan:reveal {roomId}`
fires (all three before the handler returns); the dollhouse is **not** updated.
**BLOCKING**

**AC-C06 — Actual geometry mutations emit one full-set update; loops do not**
GIVEN a reveal or other mutation that changes AABBs/surfaces, WHEN Floor Plan's
mutation handler runs, THEN it emits exactly **one** `floorplan:update` carrying
the **full current room set** (not a delta/partial), synchronously per mutation
call; GIVEN a loop crossing with no geometry change, THEN it emits
`floorplan:loop` and emits **zero** `floorplan:update` events. *(Renderer
single-frame BASE rebuild is covered by renderer AC-E04.)* **BLOCKING**

**AC-C07 — Dollhouse holds estimated positions while scan status changes**
GIVEN a room whose `estimatedNodePositions[i]` differs from the Scan Node System's
actual node position by a known delta, WHEN the dollhouse view model is queried,
THEN the marker is at `estimatedNodePositions[i]` (±0.001 m); AND a subsequent
`scan:complete` for that node changes only its queued displayed status/freshness —
before and after maturity the marker remains at the same estimate. **BLOCKING**

**AC-C08 — Room freshness is STALE while any child node is stale (multi-node)**
GIVEN a room with 2 nodes, WHEN one node's queued update matures to `KNOWN_CURRENT`
while the other remains `KNOWN_STALE`, THEN the room-level freshness reads
`KNOWN_STALE`; only once both nodes are `KNOWN_CURRENT` does the room read
`KNOWN_CURRENT`. **BLOCKING**

### Formulas

**AC-D01 — Escalation level**
GIVEN `T_session=1500`, `w_t=w_c=0.5`, WHEN `session:tick` supplies `t=375` and
the latest authoritative `scan:coverage` supplied `coverage=0.25`, THEN `e=0.25`
(±0.001). **BLOCKING**

**AC-D02 — Escalation boundaries and clamp**
GIVEN `w_t=w_c=0.5`, WHEN `t=0, coverage=0` THEN `e=0.0`; WHEN `t=T_session,
coverage=1.0` THEN `e=1.0`; WHEN `t=2×T_session, coverage=1.0` (overrun) THEN `e=1.0`
(clamp holds, not >1). **BLOCKING**

**AC-D03 — Weights are absolute, sum enforced, both-zero guarded, w_t capped**
GIVEN `w_t=0.0, w_c=0.0` configured, WHEN loaded, THEN weights fall back to 0.5/0.5
and a warning is logged; AND given any valid config, `w_t + w_c = 1` holds (out-of-sum
input is a load-time error, not silently renormalized); AND GIVEN `w_t=0.9` (exceeding
the 0.8 cap), WHEN loaded, THEN the layout is rejected at load (same path as other
weight-validation failures), guaranteeing `e` can never reach 1.0 without nonzero
coverage. **BLOCKING**

**AC-D04 — Desync delay curve (cubic), with monotonicity**
GIVEN `D0=2.0`, `D_max=25.0`, WHEN `e=0.5` THEN `desync_delay=4.88 s` (±0.01); WHEN
`e=0.9` THEN `=18.77 s` (±0.01); AND for sample pairs `(e=0.2 → 2.18)` < `(e=0.6 →
6.97)` < `(e=0.9 → 18.77)`, confirming `e1<e2 ⇒ delay(e1)<delay(e2)`. **BLOCKING**

**AC-D05 — Discrete scan-state delay is snapshotted and repeatable**
GIVEN a room is `KNOWN_CURRENT` and `scan:complete` arrives at `t0` with
`desync_delay=8 s`, WHEN queried at `t0+5 s` THEN that node and room are
`KNOWN_STALE`; WHEN queried at `t ≥ t0+8 s` (comparison is `≥`) THEN the queued
status is visible and freshness is `KNOWN_CURRENT`. GIVEN a later scan completes in
the same room, THEN it transitions `CURRENT → STALE → CURRENT` again using the delay
snapshotted for that later event. Position-marker lag is tested separately by
AC-E09. **BLOCKING**

**AC-D06 — Desync grows over the session via the full escalation pipeline**
GIVEN `T_session=1500, w_t=w_c=0.5`, WHEN `session:tick` supplies `t=375,
coverage=0.25` (computed via Formula 1 then Formula 2 in sequence), THEN the
resulting `desync_delay = 2.36 s` (±0.01); WHEN `t=1350, coverage=0.90`, THEN
`desync_delay = 18.77 s` (±0.01) — proving the `session:tick → escalation → desync`
pipeline end-to-end, distinct from AC-D04's direct Formula-2-only check. **BLOCKING**

**AC-D07 — Zero base delay updates instantly**
GIVEN `D0=0`, WHEN `e=0`, THEN `desync_delay=0` and a `scan:complete` / position
update is reflected in the same handler (no stale window, no error). **BLOCKING**

**AC-D08 — D0 < D_max enforced at load**
GIVEN `D0=10, D_max=10` (or any `D0 ≥ D_max`) configured, WHEN loaded, THEN the
layout is rejected at load and another pool layout is selected; GIVEN the default
`D0=2.0, D_max=25.0`, THEN load succeeds normally. **BLOCKING**

### Looping

**AC-L01 — Armed loop teleports on threshold crossing (proximity arm)**
GIVEN an `ARMED` loop door (proximity ≥ `loop_trigger_tier`, `e ≥ loop_arm_floor`,
`loopTarget` `REVEALED`), WHEN a `player:position` sample is outside the threshold
AABB followed immediately by a sample inside it (camera enters from the non-loop
side, matching AC-L05's phrasing), THEN `floorplan:loop` is emitted with the target
`loopSpawn`, the door enters per-door `COOLDOWN`, and zero `floorplan:update`
events are emitted for that loop. **BLOCKING**

**AC-L02 — Per-door cooldown prevents ping-pong but does not block other doors**
GIVEN door A looped at `t0`, `loop_cooldown=8 s`, WHEN door A would re-fire at `t0+3 s`
THEN none is emitted (at `t0+8 s` or later it is allowed); AND given a distinct armed
door B, crossing B at `t0+3 s` **does** emit its loop — A's cooldown does not "safe"
B. **BLOCKING**

**AC-L03 — Loop suppressed during active scan**
GIVEN an `ARMED` door and `SCAN_LOCKED`, WHEN the scan is in progress, THEN no
`floorplan:loop` fires; it fires only on the first crossing after the scan
ends/aborts. **BLOCKING**

**AC-L04 — Loop suppressed when target hidden**
GIVEN an `ARMED` door whose `loopTarget` is `HIDDEN`, WHEN the player crosses it,
THEN no loop fires and the door routes to its real neighbour. **BLOCKING**

**AC-L05 — No retroactive loop for a player already on the threshold**
GIVEN the player's **camera position** is already inside a `loopable` door's threshold
AABB, WHEN that door ARMS without the camera having exited and re-entered, THEN no
`floorplan:loop` fires; it fires only on a subsequent fresh crossing (camera enters
the AABB from the non-loop side). **BLOCKING**

**AC-L06 — Loop arms via anomaly reveal (second arm path)**
GIVEN a `loopable` door `DORMANT` with `e ≥ loop_arm_floor`, WHEN `floorplan:reveal`
for its `loopTarget` room fires, THEN the door enters `ARMED`, and a subsequent fresh
crossing emits `floorplan:loop`. **BLOCKING**

**AC-L07 — Escalation floor blocks early loops**
GIVEN a `loopable` door whose proximity/reveal condition is met but `e <
loop_arm_floor`, WHEN evaluated, THEN the door stays `DORMANT` and no loop fires; once
`e ≥ loop_arm_floor` the same condition arms it. **BLOCKING**

**AC-L08 — Proximity arm clears to DORMANT; anomaly arm persists**
GIVEN a door `ARMED` solely by `entity:proximity ≥ loop_trigger_tier`, WHEN proximity
drops below the tier before the player crosses, THEN the door returns to `DORMANT`;
GIVEN a door `ARMED` by anomaly reveal, WHEN proximity changes, THEN it stays
arm-eligible (reveal is permanent) and re-arms after each per-door cooldown while
`e ≥ loop_arm_floor`. **BLOCKING**

**AC-L09 — Reveal and loop in the same tick: reveal first**
GIVEN a `scan:complete` that triggers a reveal AND a loop crossing resolve in the same
tick, WHEN processed, THEN the `floorplan:update` (reveal geometry) is emitted
**before** the `floorplan:loop` — the player is never repositioned into geometry not
yet emitted that tick. **BLOCKING**

**AC-L10 — DORMANT→ARMED via proximity alone (isolated)**
GIVEN a `loopable` door `DORMANT` with `e ≥ loop_arm_floor` already satisfied, WHEN
`entity:proximity` crosses `loop_trigger_tier` (no subsequent crossing yet), THEN
the door transitions to `ARMED` — a direct state assertion, independent of whether
the player has crossed the threshold. **BLOCKING**

**AC-L11 — COOLDOWN→DORMANT when the condition has lapsed by cooldown end**
GIVEN a door armed solely by `entity:proximity`, WHEN it fires, enters `COOLDOWN`,
and proximity drops below `loop_trigger_tier` before `loop_cooldown` elapses, THEN
at the cooldown-elapsed re-evaluation the door transitions to `DORMANT` (condition
no longer met), not `ARMED`. **BLOCKING**

**AC-L12 — Reveal during COOLDOWN queues, does not interrupt the timer**
GIVEN a door in `COOLDOWN` (mid-timer) with `e ≥ loop_arm_floor`, WHEN
`floorplan:reveal` fires for its `loopTarget` room, THEN the door remains in
`COOLDOWN` for the remainder of `loop_cooldown` (no early arm, no timer reset);
WHEN `loop_cooldown` subsequently elapses, THEN the door transitions to `ARMED`
(the reveal's permanent condition flag is read at that re-evaluation, same as
AC-L02's cooldown-elapsed re-arm check). **BLOCKING**

**AC-L13 — COOLDOWN→ARMED when the proximity condition still holds at cooldown end**
GIVEN a door armed solely by `entity:proximity`, WHEN it fires, enters `COOLDOWN`,
and proximity remains ≥ `loop_trigger_tier` (with `e ≥ loop_arm_floor`) through
`loop_cooldown` elapsing, THEN at the cooldown-elapsed re-evaluation the door
transitions back to `ARMED` (mirrors AC-L08's anomaly-path persistence, proven here
for the proximity path). **BLOCKING**

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

**AC-E05 — SEALED freezes all mutations (incl. already-armed doors)**
GIVEN state = `SEALED` (after `session:end`), WHEN a `scan:complete` for an
un-revealed anomaly's trigger OR an `entity:proximity ≥ loop_trigger_tier` arrives, OR
the player crosses a door that was already `ARMED` before SEALED, THEN Floor Plan emits
**no** `floorplan:update`/`reveal`/`loop`; geometry and dollhouse are frozen.
**BLOCKING**

**AC-E06 — loopSpawn clamp safety net**
GIVEN a `loopable` door whose `loopSpawn.position` lies outside the target room's
navigable AABB, WHEN the loop fires, THEN the emitted `targetPosition` is clamped to
the target room interior centre at `EYE_HEIGHT` (inside the AABB by ≥ `WALL_MARGIN`).
**BLOCKING**

**AC-E07 — Chained reveals fire independently**
GIVEN anomaly room X whose reveal emits geometry containing node `N2`, where `N2` is
anomaly room Y's `revealTriggerNodeId` (a `STANDARD` node, per the Data Model —
`revealTriggerNodeId` is never `ANOMALY_FINAL`; AC-E17 still enforces exactly one
`ANOMALY_FINAL` across the whole layout), WHEN `scan:complete {nodeId: N2}` later
arrives, THEN room Y reveals independently (door unseals, `floorplan:update`,
`floorplan:reveal`). **BLOCKING**

**AC-E08 — Overlapping AABBs are kept, not deduplicated**
GIVEN two `REVEALED` rooms with intentionally overlapping AABBs, WHEN
`floorplan:update` is emitted, THEN both rooms' geometry is present in the room set;
Floor Plan does not merge, dedup, or separate them. **BLOCKING**

**AC-E09 — Position marker is lagged, not live**
GIVEN two timestamped `player:position` samples at `t1 < (now − D) < t2` and
`desync_delay(now) = D`, WHEN the dollhouse view model is queried at time `now`,
THEN the marker equals the position linearly interpolated between the `t1` and `t2`
samples at `now − D` (±0.001 m), not the live transform; at `D=0` it equals the live
position. GIVEN the session is younger than `D`, THEN the oldest retained sample is
used without error. **BLOCKING**

**AC-E10 — Position marker hidden in an unmapped room**
GIVEN the player is inside an `ANOMALY` room (revealed, never on the dollhouse), WHEN
the view model is queried, THEN it contains **no** player-position marker (absent, not
placed at a fabricated location). **BLOCKING**

**AC-E11 — Zero-STANDARD layout rejected at load**
GIVEN a `PropertyLayout` with zero `STANDARD` rooms, WHEN validated at load, THEN it is
rejected (same path as AC-C04) so `S ≥ 1` is guaranteed for coverage. **BLOCKING**

**AC-E17 — Exactly one ANOMALY_FINAL node enforced at load**
GIVEN a `PropertyLayout` with zero `ANOMALY_FINAL` nodes, OR with two or more
`ANOMALY_FINAL` nodes across all rooms, WHEN validated at load, THEN it is rejected
and another pool layout is selected (same path as AC-C04/AC-E11); a layout with
exactly one loads normally regardless of how many `ANOMALY` rooms it has (chained
reveals, AC-E07, may expose further `ANOMALY` rooms containing only `STANDARD` nodes).
**BLOCKING**

**AC-E12 — Stale room persists through session end without error**
GIVEN a `scan:complete` event with `desync_delay` long enough that `applyAt >
session:end` time, WHEN `session:end` fires (state → SEALED), THEN the pending
update never applies, the room remains `KNOWN_STALE` in the final dollhouse query,
and no error/warning is raised. **BLOCKING**

**AC-E13 — Loop does not correct the lagged position marker**
GIVEN `desync_delay > 0` and a loop fires at `t0` (real position jumps to
`loopTarget`), WHEN the dollhouse view model is queried at `t0 + ε` (before the
delay elapses), THEN the marker still renders the pre-loop interpolated trail
position (per AC-E09's formula, unaffected by the loop event), not `loopTarget`;
only once `now − desync_delay(now) ≥ t0` does the marker reflect the post-loop
room. **BLOCKING**

**AC-E14 — Non-navigable room interior rejected at load**
GIVEN a layout with a room whose AABB interior cannot satisfy `WALL_MARGIN` clamp
navigability (e.g. interior width < 2×WALL_MARGIN), WHEN validated at load, THEN
it is rejected and another pool layout is selected. **BLOCKING**

**AC-E15 — Node position outside room AABB rejected at load**
GIVEN a layout where an `estimatedNodePositions` entry lies outside its declared
room's AABB, WHEN validated at load, THEN it is rejected and another pool layout
is selected. **BLOCKING**

**AC-E16 — Dollhouse panel open does not pause world simulation**
GIVEN the dollhouse panel is open, WHEN `entity:proximity` crosses
`loop_trigger_tier`, or `session:tick`/`player:position`/`scan:complete` events
arrive, THEN Floor Plan processes them identically to panel-closed — loop doors
arm/fire per Core Rule 7, desync queues advance per Core Rule 6. Panel state has
no effect on any Core Rule. **BLOCKING**

## Open Questions

1. **Loop teleport comfort / motion sickness** — threshold teleport is
   instantaneous; repeated loops may disorient or nauseate. Needs playtest to
   validate `loop_cooldown` (8 s) and loop frequency feel comfortable, and whether a
   masking playback hitch (Found-Footage §16-F3) is *required* vs. optional.
   *Owner: playtester. Resolve during vertical slice.*
2. **Escalation inputs (`e`)** — *Partially resolved:* `coverage = V/S` is now defined
   by the Scan Node GDD (registry: `coverage`; S = count(STANDARD)+1 anomaly node).
   Still open: does `t` pause during scans/menus? Depends on Orchestrator. *Owner:
   lead-programmer. Resolve when the Orchestrator GDD is authored.*
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
6. **§15-C2 subtle-difference injection** — the loop's emotional payload (recognising
   the same-but-wrong room) is owned by the renderer/Entity System and is currently
   only a section reference, not an authored spec. Loop horror cannot be playtested
   until it exists. *Owner: technical-artist / Entity System. Assign a stub spec when
   Entity (#9) is designed; resolve before the loop vertical-slice.*

> **Re-review 2026-06-27 resolved (design-review, 5 agents):** desync now lags the
> **player-position marker** (not just the scan-state icon); desync curve `e²→e³`;
> `loop_cooldown` is **per-door**; added `loop_arm_floor` (escalation floor on loop
> arming); anomaly-reveal arm clear path defined; weight semantics fixed to absolute;
> S=0 / both-zero / D0=0 guards added; 11 ACs added/reworked.

> **Re-review 2026-06-30 resolved (independent design-review, 4 specialists +
> creative-director synthesis):** `w_t` capped at 0.8 (closes the legal-but-degenerate
> config where time alone could reach `D_max`); `D0 < D_max` now enforced at load
> (closes the flat-curve degeneration); COOLDOWN × anomaly-reveal race resolved as
> **queue, not override** (AC-L12); added an **Interaction Matrix** (Detailed Design)
> as the structural fix for the recurring "blocker lives at a rule interaction"
> pattern across all three rounds; dollhouse access paradigm locked to **toggle key**
> at the GDD level (UI Requirements) since it sets desync witness-frequency; 9 ACs
> added (AC-C08, AC-D08, AC-L10–L12, AC-E12–E15), 4 reworked for testability
> (AC-C03/D06/L01/E09); AC count 34→43. Player Fantasy reconciled: desync-vertigo and
> anomaly-reveal framed as two distinct beats, not one compounding glitch; desync/loop
> pacing interaction flagged as a Tuning Knob note for vertical-slice playtest.

> **Re-review 2026-06-30 round 4 — Verdict: APPROVED-WITH-CONDITIONS, conditions closed
> same session.** 4 specialists independently re-derived all 3 round-3 blockers as
> genuinely closed (systems-designer re-computed `w_t` cap, `D0<D_max` boundary, and the
> COOLDOWN×reveal race from scratch). One condition: the `dollhouse-open` state was
> introduced in round 3's own revision pass but never run through the Interaction Matrix
> built that same pass to catch exactly this gap (ux-designer's process finding) — fixed
> by adding the `dollhouse-open × entity-proximity` Matrix row, a UI Requirements bullet
> (panel is fullscreen-blocking; world simulation does **not** pause while it's open —
> intentional vulnerability, not an oversight), and AC-E16. Bundled 4 cheap riders:
> AC-L13 (proximity-path COOLDOWN re-arm, mirrors AC-L08), Interaction Matrix row 7
> reworded to match AC-L03's literal scope, a concrete falsifiable number for the
> desync/loop pacing note (`desync_delay≈3.47s` at `e=loop_arm_floor`), and the Player
> Fantasy reconciliation paragraph moved inline. AC count 43→45. Carried forward (not
> blocking): infinite anomaly-door re-arm has no discoverable safe/unsafe signal —
> depends on §15-C2 (Open Q#6), flagged as a named risk for the Entity System backlog.
