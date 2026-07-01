# Session/Game State Orchestrator

> **Status**: In Design
> **Author**: magatron02 + agents
> **Last Updated**: 2026-07-01
> **Implements Pillar**: Foundation/Infrastructure — enables every other pillar mechanically

## Overview

The Session/Game State Orchestrator is the central event bus and session-state machine
every other system in LAST SCAN publishes to and reads from. It owns no gameplay logic
of its own — it does not decide when a scan is valid, whether the dollhouse desyncs, or
how close the entity is. Its job is narrower and load-bearing: register the canonical
name and payload shape of every cross-system event (`scan:*`, `floorplan:*`, `entity:*`,
`player:*`, `session:*`, `movement:*`, `renderer:*`), guarantee delivery order when two
systems' events land in the same tick, and own the session-level state machine
(`LOADING → ACTIVE → SEALED`, mirroring Floor Plan's own lifecycle) that every system
checks before acting.

Four GDDs — Point Cloud Renderer, FPS Movement, Floor Plan System, Scan Node System —
were each designed and approved *before* this document exists, and each one already
assumes a specific Orchestrator contract (event names, payload fields, delivery
guarantees) as a **provisional placeholder**. This GDD's primary job is to make those
four independently-authored assumptions agree with each other, close the two events
nothing currently produces (`session:tick`, `session:end`), and register the whole
family in `entities.yaml` so it stops being provisional. Nothing else in the game may
publish an event under a name this GDD doesn't own, and no system may consume an event
whose payload shape contradicts what its producer declares here.

## Player Fantasy

Pure infrastructure — the player never perceives the Orchestrator directly. It has no
player fantasy of its own; it exists so that every other system's fantasy (Floor Plan's
"a map you used to trust," Scan Node's "the one gauge you trust," future Entity/Scan
Mechanic fantasies) can land *reliably*. A player who notices the Orchestrator at all —
a dropped event, an out-of-order state transition, two systems disagreeing about whether
a scan is active — has noticed a bug, not a feature. Its only measurable success
criterion is invisibility.

*Note: `creative-director` not consulted for this section — Foundation/Infrastructure
layer, no player-facing framing to shape.*

## Detailed Design

### Core Rules

1. **Registration, not invention.** Every event name and payload shape in this GDD's
   Interface Registry (see below) is taken verbatim from the producing GDD's own
   "Interactions with Other Systems" section. Where two GDDs disagree on a shape (none
   do currently — see Registry Conflict Check), Orchestrator does not silently pick a
   winner; it surfaces the conflict for the design team.

2. **Session lifecycle — Orchestrator is sole owner.** `LOADING → ACTIVE → SEALED`,
   mirroring Floor Plan's own per-session state table (Floor Plan Core Rule 1's
   `LOADING`/`ACTIVE`/`SEALED` naming is adopted verbatim as the project-wide session
   state, not a separate parallel one).
   - `LOADING`: session start, before any gameplay system has received its first event.
     Exit → `ACTIVE` once Floor Plan's initial `floorplan:init` + `floorplan:update`
     have both fired (the first system in the dependency chain to become ready).
   - `ACTIVE`: normal play. Orchestrator emits `session:tick {elapsedSeconds}` once per
     animation frame. Exit → `SEALED` on receiving a session-end trigger.
   - `SEALED`: no further mutation permitted anywhere. Orchestrator emits `session:end`
     exactly once, synchronously, before entering this state — every system that
     listens for `session:end` (Floor Plan, Scan Node today; Win/Lose and others
     later) is guaranteed to receive it before any post-seal event would otherwise fire.
   - **Session-end trigger source is provisional** — no Win/Lose GDD exists yet.
     Orchestrator exposes a `session:request_end {reason}` intake that any future
     system (Win/Lose, a hard failure, a debug command) can call; Orchestrator is the
     only thing that actually flips state and emits `session:end`. This keeps "who
     decides the game is over" decoupled from "who enforces that decision everywhere,"
     matching the project's stated Entity↔Scan Mechanic circular-dependency resolution
     pattern (systems-index.md Circular Dependencies section) — mediate through the
     bus, no direct authority granted to an unbuilt system.

3. **`player:position` and `session:tick` are the two continuously-firing events;
   everything else is discrete.** FPS Movement already publishes `player:position
   {x,y,z}` every frame (its own GDD, Interactions table) — Orchestrator does not wrap
   or rebroadcast it, only guarantees delivery to every current and future subscriber.
   `session:tick {elapsedSeconds}` is new: Orchestrator is its sole producer, firing
   once per animation frame from the same `requestAnimationFrame` loop, always after
   `player:position` for that frame (Rule 4 ordering).

