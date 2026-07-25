# Entity System

> **Status**: In Design (round-3 fresh-context `/design-review` 2026-07-25 → NEEDS REVISION;
> 4 blockers + 7 recommended, full-mode with creative-director synthesis — all 4 blockers +
> 6 recommended fixes addressed same session — **pending a third fresh-context re-review**.
> See `design/gdd/reviews/entity-system-review-log.md`)
> **Author**: magatron02 + agents
> **Last Updated**: 2026-07-25
> **Implements Pillar**: Perception Stripping (§8) · Horror from the familiar made wrong
> **Creative Director Review (CD-GDD-ALIGN)**: senior synthesis completed as part of round-3
> full-mode `/design-review` 2026-07-25 (verdict: NEEDS REVISION — **zero structural findings this
> round**; every blocker was a config guard, a wording fix, or one missing formula. Blocker
> character is narrowing across rounds: round-1 structural, round-2 structural, round-3 none.)
>
> ⚠️ **Standing caution for the next reviewer.** This is the third consecutive round where the
> session that *found* the issues also *fixed* them. Two specific things have now slipped a manual
> pass twice each: the **Coverage Validation table's completeness claim** (overclaimed in rounds 2
> and 3) and the **"declared invariant with no load guard" class** (round-1 `dwell_half`, round-2
> `proximity_tier_medium_max`, round-3 `I_min`/`I_max` + `SPEED_MAX`/`SPEED_BASE`). Verify both
> classes explicitly rather than trusting the document's own claims about them.

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

