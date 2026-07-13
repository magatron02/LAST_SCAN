# Entity System

> **Status**: In Design (all 8 required sections + Open Questions written; not yet independently
> reviewed — run `/design-review` in a fresh session)
> **Author**: magatron02 + agents
> **Last Updated**: 2026-07-02
> **Implements Pillar**: Perception Stripping (§8) · Horror from the familiar made wrong
> **Creative Director Review (CD-GDD-ALIGN)**: skipped — Lean mode (not a PHASE-GATE in lean).

## Overview

The Entity System owns everything about *why* and *how* the antagonist is where it is —
spawning, positioning, movement, and behavior state, for all three point-cloud-native
manifestations Point Cloud Renderer already knows how to draw. It renders nothing itself; it
decides what the entity is doing and tells the renderer through events (`entity:spawn`,
`entity:despawn`, `entity:proximity`) that Point Cloud, Floor Plan, and Scan Mechanic already
consume. The system's central authorial choice — which of Type A (void), Type B (spike), or
Type C (ghost) is active, where it is, and how close it's allowed to get — is what turns a
static point cloud into a haunted one.

To the player, the Entity System is the game's only real antagonist, and it never appears as a
creature — only as an absence of data, an impossible density, or a room that shouldn't exist
repeating itself. Its presence is read entirely through corruption of the instrument the player
already trusts: proximity distorts the point cloud, density anomalies trigger error text, and —
at the mechanical center of the horror — an active scan can capture it, turning the player's own
most vulnerable action into the thing that dooms them. This system doesn't choose whether the
ending is good or bad; it just decides, moment to moment, how close the wrongness is allowed to
get.

## Player Fantasy

Point Cloud Renderer already covers the *instrument*'s emotional arc (Analyst → Witness —
trusting the data, then recognizing it as evidence). Entity System's fantasy is what's on the
other side of that instrument: **something with intent, expressed only through three different
flavors of wrongness, and you never learn which one you're facing until it's already close.**

**Three types, three distinct dreads — never announced.** A density gap is a void with a shape
(Type A) — the horror of an absence that implies a body. An impossibly dense cluster is a spike
pretending to be furniture (Type B) — the horror of the familiar object that's secretly not one.
A ghost room bleeding through the current one is a repeat that shouldn't exist (Type C) — the
horror of déjà vu made literal and hostile. The game never tells the player which type is active
in a given room; the tells are the only clue, and the tells are deliberately ambiguous (a
density blip could be noise; a faint offset could be measurement error). The player's first read
of any anomaly is always a guess.

**The entity has an opinion about your scan.** Type C explicitly "follows scan path" — it isn't
just present, it may be *moving toward being captured*, weaponizing the player's own
thoroughness. This is the fantasy's sharpest edge: the instrument the player uses to survive (the
scan) is also the mechanism the entity can exploit, and the player never knows, in the moment,
whether finishing a scan just walked the antagonist into their own data.

**Proximity is the entity choosing to be felt, not the renderer choosing to show it.** The
tiered corruption (subtle jitter at NEAR, frozen paralysis at ADJACENT) reads as the *entity's*
escalating decision to close distance — not a passive rendering effect. The player's felt
experience across a session should be of being *approached*, not of a dial turning.

**Anchor moment:** the player, mid-scan, catching a density number that's just slightly off from
what the room should read — and realizing they can't tell, and won't be able to tell until it's
already too late to matter, whether that's Type B or nothing at all.

> *Note: `creative-director` not consulted — Lean mode. Review this framing manually before
> production.*

## Detailed Design

### Core Rules

1. **Canonical proximity tier vocabulary.** The 4-tier set `FAR / MEDIUM / NEAR / ADJACENT`
   (already load-bearing in Point Cloud Renderer and Floor Plan) is ratified as canonical,
   resolving the open cross-system item logged since 2026-06-27. The master GDD's descriptive
   "Very near" state is not a discrete tier — it describes the felt experience partway through
   ADJACENT's own quadratic jitter curve (Point Cloud Formula 3), not a separate mechanical
   state.

2. **Tier computation.** Entity System computes distance-to-player every tick and derives the
   tier: `ADJACENT` (0.0–3.0m, registered), `NEAR` (3.0–8.0m, registered), `MEDIUM` (8.0m–
   `proximity_tier_medium_max`, new knob), `FAR` (beyond `proximity_tier_medium_max`).
   `entity:proximity {tier}` is emitted **only when the tier changes** — not every frame.

3. **Single entity, mutable manifestation.** There is exactly one entity per session. Its state
   is `{ currentType: A|B|C|null, currentPosition, currentRoomId }`. Changing manifestation
   always despawns the old one before spawning the new — `entity:despawn {}` then
   `entity:spawn {type, position}` — never two types active simultaneously.

4. **Escalation input.** Entity computes `e` (session escalation) **locally**, using Floor
   Plan's own registered `session_escalation` formula and the same tuning config (`w_t`, `w_c`,
   `T_session`), from the same already-broadcast `session:tick`/`scan:coverage` inputs. Not a
   new event — the same formula computed twice from shared raw inputs, guaranteed identical
   because both consumers use the same registered definition and config.

5. **Spawn/retarget cadence and room selection.** The interval between manifestation changes
   scales inversely with `e` (more frequent as the session escalates — Formula territory,
   Section D). Room selection is weighted toward rooms near the player's current position at low
   `e`; once the anomaly room is revealed (`floorplan:reveal`), it becomes increasingly favored
   as the highest-proximity zone (master GDD §8), reaching certainty as `e→1`.

6. **Type A behavior.** Stationary once spawned. Silhouette scale grows with dwell time
   (player's continuous time within some proximity of it) — capped at a maximum scale (Formula,
   Section D).

7. **Type B behavior.** Drifts slowly via a random walk contained within
   `entity_influence_radius` (5.0m, registered — reused, not a new radius) of its spawn
   position.