4. **Ordering — Global FIFO by default; registered overrides for specific pairs.**
   Events processed in the exact arrival order they were published within a frame.
   Where a sibling GDD has already specified a required order between two of its own
   events, that order is a registered override and takes precedence over raw arrival
   order:
   - Floor Plan AC-L09: `floorplan:update` (reveal) before `floorplan:loop`, when both
     resolve in the same tick.
   - Floor Plan AC-C06: a mutation's `floorplan:update` is exactly one emission per
     mutating call — Orchestrator delivers it as a single event, never batches or
     splits it.
   - Scan Node AC-SN29 / Cross-System Invariants: `scan:coverage` and `scan:complete`
     carry identical `coverage` values when both fire from the same `scan:captured`
     resolution — Orchestrator delivers both to their subscribers before processing
     any *other* queued event, so no interleaved event can observe a state where one
     has updated and the other hasn't.
   - Point Cloud Renderer AC-E02: `scan:complete` takes priority over `scan:abort` if
     both are somehow queued in the same frame (defensive; Scan Node's own state
     machine should make this unreachable, but Orchestrator's ordering rule doesn't
     depend on that being true).
   This rule list is **not exhaustive at authoring time** — it is extended whenever a
   future GDD (Scan Mechanic, Entity, Win/Lose) declares a same-tick ordering
   requirement between two events it produces or consumes. New entries go in this
   GDD's Interface Registry, not silently assumed by the new system.

5. **No direct imports between gameplay systems — the bus is the only channel.**
   Restates and generalizes the pattern already established piecemeal (FPS Movement →
   Entity via Orchestrator only, per FPS Movement's own GDD; Entity ↔ Scan Mechanic
   circular dependency resolved via the bus, per systems-index.md). Orchestrator is the
   single point where this rule is enforced project-wide: any two systems that need to
   coordinate do so by one publishing and the other subscribing, never by one calling
   the other's code directly.

6. **Provisional event names become authoritative once registered here.** Every
   consuming GDD written so far (Point Cloud, FPS Movement, Floor Plan, Scan Node)
   marks its Orchestrator-dependent interfaces "⚠️ Provisional — Orchestrator
   undesigned." This GDD is what removes that flag. After this GDD is Approved, the
   `referenced_by` list in each event's registry entry becomes the authoritative list
   of who may rely on that shape not changing without a coordinated update.

7. **Latest-value events are cached; discrete events are fire-and-forget.** Every
   registered event is classified as one of two kinds, and the classification is part
   of its registry entry:
   - **Latest-value** (describes *current state*): Orchestrator retains the most
     recent payload and replays it to any subscriber that registers later. Members:
     `session:tick` (current elapsed time), the current session state, `scan:coverage`
     (latest level), `entity:proximity` (latest tier), `floorplan:init` (the one-time
     roster). A late-joining system (e.g. UI/HUD registering mid-session) receives the
     current value on subscribe, not silence.
   - **Discrete** (describes *a thing that happened at an instant*): fire-and-forget,
     never replayed. Members: `scan:complete`, `scan:abort`, `scan:started`,
     `scan:captured`, `floorplan:reveal`, `floorplan:loop`, `floorplan:update`,
     `movement:scan_triggered`, `scan:integrity_warning`, `scan:integrity_failure`,
     `renderer:anomaly_density`. Replaying one to a late joiner would re-fire a stale
     action, so they are not cached.
   The sole exception is `session:end` — a discrete transition marker that IS delivered
   once to a subscriber registering during `SEALED`, because a system joining a sealed
   session must know sealing happened (see Edge Cases).

### States and Transitions