**Proximity is the entity expressing intent, not the renderer choosing to show it — expressed
differently per type.** The tiered corruption (subtle jitter at NEAR, frozen paralysis at
ADJACENT) reads as the entity's escalating decision to close distance. That decision is *literal*
for **Type C** (it actively pursues the player's lagged trail) and *responsive* for **Type A**
(its silhouette grows the longer the player dwells near it — the void reacting to being watched,
a live relationship with recent proximity, not a passive dial). **Type B** expresses intent
through betrayal rather than approach: it is the furniture that quietly moved to a new spot while
the player wasn't re-scanning. The player's felt experience across a session should be of being
*reacted to* — approached, watched, or deceived depending on which wrongness is present — never
of a passive dial turning.

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
   scales inversely with `e` (more frequent as the session escalates — Formula 3). Room selection
   is weighted toward rooms near the player's current position at low `e`; once the anomaly room
   is revealed (`floorplan:reveal`), it becomes increasingly favored as the highest-proximity zone
   (master GDD §8), reaching certainty as `e→1`. **The exact weighting is Formula 4** (round-3
   re-review: this was previously qualitative prose only, which forced the implementer to invent
   the function and let a degenerate step-function pass AC-ES10/ES11 as they were then written).
   Room weighting is re-evaluated at every retarget against the player's position *at that moment*
   — including when `floorplan:reveal` arrived mid-manifestation (AC-ES39, AC-ES60). **Type
   selection**
   at each spawn is drawn from the injectable seeded RNG (see Acceptance Criteria → testability)
   using a **placeholder uniform 1/3 distribution** over {A, B, C} — a documented Vertical-Slice
   tuning target (Open Q#1), not a final balance decision, but concrete enough that the roll is
   implementable and testable now (AC-ES33b). Room and type are rolled independently — but from
   the same shared seeded RNG, so the draw order must be fixed for the sequence to be reproducible:
   **type is rolled first, then room**, every retarget (arbitrary choice, fixed so two correct
   implementations given the same seed can't diverge — AC-ES52).

6. **Type A behavior.** Stationary once spawned. Silhouette scale grows with dwell time
   (player's continuous time within some proximity of it) — capped at a maximum scale (Formula,
   Section D). The current `silhouette_scale` (Formula 1) is broadcast to Point Cloud Renderer as
   `entity:transform {scale}` (see Interactions) while Type A is active — emitted whenever the
   scale changes by a perceptible delta, not every frame. This is the channel that drives the
   growing-void tell in the renderer's VOID_MASK occluder.

7. **Type B behavior — discrete pause-and-shift.** Type B does **not** drift continuously. It
   holds a fixed position for `type_b_step_interval` (new knob), then relocates in a single step
   of **exactly** `type_b_step_distance` (new knob) to a new point, then holds again — all steps
   contained within `entity_influence_radius` (5.0m, registered — reused, not a new radius) of
   its spawn position. **Only the step *direction* is random; the magnitude is fixed** — the draw
   is uniform-on-a-circle, never uniform-in-a-disk (round-3 re-review: the earlier wording "up to
   `type_b_step_distance`" admitted a variable-magnitude reading that contradicts AC-ES19 and
   would let some steps land near-zero, firing the re-scan tell inconsistently). Step direction is
   drawn from the injectable seeded RNG; a step that would
   land outside the radius is **re-rolled**, never clamped to the boundary (clamping would
   cluster Type B against the radius edge). This discrete hold-then-step motion is the *mechanic*,
   not merely its presentation: it is what makes re-scanning the same spot a detection tell (the
   player compares two held states — see Visual/Audio Requirements).

8. **Type C behavior — trailing pursuit.** Type C maintains its own position-history ring buffer
   sampling `player:position` (mirrors Floor Plan's own dollhouse-desync ring buffer). Its
   **retention window is not a separate fixed size** — it always retains exactly
   `type_c_trail_delay` seconds of samples (plus one tick of slack for capped-`dt` rounding),
   evicting older samples every tick; retuning `type_c_trail_delay` resizes the window
   automatically, so no separate buffer-size knob is needed (AC-ES53). It moves toward the
   player's position from `type_c_trail_delay` seconds ago (new knob), not their current
   position — it arrives where the player *was*, never where they currently are.
   **Movement model:** each tick Type C re-aims at the *current* trail-delayed sample and takes
   one step toward it at `type_c_speed` (continuous homing on a sliding target — **not** a
   commit-to-waypoint-then-travel model). If that step would advance Type C past its target
   (step distance ≥ remaining distance), Type C's position is clamped exactly to the target for
   that tick rather than overshooting (AC-ES54) — this only matters when the player holds still
   longer than `type_c_trail_delay` (e.g. mid-scan), and prevents visible oscillation around the
   target at exactly that moment. Because the target itself advances each tick as the buffer
   fills, the path curves to follow the player's lagged trail. The discrete resample-step
   *look* described in Visual/Audio Requirements is a presentation choice layered over this
   per-tick homing, not a change to it. Movement speed scales with `e` (Formula, Section D) and
   can exceed `MOVE_SPEED` at high escalation (matches FPS Movement's own tuning note: "intended
   for late-game escalation, not default behaviour"). Type C ignores room/door geometry ("can
   move through walls").

9. **Scanning aggression (Type C only).** While a scan is in its **locked** window (from
   `movement:scan_triggered` to `movement:scan_released` — the vulnerable capture phase, not the
   unlocked processing/upload tail) AND the entity's current tier is `NEAR` or `ADJACENT`,
   **Type C's** pursuit speed (Formula 2) is multiplied by `scanning_aggression_multiplier` (new
   knob). Reflects the master GDD's "scan while entity is near → aggression" rule. This multiplier
   applies to **Type C only**: Type A is stationary (no speed to multiply) and Type B's
   hold-then-step motion is deliberately left unaffected — speeding it up mid-scan would break the
   "furniture pretending to be still" tell Rule 7 depends on.

   > **Accepted asymmetry — creative-director ruling, round-3 re-review.** This rule gives Type C
   > a *mechanical* type-identification tell that Types A and B have no equivalent of: a player
   > who has learned the pattern can infer "this is Type C" from feeling the entity close
   > unusually fast during a locked scan, without any UI ever naming the type. Two specialists
   > flagged this independently — as a leak of the identity the Player Fantasy depends on hiding
   > (`ux-designer`), and as an under-delivery of the "sharpest edge" beat for A/B-heavy sessions
   > (`game-designer`, now folded into Open Q#1).
   >
   > **The ruling is: accept and document, do not redesign.** The tell fires only at
   > `NEAR`/`ADJACENT` *and* only inside a locked scan — strictly inside the window the fantasy
   > already concedes ("you never learn which one you're facing **until it's already close**").
   > It is inference under duress: the player has an intensity-only sensor bar, no speed readout,
   > and a distorting point cloud. That is expert legibility layered over first-read ambiguity,
   > not a leak. Symmetry is also unaffordable — Type A is stationary by definition and Type B's
   > immunity is a round-1 decision that exists specifically to *protect* its own tell; giving
   > A and B equivalent scan-reactive tells would mean inventing new mechanics for both.
   >
   > Recorded here so the asymmetry reads as a design call rather than an oversight, and so a
   > future reviewer re-deriving it finds the answer instead of re-opening it.

10. **Movement Violation — inherited, not resolved here.** Entity's only obligation for Movement
    Violation is accurate, real-time `entity:proximity`. Win/Lose (#10, Designed) is responsible
    for cross-referencing FPS Movement's actual movement against an `ADJACENT` broadcast to
    implement "move while adjacent → violation" (master GDD §9 Type 2) — and its GDD already
    consumes `entity:proximity {tier:"ADJACENT"}` exactly this way. No new logic here.

11. **Position broadcast (Type B and Type C only) — round-2 revision, closes a gap found in
    fresh-context re-review.** `entity:spawn {position}` only carries the *starting* position —
    it never fires again for a manifestation that stays alive. That's sufficient for Type A
    (stationary, AC-ES13), but Type B relocates every `type_b_step_interval` (Rule 7) and Type C
    pursues continuously across the property (Rule 8); without a live position channel, Point
    Cloud Renderer has no way to know where to draw `ENTITY_SPIKE`/`ENTITY_GHOST` after the spawn
    frame. Entity System emits `entity:position {position}`, latest-value kind — same broadcast
    pattern as `player:position` — every tick while Type B or Type C is the active manifestation.
    Not emitted for Type A (stationary — `entity:spawn`'s position is already sufficient) or while
    `DORMANT`.

### States and Transitions

| State | Description | Entry | Exit |
|---|---|---|---|
| `DORMANT` | No manifestation active anywhere | Session start; prior manifestation despawned | Spawn/retarget condition met (Rule 5) → one of `MANIFESTING_A/B/C` |
| `MANIFESTING_A` | Type A void active, stationary, silhouette growing | Spawn roll selects A | Retarget condition (Rule 5) → `DORMANT` (despawn), then re-roll; OR `session:end` |
| `MANIFESTING_B` | Type B spike active, discrete hold-then-step (Rule 7) | Spawn roll selects B | Same as above |
| `MANIFESTING_C` | Type C ghost active, trailing pursuit | Spawn roll selects C | Same as above |

Transitions between manifestations always route through `DORMANT` — never a direct type swap in
place.

### Interactions with Other Systems

| System | Direction | Interface |
|---|---|---|
| Point Cloud Renderer | out | `entity:spawn {type, position}`, `entity:despawn {}` — activates/repositions the matching visual layer (VOID_MASK / ENTITY_SPIKE / ENTITY_GHOST) |
| Point Cloud Renderer | out | `entity:transform {scale}` — continuous while Type A is active; carries Formula 1's `silhouette_scale` so the renderer re-scales the VOID_MASK occluder in place (the growing-void tell). Throttled to perceptible deltas (`entity_transform_min_delta`, new knob). Renderer records this inbound (Point Cloud Renderer Interactions ✅); ratified here (was its provisional Open Cross-System Item) |
| Point Cloud Renderer | out | `entity:position {position}` — latest-value, every tick while Type B or Type C is active; keeps `ENTITY_SPIKE`/`ENTITY_GHOST` positioned correctly after the initial spawn frame (Rule 11, NEW this revision) |
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
| Dwell time | `dwell` | float | 0 to unbounded | Accumulated seconds the player has spent within `NEAR` or `ADJACENT` tier of this Type A entity. **Accrues at 1:1 while in range and decays at ~0.5:1 while out of range — it is NOT reset on leaving range.** See Reset behavior below; "accumulated" here never means "uninterrupted," and an implementation that hard-resets `dwell` on tier exit is incorrect (round-3 re-review: the earlier wording "uninterrupted" contradicted the decay rule two subsections down) |
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
proximity — this is what keeps Formula 1 from being a context-free timer even though it's
deterministic *given* dwell: dwell itself is a running record of the player's own choice to
linger or leave, not a clock that advances regardless of their behavior.

**Dwell floor (correctness-critical)**: `dwell` is clamped to a minimum of `0.0` — decay never
drives it negative. Without this floor, sustained time away pushes `dwell` below zero and, at
`dwell = −dwell_half`, makes the denominator (`dwell + dwell_half`) exactly zero → division by
zero (NaN / ±∞). That singularity is reachable within a single manifestation under default tuning
(≈1s at NEAR, then ~89s away before the `I_max`-paced retarget → `dwell ≈ −43.5` absent the
floor, sign-flipping wildly on either side of −20). Floored at 0, `silhouette_scale` provably
stays within its documented `[1.0, SCALE_CAP)` range for every input (AC-ES15, AC-ES16) — **but
only if `dwell_half > 0`**, which the variable table requires but nothing previously enforced.
The dwell floor alone doesn't stop `dwell_half = 0` from making the denominator zero at
`dwell = 0` — the exact moment Type A spawns with the player already NEAR/ADJACENT. Same pattern
as `proximity_tier_medium_max` below: **`dwell_half ≤ 0` is rejected at config load** (AC-ES49).

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

### Formula 4 — Room-Selection Weighting

**NEW this revision (round-3 re-review).** Core Rule 5's room selection was previously specified
only qualitatively ("favors nearer rooms", "anomaly room increasingly favored"). That forced the
implementer to invent the actual function, and admitted degenerate implementations — a hard step
function, or "2× weight to the single nearest room, uniform among the rest" — that satisfied the
old AC-ES10/ES11 literally while contradicting the prose. This formula closes that.

Selection is a two-stage draw: an inverse-power distance weighting, then an anomaly-room lerp
toward certainty.

**Stage 1 — distance weighting (all eligible rooms):**

`w_i = (d_i + ε)^(−k)` , and `P_base,i = w_i / Σ_j w_j`

**Stage 2 — anomaly lerp (only once `floorplan:reveal` has fired for the anomaly room):**

`P_anomaly = P_base,anomaly + (1 − P_base,anomaly) × e`
`P_i = P_base,i × (1 − e)` for every other room `i`

Before `floorplan:reveal`, Stage 2 is skipped entirely and `P_i = P_base,i`.

**Variables:**
| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|--------------|
| Room distance | `d_i` | float | 0 to unbounded | Distance from the player's current position to room `i`'s AABB **center** (not nearest face — center keeps large and small rooms comparable) |
| Distance softening | `ε` | float | >0, default 0.5m | Prevents a division-by-zero singularity when the player stands exactly at a room center (`d_i = 0`) and stops the room the player is standing in from taking essentially all the weight |
| Falloff exponent | `k` | float | >0, default 1.5 | How sharply locality falls off. Higher = entity spawns closer to the player more reliably |
| Escalation | `e` | float | 0.0–1.0 | Session escalation dial (same local computation as Formulas 2–3) |
| Output | `P_i` | float | 0.0–1.0, `Σ P_i = 1` | Probability room `i` is selected at this retarget |

**Output Range:** A valid probability distribution for any room count ≥ 1 (Edge Cases already
guarantee at least the starting room is eligible). `P_anomaly` is strictly increasing in `e` and
equals exactly `1.0` at `e = 1.0` — "reaching certainty as `e→1`" is now a property of the math,
not a prose aspiration.

**Example** (the exact configuration AC-ES10 tests — 3 rooms at 2m / 8m / 15m, defaults
`k=1.5`, `ε=0.5`, anomaly not yet revealed):
`w = (2.5)^−1.5, (8.5)^−1.5, (15.5)^−1.5 = 0.25299, 0.04035, 0.01639`; `Σw = 0.31073`
→ `P = 0.814, 0.130, 0.053`. The nearest room clears AC-ES10's `1/3 + 0.15 = 0.4833` threshold
comfortably and exceeds the farthest room by ~15×.

**Anomaly example** (anomaly room revealed, sitting at `P_base = 0.13`): at `e=0.5` →
`0.13 + 0.87×0.5 = 0.565`; at `e=0.8` → `0.826`; at `e=0.99` → `0.9987`. Monotonic, and clears
AC-ES11's `>0.98 at e=0.99` bar.

**Why inverse-power, not softmax or a step:** an inverse-power law has no characteristic distance
scale — it degrades smoothly whether the property's rooms are 3m or 30m apart, so `k` doesn't need
re-tuning per floor plan (a softmax's temperature `τ` would). A step function was the specific
degenerate case the old ACs admitted; anything with a hard threshold reintroduces the pacing cliff
Formula 3's "why linear" note already argues against.

---

### Tuning Constants

| Knob | Default | Rationale |
|---|---|---|
| `proximity_tier_medium_max` | 12.0m | ~4m band beyond NEAR's 8.0m edge before FAR (no signal) takes over — roughly one additional room/corridor length of "detectable but not yet a concern" |
| `scanning_aggression_multiplier` | 1.6× | Stacks with an already-elevated late-game `type_c_speed` without instantly punishing a low-`e` scan; matches the "own thoroughness weaponized" fantasy beat without being an unavoidable early-game punish |
| `type_c_trail_delay` | 4.0s | At `MOVE_SPEED` (1.6 m/s), ~6.4m of lag — continuous movement is inherently safe from Type C's tracking alone; stopping or looping lets the trailing position catch up |
| `type_b_step_distance` | 0.30m | Max displacement of a single hold-then-step move (Rule 7). Small enough to preserve the "furniture pretending to be still" read across one step; large enough that a player who re-scans the same spot notices it moved |
| `type_b_step_interval` | 1.0s | Hold time between Type B steps (Rule 7). With `type_b_step_distance`, yields an *average* displacement near the old 0.3 m/s intuition, but visibly discrete rather than a continuous glide |
| `entity_transform_min_delta` | 0.01 (scale units) | New this revision — the numeric "perceptible delta" threshold `entity:transform` (Rule 6) throttles against. 1% of the 0.75-unit growth range (1.0–1.75); at typical dwell rates this fires roughly once a second early on and tapers as growth flattens near `SCALE_CAP`, matching the asymptotic curve's own shape |
| `room_weight_exponent` (`k`) | 1.5 | NEW round-3 — Formula 4's locality falloff. 1.5 puts ~81% of the weight on the nearest room in the 2m/8m/15m reference case: clearly local without ever making a distant room impossible (which would defeat "you never know where it went") |
| `room_distance_epsilon` (`ε`) | 0.5m | NEW round-3 — Formula 4's singularity guard at `d_i = 0` (player standing at a room's AABB center). Also stops the current room from taking near-total weight. Rarely tuned; exists mainly so the `d_i = 0` case is defined rather than divergent |

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

- **If `session:end` and an elapsed `retarget_interval` land on the SAME tick** (NEW round-3 —
  previously unspecified): **`session:end` wins and is processed first.** The manifestation
  despawns exactly once; the pending retarget is discarded without rolling. No type roll, no room
  roll, and therefore **no RNG draws are consumed** by the discarded retarget. Left unordered,
  the two legal processing orders diverge observably — retarget-first produces a
  `despawn → re-roll → spawn → forced-despawn` burst inside one tick, emitting an extra
  `entity:spawn`/`entity:despawn` pair to every downstream subscriber and consuming two RNG draws,
  which desynchronises the seeded sequence for the rest of the session versus an implementation
  that ordered it the other way. Two correct-looking implementations would produce different
  event streams and different RNG sequences from the same seed — exactly the class of divergence
  AC-ES52's fixed draw order exists to prevent. (AC-ES58.)

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
| Point Cloud Renderer | Which visual layer to activate/move + Type A growth + Type B/C live position | `entity:spawn {type, position}`, `entity:despawn {}`, `entity:transform {scale}` (Type A silhouette growth), **`entity:position {position}`** (Type B/C live position, NEW this revision) *(Renderer GDD records the first three ✅ — `entity:transform` was its provisional Open Cross-System Item, ratified in round-1; `entity:position` closes the round-2 gap and is provisional pending Renderer's own confirmation)* |
| Floor Plan | Loop-arming condition | `entity:proximity {tier}` at `loop_trigger_tier` (default NEAR) *(Floor Plan GDD already records this ✅)* |
| Scan Mechanic | `entityInFrame` proxy | `entity:proximity {tier}` sampled at each capture beat *(Scan Mechanic GDD already records this ✅ — Open Q#2 notes the proxy's precision trade-off is this GDD's to own)* |
| Win/Lose (#10, Designed) | Movement Violation trigger | `entity:proximity {tier:"ADJACENT"}` cross-referenced against player movement *(Win/Lose GDD already consumes this exactly as designed ✅)* |
| Audio System (#6, undesigned) | Proximity-driven audio layering | `entity:proximity {tier}` for interference/drone/silence cues (master GDD §13). ⚠️ *Provisional — Audio undesigned.* |
| UI/HUD (#12, In Review) | Proximity sensor bar | `entity:proximity {tier}` (master GDD §11) *(UI/HUD GDD already consumes this + inherits this GDD's "never expose currentType/position" constraint ✅)* |

**Bidirectional actions:**
1. **`entity:transform {scale}` (round-1)** — added to close Point Cloud Renderer's provisional
   Open Cross-System Item. Point Cloud Renderer already records the inbound contract;
   `entities.yaml` is updated with the event (provisional — Orchestrator's formal relay
   registration is its own `/design-system` Phase 5 step).
2. **`entity:position {position}` (round-2, NEW this revision)** — closes a gap found in
   fresh-context re-review: Type B/C had no channel to broadcast their live (post-spawn) position,
   so Point Cloud Renderer could not actually render them outside the spawn frame. Registered in
   `entities.yaml` as provisional, same pattern as `entity:transform` — Point Cloud Renderer's own
   GDD needs a pass to formally record the inbound contract (flagged here, not resolved by this
   GDD).
3. All other downstream consumers (Floor Plan, Scan Mechanic, Win/Lose, UI/HUD) already recorded
   their `entity:proximity` expectations in their own GDDs; nothing else needs amending.

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
| `type_b_step_distance` | 0.30m | 0.1–0.6m | A single step jumps far enough to read as visible motion; breaks the "furniture pretending to be still" read | Step is undetectable even on a direct re-scan comparison; the tell never pays off |
| `type_b_step_interval` | 1.0s | 0.5–4.0s | Steps so rare Type B looks permanently frozen; re-scan comparison rarely catches a move | Steps so frequent the motion reads as continuous drift, collapsing the discrete hold-then-step tell back into a glide |
| `entity_transform_min_delta` | 0.01 | 0.005–0.05 | `entity:transform` fires so rarely the silhouette appears to jump in visible steps rather than creep | Fires almost every tick, no real throttling — spams the renderer for a change too small to see |
| `room_weight_exponent` (`k`, Formula 4) | 1.5 | 0.5–3.0 | Entity almost always spawns in the nearest room; the property stops feeling haunted as a whole and the player learns to only check adjacent space | Selection flattens toward uniform; the entity stops feeling drawn to the player and low-`e` spawns read as random noise |
| `room_distance_epsilon` (`ε`, Formula 4) | 0.5m | 0.1–2.0m | Locality washes out at short range — nearby rooms become hard to distinguish from each other | The room the player is standing in absorbs nearly all weight (as `ε→0` the `d_i=0` term diverges) |

**Interaction notes:**

> **Config-load guard policy (clarified round-3).** Three invariants in this GDD are enforced by
> rejecting the config at load: `proximity_tier_medium_max > 8.0` (AC-ES48), `dwell_half > 0`
> (AC-ES49), and — new this revision — the two *ordering* invariants below (AC-ES55, AC-ES56),
> plus Formula 4's `k > 0` and `ε > 0` (AC-ES57). The common thread is that each is a **declared
> invariant in a variable table whose violation is silent** — it produces no NaN, no crash, just
> wrong behaviour. Safe *ranges* elsewhere in this table are **advisory only** and are deliberately
> not guarded; do not read the absence of a guard on a safe range as an oversight.

- **`SPEED_MAX > SPEED_BASE` is validated at config load — a config violating it is rejected**
  (AC-ES56). NEW round-3. Formula 2's variable table has always declared this ordering, but
  nothing enforced it. Inverted, the formula does not error — `type_c_speed(e)` silently runs
  *backwards*, getting slower as the session escalates, inverting the entire "avoidable early,
  inescapable late" design. Same silent-inversion failure class as `I_min`/`I_max` below.
- `SPEED_BASE` must stay below `MOVE_SPEED` (1.6 m/s) and `SPEED_MAX` must stay above it — this
  is the whole point of Formula 2's crossover design. Tuning either past that boundary defeats
  the "avoidable early, inescapable late" intent. **This one is deliberately NOT load-guarded**
  (decision, round-3 re-review): `MOVE_SPEED` is FPS Movement's registered knob, and having
  Entity's config validation reach into another system's constant would couple the two systems'
  config loaders for an invariant that degrades gracefully (a too-slow Type C is disappointing,
  not broken). Advisory tuning note, enforced by playtest, not by load. Recorded explicitly so
  the inconsistency with the guarded invariants above reads as intentional rather than missed.
- **`0 < I_min < I_max` is validated at config load — a config violating it is rejected**
  (AC-ES55). NEW round-3. Formula 3's variable table has always declared this, but nothing
  enforced it. With `I_min > I_max`, `retarget_interval(e) = I_max − (I_max − I_min) × e`
  produces no error and no NaN — it silently **inverts Rule 5's stated intent**, making
  manifestation changes *rarer* as the session escalates. A late-game session would go quiet
  instead of churning, which is the exact opposite of the designed pacing and would be very hard
  to diagnose from behaviour alone.
- **Formula 4's `k > 0` and `ε > 0` are validated at config load** (AC-ES57). NEW round-3.
  `ε = 0` reintroduces a division-by-zero the instant the player stands at a room's AABB center
  (`d_i = 0`) — the same singularity class as Formula 1's `dwell_half`. `k ≤ 0` inverts the
  weighting so *distant* rooms are favored, contradicting Rule 5.
- `proximity_tier_medium_max` **must exceed `NEAR`'s registered `d_max` (8.0m)** or tier ordering
  breaks (MEDIUM would invert with NEAR). This is **validated at config load — a config with
  `proximity_tier_medium_max ≤ 8.0m` is rejected**, mirroring Floor Plan's load-time `D0 < D_max`
  guard. The safe-range floor (9.0m) is not the enforcement; the load guard is (AC-ES48).
- `dwell_half` **must be greater than 0** — Formula 1's dwell floor (clamping `dwell` at `0.0`)
  stops decay from driving the denominator negative, but doesn't stop `dwell_half ≤ 0` from making
  `dwell + dwell_half` zero the instant Type A spawns with the player already NEAR/ADJACENT
  (`dwell = 0` at that moment). Same pattern as `proximity_tier_medium_max` above: **validated at
  config load — a config with `dwell_half ≤ 0` is rejected** (AC-ES49).
- `scanning_aggression_multiplier` stacks *multiplicatively* with `type_c_speed(e)` — at high
  `e`, a scanning player facing Type C could see combined speeds well past `SPEED_MAX` alone.
  **At default tuning** the worst case is `SPEED_MAX × scanning_aggression_multiplier` =
  2.2 × 1.6 = **3.52 m/s** (2.2× `MOVE_SPEED`); this is the deliberate ceiling of the "own
  thoroughness weaponized" beat *at defaults*. ⚠ **This ceiling is tuning-dependent, not
  enforced** (clarified round-3): at both knobs' safe-range maxima simultaneously
  (`SPEED_MAX = 3.0` × `multiplier = 2.5`) the product reaches **7.5 m/s — 4.7× `MOVE_SPEED`**,
  more than double the figure above. The two safe ranges were each set independently and their
  product was never evaluated. Treat 3.52 m/s as the design's *intended* ceiling and check the
  combined product by hand before shipping any tuning pass that raises both knobs. No load guard
  (advisory ranges, per the guard policy above). Tune the multiplier down if late-game scanning
  near the entity proves unavoidable rather than merely risky.
- `dwell_half` and `I_min` interact: if `I_min` (minimum retarget interval) is shorter than the
  time Type A needs to grow noticeably (`dwell_half`), late-game manifestations may retarget away
  before the growth tell pays off. **At defaults both are 20.0s — equal, not "comfortably
  above"** — a deliberate accepted trade-off: at max escalation a Type A that retargets right at
  `I_min` reaches only ~1.375× (still a legible tell, not its full creep). If Type A's
  high-escalation slow-burn must fully pay off, raise `I_min` above `dwell_half`. Their safe
  ranges overlap and there is **no load guard coupling them** — this is a tuning choice, not an
  enforced invariant.

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

**Type B — step feel.** Type B's motion (Rule 7) is a discrete hold-then-step *by mechanic*, not
merely a presentation choice — the render simply reflects it faithfully: the spike holds a
position, then relocates in a single perceptible step, then holds again. This matches "furniture
pretending to be still" — real furniture doesn't drift smoothly, and continuous motion would give
away the tell too early. Discrete steps also make re-scanning the same spot (the intended
detection method) meaningful — the player is comparing two held states, not tracking a moving one.

**Type C — pursuit feel.** Combine both cues rather than choosing one. The ghost geometry should
carry a directional lean bias toward its current trailing target (Rule 8), giving a constant,
low-grade sense of intent even at a glance. Layered on top, position updates should resolve in
discrete resample-steps rather than smooth interpolation, echoing Type B's steadiness-breaking-
into-motion language while remaining visually distinct through the lean. The combination reads
as "it knows where it's going" (lean) plus "it just moved" (resample-step) — reinforcing the
trailing-pursuit fantasy without adding a new render layer.

**Audio direction (the Audio System #6 GDD is unwritten — this is *direction only*, not a cue
spec; concrete triggers, layering, ducking, and mix priority are that GDD's to author,
cross-referenced back here):**

> **Perceptibility asymmetry across the three types is DELIBERATE — stated explicitly so the
> Audio System author does not chase parity (round-3 re-review, `audio-director`).** Type C gets
> a clear, intensifying, gated drone. Types A and B are near-silent by design, because **their
> primary tell is visual and their audio is secondary confirmation only**. In particular:
>
> - **Type B has no functional audio tell.** Its detection path is re-scan comparison of two held
>   states (Rule 7) — a purely visual mechanic. The held-state texture described below is
>   *decorative flavour*, not a detection channel, and nothing in this GDD's mechanics depends on
>   a player ever hearing it. Do not invest in making it perceptible; do not treat its
>   imperceptibility as a bug.
> - **Type A's audio is a mood floor, not a cue.** It should support the visual growth tell, never
>   carry it.
>
> Neither A's nor B's audio is required for any acceptance criterion in this document.

- **Type A — presence audio (NEW this revision).** As `silhouette_scale` grows, the ambient
  soundscape near it should lose definition rather than gain volume — a subtle low-end
  presence/dropout that thickens in step with the visual edge-firming above, never a rising
  drone. This keeps "growing void" legible as an absence asserting itself, not a threat
  announcing itself — matches the Type A visual direction's own restraint.
- **Type B — betrayal audio (NEW this revision).** No audio should mark the discrete step itself
  (Rule 7) — the tell is caught by comparing two *held* states via re-scanning, not by hearing
  something move. The only audio Type B should carry during its held states is a faint,
  near-subliminal material-wrongness texture (a resonance a little too clean to be furniture),
  discoverable only on close listening — silent, specifically, during the step itself, so the
  step stays a purely visual/re-scan tell.
- **Manifestation change (Rule 5 despawn/respawn)** — should read as an *instrument failure*
  (static burst / brief dropout), never a musical sting, consistent with the "corruption of the
  instrument" fantasy and the no-jump-scare pillar. ⚠ Because manifestation changes can fire as
  often as every `I_min` (~20s) late-game, the Audio System must design this against
  repetition-fatigue (e.g. de-emphasise or vary it as `e` rises) so it stays a diagnostic tell
  rather than a metronome — flagged for that GDD, not solved here. Note Entity System never
  broadcasts `e` itself (Rule 4: computed locally only); the Audio System would need to replicate
  the same local-computation pattern (same registered `session_escalation` formula + shared
  `session:tick`/`scan:coverage` inputs) rather than expect a ready-made event.
- **Scanning aggression (Rule 9, Type C)** — a drone that intensifies during the vulnerable
  window. Note Rule 9's multiplier is a **boolean gate** (on/off), *not* a scalar, so it cannot
  itself be the *continuous* driver: the Audio System should drive intensity from Type C's
  `type_c_speed(e)`, gated *on* by Rule 9's active state (naming the exact mapping is the Audio
  System GDD's call). Because the gate re-evaluates every tick with no latching (AC-ES29) — it
  can flip off on the identical tick as a NEAR→MEDIUM de-escalation — gate-off should be an
  **abrupt cut, matching the despawn edge case's own precedent** ("abrupt cessation reads as
  entity withdrawing, the correct horror signal"), not a release tail; a lingering tail on a
  same-tick cutoff would read as a mix glitch rather than diegetic corruption.

Both directions are diegetic-compatible extensions of the corruption language Point Cloud
Renderer already establishes visually (jitter, colour flicker) — audio corrupts the same
instrument the visuals corrupt, never a standalone sting.

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
  freeze. ⚠ **The quoted strings above are evocative placeholders, not literal specified copy**
  (clarified round-3). Nothing in this GDD's Detailed Design, Formulas, or ACs makes `NEAR`
  actually interrupt a scan — Rule 9 only alters Type C's *speed* — so literal
  "interrupted / retry?" copy would advertise an affordance the mechanics don't implement, a
  feedback-integrity violation. `design/gdd/ui-hud.md` already implements this as a generic
  geometry/density message pool, which is correct; the wording here is the thing that was
  misleading. **Cross-doc drift flagged for UI/HUD to reconcile (not resolved here, per
  separation of concerns):** this GDD lists `FAR` and `MEDIUM` as two distinct feedback states,
  while `ui-hud.md` merges them into a single pool *while citing this GDD as its source*. One of
  the two documents is wrong about what the other says. *Owner: UI/HUD (#12), at its next pass.* The master GDD's descriptive "Very near" (point cloud distorts, stop moving) and
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

65 criteria: 56 BLOCKING (Logic) + 9 BLOCKING (Integration). No ADVISORY — this system has no
dedicated performance budget of its own (render/point-cloud cost is Point Cloud Renderer's and
the render loop's concern) and produces no pixels directly; its behavior is fully computable and
assertable in isolation.

**Testability requirements for the implementer:**
- All durations, thresholds, and tuning knobs (`dwell_half`, `SCALE_CAP`, `SPEED_BASE`,
  `SPEED_MAX`, `I_max`, `I_min`, `proximity_tier_medium_max`, `entity_influence_radius`,
  `type_c_trail_delay`, `scanning_aggression_multiplier`, `type_b_step_distance`,
  `type_b_step_interval`, `entity_transform_min_delta`) must be injectable/mockable config
  parameters — tests advance a mockable `dt`-style clock, never a real wall-clock
  `setTimeout`/`await sleep`.
- **All randomness is drawn from a single injectable, seedable RNG interface** — the type roll
  (Rule 5 / AC-ES33b), the room-selection roll (Rule 5 / AC-ES10–11), and Type B's step direction
  (Rule 7 / AC-ES18). Tests supply a fixed seed or a deterministic mock returning scripted values,
  satisfying the project's Determinism standard (no unseeded randomness; identical result every
  run). No AC that involves a roll may be written against un-seeded `Math.random()`. **Draw order
  at a combined retarget event is fixed (type roll, then room roll — Rule 5) and itself asserted
  (AC-ES52)**, so a scripted-RNG mock's call sequence is reproducible across implementations, not
  just within one.
- **Per-tick updates (dwell accrual/decay, Type B step timing, Type C ring-buffer sampling)
  advance on the same capped `dt` the Orchestrator emits** (`session:tick` elapsedSeconds;
  `dt_cap = 0.1s`, registered) — a frame hitch or tab-restore cannot jump dwell or snap Type C's
  target in a single tick (mirrors Orchestrator AC-OR34). Tests inject `dt` explicitly.
- The state machine (`DORMANT`/`MANIFESTING_A`/`MANIFESTING_B`/`MANIFESTING_C`) and every
  transition must be exercisable by feeding events through a fake event bus in Vitest — no real
  Floor Plan, Movement, Point Cloud Renderer, or Win/Lose required. `session:tick`,
  `scan:coverage`, `player:position`, `floorplan:reveal`, `movement:scan_triggered`,
  `movement:scan_released`, and `session:end` are injected directly.
- The `session_escalation` formula and its tuning config are read from the same registered
  source Floor Plan uses; tests inject a fixed/mocked config rather than depending on Floor
  Plan's own file at runtime. **This proves Entity's computation matches the formula in
  isolation, but not that it matches Floor Plan's own live implementation** — those are two
  independently-written codebases. A shared golden-fixture file (e.g.
  `tests/fixtures/session-escalation.json`: an array of `{t, coverage, weights} → expected e}`
  rows) must be asserted against by **both** Entity System's and Floor Plan's test suites — this
  is the only mechanism that actually catches the two implementations drifting apart (AC-ES51,
  Integration).
- Type C's position-history ring buffer is exercisable by feeding a scripted sequence of
  `player:position` samples at known timestamps — no real player controller required. Its
  retention window (Rule 8) is a function of `type_c_trail_delay`, not a separate constant —
  tests should verify the window resizes when the knob does (AC-ES53).
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
depending on a `session:escalation`-style broadcast that doesn't exist in this contract. This is
a single-system, mocked-config check — it does not prove agreement with Floor Plan's actual
implementation (see AC-ES51). **BLOCKING (Logic)** *(retagged from Integration — round-2
re-review: this AC never exercises a real cross-system seam, AC-ES51 does)*

**AC-ES08 — e is clamped to [0, 1]**
GIVEN input weights/coverage/tick values that would drive the raw weighted sum below 0 or above
1, WHEN `e` is computed, THEN the result is clamped to exactly 0.0 or 1.0 respectively.
**BLOCKING (Logic)**

**AC-ES51 — Entity's and Floor Plan's live implementations of session_escalation agree (NEW this revision)**
GIVEN the shared golden-fixture file (`tests/fixtures/session-escalation.json` — rows of
`{t, coverage, weights} → expected e`), WHEN Entity System's test suite AND Floor Plan's test
suite each evaluate their own `e`-computation against every fixture row, THEN both produce the
same result as the fixture's expected value for every row — proving the two independently-written
codebases genuinely agree, not just that each matches a mocked formula string in isolation
(AC-ES07). **BLOCKING (Integration)**

### Spawn/Retarget Cadence and Room Selection (Rule 5)

**AC-ES09 — Retarget interval scales inversely with e, matching Formula 3**
GIVEN `e` values of 0.0, 0.5, and 1.0, WHEN `retarget_interval(e)` is computed for each, THEN the
results are `toBeCloseTo(90.0, 5)`, `toBeCloseTo(55.0, 5)`, and `toBeCloseTo(20.0, 5)`
respectively, matching the GDD's own worked examples. **BLOCKING (Logic)**

**AC-ES10 — Room selection matches Formula 4's distance weighting across a non-degenerate room set (rewritten this revision)**
GIVEN a fixed RNG seed, `e = 0.1`, `floorplan:reveal` not yet fired, defaults `k = 1.5` /
`ε = 0.5`, and **at least 5 eligible rooms at distinct distances** (use 2m / 5m / 8m / 11m / 15m),
WHEN 10000 seeded retarget room-selection rolls are run, THEN each room's observed selection
frequency matches its Formula 4 probability `P_base,i = (d_i + ε)^−k / Σ_j (d_j + ε)^−k` to within
±0.02, AND the frequencies are **strictly monotonically decreasing** with distance across all five
rooms. Deterministic under the fixed seed — re-running yields the identical selection sequence.
**BLOCKING (Logic)** *(round-3 re-review: the original tested exactly 3 rooms and asserted only
"nearest > uniform+0.15 AND nearest > farthest", which a degenerate "2× weight to the single
nearest, uniform among the rest" implementation satisfied identically to a correct one. Asserting
against Formula 4's actual per-room probabilities over ≥5 rooms is what distinguishes them.)*

**AC-ES10b — Formula 4 worked example reproduces the GDD's own stated probabilities (NEW this revision)**
GIVEN the 3-room reference configuration from Formula 4's worked example (2m / 8m / 15m,
`k = 1.5`, `ε = 0.5`, anomaly unrevealed), WHEN `P_base` is computed for each room, THEN the
results are `toBeCloseTo(0.814, 3)`, `toBeCloseTo(0.130, 3)`, and `toBeCloseTo(0.053, 3)`, and
they sum to `toBeCloseTo(1.0, 5)` — a pure-math check on the formula independent of any RNG.
**BLOCKING (Logic)**

**AC-ES11 — Anomaly room favoring increases after floorplan:reveal, reaching certainty as e approaches 1 (rewritten this revision)**
GIVEN a fixed RNG seed and `floorplan:reveal` fired for the anomaly room, WHEN `e` is sampled at
**at least 5 values spanning the range (0.0, 0.2, 0.5, 0.8, 0.99)** with 10000 seeded rolls at
each, THEN the anomaly room's observed selection frequency is strictly greater at each successive
`e` (monotonic increase across all five samples, not merely the endpoints), matches Formula 4's
`P_anomaly = P_base,anomaly + (1 − P_base,anomaly) × e` to within ±0.02 at every sampled `e`, AND
`toBeGreaterThan(0.98)` at `e = 0.99`. **A hard step function (near-zero below some threshold,
near-certainty above) must fail this AC** — that implementation passed the original 3-sample
version. Deterministic under the fixed seed. **BLOCKING (Logic)** *(round-3 re-review: the
original sampled only e=0.5/0.8/0.99, which a step function satisfied while contradicting the
"increasingly favored" prose.)*

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

**AC-ES16 — Dwell decays (not resets), and is floored at 0 (no negative dwell / no singularity)**
GIVEN accrued dwell time `d > 0` and the player's tier is currently MEDIUM or FAR, WHEN 1 second
of elapsed time passes outside NEAR/ADJACENT, THEN effective dwell decreases by
`toBeCloseTo(0.5, 5)` seconds (not reset to 0, and not decremented at the full 1:1 accrual rate);
AND GIVEN accrued dwell at or near `0.0`, WHEN further time passes outside NEAR/ADJACENT, THEN
dwell is floored at exactly `0.0` and never goes negative — guaranteeing Formula 1's denominator
(`dwell + dwell_half`) never reaches its `dwell = −dwell_half` division-by-zero singularity.
**BLOCKING (Logic)**

**AC-ES17 — Dwell only accrues while player is in NEAR/ADJACENT range of Type A**
GIVEN Type A is manifested and the player's tier relative to it is NEAR or ADJACENT, WHEN 1
second elapses, THEN accrued dwell increases by 1.0 second; conversely, no accrual occurs during
ticks where the tier is MEDIUM or FAR (only the decay of AC-ES16 applies then).
**BLOCKING (Logic)**

**AC-ES17b — Type A silhouette scale is broadcast via entity:transform {scale}**
GIVEN Type A is active and its `silhouette_scale` (Formula 1) changes from one value to a
perceptibly different one as dwell accrues, WHEN the change is processed, THEN Entity System emits
`entity:transform {scale}` carrying the new `silhouette_scale`; no such event is emitted for Type
B or Type C, and none is emitted on a tick where Type A's scale is unchanged. **BLOCKING (Logic)**

**AC-ES49 — dwell_half ≤ 0 is rejected at config load (NEW this revision)**
GIVEN a config with `dwell_half = 0` or `dwell_half < 0`, WHEN the config is loaded, THEN load is
rejected — preventing Formula 1's `dwell + dwell_half` denominator from reaching zero the instant
Type A spawns with the player already NEAR/ADJACENT (`dwell = 0`), a case AC-ES16's decay-floor
alone does not cover. **BLOCKING (Logic)**

**AC-ES50 — entity:transform throttle fires exactly at the entity_transform_min_delta boundary (NEW this revision)**
GIVEN Type A's `silhouette_scale` changes by exactly `entity_transform_min_delta` (default 0.01)
between two ticks, WHEN the change is processed, THEN `entity:transform` IS emitted; GIVEN it
changes by a smaller amount, THEN it is NOT emitted that tick (the delta accumulates and is
carried into the next comparison rather than being discarded) — proving the throttle boundary
itself is enforced, not just the trivial large-change/no-change cases already covered by
AC-ES17b. **BLOCKING (Logic)**

### Type B Behavior (Rule 7)

**AC-ES18 — Type B stays within entity_influence_radius via boundary re-roll, not clamping (rewritten this revision)**
GIVEN Type B has spawned at position `P` and a scripted/mocked RNG whose first draw for a given
step would land outside `entity_influence_radius` (5.0m) and whose second draw would land inside
it, WHEN that step is processed, THEN the RNG mock is called **twice** for that step (proving a
re-roll actually happened) and Type B's resulting position matches the *second* draw's direction
at `type_b_step_distance`, not the boundary-clamped point along the first draw's direction — a
clamping implementation would call the RNG once and land at the radius edge, which this AC must
fail. Deterministic under the fixed seed. **BLOCKING (Logic)** *(round-2 re-review: original
version only asserted "never exceeds radius," which a clamping implementation satisfies
identically to a re-rolling one — rewritten to assert the distinguishing behavior Rule 7 actually
specifies)*

**AC-ES19 — Type B moves in discrete steps, not continuously, by the exact seeded displacement**
GIVEN Type B is active with default knobs (`type_b_step_distance = 0.30m`,
`type_b_step_interval = 1.0s`), a mockable clock, and a fixed RNG seed, WHEN the clock advances,
THEN Type B's position is **unchanged during a hold interval** and changes **exactly once per
`type_b_step_interval`**, by the displacement the seeded RNG's scripted direction and
`type_b_step_distance` together determine (`toBeCloseTo`, not merely
`toBeLessThanOrEqual(type_b_step_distance)`) — never a continuous per-tick `MOVE_SPEED`- or
`type_c_speed`-style glide, and never a zero-displacement no-op passing by default. **BLOCKING
(Logic)** *(round-2 re-review: the original one-sided `toBeLessThanOrEqual` bound was trivially
satisfied by an implementation that never actually moves)*

### Type C Behavior (Rule 8, Formula 2)

**AC-ES20 — Type C targets the player's position from type_c_trail_delay seconds ago**
GIVEN a scripted `player:position` history where the player was at position `P1` at time
`t - type_c_trail_delay` and at a different position `P2` at time `t`, WHEN Type C computes its
movement target at time `t`, THEN it targets `P1`, not `P2`. **BLOCKING (Logic)**

**AC-ES54 — Type C clamps to its target on arrival rather than overshooting (NEW this revision)**
GIVEN Type C's remaining distance to its current trail-delayed target is smaller than the
distance `type_c_speed` would cover that tick (e.g. because the player has held still longer
than `type_c_trail_delay`, as happens mid-scan), WHEN Type C's position is updated that tick,
THEN it is clamped exactly to the target position rather than stepping past it — preventing
visible oscillation around the target on ticks where the player isn't moving, which is precisely
Rule 9's scanning-aggression window. **BLOCKING (Logic)**

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

**AC-ES53 — Ring buffer retention window tracks type_c_trail_delay, not a fixed size (NEW this revision)**
GIVEN two configs differing only in `type_c_trail_delay` (e.g. 2.0s vs 8.0s), WHEN each config's
Type C ring buffer is exercised with an identical long `player:position` stream, THEN the buffer
retains samples covering the *configured* `type_c_trail_delay` window (plus one tick of `dt_cap`
slack) in both cases — proving the retention window resizes with the knob rather than being a
separately hardcoded capacity that could fall short of a retuned `type_c_trail_delay`.
**BLOCKING (Logic)**

**AC-ES52 — RNG draw order at a combined retarget event is fixed (type, then room) (NEW this revision)**
GIVEN a fixed RNG seed and a retarget event where both a type roll and a room-selection roll fire
(Rule 5), WHEN the retarget is processed, THEN the RNG's first draw determines the type and the
second draw determines the room — verified by a scripted-RNG mock asserting the call sequence —
and this order is identical on every retarget and every re-run with the same seed. **BLOCKING
(Logic)**

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

**AC-ES30b — Aggression multiplier is a no-op for Type A and Type B**
GIVEN a scan is in its LOCKED window with the entity at NEAR/ADJACENT tier, WHEN the active
manifestation is Type A (stationary) or Type B (hold-then-step), THEN `scanning_aggression_multiplier`
alters neither — Type A remains at its fixed position (no speed to scale) and Type B's
`type_b_step_distance` / `type_b_step_interval` are unchanged from their un-multiplied values. The
multiplier affects Type C's pursuit speed only (AC-ES26, AC-ES30). **BLOCKING (Logic)**

### Movement Violation Non-Interference (Rule 10)

**AC-ES31 — Entity takes no action beyond emitting accurate real-time entity:proximity**
GIVEN any entity state or tier, WHEN ticks advance, THEN Entity System emits only
`entity:spawn`, `entity:despawn`, `entity:proximity`, `entity:transform`, and `entity:position`
per their defined rules — no additional event (e.g. a violation flag, a win/lose signal, or a
movement-blocking call) is ever emitted by this system. **BLOCKING (Logic)** *(whitelist corrected
this revision — `entity:transform` had been added in round-1 without updating this AC, and
`entity:position` is new this round; both are Rule 6/Rule 11 rendering data, not Movement
Violation logic, so Rule 10's "no extra logic" guarantee still holds)*

### Position Broadcast (Rule 11)

**AC-ES47 — entity:position is emitted every tick for Type B/C, never for Type A or DORMANT (NEW this revision)**
GIVEN the active manifestation is Type B or Type C, WHEN `session:tick` fires, THEN
`entity:position {position}` is emitted that same tick carrying the entity's current position
(latest-value kind, mirroring `player:position`'s own pattern); GIVEN the active manifestation is
Type A, or the state is `DORMANT`, THEN `entity:position` is never emitted — Type A's one
position is already carried by `entity:spawn` (AC-ES13 confirms it never changes), and `DORMANT`
has no entity to report a position for. **BLOCKING (Logic)**

### States and Transitions

**AC-ES32 — DORMANT is entered at session start with no manifestation active**
GIVEN a new session begins, WHEN Entity System initializes, THEN state is `DORMANT` and
`currentType` is `null` — no `entity:spawn` has been emitted yet. **BLOCKING (Logic)**

**AC-ES33 — DORMANT transitions to the correct MANIFESTING_X state on spawn roll**
GIVEN state is `DORMANT` and the spawn/retarget condition (Rule 5) is met, WHEN the type roll
selects A, B, or C, THEN state transitions to `MANIFESTING_A`, `MANIFESTING_B`, or
`MANIFESTING_C` respectively, and the corresponding `entity:spawn {type, position}` is emitted.
**BLOCKING (Logic)**

**AC-ES33b — Type roll uses the seeded RNG and the placeholder uniform distribution**
GIVEN a fixed RNG seed, WHEN 3000 seeded spawn/retarget type rolls are drawn, THEN each of Type
A, B, and C is selected with frequency `toBeCloseTo(1/3, 1)` (the placeholder uniform 1/3
distribution — a documented Vertical-Slice tuning target, Open Q#1), AND the drawn sequence is
identical on re-run with the same seed (deterministic). **BLOCKING (Logic)**

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

**AC-ES60 — Reveal arriving mid-manifestation actually applies its weighting at the next retarget (NEW this revision)**
GIVEN `floorplan:reveal` fires for the anomaly room **while state is `MANIFESTING_A/B/C`** (not
while `DORMANT`), WHEN that manifestation later retargets naturally and 10000 seeded room rolls are
run at a fixed `e`, THEN the anomaly room's selection frequency matches Formula 4's Stage-2
`P_anomaly` for that `e` — i.e. the reveal received mid-manifestation is genuinely retained and
applied. **BLOCKING (Integration)** *(round-3 re-review: AC-ES39 asserts only the negative — no
forced despawn — and AC-ES11's GIVEN never specifies the entity was mid-manifestation when the
reveal fired. An implementation that only latched revealed-room weighting when the roll originated
from `DORMANT` passed both while violating Rule 5. The Coverage Validation row for Core Rule 5
overclaimed this scenario as covered.)*

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

**AC-ES45 — session:end freezes all per-tick updates, not just retargeting (rewritten this revision — before/after structure)**
GIVEN a manifestation is active, WHEN one tick is advanced **before** `session:end` under inputs
chosen to change all three values, THEN dwell (Formula 1), Type B's stepped position (Rule 7), and
Type C's ring-buffer contents each **provably change** — establishing they were live; AND WHEN
`session:end` is then delivered and an **identical** tick advanced again, THEN all three values are
unchanged from their pre-`session:end` readings. The freeze is total, not limited to suppressing
retarget (AC-ES35 covers retarget specifically). **BLOCKING (Integration)** *(round-3 re-review:
the original asserted only the frozen state, so a globally-broken implementation that never updated
these values at all passed vacuously — the same defect round-2 fixed in AC-ES18/ES19. Other ACs
would have caught such an implementation, but relying on that external safety net is exactly the
structure round-2 rejected. The before/after pairing makes this AC self-sufficient.)*

**AC-ES45b — session:end also freezes tier recomputation and entity:proximity emission (rewritten this revision — before/after structure)**
GIVEN a manifestation is active, WHEN a `player:position` that crosses a tier boundary is delivered
**before** `session:end`, THEN `entity:proximity` **is** emitted with the new tier — establishing
the channel was live; AND WHEN `session:end` is then delivered and a further boundary-crossing
`player:position` is delivered, THEN **no** new `entity:proximity` is emitted and the last-emitted
tier stands frozen. The freeze covers tier recomputation (AC-ES02), not only the
dwell/drift/ring-buffer updates of AC-ES45. **BLOCKING (Logic)** *(round-3 re-review: same vacuous-
pass rewrite as AC-ES45 above.)*

**AC-ES58 — session:end and an elapsed retarget on the same tick: session:end wins, no RNG consumed (NEW this revision)**
GIVEN a manifestation is active, its `retarget_interval(e)` elapses on exactly the same tick that
`session:end` arrives, and a scripted RNG mock is installed, WHEN that tick is processed, THEN
exactly **one** `entity:despawn` is emitted, **no** `entity:spawn` is emitted, and the RNG mock
records **zero draws** for that tick — the pending retarget is discarded without rolling. A
retarget-first ordering would instead emit `despawn → spawn → despawn` and consume two draws
(type, then room), desynchronising the seeded sequence for the remainder of the session versus a
`session:end`-first implementation. **BLOCKING (Integration)** *(round-3 re-review: processing
order was previously unspecified, so two correct-looking implementations produced different event
streams and different RNG sequences from the same seed — the divergence class AC-ES52's fixed draw
order exists to prevent.)*

**AC-ES46 — Degenerate room selection: only the starting room revealed still yields a valid pick**
GIVEN only the player's starting room is currently revealed, WHEN room selection runs for a
retarget, THEN the starting room is selected without error — spawn selection is never left with
zero eligible candidates. **BLOCKING (Logic)**

> **Coincidental loop-teleport-into-Type-A-adjacency**: explicitly out of scope per the Edge
> Cases text (Entity System does not reach into Floor Plan's loop-target selection) — **no AC
> written; a coordination note for Floor Plan's own tuning, not a gap in this GDD.**

> *Note: `qa-lead` consulted (lean-mode Section H high-risk spawn).*

### Config Load Validation — Tuning Knob Invariants

**AC-ES48 — proximity_tier_medium_max ≤ 8.0m is rejected at config load**
GIVEN a config with `proximity_tier_medium_max ≤ 8.0` (at or below `NEAR`'s registered `d_max`),
WHEN the config is loaded, THEN load is rejected — the Tuning Knobs "Interaction notes" invariant
had no corresponding AC before the round-2 revision; the Coverage Validation table's "nothing left
uncovered" claim didn't extend to Tuning Knob invariants until then. **BLOCKING (Logic)**

(AC-ES49, `dwell_half ≤ 0` rejection, is the sibling load-guard AC — see Type A Behavior above.)

**AC-ES55 — I_min ≥ I_max (or I_min ≤ 0) is rejected at config load (NEW this revision)**
GIVEN a config where `I_min ≥ I_max` (e.g. `I_min = 100.0`, `I_max = 90.0`) or `I_min ≤ 0`, WHEN
the config is loaded, THEN load is rejected. Formula 3's variable table has always declared
`0 < I_min < I_max`, but nothing enforced it: inverted, `retarget_interval(e)` produces no error
and no NaN — it silently *increases* with `e`, making manifestation changes rarer as the session
escalates, exactly inverting Rule 5's stated intent. **BLOCKING (Logic)**

**AC-ES56 — SPEED_MAX ≤ SPEED_BASE is rejected at config load (NEW this revision)**
GIVEN a config where `SPEED_MAX ≤ SPEED_BASE`, WHEN the config is loaded, THEN load is rejected.
Formula 2's variable table has always declared `SPEED_MAX > SPEED_BASE`, but nothing enforced it:
inverted, `type_c_speed(e)` runs backwards — Type C gets *slower* as escalation rises, inverting
the "avoidable early, inescapable late" design with no error to diagnose from. **BLOCKING (Logic)**

**AC-ES57 — Formula 4's k ≤ 0 or ε ≤ 0 is rejected at config load (NEW this revision)**
GIVEN a config with `room_weight_exponent ≤ 0` or `room_distance_epsilon ≤ 0`, WHEN the config is
loaded, THEN load is rejected — `ε = 0` reintroduces a division-by-zero the instant the player
stands at a room's AABB center (`d_i = 0`, the same singularity class as `dwell_half`), and
`k ≤ 0` inverts Formula 4 so distant rooms are favored, contradicting Rule 5. **BLOCKING (Logic)**

**AC-ES57b — Valid boundary configs are ACCEPTED, not over-rejected (NEW this revision)**
GIVEN configs at the *legal* side of each guarded boundary — `proximity_tier_medium_max = 8.001`,
`dwell_half = 0.001`, `I_min = 19.999` with `I_max = 20.0`, `SPEED_MAX = 0.901` with
`SPEED_BASE = 0.9`, `k = 0.001`, `ε = 0.001` — WHEN each config is loaded, THEN load **succeeds**
in every case. Proves the guards of AC-ES48/49/55/56/57 reject only genuine violations rather than
being implemented with an inverted or off-by-one comparison that also rejects valid tuning.
**BLOCKING (Logic)** *(round-3 re-review: every config-guard AC asserted only the rejection path;
an implementation that rejected everything passed all of them.)*

## Coverage Validation

| Source | AC(s) |
|---|---|
| Core Rule 1 (canonical tier vocabulary) | AC-ES01 |
| Core Rule 2 (tier computation + change-only emission) | AC-ES01, ES02, ES03, ES04 |
| Core Rule 3 (single entity, despawn-before-spawn) | AC-ES05, ES06 |
| Core Rule 4 (local escalation computation) | AC-ES07, ES08, ES51 |
| Core Rule 5 (cadence + room + type selection + RNG draw order) | AC-ES09, ES10, ES10b, ES11, ES12, ES33b, ES52, ES60 |
| Core Rule 6 (Type A stationary + silhouette growth + `entity:transform`) | AC-ES13, ES14, ES15, ES16, ES17, ES17b, ES49, ES50 |
| Core Rule 7 (Type B discrete pause-and-shift) | AC-ES18, ES19 |
| Core Rule 8 (Type C trailing pursuit + ring-buffer window + arrival clamp) | AC-ES20, ES21, ES22, ES23, ES24, ES25, ES53, ES54 |
| Core Rule 9 (scanning aggression — Type C only) | AC-ES26, ES27, ES28, ES29, ES30, ES30b |
| Core Rule 10 (no extra logic beyond entity:proximity) | AC-ES31 |
| Core Rule 11 (position broadcast, Type B/C only) | AC-ES47 |
| State table: all 4 states + transitions | AC-ES32, ES33, ES34, ES35 |
| `entity:transform {scale}` emission (Rule 6 / Downstream) | AC-ES17b, ES50 |
| `entity:position {position}` emission (Rule 11 / Downstream) | AC-ES47 |
| Formula 1 (silhouette growth + dwell floor + dwell_half guard) | AC-ES14, ES15, ES16, ES49 |
| Formula 2 (Type C pursuit speed) | AC-ES21, ES22, ES23 |
| Formula 3 (retarget interval) | AC-ES09, ES38, ES55 |
| Formula 4 (room-selection weighting) | AC-ES10, ES10b, ES11, ES57, ES60 |
| Edge Cases (all 11) | AC-ES38–ES46, ES45b, ES58; loop-teleport coincidence explicitly N/A |
| Tuning Knob invariants (config load guards — rejection) | AC-ES48, ES49, ES55, ES56, ES57 |
| Tuning Knob invariants (config load guards — valid-boundary acceptance) | AC-ES57b |

**Traceability claim (corrected round-3).** Every Core Rule, Formula behaviour, state-table
transition, and Edge Case has a corresponding criterion, and every invariant this GDD declares as
**load-guarded** has both a rejection AC and (via AC-ES57b) an acceptance AC.

Two documented exceptions, both deliberate rather than gaps:
1. **Coincidental loop-teleport adjacency** — explicitly out of scope in this GDD's own Edge Cases
   text (it would require reaching into Floor Plan's loop-target selection).
2. **`SPEED_BASE < MOVE_SPEED < SPEED_MAX`** — declared in Tuning Knobs "Interaction notes" as an
   *advisory* invariant, deliberately not load-guarded (see the guard-policy note there), and
   therefore deliberately without a load-guard AC. `MOVE_SPEED` belongs to FPS Movement.

> ⚠ **Round-3 correction.** The previous version of this section claimed no Tuning Knob invariant
> was left uncovered. That claim was **false**: `0 < I_min < I_max` (Formula 3) and
> `SPEED_MAX > SPEED_BASE` (Formula 2) were both declared invariants with neither a guard nor an
> AC. Both are now guarded (AC-ES55, AC-ES56). Recorded rather than silently corrected, because
> this table has now overclaimed in two consecutive review rounds and future reviewers should
> treat its completeness claims as a thing to verify, not accept.

## Open Questions

1. **Type-selection probability — placeholder ships, final tuning deferred.** Core Rule 5 now
   specifies a **placeholder uniform 1/3 distribution** over {A, B, C} (seeded RNG, asserted by
   AC-ES33b) so the roll is implementable and testable today. What remains open is whether the
   *shipped* distribution should instead be escalation-weighted — matching the master GDD's
   implicit `PASSIVE → AMBIENT → AGGRESSIVE` ordering (e.g. Type C rarer at low `e`, unlocking as
   the session escalates). **Tension flagged in round-2 re-review (game-designer):** escalation
   weighting makes type *more* predictable as a session goes on, which cuts against the Player
   Fantasy's "you never learn which one you're facing until it's already close." Whoever re-tunes
   this should weigh that tension explicitly, not treat it as a pure difficulty-pacing knob — the
   current uniform placeholder may be closer to the stated fantasy than its own intended
   replacement.

   **Second tension flagged in round-3 re-review (game-designer, ratified by creative-director) —
   the distribution is also a *fantasy-delivery floor*, not only a difficulty knob.** Rule 9's
   scanning-aggression beat ("the entity has an opinion about your scan") is what Player Fantasy
   calls the fantasy's **"sharpest edge"** — and it is Type C-only. Under the uniform 1/3
   placeholder across the ~4–10 retargets a session produces (Formula 3), a meaningful share of
   short sessions — roughly 20% at 4 retargets — **never roll Type C at all and never experience
   the single most load-bearing fantasy claim in this document.** The same skew drives real
   difficulty variance: Type C is the only manifestation with late-game inescapability (Formula 2)
   and aggression stacking, so "how many Type C rolls did I get" is currently the dominant
   session-difficulty variable and is tracked nowhere.

   Whoever re-tunes this must therefore satisfy **three** constraints, not one: difficulty pacing,
   the unpredictability the fantasy depends on, and a delivery floor (e.g. guaranteeing at least
   one Type C manifestation per session past some `e`). **Creative-director's design test:** if
   playtesters who never saw Type C describe the game as "atmospheric" rather than "hostile," the
   floor is required.

   *Owner: game-designer. Re-tune before Vertical Slice; **no longer blocking implementation** now
   that a documented placeholder exists.*

2. **entityInFrame precision is implicitly ratified, not re-opened.** Scan Mechanic's Open Q#2
   asked this GDD to confirm or revise its proximity-tier proxy for `entityInFrame`. Core Rule 2
   confirms `entity:proximity` never broadcasts raw position or frustum data — only tier — and UI
   Requirements explicitly forbids leaking position elsewhere too. This makes the tier-proxy the
   *only* option available under this GDD's contract; upgrading to a precise position+frustum
   check would require a new event this GDD does not currently define. *Owner: whoever revisits
   Scan Mechanic's Open Q#2, informed by this constraint. Not blocking either GDD's approval.*

3. ~~**Room-selection weighting is qualitative, not a formula.**~~ **RESOLVED round-3
   (2026-07-25)** by **Formula 4** — inverse-power distance weighting `w_i = (d_i + ε)^−k` with a
   Stage-2 anomaly lerp to certainty, plus new knobs `room_weight_exponent` (k, default 1.5) and
   `room_distance_epsilon` (ε, default 0.5m). AC-ES10/ES11 were rewritten against the formula
   (≥5 rooms, ≥5 `e` samples) and AC-ES10b added as a pure-math check.

   *This item's own prior self-assessment — "testable as written… not blocking" — was **wrong**,
   and the round-3 re-review overruled it: an implementer could not build Rule 5 without inventing
   the function, and the old ACs demonstrably admitted a hard step function and a
   "2×-the-nearest-room" degenerate. Retained here rather than deleted as a caution: an Open
   Question's own non-blocking claim is not evidence that it is non-blocking.*

4. **Type B "mimics shape of nearby objects" (master GDD §6) is an art-direction concern, not
   resolved here.** This GDD specifies Type B's *positioning* behavior (drift, containment
   radius) but the visual claim that it resembles specific room objects is Point Cloud
   Renderer/art direction's to execute, not a mechanical rule. *Owner: art-director /
   technical-artist, at asset-spec time.*

5. **All numeric defaults are systems-designer estimates, unplaytested.** `dwell_half`,
   `SCALE_CAP`, `SPEED_BASE`/`SPEED_MAX`, `I_max`/`I_min`, `type_c_trail_delay`,
   `scanning_aggression_multiplier`, and (round-3) `room_weight_exponent`/`room_distance_epsilon`
   — every curve and constant in this GDD is a reasoned first pass, not a validated one. *Owner:
   game-designer / systems-designer. Validate during Vertical Slice playtesting per the
   systems-index's own "prototype each entity type early" flag.*

   **Specific playtest checks flagged by round-3 re-review:**
   - **Type B step legibility vs. ambient jitter (game-designer).** Type B's tell is a 0.30m /
     1.0s discrete step, but proximity jitter is *already active* at NEAR/ADJACENT — the exact
     band where the player is close enough to witness a step live. A 0.30m displacement seen
     directly may be indistinguishable from jitter noise, and worse, a jitter frame may be
     *misread* as a Type B step when the active type is A or C. The design intends re-scan
     comparison (two held states) as the detection path, but nothing prevents live observation.
     This would make the tells ambiguous *accidentally* rather than by authorial choice. Check
     whether `type_b_step_distance` needs raising above the jitter amplitude, or whether the
     confusion is a feature.
   - **Combined speed ceiling (systems-designer).** Verify `SPEED_MAX × scanning_aggression_multiplier`
     by hand after any tuning pass — the safe ranges multiply to 7.5 m/s, not the 3.52 m/s the
     design intends (see Tuning Knobs Interaction notes).

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