8. **Type C behavior — trailing pursuit.** Type C maintains its own position-history ring buffer
   sampling `player:position` (mirrors Floor Plan's own dollhouse-desync ring buffer). It moves
   toward the player's position from `type_c_trail_delay` seconds ago (new knob), not their
   current position — it arrives where the player *was*, never where they currently are.
   Movement speed scales with `e` (Formula, Section D) and can exceed `MOVE_SPEED` at high
   escalation (matches FPS Movement's own tuning note: "intended for late-game escalation, not
   default behaviour"). Type C ignores room/door geometry ("can move through walls").

9. **Scanning aggression.** While a scan is in its **locked** window (from
   `movement:scan_triggered` to `movement:scan_released` — the vulnerable capture phase, not the
   unlocked processing/upload tail) AND the entity's current tier is `NEAR` or `ADJACENT`, its
   movement speed is multiplied by `scanning_aggression_multiplier` (new knob). Reflects the
   master GDD's "scan while entity is near → aggression" rule.

10. **Movement Violation — inherited, not resolved here.** Entity's only obligation is accurate,
    real-time `entity:proximity`. Win/Lose (#10, undesigned) is responsible for cross-referencing
    FPS Movement's actual movement against an `ADJACENT` broadcast to implement "move while
    adjacent → violation" (master GDD §9 Type 2). No new logic here.

### States and Transitions

| State | Description | Entry | Exit |
|---|---|---|---|
| `DORMANT` | No manifestation active anywhere | Session start; prior manifestation despawned | Spawn/retarget condition met (Rule 5) → one of `MANIFESTING_A/B/C` |
| `MANIFESTING_A` | Type A void active, stationary, silhouette growing | Spawn roll selects A | Retarget condition (Rule 5) → `DORMANT` (despawn), then re-roll; OR `session:end` |
| `MANIFESTING_B` | Type B spike active, drifting | Spawn roll selects B | Same as above |
| `MANIFESTING_C` | Type C ghost active, trailing pursuit | Spawn roll selects C | Same as above |

Transitions between manifestations always route through `DORMANT` — never a direct type swap in
place.

### Interactions with Other Systems

| System | Direction | Interface |
|---|---|---|
| Point Cloud Renderer | out | `entity:spawn {type, position}`, `entity:despawn {}` — activates/repositions the matching visual layer (VOID_MASK / ENTITY_SPIKE / ENTITY_GHOST) |
| Floor Plan | in | Room AABBs + door graph (via Orchestrator) for placement/pathing; `floorplan:reveal` to begin favoring the anomaly room; shares `session_escalation`'s registered formula + config for local `e` computation |
| FPS Movement | in | `player:position {x,y,z}` — distance computation (all types) and Type C's trailing-position ring buffer |
| Scan Mechanic | in | `movement:scan_triggered` / `movement:scan_released` — bounds the "scan active" window for Rule 9 |
| Scan Node | in | `scan:coverage` (via Orchestrator) — one of the two inputs to locally-computed `e` |
| Orchestrator | in + out | Receives `session:tick`, `scan:coverage`, `player:position`, `floorplan:reveal`, `movement:scan_triggered`/`released`, `session:end`. Emits `entity:spawn`, `entity:despawn`, `entity:proximity {tier}` |
| Win/Lose (#10, undesigned) | out (indirect) | `entity:proximity {tier:"ADJACENT"}` is the signal Win/Lose will cross-reference for Movement Violation — not resolved here |

## Formulas

### Formula 1 — Type A Silhouette Growth

The `type_a_silhouette_scale` formula is defined as:

`silhouette_scale = 1.0 + (SCALE_CAP − 1.0) × (dwell / (dwell + dwell_half))`

**Variables:**
| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|--------------|
| Dwell time | `dwell` | float | 0 to unbounded | Continuous seconds player has spent within `NEAR` or `ADJACENT` tier of this Type A entity, uninterrupted |
| Half-growth constant | `dwell_half` | float | >0, default 20.0s | Seconds of dwell at which growth reaches the halfway point between 1.0x and cap |
| Scale cap | `SCALE_CAP` | float | >1.0, default 1.75 | Maximum silhouette multiplier, asymptotically approached, never reached exactly |
| Output | `silhouette_scale` | float | 1.0 to `SCALE_CAP` (exclusive) | Multiplier applied to Type A's base silhouette size |

**Output Range:** 1.0 (inclusive, at dwell=0) to 1.75 (asymptotic, never fully reached — a
diminishing-returns curve, not a hard ramp).

**Example:** With `dwell_half=20.0`, `SCALE_CAP=1.75`: at dwell=20s, `silhouette_scale =
1.0 + 0.75×(20/40) = 1.375x`. At dwell=60s, `= 1.0 + 0.75×(60/80) = 1.5625x`. At dwell=180s,
`= 1.0 + 0.75×(180/200) = 1.675x` (still visibly creeping toward, but never touching, 1.75x).

**Why this shape**: a diminishing-returns curve has no hard "done growing" moment — it keeps
creeping almost imperceptibly forever, matching "the horror of an absence that implies a body"
better than a curve that visibly plateaus and sits static (a static silhouette reads as
"finished," breaking the slow-burn tell). It front-loads noticeable growth in the first
~20–40s (the tell stays legible) while very long dwell times yield only fractional additional
growth (never becomes jump-scare-scale).

**Reset behavior**: dwell **decays, does not instantly reset**, when the player leaves
`NEAR`/`ADJACENT` range — at roughly half the accrual rate (~0.5s of effective dwell lost per
second away). An instant reset would make "step back, step forward" trivially defeat the tell;
permanent retention would let one early glance haunt the whole session regardless of later
behavior. Decay keeps the silhouette reflecting a *live* relationship with recent, sustained
proximity.

---

### Formula 2 — Type C Pursuit Speed

The `type_c_speed` formula is defined as:

`type_c_speed(e) = SPEED_BASE + (SPEED_MAX − SPEED_BASE) × e³`

**Variables:**
| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|--------------|
| Escalation | `e` | float | 0.0–1.0 | Session escalation dial, locally computed from Floor Plan's registered `session_escalation` formula |
| Baseline speed | `SPEED_BASE` | float | >0, default 0.9 m/s | Type C's pursuit speed at e=0 — must read as slow/avoidable |
| Max speed | `SPEED_MAX` | float | >`SPEED_BASE`, default 2.2 m/s | Type C's pursuit speed at e=1 — must exceed `MOVE_SPEED` (1.6 m/s) |
| Output | `type_c_speed` | float | `SPEED_BASE` to `SPEED_MAX` | Type C's current movement speed toward its trailing target position (m/s) |

**Output Range:** 0.9–2.2 m/s. Sub-`MOVE_SPEED` (1.6) until the crossover point where
`0.9 + 1.3×e³ = 1.6` → `e ≈ 0.815`. Below that, the player can always outpace Type C in a
straight line even at NEAR range; above it, Type C can run the player down once it enters NEAR
(matching FPS Movement's own tuning note verbatim).

**Example:** e=0.3 (early): `0.9 + 1.3×0.027 = 0.935 m/s` — trivially outwalked. e=0.7
(mid-late): `0.9 + 1.3×0.343 = 1.346 m/s` — still under `MOVE_SPEED`, tension rising but not yet
lethal. e=0.95 (near-max): `0.9 + 1.3×0.857 = 2.014 m/s` — exceeds `MOVE_SPEED` by 26%, escape
from NEAR/ADJACENT is no longer guaranteed.

**Cubic, matching `desync_delay`'s exact precedent** (`e³`, not `e²` or linear). This is the
single formula capable of fully revoking the player's baseline escape option ("just walk away")
— it should be the *last* threshold to cross, not a gradually-creeping one. A quadratic
equivalent (matching the jitter curve's shape instead) would cross `MOVE_SPEED` at `e≈0.66`,
cutting noticeably earlier into what should be the game's safer middle stretch.

**Asymmetry flag**: unlike `desync_delay` (structurally guaranteed to never reach `D_max` from
elapsed time alone, via the registered `w_t≤0.8` cap), nothing here prevents `type_c_speed`
reaching `SPEED_MAX` from elapsed time alone if the player stalls. This is intentional — the
design goal here is specifically "removes just-walk-away late-game," not "protect a legal-config
guarantee" — but it's a deliberate asymmetry with the sibling formula, not an oversight.

---

### Formula 3 — Manifestation Retarget Interval

The `retarget_interval` formula is defined as:

`retarget_interval(e) = I_max − (I_max − I_min) × e`

**Variables:**
| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|--------------|
| Escalation | `e` | float | 0.0–1.0 | Session escalation dial (same local computation as Formula 2) |
| Max interval | `I_max` | float | >0, default 90.0s | Seconds between manifestation changes at e=0 — rare, disorienting when it happens |
| Min interval | `I_min` | float | 0 < `I_min` < `I_max`, default 20.0s | Seconds between manifestation changes at e=1 — frequent but not chaotic |
| Output | `retarget_interval` | float | `I_min` to `I_max` | Seconds until the next despawn/re-roll (Rule 5) |

**Output Range:** 20.0–90.0s, **linear** in `e` — deliberately different from Formulas 1 and 2.

**Example:** e=0.0 → 90.0s (a full settled stretch before anything changes). e=0.5 →
`90.0 − 70.0×0.5 = 55.0s`. e=1.0 → 20.0s (a manifestation change roughly every 20 seconds late
game — frequent enough to feel like the house can't hold still, not so frequent it's noise).

**Why linear, not cubic (unlike Formulas 1–2)**: `desync_delay` and `type_c_speed` are *severity*
curves — they must stay safe early and only turn dangerous late, so a delayed-onset (cubic)
shape is correct. `retarget_interval` is a *cadence* curve — it doesn't cross a danger threshold,
it paces how often the "what is it this time" uncertainty refreshes. A cubic retarget curve would
mean almost no manifestation variety for the first ~80% of the session, then a sudden flurry at
the very end — a pacing cliff, not escalating dread. Linear cadence keeps the uncertainty-refresh
rate climbing steadily throughout, and avoids stacking all three `e`-driven formulas' most
dramatic changes into the same narrow late-session window.

---

### Tuning Constants

| Knob | Default | Rationale |
|---|---|---|
| `proximity_tier_medium_max` | 12.0m | ~4m band beyond NEAR's 8.0m edge before FAR (no signal) takes over — roughly one additional room/corridor length of "detectable but not yet a concern" |
| `scanning_aggression_multiplier` | 1.6× | Stacks with an already-elevated late-game `type_c_speed` without instantly punishing a low-`e` scan; matches the "own thoroughness weaponized" fantasy beat without being an unavoidable early-game punish |
| `type_c_trail_delay` | 4.0s | At `MOVE_SPEED` (1.6 m/s), ~6.4m of lag — continuous movement is inherently safe from Type C's tracking alone; stopping or looping lets the trailing position catch up |
| Type B drift speed | 0.3 m/s | Slow enough to preserve the "furniture pretending to be still" read; fast enough that a player who re-scans the same spot can notice it moved |

> *Note: `systems-designer` consulted (Section D high-risk spawn, per lean-mode rule).*

## Edge Cases

- **If the session starts** (`e=0`): the first manifestation occurs after
  `retarget_interval(0) = 90s` (`I_max`) — no separate "initial delay" knob is needed; the
  escalation formula already produces the right cold-open pacing.

- **If the anomaly room is revealed while the entity is already manifesting elsewhere**: the
  current manifestation is not interrupted. The reveal only updates the *weighting* for the
  next scheduled retarget roll (Rule 5) — no forced immediate retarget.

- **If Type C's position-history ring buffer holds less than `type_c_trail_delay` seconds of
  data** (just after spawning): Type C targets the oldest available sample instead, mirroring
  Floor Plan's own ring-buffer edge case ("if the session is younger than the requested delay,
  use the oldest sample").

- **If a manifestation despawns while the entity is at `ADJACENT`** (mid-dread-moment): it
  vanishes instantly, no fade. Matches existing project precedent (Point Cloud Renderer:
  "abrupt cessation reads as entity withdrawing, which is the correct horror signal").

- **If distance crosses more than one tier boundary within a single tick** (e.g. Floor Plan's
  loop teleport suddenly repositions the player): only the tier *after* that tick's movement
  resolves is evaluated and emitted — no synthetic intermediate-tier events for boundaries
  passed through.

- **If a Floor Plan loop teleport happens to land the player adjacent to a stationary Type A**
  (coincidental, not entity-initiated): this is legal but sits close to the no-jump-scare
  pillar's edge. Entity System does not reach into Floor Plan's loop-target selection to prevent
  it (would violate separation of concerns) — flagged here as a coordination note for whoever
  tunes Floor Plan's loop targets, not resolved by this GDD.

- **If `session:tick` or `scan:coverage` haven't broadcast yet when `e` is needed** (very early
  session): `e` defaults to `0`. Consistent with the natural 90s cold-open — nothing depends on
  `e` being available before the first tick lands anyway.

- **If the entity despawns (goes `DORMANT`)**: `entity:proximity` immediately reports `FAR` as
  part of the despawn transition — there is no "proximity to nothing." A subscriber that only
  reads the cached latest-value always gets a coherent answer.

- **If `session:end` arrives while a manifestation is active**: no further retargets,
  dwell-decay, or drift updates occur. The last-emitted `entity:proximity` value stands frozen
  (Orchestrator's latest-value caching already covers late subscribers; no new logic needed
  here).

- **If no room besides the player's starting room is yet revealed** (extreme early session): the
  starting room is always a valid spawn-selection candidate — spawn selection is never left with
  zero eligible rooms.

## Dependencies

**Upstream — what Entity System consumes:**

| System | Dependency type | Interface |
|---|---|---|
| Orchestrator | Event bus (hard) | Receives: `session:tick`, `scan:coverage`, `player:position`, `floorplan:reveal`, `movement:scan_triggered`/`released`, `session:end`. Emits: see Downstream |
| FPS Movement | Hard (data consumer) | `player:position {x,y,z}` — required for all distance/tier computation and Type C's trailing-position ring buffer |
| Floor Plan | Hard (data consumer) | Room AABBs + door graph (via Orchestrator) for spawn placement; `floorplan:reveal` for anomaly-room weighting; shares the registered `session_escalation` formula + tuning config for local `e` computation |
| Scan Node | Hard (data consumer) | `scan:coverage` (via Orchestrator) — one of the two inputs to locally-computed `e` |
| Scan Mechanic | Soft (event consumer) | `movement:scan_triggered`/`movement:scan_released` bound the "scan active" window for Rule 9's aggression multiplier. Without it, Entity still functions — the multiplier simply never applies. |

Entity System has no hard dependency on Point Cloud Renderer — it only *emits* to it (see
Downstream). It does not call any system directly; all flow is via the Orchestrator bus.

**Downstream — systems that depend on Entity System:**

| System | What they need | Interface |
|---|---|---|
| Point Cloud Renderer | Which visual layer to activate/move | `entity:spawn {type, position}`, `entity:despawn {}` *(Renderer GDD already records this ✅)* |
| Floor Plan | Loop-arming condition | `entity:proximity {tier}` at `loop_trigger_tier` (default NEAR) *(Floor Plan GDD already records this ✅)* |
| Scan Mechanic | `entityInFrame` proxy | `entity:proximity {tier}` sampled at each capture beat *(Scan Mechanic GDD already records this ✅ — Open Q#2 notes the proxy's precision trade-off is this GDD's to own)* |
| Win/Lose (#10, undesigned) | Movement Violation trigger | `entity:proximity {tier:"ADJACENT"}` cross-referenced against player movement. ⚠️ *Provisional — Win/Lose undesigned.* |
| Audio System (#6, undesigned) | Proximity-driven audio layering | `entity:proximity {tier}` for interference/drone/silence cues (master GDD §13). ⚠️ *Provisional — Audio undesigned.* |
| UI/HUD (#12, undesigned) | Proximity sensor bar | `entity:proximity {tier}` (master GDD §11). ⚠️ *Provisional — UI/HUD undesigned.* |

**Bidirectional actions:** none required this session — all three currently-designed downstream
consumers (Point Cloud Renderer, Floor Plan, Scan Mechanic) already recorded their `entity:*`
expectations in their own GDDs before this one existed; nothing needs amending.

## Tuning Knobs

| Knob | Default | Safe Range | Too High | Too Low |
|---|---|---|---|---|
| `proximity_tier_medium_max` | 12.0m | 9.0–20.0m | MEDIUM spans too much of the property; entity feels omnipresent | MEDIUM barely exists; jumps straight from FAR to NEAR, losing the graduated warning |
| `dwell_half` (Type A growth) | 20.0s | 10–40s | Silhouette barely grows within a typical single encounter; tell feels inert | Growth saturates almost instantly; loses the slow-burn read |
| `SCALE_CAP` (Type A max) | 1.75 | 1.3–2.5 | Silhouette eventually reads as absurdly oversized, breaks believability | Growth is barely perceptible even at long dwell; tell too subtle |
| `SPEED_BASE` (Type C, e=0) | 0.9 m/s | 0.5–1.3 m/s | Threatening even at session start, undercuts "avoidable early" design intent | Type C reads as harmless even up close early game |
| `SPEED_MAX` (Type C, e=1) | 2.2 m/s | 1.7–3.0 m/s | Escape becomes near-impossible once in NEAR range late-game — may feel unfair rather than tense | Fails to exceed `MOVE_SPEED`; "just walk away" never actually breaks late-game |
| `I_max` (retarget, e=0) | 90.0s | 60–150s | Long stretches with no manifestation change; early game may feel static | Manifestation changes too often even at e=0; undercuts "settled dread" cold-open |
| `I_min` (retarget, e=1) | 20.0s | 10–40s | Constant manifestation churn late-game reads as chaotic noise, not dread | Manifestation barely changes even at max escalation; late-game feels the same as mid-game |
| `scanning_aggression_multiplier` | 1.6× | 1.2–2.5× | Stacks with high-`e` `type_c_speed` into a near-unavoidable punish for scanning near the entity at all | Scanning near the entity carries negligible extra risk; undercuts the "own thoroughness weaponized" beat |
| `type_c_trail_delay` | 4.0s | 2–8s | Type C tracks too close to the player's real-time position; "just walk away" stops working even early, before `e` intends it to | Lag is so long Type C rarely closes distance even when it should |
| `type_b_drift_speed` | 0.3 m/s | 0.1–0.6 m/s | Visibly moving; breaks the "furniture pretending to be still" read | Drift is undetectable even across a full session; the tell never pays off |

**Interaction notes:**
- `SPEED_BASE` must stay below `MOVE_SPEED` (1.6 m/s) and `SPEED_MAX` must stay above it — this
  is the whole point of Formula 2's crossover design. Tuning either past that boundary defeats
  the "avoidable early, inescapable late" intent.
- `proximity_tier_medium_max` must stay above `NEAR`'s registered `d_max` (8.0m) or tier
  ordering breaks (MEDIUM would invert with NEAR).
- `scanning_aggression_multiplier` stacks *multiplicatively* with `type_c_speed(e)` — at high
  `e`, a scanning player facing Type C could see combined speeds well past `SPEED_MAX` alone.
  Tune the multiplier down if late-game scanning near the entity proves unavoidable rather than
  merely risky.
- `dwell_half` and `I_min` interact: if `I_min` (minimum retarget interval) is shorter than the
  time needed for Type A's silhouette to meaningfully grow (`dwell_half`), late-game
  manifestations may retarget away before the growth tell ever pays off. Keep `I_min`
  comfortably above `dwell_half` if Type A's slow-burn read matters at high escalation.

## Visual/Audio Requirements

This system directs no rendering of its own — every visual output routes through Point Cloud
Renderer's existing layers (`VOID_MASK`, `ENTITY_SPIKE`, `ENTITY_GHOST`). The guidance below is
feel direction for how those already-locked layers should be driven by this system's state, not
new visual mechanics.

**Type A — growth feel.** Silhouette growth (Formula 1) should read as the void *steadying into
itself*, not merely scaling up. As `silhouette_scale` climbs, the occluder's edge should firm up
almost imperceptibly alongside the size increase — a void that was slightly uncertain at its
boundary becoming more certain of its shape. The scale change carries the primary read; the edge
firming is a secondary confirmation for a player already suspicious enough to look closely.

**Type B — drift feel.** The random walk (Rule 7) should not read as continuous motion. Present
it as a pause-and-shift: the spike holds a position, then relocates in a single perceptible
step, then holds again. This matches "furniture pretending to be still" — real furniture doesn't
drift smoothly, and continuous motion would give away the tell too early. Discrete steps also
make re-scanning the same spot (the intended detection method) meaningful — the player is
comparing two held states, not tracking a moving one.

**Type C — pursuit feel.** Combine both cues rather than choosing one. The ghost geometry should
carry a directional lean bias toward its current trailing target (Rule 8), giving a constant,
low-grade sense of intent even at a glance. Layered on top, position updates should resolve in
discrete resample-steps rather than smooth interpolation, echoing Type B's steadiness-breaking-
into-motion language while remaining visually distinct through the lean. The combination reads
as "it knows where it's going" (lean) plus "it just moved" (resample-step) — reinforcing the
trailing-pursuit fantasy without adding a new render layer.

**Audio cues (new, not yet owned by an authored system — see Dependencies' Audio System entry):**

| Trigger | Cue | Direction |
|---|---|---|
| Manifestation change (Rule 5 despawn/respawn) | Static burst / brief audio dropout | Reads as an instrument failure, not a musical sting — consistent with the "corruption of the instrument" fantasy, not a jump-scare cue |
| Scanning aggression active (Rule 9) | Parametric drone intensification | Continuous, not triggered — intensity should track `scanning_aggression_multiplier`'s active state directly, giving the player a real-time audio read of the exact vulnerable window Rule 9 defines |

Both cues are diegetic-compatible extensions of the corruption language Point Cloud Renderer
already establishes visually (jitter, colour flicker) — audio corrupts the same instrument the
visuals corrupt, never a standalone sting.

📌 **Asset Spec** — Visual/Audio direction is defined. After the art bible is approved, run
`/asset-spec system:entity-system` to produce per-asset visual descriptions, dimensions, and
generation prompts from this section.

## UI Requirements

Entity System supplies the **proximity sensor view model** to UI/HUD, which renders it (master
GDD §11 sidebar proximity bar). Entity System owns the data; UI owns the pixels.

- **View model**: current `entity:proximity` tier only. **Must never expose** `currentType`
  (A/B/C), exact distance, or entity position — the fantasy depends on the player never being
  told which type they're facing (Player Fantasy: "never learn which one you're facing until
  it's already close"). A UI that leaks type information defeats the system's central design
  intent.
- **Tier-to-feedback mapping** (inherited from the master GDD's §5 table, reconciled to the
  ratified 4-tier vocabulary): `FAR` → normal operation; `MEDIUM` → `ALIGNMENT WARNING` flicker;
  `NEAR` → `SCAN INTERRUPTED — RETRY?`-style messaging; `ADJACENT` → distortion + eventual UI
  freeze. The master GDD's descriptive "Very near" (point cloud distorts, stop moving) and
  "Adjacent" (all UI freezes) are not two separate UI states — both live inside the single
  `ADJACENT` tier's own continuum (Point Cloud Renderer's existing jitter formula already ramps
  within that band). Where exactly within `ADJACENT` the UI-freeze threshold sits is UI/HUD's
  own scope to tune, not fixed here.
- **Proximity sensor bar** must show intensity only, never direction (master GDD §11: "Does not
  show direction — only intensity") — matches this GDD's own design: the player should never
  know *where* the threat is relative to them from the UI alone, only *how close*.
- **Update triggers**: `entity:proximity` (fires only on tier change, per Rule 2 — the UI's bar
  animates toward the new intensity level on each event, not continuously).

> **📌 UX Flag — Entity System**: the proximity sensor bar shares the same HUD sidebar real
> estate as Scan Node's node ledger and Scan Mechanic's scan readout (master GDD §11). In
> Pre-Production, run `/ux-design` for the HUD proximity bar before writing epics — UI stories
> should cite `design/ux/hud.md`, not this GDD directly.

## Acceptance Criteria

46 criteria: 42 BLOCKING (Logic) + 4 BLOCKING (Integration). No ADVISORY — this system has no
dedicated performance budget of its own (render/point-cloud cost is Point Cloud Renderer's and
the render loop's concern) and produces no pixels directly; its behavior is fully computable and
assertable in isolation.

**Testability requirements for the implementer:**
- All durations, thresholds, and tuning knobs (`dwell_half`, `SCALE_CAP`, `SPEED_BASE`,
  `SPEED_MAX`, `I_max`, `I_min`, `proximity_tier_medium_max`, `entity_influence_radius`,
  `type_c_trail_delay`, `scanning_aggression_multiplier`) must be injectable/mockable config
  parameters — tests advance a mockable `dt`-style clock, never a real wall-clock
  `setTimeout`/`await sleep`.
- The state machine (`DORMANT`/`MANIFESTING_A`/`MANIFESTING_B`/`MANIFESTING_C`) and every
  transition must be exercisable by feeding events through a fake event bus in Vitest — no real
  Floor Plan, Movement, Point Cloud Renderer, or Win/Lose required. `session:tick`,
  `scan:coverage`, `player:position`, `floorplan:reveal`, `movement:scan_triggered`,
  `movement:scan_released`, and `session:end` are injected directly.
- The `session_escalation` formula and its tuning config are read from the same registered
  source Floor Plan uses; tests inject a fixed/mocked config rather than depending on Floor
  Plan's own file at runtime.
- Type C's position-history ring buffer is exercisable by feeding a scripted sequence of
  `player:position` samples at known timestamps — no real player controller required.
- All distance/speed/scale/interval assertions use `toBeCloseTo(expected, 5)` (or documented
  equivalent tolerance), never strict `toBe`, given floating-point math.
- Each test isolates one entity lifecycle (spawn-to-despawn or formula evaluation) and tears
  down its own state; no test depends on another's execution order.

### Proximity Tiers (Rules 1-2)

**AC-ES01 — Tier boundaries match the canonical 4-tier vocabulary**
GIVEN distance-to-player values of exactly 0.0m, 3.0m, 8.0m, and `proximity_tier_medium_max`,
WHEN the tier is computed at each boundary, THEN the result is ADJACENT at [0.0, 3.0),
NEAR at [3.0, 8.0), MEDIUM at [8.0, `proximity_tier_medium_max`), and FAR at
`proximity_tier_medium_max` and beyond, with boundary values assigned to the tier whose range
includes them (no gap, no overlap). **BLOCKING (Logic)**

**AC-ES02 — Tier is recomputed every tick**
GIVEN an active manifestation, WHEN `session:tick` fires, THEN distance-to-player and its
derived tier are recomputed that same tick, regardless of whether the tier actually changed.
**BLOCKING (Logic)**

**AC-ES03 — entity:proximity emits only on tier change**
GIVEN the current tier is NEAR and distance-to-player fluctuates but stays within [3.0, 8.0)
across multiple ticks, WHEN each tick recomputes the tier, THEN no additional
`entity:proximity` event is emitted — only the original transition into NEAR emitted one.
**BLOCKING (Logic)**

**AC-ES04 — entity:proximity emits exactly once per actual tier change**
GIVEN the current tier is MEDIUM, WHEN distance-to-player crosses into NEAR on one tick, THEN
exactly one `entity:proximity {tier: NEAR}` event is emitted that tick, with no duplicate and no
event for intermediate ticks that didn't cross a boundary. **BLOCKING (Logic)**

### Single Entity, Mutable Manifestation (Rule 3)

**AC-ES05 — Exactly one entity per session, state shape matches spec**
GIVEN a session in progress, WHEN entity state is inspected at any point, THEN it always
conforms to `{ currentType: A|B|C|null, currentPosition, currentRoomId }` and no second,
concurrent entity instance exists. **BLOCKING (Logic)**

**AC-ES06 — Manifestation change always despawns before spawning, never simultaneous types**
GIVEN Type A is currently manifested, WHEN a retarget condition selects Type B, THEN
`entity:despawn {}` is emitted before `entity:spawn {type: B, position}`, and at no point between
those two events (nor at any other time) are two types simultaneously active.
**BLOCKING (Logic)**

### Escalation Input (Rule 4)

**AC-ES07 — Entity computes e locally using Floor Plan's formula and shared inputs**
GIVEN a fixed `session:tick` value `t`, `scan:coverage` value, and the same tuning config Floor
Plan uses, WHEN Entity System computes `e`, THEN the result equals
`clamp(w_t*(t/T_session) + w_c*coverage, 0, 1)` computed independently from the identical
inputs — proving Entity's local computation matches the registered formula rather than
depending on a `session:escalation`-style broadcast that doesn't exist in this contract.
**BLOCKING (Integration)**

**AC-ES08 — e is clamped to [0, 1]**
GIVEN input weights/coverage/tick values that would drive the raw weighted sum below 0 or above
1, WHEN `e` is computed, THEN the result is clamped to exactly 0.0 or 1.0 respectively.
**BLOCKING (Logic)**

### Spawn/Retarget Cadence and Room Selection (Rule 5)

**AC-ES09 — Retarget interval scales inversely with e, matching Formula 3**
GIVEN `e` values of 0.0, 0.5, and 1.0, WHEN `retarget_interval(e)` is computed for each, THEN the
results are `toBeCloseTo(90.0, 5)`, `toBeCloseTo(55.0, 5)`, and `toBeCloseTo(20.0, 5)`
respectively, matching the GDD's own worked examples. **BLOCKING (Logic)**

**AC-ES10 — Room selection favors rooms near the player at low e**
GIVEN `e` is low (e.g. 0.1) and `floorplan:reveal` has not fired for the anomaly room, WHEN a
retarget room-selection roll occurs across repeated trials, THEN rooms nearer the player's
current position are weighted more heavily than distant rooms in the selection distribution.
**BLOCKING (Logic)**

**AC-ES11 — Anomaly room favoring increases after floorplan:reveal, reaching certainty as e approaches 1**
GIVEN `floorplan:reveal` has fired for the anomaly room, WHEN `e` is progressively increased
toward 1.0 across repeated retarget rolls, THEN the anomaly room's selection weight
monotonically increases and approaches certainty (selection probability → 1.0) as `e → 1.0`.
**BLOCKING (Logic)**

**AC-ES12 — Retarget condition triggers a MANIFESTING state exit through DORMANT**
GIVEN an active manifestation and `retarget_interval(e)` has elapsed since the last
spawn/retarget, WHEN the interval elapses, THEN the current manifestation despawns
(`entity:despawn`) and state transitions to `DORMANT` before any new type is rolled — matches the
state table's "always route through DORMANT" rule. **BLOCKING (Logic)**

### Type A Behavior (Rule 6, Formula 1)

**AC-ES13 — Type A is stationary once spawned**
GIVEN Type A has spawned at a position, WHEN any number of ticks elapse without a
retarget/despawn, THEN `currentPosition` for the Type A entity does not change.
**BLOCKING (Logic)**

**AC-ES14 — Silhouette scale matches Formula 1 at worked-example dwell values**
GIVEN dwell times of 20s, 60s, and 180s with defaults (`dwell_half=20.0s`, `SCALE_CAP=1.75`),
WHEN `silhouette_scale` is computed for each, THEN the results are `toBeCloseTo(1.375, 5)`,
`toBeCloseTo(1.5625, 5)`, and `toBeCloseTo(1.675, 5)` respectively, matching the GDD's own
worked examples. **BLOCKING (Logic)**

**AC-ES15 — Silhouette scale is bounded to [1.0, SCALE_CAP) and asymptotic**
GIVEN dwell = 0s and dwell approaching a very large value, WHEN `silhouette_scale` is computed,
THEN the result is `toBeCloseTo(1.0, 5)` at dwell=0 and strictly increases toward but never
reaches or exceeds `SCALE_CAP` (1.75) as dwell grows arbitrarily large. **BLOCKING (Logic)**

**AC-ES16 — Dwell decays (not resets) when player leaves NEAR/ADJACENT range**
GIVEN accrued dwell time `d` and the player's tier is currently MEDIUM or FAR, WHEN 1 second of
elapsed time passes outside NEAR/ADJACENT, THEN effective dwell decreases by
`toBeCloseTo(0.5, 5)` seconds (not reset to 0, and not decremented at the full 1:1 accrual
rate). **BLOCKING (Logic)**

**AC-ES17 — Dwell only accrues while player is in NEAR/ADJACENT range of Type A**
GIVEN Type A is manifested and the player's tier relative to it is NEAR or ADJACENT, WHEN 1
second elapses, THEN accrued dwell increases by 1.0 second; conversely, no accrual occurs during
ticks where the tier is MEDIUM or FAR (only the decay of AC-ES16 applies then).
**BLOCKING (Logic)**

### Type B Behavior (Rule 7)

**AC-ES18 — Type B drifts via random walk contained within entity_influence_radius**
GIVEN Type B has spawned at position `P`, WHEN its random-walk movement runs across many ticks,
THEN its position never exceeds `entity_influence_radius` (5.0m) distance from `P`, across all
sampled ticks. **BLOCKING (Logic)**

**AC-ES19 — Type B drift speed matches the registered constant**
GIVEN Type B is drifting, WHEN its per-tick displacement is measured over a fixed `dt`, THEN the
resulting speed is `toBeCloseTo(0.3, 5)` m/s (not the general `MOVE_SPEED` or Type C's speed
formula). **BLOCKING (Logic)**

### Type C Behavior (Rule 8, Formula 2)

**AC-ES20 — Type C targets the player's position from type_c_trail_delay seconds ago**
GIVEN a scripted `player:position` history where the player was at position `P1` at time
`t - type_c_trail_delay` and at a different position `P2` at time `t`, WHEN Type C computes its
movement target at time `t`, THEN it targets `P1`, not `P2`. **BLOCKING (Logic)**

**AC-ES21 — Type C pursuit speed matches Formula 2 at worked-example e values**
GIVEN `e` values of 0.3, 0.7, and 0.95 with defaults (`SPEED_BASE=0.9`, `SPEED_MAX=2.2`), WHEN
`type_c_speed(e)` is computed for each, THEN the results are `toBeCloseTo(0.935, 5)`,
`toBeCloseTo(1.346, 5)`, and `toBeCloseTo(2.014, 5)` respectively, matching the GDD's own worked
examples. **BLOCKING (Logic)**

**AC-ES22 — Type C speed can exceed MOVE_SPEED above the e ≈ 0.815 crossover**
GIVEN `e = 0.9` (above the ≈0.815 crossover), WHEN `type_c_speed(e)` is computed, THEN the
result exceeds `MOVE_SPEED` (1.6 m/s); conversely, at `e = 0.5` (below crossover), the result is
below `MOVE_SPEED`. **BLOCKING (Logic)**

**AC-ES23 — Type C speed is bounded to [SPEED_BASE, SPEED_MAX]**
GIVEN `e = 0.0` and `e = 1.0`, WHEN `type_c_speed(e)` is computed, THEN the results are
`toBeCloseTo(0.9, 5)` and `toBeCloseTo(2.2, 5)` respectively — the formula's output never falls
outside this range for any `e` in `[0, 1]`. **BLOCKING (Logic)**

**AC-ES24 — Type C ignores room/door geometry**
GIVEN Type C's trail-delayed target position is on the opposite side of a wall or closed door
from Type C's current position, WHEN Type C moves toward that target, THEN its movement path is
a direct line unobstructed by wall/door collision checks — no geometry query gates its motion.
**BLOCKING (Logic)**

**AC-ES25 — Type C maintains its own independent position-history ring buffer**
GIVEN a sequence of `player:position` events, WHEN Type C samples its ring buffer for the
trail-delayed target, THEN the sampled history is Type C's own internally-maintained buffer
(not a shared/external buffer queried from another system), verified by confirming the buffer
persists and evicts oldest entries independently of any other system's state.
**BLOCKING (Logic)**

### Scanning Aggression (Rule 9)

**AC-ES26 — Speed multiplier applies only during the LOCKED window AND at NEAR/ADJACENT tier**
GIVEN the entity's current tier is NEAR and a scan is in its LOCKED window (between
`movement:scan_triggered` and `movement:scan_released`), WHEN movement speed is computed for
that tick, THEN it is multiplied by `scanning_aggression_multiplier` (1.6x) relative to the same
entity's un-multiplied speed. **BLOCKING (Logic)**

**AC-ES27 — Multiplier does not apply when tier is MEDIUM/FAR even during LOCKED window**
GIVEN a scan is in its LOCKED window but the entity's current tier is MEDIUM or FAR, WHEN
movement speed is computed, THEN no `scanning_aggression_multiplier` is applied — base speed
only. **BLOCKING (Logic)**

**AC-ES28 — Multiplier does not apply outside the LOCKED window even at NEAR/ADJACENT tier**
GIVEN the entity's tier is ADJACENT but no scan is currently in its LOCKED window (either no
scan has started, or `movement:scan_released` has already fired), WHEN movement speed is
computed, THEN no `scanning_aggression_multiplier` is applied. **BLOCKING (Logic)**

**AC-ES29 — Multiplier turns off correctly on tier de-escalation mid-LOCKED-window without a new proximity event**
GIVEN a scan is in its LOCKED window and the entity's tier de-escalates from NEAR to MEDIUM
(entity:proximity emits once for that transition per Rule 2), WHEN a subsequent tick's speed is
computed with the tier still MEDIUM and the scan still LOCKED, THEN the multiplier is no longer
applied — the gate re-evaluates tier state every tick (AC-ES02) rather than latching the
multiplier from the last `entity:proximity` event payload. **BLOCKING (Integration)**

**AC-ES30 — Multiplier composes correctly with Type C's trail-pursuit speed**
GIVEN Type C is manifested with `type_c_speed(e)` computed for the current `e`, and a scan is in
its LOCKED window while Type C's tier is ADJACENT, WHEN effective movement speed is computed,
THEN it equals `type_c_speed(e) * scanning_aggression_multiplier` — proving the two speed
modifiers (Formula 2's escalation scaling and Rule 9's aggression multiplier) stack
multiplicatively rather than one overriding the other. **BLOCKING (Integration)**

### Movement Violation Non-Interference (Rule 10)

**AC-ES31 — Entity takes no action beyond emitting accurate real-time entity:proximity**
GIVEN any entity state or tier, WHEN ticks advance, THEN Entity System emits only
`entity:spawn`, `entity:despawn`, and `entity:proximity` per their defined rules — no additional
event (e.g. a violation flag, a win/lose signal, or a movement-blocking call) is ever emitted by
this system. **BLOCKING (Logic)**

### States and Transitions

**AC-ES32 — DORMANT is entered at session start with no manifestation active**
GIVEN a new session begins, WHEN Entity System initializes, THEN state is `DORMANT` and
`currentType` is `null` — no `entity:spawn` has been emitted yet. **BLOCKING (Logic)**

**AC-ES33 — DORMANT transitions to the correct MANIFESTING_X state on spawn roll**
GIVEN state is `DORMANT` and the spawn/retarget condition (Rule 5) is met, WHEN the type roll
selects A, B, or C, THEN state transitions to `MANIFESTING_A`, `MANIFESTING_B`, or
`MANIFESTING_C` respectively, and the corresponding `entity:spawn {type, position}` is emitted.
**BLOCKING (Logic)**

**AC-ES34 — Every MANIFESTING_X state exits to DORMANT on retarget, never directly to another MANIFESTING_X**
GIVEN state is `MANIFESTING_A`, `MANIFESTING_B`, or `MANIFESTING_C` and the retarget condition is
met, WHEN the transition occurs, THEN state passes through `DORMANT` (with `entity:despawn`
emitted) before any subsequent `MANIFESTING_X` state is entered — there is no direct
`MANIFESTING_A` → `MANIFESTING_B`-style edge in the implementation. **BLOCKING (Logic)**

**AC-ES35 — session:end exits any MANIFESTING_X state without further retargeting**
GIVEN state is any of `MANIFESTING_A`/`MANIFESTING_B`/`MANIFESTING_C`, WHEN `session:end`
arrives, THEN the current manifestation despawns and no further spawn/retarget occurs for the
remainder of the session. **BLOCKING (Logic)**

### Integration — Composition

**AC-ES36 — Full manifestation-change event sequence fires in order with no overlap**
GIVEN Type A is active and a retarget condition fires selecting Type C, WHEN the transition
processes, THEN the emitted event order is exactly: `entity:despawn {}` → (state passes through
`DORMANT`) → `entity:spawn {type: C, position}`, with no `entity:proximity` for the outgoing
Type A emitted after its despawn, and no `entity:proximity` for Type C emitted before its
spawn — proving the despawn-then-spawn ordering end-to-end, not just the state-table edges in
isolation. **BLOCKING (Integration)**

**AC-ES37 — e is computed from a single consistent source across all formulas in the same tick**
GIVEN a single tick where `session:tick` and `scan:coverage` inputs are fixed, WHEN that tick's
`e` is used to drive both `retarget_interval(e)` (Formula 3) and, if Type C is active,
`type_c_speed(e)` (Formula 2), THEN both formulas consume the identical `e` value computed once
that tick — proving Entity System does not recompute `e` inconsistently between the two
consumers within the same tick. **BLOCKING (Integration)**

### Edge Cases

**AC-ES38 — Cold-open timing matches retarget_interval(0)**
GIVEN a new session begins (`e=0` at start), WHEN the first manifestation occurs, THEN it
happens after exactly `toBeCloseTo(90.0, 5)` seconds — no separate initial-delay knob exists;
Formula 3 alone governs the cold open. **BLOCKING (Integration)**

**AC-ES39 — Anomaly reveal mid-manifestation does not force an immediate retarget**
GIVEN an active manifestation and `floorplan:reveal` fires for the anomaly room, WHEN the reveal
is processed, THEN no `entity:despawn` occurs as a direct result — only the room-selection
*weighting* for the next naturally-scheduled retarget (Rule 5) changes. **BLOCKING (Logic)**

**AC-ES40 — Type C degrades gracefully with insufficient ring-buffer history**
GIVEN Type C has just spawned and its position-history ring buffer holds less than
`type_c_trail_delay` seconds of samples, WHEN Type C computes its trailing target, THEN it uses
the oldest available sample rather than erroring or defaulting to the player's current
position. **BLOCKING (Logic)**

**AC-ES41 — Despawn at ADJACENT is instant, no fade**
GIVEN the entity is at tier `ADJACENT` when a retarget condition fires, WHEN `entity:despawn` is
emitted, THEN it fires in the same tick with no interpolation or fade delay applied.
**BLOCKING (Logic)**

**AC-ES42 — Single-tick multi-tier-boundary crossing emits only the resolved tier**
GIVEN distance-to-player jumps from `FAR` to `ADJACENT` within a single tick (e.g. a Floor Plan
loop teleport), WHEN the tier is recomputed that tick, THEN exactly one
`entity:proximity {tier: ADJACENT}` is emitted — no synthetic `MEDIUM` or `NEAR` events fire for
boundaries passed through. **BLOCKING (Logic)**

**AC-ES43 — e defaults to 0 before session:tick/scan:coverage have broadcast**
GIVEN neither `session:tick` nor `scan:coverage` has fired yet this session, WHEN `e` is
computed, THEN the result is exactly `0.0`. **BLOCKING (Logic)**

**AC-ES44 — Despawn transition emits entity:proximity{tier: FAR}**
GIVEN the entity is at any non-FAR tier when it despawns, WHEN the despawn transition processes,
THEN `entity:proximity {tier: FAR}` is emitted as part of that same transition — there is no
"proximity to nothing" state. **BLOCKING (Logic)**

**AC-ES45 — session:end freezes all per-tick updates, not just retargeting**
GIVEN `session:end` arrives while a manifestation is active, WHEN subsequent ticks would
otherwise occur, THEN dwell decay/growth (Formula 1), Type B drift, and Type C's ring-buffer
sampling all stop advancing — the freeze is total, not limited to suppressing retarget
(AC-ES35 covers retarget specifically; this AC covers the remaining per-tick mechanisms).
**BLOCKING (Integration)**

**AC-ES46 — Degenerate room selection: only the starting room revealed still yields a valid pick**
GIVEN only the player's starting room is currently revealed, WHEN room selection runs for a
retarget, THEN the starting room is selected without error — spawn selection is never left with
zero eligible candidates. **BLOCKING (Logic)**

> **Coincidental loop-teleport-into-Type-A-adjacency**: explicitly out of scope per the Edge
> Cases text (Entity System does not reach into Floor Plan's loop-target selection) — **no AC
> written; a coordination note for Floor Plan's own tuning, not a gap in this GDD.**

> *Note: `qa-lead` consulted (lean-mode Section H high-risk spawn).*

## Coverage Validation

| Source | AC(s) |
|---|---|
| Core Rule 1 (canonical tier vocabulary) | AC-ES01 |
| Core Rule 2 (tier computation + change-only emission) | AC-ES01, ES02, ES03, ES04 |
| Core Rule 3 (single entity, despawn-before-spawn) | AC-ES05, ES06 |
| Core Rule 4 (local escalation computation) | AC-ES07, ES08 |
| Core Rule 5 (cadence + room selection) | AC-ES09, ES10, ES11, ES12 |
| Core Rule 6 (Type A stationary + silhouette growth) | AC-ES13, ES14, ES15, ES16, ES17 |
| Core Rule 7 (Type B drift) | AC-ES18, ES19 |
| Core Rule 8 (Type C trailing pursuit) | AC-ES20, ES21, ES22, ES23, ES24, ES25 |
| Core Rule 9 (scanning aggression) | AC-ES26, ES27, ES28, ES29, ES30 |
| Core Rule 10 (no extra logic beyond entity:proximity) | AC-ES31 |
| State table: all 4 states + transitions | AC-ES32, ES33, ES34, ES35 |
| Formula 1 (silhouette growth) | AC-ES14, ES15, ES16 |
| Formula 2 (Type C pursuit speed) | AC-ES21, ES22, ES23 |
| Formula 3 (retarget interval) | AC-ES09, ES38 |
| Edge Cases (all 10) | AC-ES38–ES46; loop-teleport coincidence explicitly N/A |

No Core Rule, Formula behavior, state-table transition, or Edge Case is left without a
corresponding criterion — the one exception (coincidental loop-teleport adjacency) is explicitly
out of scope in this GDD's own text, not a gap.

## Open Questions

1. **Type selection probability at each retarget is unspecified.** Core Rule 5 defines *room*
   selection weighting but not *type* (A/B/C) selection — is it uniform-random, or should it be
   escalation-weighted, matching the master GDD's own implicit ordering (`PASSIVE` → `AMBIENT` →
   `AGGRESSIVE`)? Starting sessions with only Type A/B available and unlocking Type C at higher
   `e` would match the labels' apparent difficulty progression, but this GDD currently leaves it
   open. *Owner: game-designer. Resolve before Vertical Slice — this materially affects
   difficulty pacing.*

2. **entityInFrame precision is implicitly ratified, not re-opened.** Scan Mechanic's Open Q#2
   asked this GDD to confirm or revise its proximity-tier proxy for `entityInFrame`. Core Rule 2
   confirms `entity:proximity` never broadcasts raw position or frustum data — only tier — and UI
   Requirements explicitly forbids leaking position elsewhere too. This makes the tier-proxy the
   *only* option available under this GDD's contract; upgrading to a precise position+frustum
   check would require a new event this GDD does not currently define. *Owner: whoever revisits
   Scan Mechanic's Open Q#2, informed by this constraint. Not blocking either GDD's approval.*

3. **Room-selection weighting is qualitative, not a formula.** Core Rule 5 / AC-ES10-11 specify
   *monotonic* behavior (nearer rooms favored at low `e`; anomaly room favored increasingly,
   reaching certainty at `e→1`) but not an exact weighting function. Testable as written; a
   precise formula can be added later without changing this GDD's contract. *Owner:
   systems-designer. Resolve during Vertical Slice tuning, not blocking.*

4. **Type B "mimics shape of nearby objects" (master GDD §6) is an art-direction concern, not
   resolved here.** This GDD specifies Type B's *positioning* behavior (drift, containment
   radius) but the visual claim that it resembles specific room objects is Point Cloud
   Renderer/art direction's to execute, not a mechanical rule. *Owner: art-director /
   technical-artist, at asset-spec time.*

5. **All numeric defaults are systems-designer estimates, unplaytested.** `dwell_half`,
   `SCALE_CAP`, `SPEED_BASE`/`SPEED_MAX`, `I_max`/`I_min`, `type_c_trail_delay`,
   `scanning_aggression_multiplier` — every curve and constant in this GDD is a reasoned first
   pass, not a validated one. *Owner: game-designer / systems-designer. Validate during Vertical
   Slice playtesting per the systems-index's own "prototype each entity type early" flag.*

6. **Second simultaneous manifestation as a late-game escalation lever is out of scope for
   MVP.** The "one entity, mutable type" decision was chosen over "three simultaneous hazard
   pools" for simplicity. A future expansion (Alpha/Full Vision tier) could introduce a second
   concurrent manifestation at very high `e` as an additional escalation lever — not designed
   here, would be a GDD amendment if adopted. *Owner: producer / game-designer. Scope decision,
   not before Alpha.*

7. **Coincidental loop-teleport-into-adjacency (restated from Edge Cases)** — a Floor Plan loop
   teleport could legally land the player adjacent to a stationary Type A, sitting close to the
   no-jump-scare pillar's edge. Not resolved by this GDD (would require reaching into Floor
   Plan's loop-target selection). *Owner: whoever tunes Floor Plan's loop targets. Worth a
   playtest check, not a blocking fix.*