**Session lifecycle** (project-wide, adopted from Floor Plan's naming):

| State | Description | Entry | Exit |
|---|---|---|---|
| `LOADING` | Session starting; Floor Plan has not yet emitted initial geometry | Page load / new session | Floor Plan's first `floorplan:init` + `floorplan:update` both received → `ACTIVE` |
| `ACTIVE` | Normal play; `session:tick` fires every frame | `LOADING` exit | `session:request_end {reason}` received (from any system) → `SEALED` |
| `SEALED` | No further mutation permitted; `session:end` already emitted | `session:request_end` received | — (terminal for the session) |

**Per-frame event ordering** (within one `requestAnimationFrame` tick, `ACTIVE` state only):

| Order | Event | Note |
|---|---|---|
| 1 | `player:position {x,y,z}` | FPS Movement's per-frame publish |
| 2 | `session:tick {elapsedSeconds}` | Orchestrator's own per-frame publish, always after position |
| 3+ | All other queued events, FIFO, with registered overrides applied (Rule 4) | |

### Interactions with Other Systems

| System | Direction | Interface |
|---|---|---|
| **Point Cloud Renderer** | in + out | **In:** none (Renderer only consumes from others via the bus). **Out:** relays `entity:proximity`, `scan:capture_frame`, `scan:complete`, `scan:abort` to it; relays its `renderer:anomaly_density {type, sigma}` onward to UI/HUD (undesigned) once that exists. |
| **FPS Movement** | in + out | **In:** relays `movement:scan_triggered {nodePosition}` from Scan Mechanic (undesigned) to it; relays `scan:complete`/`scan:abort` to it. **Out:** relays its `player:position {x,y,z}` to all subscribers (currently Floor Plan). |
| **Floor Plan System** | in + out | **In:** relays `player:position`, `session:tick`, `scan:coverage`, `scan:started`, `scan:complete`, `scan:abort`, `entity:proximity`, `session:end` to it. **Out:** relays its `floorplan:init`, `floorplan:update`, `floorplan:reveal {roomId}`, `floorplan:loop {targetPosition, targetYaw, toRoom}` to Point Cloud Renderer, Scan Node, FPS Movement. |
| **Scan Node System** | in + out | **In:** relays `floorplan:init`, `floorplan:reveal` to it; relays `scan:started`, `scan:captured` from Scan Mechanic (undesigned) to it. **Out:** relays its `scan:complete`, `scan:abort`, `scan:coverage` (canonical), `scan:integrity_warning`, `scan:integrity_failure` to every subscriber (Point Cloud, FPS Movement, Floor Plan today; Win/Lose, UI/HUD later). |
| **Scan Mechanic** (#8, undesigned) | provisional | Expected to produce `movement:scan_triggered`, `scan:started`, `scan:captured`, `scan:capture_frame`; expected to consume `scan:complete`/`scan:abort` to know when its own locked-scan sequence should release. Contract inferred from what Point Cloud Renderer, FPS Movement, and Scan Node already declare as *their* upstream — Scan Mechanic's own GDD must confirm, not redefine, these shapes. |
| **Entity System** (#9, undesigned) | provisional | Expected to produce `entity:proximity {tier}`. Tier vocabulary (4 vs 5 tiers) is Entity System's decision per the Open Cross-System Item already logged in systems-index.md — Orchestrator relays whatever shape is declared, does not constrain it. |
| **Win/Lose & Ending** (#10, undesigned) | provisional | Expected to call `session:request_end {reason}` and consume `session:end`, `scan:coverage`, `scan:integrity_failure`. |

## Formulas

This system contains no gameplay formulas of its own. Every quantity that flows
through the bus (`coverage`, `desync_delay`, `session_escalation`, entity proximity
distances, etc.) is computed by its owning GDD (Scan Node, Floor Plan, Entity System
when authored) — Orchestrator relays the payload unchanged and never recomputes,
reinterprets, or clamps a value a producer has already emitted. This is consistent
with Core Rule 1 (registration, not invention): a formula belongs to whichever GDD's
Interactions table declares it as output.

The one numeric behavior Orchestrator does own — per-frame event ordering (Rule 4) —
is a sequencing rule, not a formula; it has no variables, no output range, and
produces no computed value. It is fully specified in Detailed Design and needs no
Formulas-section treatment.

## Edge Cases

> Event classification (latest-value cached vs. discrete fire-and-forget) is defined
> in Detailed Design Core Rule 7; several edge cases below depend on it.

- **If any event arrives while state is `SEALED`**: dropped, and a `console.warn` names
  the event and its producer. SEALED is frozen by design — Floor Plan and Scan Node
  already freeze their own mutations on `session:end` (Floor Plan AC-E05, Scan Node
  AC-SN19), so a post-seal event indicates a producer that didn't honor `session:end`;
  the drop is a safety net, the warn surfaces the offending producer for fixing.

- **If a gameplay event (e.g. `scan:complete`) arrives while state is still `LOADING`**:
  relayed normally if a subscriber exists, but Orchestrator does not advance to `ACTIVE`
  on it. `LOADING → ACTIVE` is gated solely on Floor Plan's `floorplan:init` + first
  `floorplan:update` (Core Rule 2). A scan can't complete before the roster exists
  anyway (Scan Node builds its roster from `floorplan:init`), so this is defensive — if
  it happens, the event flows but the state gate is unmoved.

- **If a subscriber registers after a latest-value event already fired**: the cached
  latest value is delivered to it immediately on subscribe (e.g. UI/HUD registering
  mid-session receives the current `scan:coverage`, current `entity:proximity` tier,
  current session state, and the `floorplan:init` roster). Discrete events are NOT
  replayed — a late-joining UI does not receive a historical `scan:complete` for a node
  scanned before it subscribed; it reads current node state from the cached
  `scan:coverage` / roster instead.

- **If a subscriber registers after `session:end` fired (state already `SEALED`)**: the
  cached session state (`SEALED`) is delivered immediately, so the subscriber knows the
  session is over. `session:end` itself, being the discrete transition marker, is also
  delivered once to a subscriber that registers during `SEALED` — this is the single
  discrete-event exception (Core Rule 7), because a system joining a sealed session must
  know sealing happened, not merely that the current state is SEALED.

- **If two events with a registered ordering override arrive in the same tick but out of
  their required order** (e.g. `floorplan:loop` queued before `floorplan:update` for the
  same reveal): Orchestrator reorders them to satisfy the override before delivery
  (Floor Plan AC-L09's "reveal before loop" holds regardless of publish order).
  Overrides are applied as a stable sort on the frame's queue, not a per-pair swap — so
  a chain of three ordered events resolves correctly, not just adjacent pairs.

- **If an event is published under a name not in the Interface Registry** (unknown/
  misspelled event): dropped, `console.error` names the unknown event and its publisher.
  No subscriber can have registered for an unregistered name, so nothing would receive
  it anyway — the error exists to catch typos and unregistered new events during
  development, per Core Rule 1 (only registered names are valid).

- **If a producer emits a latest-value event with a payload that fails its registered
  shape** (e.g. `scan:coverage` with a missing `coverage` field): Orchestrator does not
  validate payload *contents* — shape enforcement is the producer's own AC
  responsibility (each producing GDD tests its own emission shape, e.g. Scan Node
  AC-SN21). Orchestrator relays the payload as-is. This is deliberate: a validating bus
  would duplicate every producer's tests and become a second source of truth for shapes.
  The bus owns names and ordering, not field-level validation.

- **If `session:request_end {reason}` is called more than once** (e.g. Win/Lose requests
  end, then a hard failure also requests end in the same or a later frame): the first
  call flips state to `SEALED` and emits `session:end` once; every subsequent call is a
  no-op (a `console.warn` records the redundant `reason` for debugging, but state and
  `session:end` are unchanged). Single-fire, matching the SEALED terminal-state contract.

- **If `session:request_end` is called during `LOADING`** (before `ACTIVE`): honored —
  state goes `LOADING → SEALED` directly, `session:end` fires. A session can be aborted
  before it fully starts (e.g. a load failure); there is no rule requiring `ACTIVE` be
  reached first.

## Dependencies

**Upstream — what Orchestrator consumes:** none, structurally. Orchestrator is the
substrate every other system rides on; it subscribes to nothing and produces only
`session:tick` / `session:end` from its own state machine. Its "inputs" are the publish
calls other systems make into the bus, which is the bus's purpose, not a dependency.

**Downstream — every gameplay system depends on Orchestrator (hard):**

| System | Relationship | Interface |
|---|---|---|
| Point Cloud Renderer | Hard (consumer) | Receives `entity:proximity`, `scan:capture_frame`, `scan:complete`, `scan:abort`, `floorplan:update` via the bus; publishes `renderer:anomaly_density`. *(Renderer GDD lists Orchestrator as its event source — becomes non-provisional on this GDD's approval.)* |
| FPS Movement | Hard (consumer + producer) | Publishes `player:position`; receives `movement:scan_triggered`, `scan:complete`, `scan:abort`, `floorplan:loop`. *(FPS GDD lists Orchestrator — non-provisional on approval.)* |
| Floor Plan System | Hard (consumer + producer) | Publishes `floorplan:*`; receives `player:position`, `session:tick`, `scan:*`, `entity:proximity`, `session:end`. *(Floor Plan GDD's Dependencies § 2 explicitly names "Orchestrator GDD (when authored) must register the `floorplan:*` family plus inbound `player:position`, `session:tick`, `scan:*`" — this GDD satisfies that.)* |
| Scan Node System | Hard (consumer + producer) | Publishes `scan:*`; receives `floorplan:init`, `floorplan:reveal`, `scan:started`, `scan:captured`. *(Scan Node GDD's Dependencies § 2 explicitly names "Orchestrator must register the `scan:*` event family" — satisfied here.)* |
| Scan Mechanic (#8) | Hard (undesigned) | Will publish `movement:scan_triggered`, `scan:started`, `scan:captured`, `scan:capture_frame`; consume `scan:complete`/`scan:abort`. |
| Entity System (#9) | Hard (undesigned) | Will publish `entity:proximity {tier}`. |
| Win/Lose & Ending (#10) | Hard (undesigned) | Will call `session:request_end`; consume `session:end`, `scan:coverage`, `scan:integrity_failure`. |
| UI/HUD (#12), Found-Footage (#13), Audio (#6), Cycle/Meta (#11) | Hard (undesigned) | All consume via the bus; specifics deferred to their own GDDs. |

**Hard vs. soft:** there is no soft dependency here — a gameplay system either rides the
bus or cannot communicate at all. Orchestrator is the one system whose absence breaks
every other system simultaneously, which is why it sits at the Core layer and is
designed before the four systems that consume it were only provisionally able to
reference it.

**Bidirectional consistency (already satisfied):**
1. **Floor Plan GDD** — already declares the reciprocal contract in its Dependencies §
   ("Orchestrator GDD when authored must register `floorplan:*` + inbound contracts").
   ✅ No patch needed; this GDD fulfills the stated expectation.
2. **Scan Node GDD** — already declares "Orchestrator must register the `scan:*` event
   family." ✅ Fulfilled here.
3. **Point Cloud Renderer + FPS Movement GDDs** — both list Orchestrator as their event
   bus in their Interactions tables. ✅ Consistent.

**Provisional-flag cleanup (post-approval action, not a GDD edit here):** the four
sibling GDDs each tag their Orchestrator-facing interfaces "⚠️ Provisional —
Orchestrator undesigned." Once this GDD is Approved, those flags are stale. Flagged as
a follow-up: a light editorial pass to remove "provisional" from the four
approved/designed GDDs' Orchestrator references. Not done in this GDD (it only touches
Orchestrator's own file); tracked as Open Question.

## Tuning Knobs

Orchestrator has **no gameplay tuning knobs.** Every quantity a designer would tune
(session length `T_session`, desync curve, coverage weights, proximity distances,
corruption threshold) lives in the owning system's GDD, not here — Orchestrator relays
those values untouched (Formulas §). Its own behaviors — per-frame `session:tick`,
deterministic FIFO+override ordering, the `LOADING/ACTIVE/SEALED` machine — are
structural rules, not tunable values: changing them would change *correctness*, not
*balance*.

Two **development toggles** exist (dev-facing, not shipped as designer sliders):

| Toggle | Default | Purpose | Off behavior |
|---|---|---|---|
| `warnOnDroppedEvent` | `true` (dev) / `false` (prod build) | Emit the `console.warn`/`console.error` for post-SEAL events, unknown event names, and redundant `session:request_end` (Edge Cases) | Drops still happen silently; the diagnostics are suppressed in production to keep the console clean for a shipped web build |
| `cacheLatestValues` | `true` | Enable the latest-value replay cache (Core Rule 7) for late subscribers | If `false`, all events become fire-and-forget — late subscribers get nothing until the next emission. **Only for testing the no-cache path**; shipping with this off breaks mid-session UI/HUD registration |

Neither is a balance lever — both are debug/build-configuration switches.
`cacheLatestValues=false` is documented only so its behavior is defined (Edge Cases test
the cache path); it is never a shipping configuration.

**No knob interacts with any other system's tuning.** Orchestrator's determinism is a
precondition for every other system's knobs meaning anything — if event delivery were
itself tunable/nondeterministic, no downstream formula could be validated. This is why
Orchestrator is deliberately knob-free at the gameplay level.

## Visual/Audio Requirements

[To be designed]

## UI Requirements

[To be designed]

## Acceptance Criteria

[To be designed]

## Open Questions

[To be designed]
