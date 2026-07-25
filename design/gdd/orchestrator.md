# Session/Game State Orchestrator

> **Status**: Approved (round-four independent `/design-review` 2026-07-02, 5
> specialists). Prior round-three `/design-review` 2026-07-02 returned
> NEEDS REVISION; 6 blockers revised in-session (registry fidelity: `floorplan:loop`
> `toRoom` drift resolved in producer's favour + Core Rule 1 self-contradiction
> precedence clause; `scan:integrity_*` placeholder payloads replaced with declared
> field sets; mixed atomic+directed override groups given a defined `intraGroupRank`
> + new AC-OR33; arrival index operationally defined as publish-call-time with
> **next-tick deferral** for mid-delivery publishes + `subscribe()` reentrancy
> contract + AC-OR29 re-targeted to a latest-value event; `session:tick
> elapsedSeconds` defined as capped-dt game-time accumulation + new AC-OR34; new OQ9
> for DI wiring/override-table storage ADR). OQ6 (`verify-registry` tooling) round-4
> **entry condition MET** (`npm run verify:registry` → 14 pass / 0 fail / 5 skip).
> **Round 4 APPROVED**; two one-sentence addenda applied same session (AC-OR01
> evidence-note scope caveat; Rule 4 `groupAnchorIndex` single-pass). New OQ10
> (pure-atomic n≥3 chains); OQ9 scope expanded (burst-cost + render-ordering).
> **Author**: magatron02 + agents
> **Last Updated**: 2026-07-02
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
   **Self-contradicting producer precedence**: if a producing GDD's *own* citations of
   an event's shape disagree with each other (as `floorplan:loop`'s did until
   2026-07-02 — Core Rule prose vs. consumer-facing tables), the producer's **Core
   Rules / Detailed Design prose is normative** and its other tables/ACs are the ones
   in error; the conflict is still surfaced, and the producing GDD is patched to one
   shape before this registry entry is treated as verbatim-verified.

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
   **`elapsedSeconds` is capped-dt game time, not wall-clock time.** It is the running
   sum of per-frame deltas where each frame's delta is clamped to `dt_cap` (0.1 s —
   the same cap FPS Movement's Formula 1 applies to its own `dt`, and for the same
   reason: a backgrounded/restored tab must not produce a discontinuous jump).
   Consequence: a tab backgrounded for five minutes advances `elapsedSeconds` by at
   most 0.1 s on the resume frame. This keeps `elapsedSeconds` inside the
   `0–T_session` envelope Floor Plan's `session_escalation` formula declares for its
   `t` input — without the cap, a tab-restore would silently snap `e` to 1.0 and hand
   out max desync (`D_max`) for free, violating Floor Plan's "D_max only via the
   Completion Trap" structural guarantee (AC-OR34). Where `session:tick` sits
   relative to Three.js's actual `renderer.render(scene, camera)` call *within* that
   same rAF callback is **not fixed by this GDD** and is currently moot (no renderer
   subscribes to `session:tick`); it becomes a hard prerequisite for whichever future
   GDD (Point Cloud Renderer or UI/HUD) is first to drive a per-frame *visual*
   computation off `session:tick`'s `elapsedSeconds` — that GDD must pin
   tick-before-render or accept a one-frame lag. Tracked as Open Question 8.

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
     has updated and the other hasn't. This is registered as an **atomic adjacency**
     override, *not* a directed `(before, after)` pair: the two must be contiguous in
     either internal order, which a directed rank cannot express (see mechanism below).
   - Point Cloud Renderer AC-E02: `scan:complete` takes priority over `scan:abort` if
     both are somehow queued in the same frame (defensive; Scan Node's own state
     machine should make this unreachable, but Orchestrator's ordering rule doesn't
     depend on that being true).
   This rule list is **not exhaustive at authoring time** — it is extended whenever a
   future GDD (Scan Mechanic, Entity, Win/Lose) declares a same-tick ordering
   requirement between two events it produces or consumes. New entries go in this
   GDD's Interface Registry, not silently assumed by the new system.

   **Override resolution mechanism (two kinds, compiled once, applied as one stable sort).**
   A registered override is one of **two kinds**, kept separate because they encode
   different requirements:
   - **Directed order** `(before, after)` on event *names* — e.g.
     `(floorplan:update, floorplan:loop)`. Asserts `before` is delivered ahead of
     `after` whenever both are queued in the same frame.
   - **Atomic adjacency** `{a, b}` on event *names* — e.g. `{scan:coverage,
     scan:complete}`. Asserts the two are delivered **back-to-back with no unrelated
     event between them**, in *either* internal order (their producer guarantees the
     payloads are equal at emission — Scan Node AC-SN29 — so which lands first is
     immaterial; only the no-interleave requirement matters). This is deliberately
     NOT a `(before, after)` pair: a directed rank can express "before" but cannot
     express "contiguous, either order," so the two kinds are stored and compiled
     separately.

   **Compiled once, never at runtime.** The whole override set (both kinds) is
   compiled **a single time at registration / build time** — never recompiled per
   tick, and there is **no runtime `registerOverride()` API**. "Extended by a future
   GDD" (above) means the static set is re-authored and the game rebuilt, not mutated
   live. The compile produces, per event name: (a) an **override-group id** — the
   connected component reached through every directed and atomic edge the event
   touches (an event in no override is its own singleton group); and (b) an
   **intra-group rank**, assigned as follows. A group may be **mixed** — containing
   both directed and atomic edges — and the current registered set already produces
   one: `scan:complete` bridges the atomic pair `{scan:coverage, scan:complete}` and
   the directed pair `(scan:complete, scan:abort)`, so all three compile into a
   single mixed group. Rank assignment therefore covers all three group shapes:
   - **Directed members** (events touching at least one directed edge): the group's
     directed edges are topologically sorted and **linearized into a strict total
     order** (incomparable members tie-broken deterministically by registration
     order in the static set), giving each directed member a unique integer rank.
   - **Atomic-only members** (events touching only atomic edges): each **inherits
     the exact rank of its atomic partner**. Equal keys are contiguous under the
     stable sort, so adjacency holds; the pair's internal order is arrival order
     (any order satisfies the adjacency requirement — the sort is stable, so
     equal-key events keep their relative arrival positions).
   - **Singletons**: rank `0`.
   Two compile-time rejection rules, both design errors with no runtime fallback:
   the directed-edge set **MUST be acyclic** (`A→B` and `B→A`, directly or
   transitively, is a contradictory requirement — there is no correct order to fall
   back to); and an **atomic edge between two members that hold distinct directed
   ranks** in the same group (e.g. atomic `{A, C}` alongside directed `A→B→C`) is
   equally contradictory — adjacency and interposition cannot both hold — and is
   rejected at compile. An atomic-only member with atomic edges to **two partners of
   different ranks** is rejected for the same reason.

   **Delivery is one stable sort on a single compound key.** The whole frame's queue —
   override groups and unrelated singletons together — resolves in one pass, never by
   per-pair swaps and never by an ad-hoc comparator (an ad-hoc pairwise comparator is
   forbidden: it is not guaranteed to be a strict weak ordering and silently breaks
   past three events). Each queued event's sort key is `(groupAnchorIndex, intraGroupRank)`:
   - `groupAnchorIndex` = the **minimum arrival index among the event's override-group
     members actually queued this tick** (group *membership* is the static compile-time
     set; the minimum is taken only over members present in the current tick's queue —
     an event whose group-mates didn't fire this tick anchors at its own arrival index,
     behaving as a singleton for that tick). **This minimum is computed in the same
     single pass that snapshots the tick's queue — one `Map` from override-group id to
     its minimum arrival index, populated while iterating the queue once — so per-event
     key assignment stays O(1) and the "no graph work in the frame budget" claim below
     holds literally. A naive per-event scan of the queue for group-mates would be
     O(n·groupSize) and is explicitly NOT the intended implementation.** Arrival indices
     are unique, so
     two distinct groups can never tie on this — a group is delivered as a contiguous
     block slotted at its earliest-arriving member's position, and every unrelated
     event keeps its arrival position relative to that block.
   - `intraGroupRank` = the compile-time rank defined above (linearized topological
     rank for directed members; inherited partner rank for atomic-only members —
     equal keys stay contiguous and keep arrival order under the stable sort; `0`
     for a singleton).
   Stable-sorting the queue by this key ascending delivers: directed chains of any
   length in correct relative order (AC-OR13/OR14), atomic groups contiguous (AC-OR11),
   and all unrelated events in FIFO arrival order around them (AC-OR09/OR14). Because
   group ids and ranks are precomputed at build time, per-event key lookup is O(1) and
   the only per-frame cost is one stable sort of that frame's queued events — **no graph
   work ever runs inside the frame budget.** (Events touching no override fall through
   to pure arrival-order FIFO, the Rule 4 default, as the singleton case of this key.)

   **Arrival index assignment and mid-delivery publishes (next-tick deferral).** An
   event's arrival index is assigned **at `publish()` call time**, monotonically per
   session. The tick's delivery queue is **snapshotted and sorted once** when the
   delivery pass begins; an event published *during* that pass (from inside a
   subscriber's handler — e.g. Scan Node reacting to `scan:captured` by publishing
   `scan:complete`) keeps its publish-time arrival index but **joins the next tick's
   queue**, never the in-flight one. This preserves "one stable sort per tick"
   exactly, makes delivery order fully deterministic, and structurally prevents two
   handlers from publishing each other into an unbounded same-tick loop (a cascade
   advances at most one hop per tick — ~16 ms per hop at 60 FPS, imperceptible). The
   sole exception is `session:end`, which Core Rule 2 requires be emitted
   synchronously at the moment of sealing, bypassing the queue.

   **`subscribe()` is synchronously reentrant during a delivery pass.** Registration
   takes effect immediately: the new subscriber receives any queued event whose
   delivery moment occurs *after* its registration within the same pass, and — for
   latest-value events (Rule 7) — the on-subscribe cached replay delivers the value
   cached *at registration time* (the cache is written at each emission's delivery
   moment, so a mid-pass subscriber may receive the prior cached value as replay and
   the in-flight emission live). Per emission, any subscriber receives **at most one
   delivery** — never the same emission twice via replay and live delivery (AC-OR29).

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
     current value on subscribe, not silence. If a latest-value event fires more than
     once in a single tick (e.g. `entity:proximity` crossing two tiers in one frame,
     once Entity System exists), the cached value is the **last write in delivery
     order** within that tick — a subscriber joining after the tick reads that final
     value, never an intermediate one.
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
| **Point Cloud Renderer** | in + out | **In:** none (Renderer only consumes from others via the bus). **Out:** relays `entity:proximity`, `entity:spawn {type, position}`, `entity:despawn {}` (producer: Entity System #9), `scan:capture_frame`, `scan:complete`, `scan:abort` to it; relays its `renderer:anomaly_density {sigma}` onward to UI/HUD (undesigned) once that exists. *(`entity:spawn`/`despawn` + untyped anomaly payload added 2026-07-15, Point Cloud Renderer design-review — the registry predated Entity System's GDD.)* |
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
  the drop is a safety net, the warn surfaces the offending producer for fixing. The
  warn is **throttled to once per event *name* per session**: a producer that keeps
  firing every frame post-seal (e.g. FPS Movement's per-frame `player:position`) must
  not flood the console 60×/s — the first drop of each name warns, subsequent drops of
  that same name are silent.

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

- **If `session:request_end` and Floor Plan's dual-init (`floorplan:init` + the first
  `floorplan:update`) all resolve in the *same* tick** (abort-on-load-failure — Floor
  Plan detects a fatal seed error the same frame it emits init): `session:request_end`
  **takes precedence over the `LOADING → ACTIVE` gate**, in any arrival order within
  that tick. State goes `LOADING → SEALED` directly, `ACTIVE` is never entered, and no
  `session:tick` fires that tick — even though the dual-init condition (Core Rule 2 /
  AC-OR03) is *also* satisfied. Rationale: an aborting session must not transiently
  enter `ACTIVE` and emit a stray frame event, so AC-OR28's "`LOADING → SEALED`
  directly" holds regardless of what else the tick contains. This is a state-machine
  precedence rule, not an arrival-order one: it is order-independent so the outcome is
  deterministic. (`floorplan:init`/`floorplan:update` in that tick land into a sealing
  state and are handled per the post-SEAL drop rule above.)

## Dependencies

**Upstream — what Orchestrator consumes:** none, structurally. Orchestrator is the
substrate every other system rides on; it subscribes to nothing and produces only
`session:tick` / `session:end` from its own state machine. Its "inputs" are the publish
calls other systems make into the bus, which is the bus's purpose, not a dependency.

**Downstream — every gameplay system depends on Orchestrator (hard):**

| System | Relationship | Interface |
|---|---|---|
| Point Cloud Renderer | Hard (consumer) | Receives `entity:proximity`, `entity:spawn`, `entity:despawn`, `scan:capture_frame`, `scan:complete`, `scan:abort`, `floorplan:update` via the bus; publishes `renderer:anomaly_density {sigma}`. *(Renderer GDD lists Orchestrator as its event source — becomes non-provisional on this GDD's approval.)* |
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

**Instantiation & test isolation (implementation constraint, per `coding-standards.md`).**
The bus is **constructor-injected and passed by reference**, never imported as a
module-level singleton (`coding-standards.md` mandates DI over singletons, all public
methods unit-testable). Both toggles above are **per-instance constructor parameters**,
not global mutable state. This is load-bearing for testability: every AC-OR test
constructs a **fresh Orchestrator instance**, so no toggle (e.g. `cacheLatestValues=false`
in AC-OR30) and no cached latest-value or session state leaks across tests, and no AC
depends on execution order. A singleton bus would make most of the 34 ACs
order-dependent and would block every consuming system from mocking the bus in its own
unit tests.

**No knob interacts with any other system's tuning.** Orchestrator's determinism is a
precondition for every other system's knobs meaning anything — if event delivery were
itself tunable/nondeterministic, no downstream formula could be validated. This is why
Orchestrator is deliberately knob-free at the gameplay level.

## Visual/Audio Requirements

This system produces **no visual or audio output of any kind.** It is the message
bus and session-state machine — every visible/audible effect belongs to the system
that owns the data being relayed (Point Cloud Renderer's colours, Floor Plan's
dollhouse, future UI/HUD's error messages, future Audio System's cues).
Orchestrator's only observable "output" is *timing* — the order and cadence at
which it delivers events — which is a Detailed Design / Acceptance Criteria
concern, not a Visual/Audio one.

*No art-director/audio-director consultation needed — Foundation/Infrastructure
layer, no visual or audio surface exists to direct.*

## UI Requirements

This system has **no UI surface of its own.** It exposes no screen, panel, or
diegetic element. Its only interface is the publish/subscribe API other systems'
code calls into — not a player-facing UI at all.

*No `/ux-design` spec required for this system.*

## Acceptance Criteria

> 34 criteria. **Logic** = pure bus mechanics, unit-testable with a fake
> publisher/subscriber. **Integration** = encodes a cross-GDD contract (cites a
> sibling GDD's own AC). Almost all are **BLOCKING**; the sole **ADVISORY** item is
> AC-OR30, which exercises the `cacheLatestValues=false` dev/test path that never
> ships (a break there cannot regress the player build, only a test tool).
> Orchestrator has otherwise no visual/perf surface (matching Point Cloud/Floor
> Plan/Scan Node precedent).
>
> **Core Rule 5** (no direct imports between gameplay systems) has no AC here — it
> is an architectural constraint enforced by code review / a static import-graph
> check at implementation time, not a runtime-observable behavior. Not silently
> dropped; explicitly out of AC scope.
>
> **`referenced_by` population** (Core Rule 6) is a documentation/registry-
> maintenance concern tracked by the `/design-system` Phase 5 process, not a
> runtime AC.

### Registration & Interface Contract

> **Test evidence for AC-OR01 / AC-OR02.** Unlike every other AC in this document,
> these two are **not** runtime behaviours exercisable by a Vitest fake-bus test —
> they assert an equivalence between `entities.yaml`'s `events:` section and the
> "Interactions with Other Systems" prose in four separate producing GDDs. They are
> satisfied by a **documentation-audit artifact**, not a unit test: a
> `/consistency-check` run (or an equivalent `verify-registry` script) that extracts
> each event's payload field set from both the registry and its producing GDD and
> reports **zero field-set deltas**. **Until OQ6's structured `payload_fields` schema
> lands, this audit is human-executed** — a reviewer hand-compares each event's field
> set between the registry and its producing GDD. **The manual audit's track record is
> poor**: the 2026-07-01 rounds each believed they had confirmed zero deltas, and the
> 2026-07-02 round-3 review found two live deltas both had missed (`floorplan:loop`'s
> `toRoom` drift; `scan:integrity_*` registered as un-comparable `"{...}"`
> placeholders) — three rounds running, every round's blockers clustered at this
> boundary. Per creative-director ruling (round 3), **OQ6's `verify-registry` script
> is now a round-4 entry condition**, not a recommendation: the next review verifies
> machine-checked output, not a fourth human sweep. Gate evidence = that pass/fail
> report, filed like a Config/Data smoke check, not a `tests/unit/` suite.
> **Scope caveat (round-4 review).** `verify-registry` compares **top-level payload
> field names** and flags producer self-contradiction — it does **not** diff *nested*
> field names (`roomMeta:[{id,type}]` collapses to `roomMeta` before comparison). This
> is sufficient today because no active (non-provisional) event carries a nested
> payload shape at divergent-rename risk; the "14 pass / 0 fail" result therefore
> proves top-level parity + self-contradiction absence, which is the exact failure
> class (the `floorplan:loop` 4-vs-3 split) that beat three human rounds — **not** full
> field-tree parity. A future event with nested payload fields must have the tool
> extended to diff nested names before its AC-OR01 pass counts as verbatim-complete.

**AC-OR01 — Registry shapes match producing GDDs verbatim**
GIVEN the Interface Registry entry for any event, WHEN compared against the
"Interactions with Other Systems" table in that event's producing GDD, THEN the
event name and payload field set are identical (no renamed fields, no added/
dropped fields). **BLOCKING (Integration)**

**AC-OR02 — Every Core Rule 1–7 has a registry entry**
GIVEN the Interface Registry in `entities.yaml`, WHEN checked against Core Rules
1–7 of this GDD, THEN every event named in any Core Rule (the full `session:*`,
`scan:*`, `floorplan:*`, `entity:*`, `player:*`, `movement:*`, `renderer:*` family)
has a corresponding registry entry — no rule references an event absent from the
registry. **BLOCKING (Integration)**

### Session Lifecycle

**AC-OR03 — LOADING → ACTIVE gated on Floor Plan's dual init events**
GIVEN state `LOADING`, WHEN both `floorplan:init` and the first `floorplan:update`
have been received, THEN state transitions to `ACTIVE` within the same frame;
WHEN only one of the two has arrived, THEN state remains `LOADING`. **BLOCKING
(Integration)**

**AC-OR04 — session:end fires exactly once, synchronously before SEALED**
GIVEN state `ACTIVE`, WHEN `session:request_end {reason}` is received, THEN
`session:end` is emitted exactly once, synchronously, and state is `SEALED`
immediately after — no event can be delivered between the emission and the state
flip. **BLOCKING (Logic)**

**AC-OR05 — SEALED is terminal under further input**
GIVEN state is `SEALED`, WHEN any further event is processed — a second
`session:request_end`, a normal gameplay event (e.g. `scan:complete`), or an event
with no registered override — THEN state reads `SEALED` both immediately after
processing and after 3 further `requestAnimationFrame` ticks; no code path
transitions state away from `SEALED`. **BLOCKING (Logic)**

### Continuous Events & Ordering

**AC-OR06 — player:position is relayed unmodified, no envelope added**
GIVEN FPS Movement publishes `player:position {x,y,z}`, WHEN a subscriber's
handler receives it, THEN the payload's values are byte-identical to what was
published AND its key set is exactly `{x,y,z}` — no Orchestrator-added metadata
(timestamp, sequence id, source tag) is present. **BLOCKING (Logic)**

**AC-OR07 — session:tick fires once per frame, after player:position**
GIVEN state `ACTIVE`, WHEN one `requestAnimationFrame` tick completes, THEN
exactly one `session:tick {elapsedSeconds}` has been emitted, and it was
delivered strictly after that frame's `player:position`. **BLOCKING (Logic)**

**AC-OR08 — session:tick's frame position is structural, immune to publish order**
GIVEN some other system attempts to publish an event before `player:position` in a
frame's queue, WHEN that frame resolves, THEN delivery order is still exactly
`player:position` (1st), `session:tick` (2nd), then all other queued events (3rd+)
— the early-published unrelated event does not preempt position or tick.
**BLOCKING (Logic)**

**AC-OR09 — Global FIFO for unregistered pairs**
GIVEN two events with no registered ordering override arrive in the same tick,
WHEN Orchestrator delivers them, THEN they are delivered in their exact publish
order. **BLOCKING (Logic)**

**AC-OR10 — Registered override: floorplan:update before floorplan:loop**
GIVEN both `floorplan:update` (reveal) and `floorplan:loop` are queued in the same
tick for the same reveal, WHEN Orchestrator delivers them, THEN `floorplan:update`
is delivered first regardless of publish order (Floor Plan AC-L09). **BLOCKING
(Integration)**

**AC-OR11 — Registered override: scan:coverage / scan:complete atomicity, adversarial interleave**
GIVEN a tick queues, in publish order: `unrelatedA`, `scan:complete`,
`unrelatedB`, `scan:coverage`, `unrelatedC` (where `scan:coverage`/`scan:complete`
fire from the same `scan:captured` resolution and are registered as an **atomic
adjacency** override), WHEN Orchestrator delivers the tick, THEN `scan:coverage` and
`scan:complete` are delivered **back-to-back with no unrelated event between them**,
the atomic block is slotted at the group's earliest-arriving member (`scan:complete`,
arrival index 1), and the three unrelated events keep arrival order around it — i.e.
delivery is `unrelatedA, [scan:coverage · scan:complete in either internal order],
unrelatedB, unrelatedC`. The pair's *internal* order is unconstrained (Scan Node
AC-SN29 makes their payloads equal at emission); only the adjacency (no interleave)
and the block's anchor position are asserted. **BLOCKING (Integration)**

**AC-OR12 — Registered override: scan:complete before scan:abort**
GIVEN both `scan:complete` and `scan:abort` are queued in the same tick, WHEN
Orchestrator delivers them, THEN `scan:complete` is delivered first (Point Cloud
Renderer AC-E02, defensive). **BLOCKING (Integration)**

**AC-OR13 — Override chain resolves via stable sort, not adjacent-pair swap**
GIVEN three events with a registered order A→B→C arrive queued as C, A, B, WHEN
Orchestrator delivers them, THEN the delivery order is A, B, C. **BLOCKING
(Logic)**

**AC-OR14 — Override chain does not disturb unrelated FIFO events in the same tick**
GIVEN a tick queues, in publish order: `unrelatedA, C, unrelatedB, A, B` (where
A→B→C is a registered 3-chain override per AC-OR13), WHEN the tick resolves, THEN
delivery order is `unrelatedA, A, B, C, unrelatedB` — the chain resolves into
correct relative order while both unrelated events retain their original relative
position around it. **BLOCKING (Logic)**

### Event Caching (Latest-Value vs. Discrete)

**AC-OR15 — Latest-value event replayed to a late subscriber**
GIVEN `scan:coverage` has already fired at least once, WHEN a new subscriber
registers afterward, THEN it immediately receives the most recent `scan:coverage`
payload without waiting for the next emission. **BLOCKING (Logic)**

**AC-OR16 — session:tick is a cached latest-value event**
GIVEN 5 `session:tick` events have fired (`elapsedSeconds` currently 5.0), WHEN a
new subscriber registers, THEN it immediately receives `session:tick
{elapsedSeconds: 5.0}` on subscribe, without waiting for the next frame.
**BLOCKING (Logic)**

**AC-OR17 — Current session state is cached for a subscriber joining mid-ACTIVE**
GIVEN state is `ACTIVE` (not yet `SEALED`), WHEN a new subscriber registers for
session-state, THEN it immediately receives `ACTIVE` on subscribe. **BLOCKING
(Logic)**

**AC-OR18 — Discrete event is NOT replayed to a late subscriber**
GIVEN `scan:complete` fired for node N before a subscriber registered, WHEN that
subscriber registers afterward, THEN it does **not** receive a replay of that
`scan:complete`; it must read current state from a latest-value event instead
(e.g. `scan:coverage`). **BLOCKING (Logic)**

**AC-OR19 — session:end is the sole discrete exception**
GIVEN state is `SEALED` (session:end already fired), WHEN a new subscriber
registers, THEN it immediately receives one `session:end` delivery, even though
`session:end` is classified discrete. **BLOCKING (Logic)**

**AC-OR20 — floorplan:init is cached as a one-time roster**
GIVEN `floorplan:init` has fired, WHEN a subscriber registers afterward, THEN it
receives the cached roster payload immediately. **BLOCKING (Logic)**

**AC-OR21 — A second floorplan:init is rejected, cached roster never changes**
GIVEN `floorplan:init` has already fired once this session, WHEN a second
`floorplan:init` is published, THEN Orchestrator does **not** update the cached
roster, does **not** relay it to any subscriber, and (with
`warnOnDroppedEvent=true`) `console.warn` names the rejected re-fire. Protects
Scan Node's roster-invariant (Scan Node AC-SN14) at the bus level, not just by
sibling-GDD convention. **BLOCKING (Logic)**

### Edge Cases

**AC-OR22 — Post-SEAL event is dropped with a named warning**
GIVEN state `SEALED`, WHEN any event is published, THEN it is not delivered to
any subscriber, and (with `warnOnDroppedEvent=true`) `console.warn` names both
the event and its producer. **BLOCKING (Logic)**

**AC-OR23 — Post-SEAL drop and late-SEALED-subscriber replay don't cross-contaminate, same frame**
GIVEN state is `SEALED` and `session:end` already fired once, WHEN in the same
frame (a) a new subscriber registers for `session:end` (triggering AC-OR19's
replay) AND (b) an unrelated event (e.g. `scan:coverage`) is published post-seal
(triggering AC-OR22's drop+warn), THEN the late subscriber receives exactly one
`session:end` delivery, the dropped event triggers exactly one `console.warn`
naming it, and neither path's count is affected by the other. **BLOCKING
(Integration)**

**AC-OR24 — LOADING-state gameplay event relays without advancing state**
GIVEN state `LOADING`, WHEN a gameplay event (e.g. `scan:complete`) is published
with an existing subscriber, THEN it is delivered normally, and state remains
`LOADING` (only AC-OR03's dual-init condition advances it). **BLOCKING (Logic)**

**AC-OR25 — Unknown event name is dropped with a named error**
GIVEN an event name not present in the Interface Registry, WHEN it is published,
THEN it is not delivered to any subscriber, and (with `warnOnDroppedEvent=true`)
`console.error` names the unknown event and its publisher. **BLOCKING (Logic)**

**AC-OR26 — Malformed payload is relayed as-is, silently (distinct from an unknown event)**
GIVEN a *registered* event published with a payload missing a documented field,
WHEN Orchestrator processes it, THEN the subscriber's handler is **invoked exactly
once with the same malformed payload unchanged** — no default-filling or field
injection occurs, no error propagates to the publisher, and (unlike AC-OR25) **no
`console.error` fires**, since the event name itself is valid; only unregistered
*names* are logged as errors. **BLOCKING (Logic)**

**AC-OR27 — Redundant session:request_end is a single no-op**
GIVEN `session:request_end` has already flipped state to `SEALED` once, WHEN a
second `session:request_end {reason}` arrives (same or later frame), THEN state
remains `SEALED`, no second `session:end` is emitted, that frame's other
scheduled emissions (e.g. `session:tick`) proceed normally, and (with
`warnOnDroppedEvent=true`) `console.warn` records the redundant reason.
**BLOCKING (Logic)**

**AC-OR28 — session:request_end during LOADING is honored directly**
GIVEN state `LOADING`, WHEN `session:request_end {reason}` is received, THEN
state transitions `LOADING → SEALED` directly (without passing through `ACTIVE`),
and `session:end` fires. **BLOCKING (Logic)**

**AC-OR29 — Mid-pass subscriber receives a queued latest-value emission exactly once**
GIVEN `scan:coverage` (latest-value, Rule 7) is queued this tick but not yet
delivered, WHEN a new subscriber to `scan:coverage` registers from inside another
subscriber's handler during the same tick's delivery pass (Rule 4's `subscribe()`
reentrancy contract), THEN: (a) the on-subscribe replay, if any, delivers only the
*previously cached* value (the cache is written at delivery time, and this tick's
emission has not yet delivered); (b) the subscriber receives the queued emission
**exactly once, live**, when its delivery moment arrives — never twice (once as
replay, once live); and (c) the delivery ordering for already-registered
subscribers is unaffected by the new registration. **BLOCKING (Integration)**
*Test note: this is deliberately a reentrancy test — the mid-pass moment is
constructed by calling `subscribe()` synchronously from inside another subscriber's
handler, which Rule 4 guarantees is legal. It is not constructible as a black-box
register-then-assert. Discrete events need no counterpart AC: per AC-OR18 a discrete
event is never replayed, so a mid-pass discrete subscriber trivially receives only
deliveries occurring after its registration.*

**AC-OR30 — cacheLatestValues=false disables all replay**
GIVEN the `cacheLatestValues` toggle is `false`, WHEN a subscriber registers after
any latest-value event has fired, THEN it receives nothing until the next live
emission — no cached replay occurs, including for `floorplan:init`,
`session:tick`, and `SEALED` state/`session:end`. **ADVISORY (Config/Data)** — this
exercises the no-cache dev/test path only; `cacheLatestValues=false` is never a
shipping configuration (Tuning Knobs), so a break here cannot cause a player-facing
regression, only a broken test tool. Every other AC-OR item assumes the shipping
default `cacheLatestValues=true`.

**AC-OR31 — request_end short-circuits the LOADING→ACTIVE gate in a shared tick**
GIVEN state `LOADING`, WHEN `floorplan:init`, the first `floorplan:update`, and
`session:request_end {reason}` are all published within the same tick (in **any**
arrival order), THEN after the tick resolves state is `SEALED`, `ACTIVE` was never
entered, exactly one `session:end` was emitted, and zero `session:tick` events fired
that tick (Core Rule 2 precedence; Edge Cases — same-tick abort). **BLOCKING (Logic)**

**AC-OR32 — floorplan:update is delivered as exactly one emission per mutating call**
GIVEN a single Floor Plan mutating call produces one `floorplan:update`, WHEN
Orchestrator processes it, THEN subscribers receive **exactly one** `floorplan:update`
delivery for that call — Orchestrator never splits it into multiple deliveries and
never coalesces it with another mutation's `floorplan:update` (Floor Plan AC-C06;
Rule 4 override list). **BLOCKING (Integration)**

**AC-OR33 — Mixed atomic+directed override group resolves correctly when fully co-queued**
GIVEN the registered mixed group (atomic `{scan:coverage, scan:complete}` + directed
`(scan:complete, scan:abort)` — one connected component per Rule 4's compile), WHEN a
tick queues, in publish order: `scan:abort`, `unrelatedA`, `scan:coverage`,
`scan:complete`, THEN delivery is `[scan:coverage · scan:complete in either internal
order], scan:abort, unrelatedA` — the atomic pair is back-to-back with no event
between them (AC-OR11's adjacency), `scan:complete` precedes `scan:abort` (AC-OR12's
directed order), the whole group is delivered as one contiguous block anchored at its
earliest-arriving member's position (`scan:abort`, arrival index 0), and `unrelatedA`
keeps its arrival position relative to the block. Both AC-OR11 and AC-OR12 hold
simultaneously in a single tick. **BLOCKING (Logic)**

**AC-OR34 — elapsedSeconds is capped-dt game time, immune to tab-restore jumps**
GIVEN state `ACTIVE` and `elapsedSeconds` currently `E`, WHEN the next
`requestAnimationFrame` fires after a real inter-frame gap of `G` seconds where
`G > dt_cap` (e.g. `G = 300` after a backgrounded tab resumes), THEN that frame's
`session:tick` carries `elapsedSeconds = E + dt_cap` exactly — the wall-clock gap
never leaks into the payload, and a downstream `t/T_session` consumer (Floor Plan
`session_escalation`) observes at most a `dt_cap` advance per frame. **BLOCKING
(Logic)**

## Open Questions

1. **Provisional-flag cleanup across 4 sibling GDDs** — Point Cloud Renderer, FPS
   Movement, Floor Plan, and Scan Node each tag their Orchestrator-facing interfaces
   "⚠️ Provisional — Orchestrator undesigned." Once this GDD is Approved, those flags
   are stale. A light editorial pass should remove them and replace with a citation
   to this GDD. *Owner: whoever runs this GDD's post-approval pass. Resolve
   immediately after Approval — cheap, mechanical, no design risk.*

2. **Session-end trigger source is still provisional** — `session:request_end
   {reason}` is designed as an intake any future system can call, but no system calls
   it yet (Win/Lose & Ending, #10, is undesigned). This GDD's contract (Core Rule 2,
   AC-OR04/27/28) is fully specified and testable *now*, independent of who calls it
   — but the actual trigger conditions (coverage threshold reached, entity captured,
   movement violation, corruption threshold) aren't decided until Win/Lose exists.
   *Owner: whoever designs Win/Lose (#10). No blocker to Orchestrator's own
   approval.*

3. **`entity:proximity` tier vocabulary (4 vs. 5)** — already logged in
   `systems-index.md` Open Cross-System Items. Orchestrator relays whatever shape
   Entity System (#9) declares; it does not constrain or decide the tier set.
   Restated here for visibility since Orchestrator's Interactions table references
   `entity:proximity` by name. *Owner: Entity System (#9) author. Resolve when Entity
   is designed.*

4. **Core Rule 5 enforcement tooling** — "no direct imports between gameplay
   systems" is a code-level constraint with no runtime AC (see Acceptance Criteria
   preamble). Should this be enforced by a lint rule / dependency-graph check (e.g.
   `dependency-cruiser` or a custom ESLint rule) at implementation time, or left to
   code review discipline? *Owner: lead-programmer / devops-engineer. Resolve before
   Production tooling setup, not blocking for this GDD's approval.*

5. **`referenced_by` registry maintenance** — AC-OR02 tests that every Core Rule's
   events are *registered*, but keeping each entry's `referenced_by` list current as
   new GDDs consume an event is a process discipline (`/design-system` Phase 5), not
   a runtime guarantee. No action needed now; noted so it isn't assumed automated.
   *Owner: whoever runs `/design-system` for future consuming GDDs.*

6. **Registry payload-drift prevention (structural)** — the 2026-07-01 independent
   review found two events (`scan:abort`, `floorplan:init`) whose `entities.yaml`
   payloads had drifted from their producing GDDs (corrected in the same session).
   Root cause: the registry stores `payload:` as free text, so nothing machine-checks
   AC-OR01's verbatim-match invariant. Recommended hardening: either restructure
   `payload` as a structured field list (e.g. `payload_fields: [nodeId, coverage]`) or
   add a `verify-registry` step to `/consistency-check` that diffs field sets between
   the registry and each producing GDD (the AC-OR01/02 evidence artifact).
   **RESOLVED (round 3, same session).** The round-4 entry condition — a scripted
   `verify-registry` diff — now exists at `tools/verify-registry.mjs` (`npm run
   verify:registry`). It parses the existing free-text `payload:` with a balanced-
   brace reader (so the separate `payload_fields:` schema was unnecessary — the
   registry stays single-source), extracts each event's field set, diffs it against
   the producing GDD's declared shape, and additionally flags **producer self-
   contradiction** (the exact failure mode that hid `floorplan:loop`'s 4-vs-3
   `toRoom` split for three rounds). On first run it caught two further live drifts
   the manual audits of rounds 1–3 had all missed — `scan:complete` restated as a
   `{nodeId}` subset in two Scan Node consumer rows, and `renderer:anomaly_density`
   written three inconsistent ways in Point Cloud (`{type,sigma}` / `{type}` /
   `{type, sigma≈5.0}`) — both normalized. It now reports **14 pass, 0 fail, 5 skip
   (provisional)**. Round 4 verifies this script's output, not a fourth human sweep.
   *Follow-up: fold `verify:registry` into CI once `/test-setup` lands a workflow
   (no CI exists yet — YAGNI until then). Owner: whoever runs `/test-setup`.*

7. **Rule 5 enforcement needs an ADR before first bus implementation** — "no direct
   imports between gameplay systems" (Core Rule 5) is the architectural thesis of this
   GDD but has no runtime AC and no forcing function. Per the 2026-07-01 review
   (creative-director synthesis), an `/architecture-decision` ADR must pin the
   enforcement mechanism (ESLint import-boundary rule vs. `dependency-cruiser` vs.
   review checklist) as a **blocking prerequisite to the first system implementing
   against the bus** — not to this GDD's approval. Supersedes the earlier framing of
   OQ4 as an open tooling choice. *Owner: lead-programmer / devops-engineer.*

8. **`session:tick` vs. `renderer.render()` ordering within the rAF callback** — this
   GDD fixes the Orchestrator's *internal* per-frame order (`player:position` →
   `session:tick` → queued events) but not where Three.js's actual scene render sits
   relative to `session:tick` in the same `requestAnimationFrame` callback. Moot today
   (no renderer subscribes to `session:tick`). Becomes a **blocking prerequisite for
   whichever future GDD (Point Cloud Renderer or UI/HUD) first drives a per-frame
   visual computation off `session:tick`'s `elapsedSeconds`** — that GDD must pin
   tick-before-render or explicitly accept a one-frame lag. Not blocking this GDD's
   approval. *Owner: first `session:tick`-consuming visual GDD (Renderer #1 or UI/HUD
   #12).*

9. **Bus wiring + override-table storage need an ADR before first bus implementation**
   — two implementability questions this GDD deliberately does not answer (round-3
   review, lead-programmer; scoped by creative-director as architecture-phase work,
   mirroring OQ7's framing): (a) **who constructs the one production Orchestrator
   instance and how each consuming system obtains the reference** — "constructor-
   injected, never a singleton" (Tuning Knobs) names the constraint but not the
   wiring pattern; with no DI library in the allowed list, the manual pattern (entry-
   point module constructing the instance and passing it via constructor vs.
   `init(bus)` for flat function modules) *is* the architecture, and five
   implementers left unguided will invent five patterns. (b) **where the static
   override set lives as a file** — Rule 4 pins the compile-once lifecycle but not
   whether the set is a JS literal in `orchestrator.js`, an adjacent data module, or
   build-time codegen from `entities.yaml`; these fail differently (build-time vs.
   page-load). Both answers go in the same `/architecture-decision` ADR as OQ7's
   import-boundary enforcement — and note the OQ7 lint mechanism *depends on* the
   wiring answer (you cannot write an import-boundary rule until you know how the
   reference flows). **Blocking prerequisite to the first system implementing against
   the bus — not to this GDD's approval.** *Owner: lead-programmer /
   technical-director.*
   **Round-4 addition (engine-programmer).** The same ADR must also (c) **bound the
   per-tick delivered-queue size** (or adopt the round-1-deferred perf-tripwire AC) —
   Rule 4's delivery is one stable sort, O(n log n) with `n` structurally unbounded,
   and this GDD's own scan-complete cascade / multi-node `floorplan:reveal` bursts can
   spike `n`; and (d) **pin where Orchestrator's full delivery pass sits relative to
   Three.js `renderer.render()`** inside the rAF callback. (d) overlaps OQ8 but is
   already live *today*: `player:position` → FPS Movement's PointerLockControls camera
   mutation runs every frame *before* `session:tick`, so the delivery-pass-vs-render
   ordering exists now, not only when a future GDD consumes `session:tick`. Both are
   perf/timing, not correctness — deferred to the ADR, not blocking this GDD's approval.

10. **Pure-atomic override chains of 3+ events (n≥3, no directed edge) are undefined.**
    Rule 4's rank assignment says an atomic-only member "inherits the exact rank of its
    atomic partner" (**singular**), and its compile-time rejections presuppose a directed
    edge somewhere in the group to seed integer ranks. A pure-atomic triangle
    (`{A,B}` + `{B,C}` atomic, **no** directed edge anywhere) leaves `B` with two atomic
    partners and no rank source — the doc states neither a resolution (one shared-rank
    connected component) nor a compile-time rejection. **Cannot fire today**: no active
    registered event forms a 3-way pure-atomic group — the one live bridge
    (`scan:complete`) is a *mixed* group, seeded by the `(scan:complete, scan:abort)`
    directed edge, and is covered by AC-OR33. This becomes **blocking the instant Entity
    (#9) or Win/Lose (#10) registers a 3-way atomic requirement**: resolve it then by
    defining pure-atomic n≥3 as either a single shared-rank component (transitive
    adjacency) or an explicit compile-time rejection, and add a fixture. *Owner:
    whichever GDD first registers atomic edges among 3+ events. This is a design-gate on
    that GDD, not on this one.*
