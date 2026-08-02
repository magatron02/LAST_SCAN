# ADR-0008: UI/HUD — View-Model Transport, Dirty-Check & Presentation-Layer Wiring

## Status
Proposed

## Date
2026-08-01

## Last Verified
2026-08-01

## Decision Makers
magatron02 (owner) + architecture-review follow-up

## Summary
Pins UI/HUD's implementation architecture: composition-root DI extended from "just the bus"
(ADR-0001) to five sibling-system references, `src/ui/` as a zone permanently outside the
ESLint cross-system-import ban, a `structuralEqual` dirty-check for the mandatory per-tick
view-model comparison, a microtask-deferred end-of-tick audio-evaluation mechanism, and
Win/Lose's ending-record transport as a pull method. Resolves the transport seam ADR-0006(g)
and ADR-0007(h) both deferred here, and supersedes ADR-0006(g)'s `floorplan:viewmodel` event
recommendation. LOW engine risk — pure DOM/JS, no Three.js API surface.

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Three.js r171 — no direct Three.js API surface; UI/HUD is DOM/CSS rendered over the WebGL canvas |
| **Domain** | UI |
| **Knowledge Risk** | LOW — plain JS/DOM, no engine API at risk. `docs/engine-reference/three/` has no `modules/ui.md` because Three.js has no UI subsystem this project uses — not a documentation gap for this ADR's purposes. |
| **References Consulted** | `design/gdd/ui-hud.md` (all 10 Core Rules, Interactions, Testability requirements, 60 ACs), `docs/architecture/adr-0001-orchestrator-bus-wiring.md`, `docs/architecture/adr-0006-floor-plan.md` (b)/(g), `docs/architecture/adr-0007-scan-node.md` (h), `docs/registry/architecture.yaml` (`bus_wiring` api_decision, forbidden patterns) |
| **Post-Cutoff APIs Used** | None. `queueMicrotask` (baseline since 2018) and `Object.is`/strict equality (ES2015 and earlier) are both long-stable. |
| **Verification Required** | None (logic + DOM structure; validated by Vitest, and by a jsdom/Testing Library harness once TR-ui-009/Open Q#5 is resolved) |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Accepted — composition-root pattern this ADR extends), ADR-0006 (Proposed — `getDollhouseViewModel()` interface), ADR-0007 (Proposed — `getNodeLedgerViewModel()` interface) |
| **Enables** | Resolves the view-model transport seam ADR-0006(g) and ADR-0007(h) both deferred; unblocks UI/HUD implementation stories |
| **Blocks** | First UI/HUD implementation story (stays auto-blocked per `docs/CLAUDE.md` until this ADR reaches Accepted) |
| **Ordering Note** | Presentation layer — last in the topological order (`architecture-review-2026-08-01.md` §3). ADR-0006(g)/ADR-0007(h) are amended alongside this ADR to point here. |

## Context

### Problem Statement
UI/HUD's GDD (Designed, in review) locked the substance of its view-model transport —
composition-root DI, two per-tick-polled getters, a mandatory structural dirty-check — but
explicitly deferred formalizing it to "this GDD's recommendation for its own future ADR."
Meanwhile two Proposed ADRs each independently deferred the same question outward:
ADR-0006(g) recommends a `floorplan:viewmodel` bus event (which the GDD went on to reject),
and ADR-0007(h) mirrors the deferral for the node-ledger view model. Until this ADR existed,
those two were the more architecturally authoritative documents on record and pointed an
implementer the wrong way (architecture-review conflict C4). Four seams needed pinning:
(1) where UI/HUD's module lives in `src/` relative to the ESLint cross-system-import ban
ADR-0001(c) established (the handoff note's flagged "consumer waiting on that decision");
(2) the exact dirty-check algorithm, since the GDD is explicit that a naive/shallow
implementation would silently defeat the whole contract (AC-UH50); (3) the end-of-tick audio
evaluation mechanism, since the GDD proves it *cannot* run inside the `session:tick` handler
itself and asks "the eventual ADR" to pin the mechanism; (4) Win/Lose's ending-record
transport verb, left unstated even by the GDD's own Interactions table.

### Current State
No `src/` implementation exists yet for any system. This is the first ADR to establish a
presentation-layer module's placement and wiring — precedent-setting for any future
presentation-layer system (e.g. Found-Footage Layer, #13).

### Constraints
- Core Rule 5 (no direct cross-system imports; bus or composition-root only) — registered as
  `forbidden_patterns: direct_cross_system_import`.
- Composition root is `src/main.js` (ADR-0001(a)) — the only place allowed to construct every
  system and wire references between them.
- 16.6 ms / 60 FPS frame budget; the per-tick dirty-check (Core Rule 2) runs every frame with
  no ADR-0003 slice today (conflict C3).
- DOM/CSS only for rendering — no Three.js scene-graph involvement (diegetic UI is DOM over
  the canvas, not in-world geometry, per `technical-preferences.md`).
- jsdom/Testing Library is not yet on the Allowed Libraries list (TR-ui-009, Open Q#5) — 16 of
  60 ACs cannot be written until that's resolved; out of scope for this ADR (a
  `technical-preferences.md` change, not an architecture decision).
- Determinism (`coding-standards.md`): no test may depend on an unseeded RNG.

### Requirements
Covers TR-ui-001 through TR-ui-008. (TR-ui-009 — DOM test harness approval — is a
project-standards decision, not an architecture one; this ADR does not resolve it.)

## Decision

### (a) Module location — `src/ui/hud.js`, a zone the ESLint ban never reaches
UI/HUD lives at `src/ui/hud.js` (plus any supporting modules under `src/ui/`), **outside**
`src/systems/**` entirely. This settles the question ADR-0001(c) left open ("concrete zone
globs... when the first system is scaffolded") for UI/HUD specifically: the zone rule's ban is
`src/systems/** → src/systems/**`; `src/ui/**` was never in its scope. This is a permanent,
structural boundary rather than a documented exception — future presentation-layer systems
(Found-Footage Layer, #13) follow the same convention. UI/HUD's own file makes **zero static
imports** of any sibling system regardless of location — it receives every reference via
constructor injection from `main.js`, per (b). (TR-ui-001, TR-ui-003)

### (b) Composition-root DI extends ADR-0001(a) to sibling-system references, not just the bus
`src/main.js` constructs all five systems UI/HUD renders (Floor Plan, Scan Node, Scan
Mechanic, Entity System, Win/Lose) *before* constructing `UiHud`, then passes their references
into `UiHud`'s constructor alongside the bus — the same manual-composition pattern
ADR-0001(a) already uses for the bus, extended to a second category of injected dependency:

```js
const uiHud = new UiHud(bus, {
  floorPlan, scanNode, scanMechanic, entitySystem, winLose,
}, config);
```

A named-properties object (not five positional args) avoids constructor-argument-order
mistakes as the dependency count grows. This closes GDD Open Q#8 ("Composition-root DI wiring
pends Orchestrator OQ9(a)") — Orchestrator's OQ9 was specifically about DI wiring/override-table
storage, which ADR-0001(a) already answered; this is the direct extension of that same answer
to sibling references, not a new pattern requiring its own Orchestrator ratification.

Of the five injected references, per Core Rule 2: **Floor Plan and Scan Node are polled every
render tick** (`getDollhouseViewModel()` while `DOLLHOUSE_OPEN`, `getNodeLedgerViewModel()`
while `HUD_ACTIVE`). **Scan Mechanic and Entity System's references go unused for data** — UI/HUD
reads them only via bus subscriptions (`movement:scan_triggered`, `scan:*`, `entity:proximity`)
— retained per the GDD's Core Rule 2 wording for constructor-injection uniformity across all
five, not because their reference is called. **Win/Lose is a third, pull-based case**, resolved
in (e). (TR-ui-001)

### (c) Dirty-check — a pure `structuralEqual(a, b)` function, exported and independently testable
Rule 2's per-tick dirty-check is one small pure function, not inlined per-callsite logic, so
both polled getters share one tested implementation:

```js
// src/ui/structural-equal.js
function sameValueZero(a, b) {
  return a === b || (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b));
}

export function structuralEqual(a, b) {
  if (sameValueZero(a, b)) return true;                 // scalars, NaN, +0/-0, and reference equality
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => structuralEqual(v, b[i]));
  }
  const aKeys = Object.keys(a), bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(k => Object.prototype.hasOwnProperty.call(b, k) && structuralEqual(a[k], b[k]));
}
```

`sameValueZero` — not a literal `Object.is` — is the scalar/fast-path check: `Object.is` alone
would treat `+0`/`-0` as *unequal*, which is not SameValueZero (the GDD's own named semantics)
and would cause a spurious re-render on a `-0` float field, not a missed one (low severity, but
worth getting right rather than documenting as a known deviation). The array branch checks
length then pairwise; the object branch checks key-*count* then each key's presence and
recursive equality — catching an added/removed key, not just a `min(length)` walk. No branch
assumes referential stability — two freshly-allocated objects with identical nested values
return `true`, the exact case AC-UH50 exists to prove.

**Cache semantics.** Each polled getter's previous-tick cache initialises to `undefined`.
`structuralEqual(undefined, viewModel)` is always `false` for a real view model, so the first
tick always writes — the GDD's required cold-start sentinel (Rule 2), achieved via a value real
getters never return (AC-UH38 requires getters to return a defined view model, never `undefined`
or a throw), not a manufactured sentinel symbol.

**Re-activation invalidates the cache — both directions.** The GDD's Rule 2 states this
explicitly only for the node-ledger cache on `DOLLHOUSE_OPEN → HUD_ACTIVE` re-attach (its
`getNodeLedgerViewModel()` cache goes stale while unpolled during `DOLLHOUSE_OPEN`, so the first
post-re-attach tick must force a write regardless of equality). **This ADR generalises the same
mechanism to the dollhouse cache on the reverse transition**: `getDollhouseViewModel()` is
likewise unpolled while `HUD_ACTIVE` (Rule 1 removes the dollhouse panel from the render tree
when closed), and Floor Plan's own desync/freshness state keeps advancing during that interval
— by the same staleness reasoning, the first tick after `HUD_ACTIVE → DOLLHOUSE_OPEN` must also
force a write. `UiHud` resets **whichever** getter's cache is about to resume polling to
`undefined` on every panel-activation edge, not only the one direction the GDD worded — nothing
in the GDD contradicts this (no AC requires the dollhouse cache to *skip* a write on reopen), and
it closes an asymmetry the GDD's own text left implicit. **Flagged for the GDD owner**: consider
adding a symmetric AC alongside AC-UH55 when `ui-hud.md` is next revised. (TR-ui-002)

### (d) Panel occlusion — detach-and-cache via a retained DOM subtree reference
`UiHud` holds the always-visible HUD's root element as an instance field. On `DOLLHOUSE_OPEN`
entry: `hudRoot.remove()` (detaches, does not destroy — the element and its listeners persist in
memory, held by the instance reference). On exit back to `HUD_ACTIVE`: re-insert the same node
reference (e.g. `dollhouseRoot.replaceWith(hudRoot)`) — no `createElement` rebuild. This is the
GDD's own resolved Open Q#3 (detach-and-cache, not z-index hiding or destroy-and-rebuild); this
ADR only pins *where* the retained reference lives — the `UiHud` instance, never a module-level
global, so two `UiHud` instances in tests never share detached DOM. (TR-ui-003)

### (e) Win/Lose transport — pull method, called once at the SEALED edge
`WinLose` exposes `getEndingRecord()` (mirroring Floor Plan/Scan Node's already-pinned getter
pattern, ADR-0006(b)/ADR-0007(h)), and `UiHud` calls it **exactly once**: on the tick it
observes cached session state transition to `SEALED` (via the same cached-session-state
subscription Rule 7 already requires) — not per-tick like the two polled getters. `UiHud` merges
the returned `{primaryOutcome, coverage, nodesCompleted, entityEverCaptured}` with its own
`anomaliesLogged` tally (Rule 5) into the `TERMINAL` render. This matches the GDD Dependencies
table's "Hard (data consumer)" wording for Win/Lose (distinct from "event consumer," used for
Scan Mechanic/Entity/Point Cloud) and needs no new bus event. (TR-ui-001, TR-ui-007)

### (f) End-of-tick audio evaluation — a microtask scheduled from the session:tick handler
Rule 9's "cannot evaluate inside the `session:tick` handler itself" constraint is met with the
native platform primitive the GDD's own prose suggests as its example:

```js
onSessionTick() {
  const buffer = { errorEvents: this._pendingErrorEvents, sealed: this._justSealed };
  this._pendingErrorEvents = [];
  queueMicrotask(() => this._evaluateEndOfTickAudio(buffer));
}
```

Because Orchestrator's delivery pass (ADR-0001(d)) runs the *entire* tick's queued events
synchronously before the rAF callback returns — and `renderer.render()` also runs synchronously
in that same callback, after delivery — the microtask queued from inside `session:tick`'s
handler fires only after the whole rAF callback (delivery **and** render) completes, never
mid-delivery. No AC asserts audio evaluation must precede `renderer.render()` within the same
frame (tests drive this via a fake bus + mock clock, never real rAF timing), so this satisfies
"evaluated once, after all of that tick's events... have been applied" without a library or
polyfill — `queueMicrotask` is baseline. (TR-ui-008)

### (g) Message-pool selection — a shuffle-bag per pool, boundary-fixed against immediate repeats
Each error-message pool (FAR/MEDIUM, NEAR, ADJACENT) is a small class, not inline random-index
logic, with an **injectable RNG** (per `coding-standards.md`'s determinism rule — no test may
depend on an unseeded `Math.random()`):

```js
// src/ui/message-pool.js
export class ShuffledMessagePool {
  constructor(messages, rng = Math.random) { this._messages = messages; this._rng = rng; this._deck = []; this._lastShown = null; }
  next() {
    if (this._deck.length === 0) {
      this._deck = shuffle([...this._messages], this._rng);
      if (this._deck.length > 1 && this._deck[0] === this._lastShown) {
        [this._deck[0], this._deck[1]] = [this._deck[1], this._deck[0]]; // boundary fix
      }
    }
    return (this._lastShown = this._deck.pop());
  }
}
```

Draws without replacement until the pool is exhausted (every string shown once), reshuffles,
and swaps the new deck's first slot if it would repeat the immediately-previous string —
satisfying AC-UH19b's "no two consecutive selections identical across the cycle boundary"
without a rejection-sampling loop. `shuffle` is a standard Fisher–Yates over the injected `rng`
(one line, no dependency). For pool size 1 the swap is skipped (`length > 1` guard), matching
the GDD's stated vacuous case. Tests inject a seeded `rng` for deterministic cycles. (TR-ui-008)

### (h) Never-expose, coverage-dominance, and the anomaliesLogged tally — no additional architecture beyond (b)/(c)/(e)
Rule 3 (never expose entity type/position, `entityInFrame`, anomaly-room identity,
`primaryOutcome`), Rule 4 (`coverage_dominance_ratio` font-size math) and Rule 5
(`anomaliesLogged` tally) are pure view-construction and rendering logic operating on data
already reaching `UiHud` via (b)/(e) — none needs a new wiring mechanism.

**Risk worth naming explicitly.** Composition-root DI (vs. a pre-filtered event payload) hands
`UiHud` a live reference into each sibling's public surface, so Rule 3's guarantee is a
*code-discipline and test* contract (AC-UH05–08), not a structural/language-enforced one.
`getNodeLedgerViewModel()`/`getDollhouseViewModel()` are already filtered at the source (Scan
Node/Floor Plan's own pure derivations exclude `entityCaptured`/anomaly rooms per
ADR-0007(f)/ADR-0006(b)) — that source-side filtering is the real mitigation; `UiHud`'s own code
must not additionally reach past those getters into a raw internal field. (TR-ui-004,
TR-ui-005, TR-ui-006)

### Architecture Diagram
```
                          src/main.js (composition root, ADR-0001)
                                │ constructs FloorPlan, ScanNode, ScanMechanic,
                                │ EntitySystem, WinLose, THEN UiHud(bus, {...}, config)
                                ▼
     ┌───────────────────────────── src/ui/hud.js — UiHud ─────────────────────────────┐
     │ polled every tick:  floorPlan.getDollhouseViewModel()   (while DOLLHOUSE_OPEN)   │
     │                     scanNode.getNodeLedgerViewModel()   (while HUD_ACTIVE)        │
     │                     → structuralEqual(prevCache, next) → skip DOM write if equal  │
     │                     → cache resets to undefined on either panel's activation edge │
     │ pulled once:        winLose.getEndingRecord()           (at SEALED, (e))          │
     │ bus-subscribed:     movement:scan_*, scan:*, entity:proximity,                     │
     │                     renderer:anomaly_density, session:tick / cached session state  │
     │ state machine:      HUD_ACTIVE ⇄ DOLLHOUSE_OPEN → TERMINAL                         │
     └──────────────────────────────────────────────────────────────────────────────────┘
        ✗ src/ui/** is OUTSIDE the ESLint src/systems/** zone rule (ADR-0001(c)) — (a)
        session:tick → queueMicrotask(evaluate audio) → fires after delivery+render — (f)
```

### Key Interfaces
```
new UiHud(bus, { floorPlan, scanNode, scanMechanic, entitySystem, winLose }, config)
structuralEqual(a, b) -> boolean                       // src/ui/structural-equal.js
class ShuffledMessagePool { constructor(messages, rng = Math.random); next() }  // src/ui/message-pool.js
WinLose.getEndingRecord() -> { primaryOutcome, coverage, nodesCompleted, entityEverCaptured }
FloorPlan.getDollhouseViewModel() / ScanNode.getNodeLedgerViewModel()  — pinned by ADR-0006/0007
```

### Implementation Guidelines
- `src/ui/hud.js` never contains a static `import` of any `src/systems/**` module — all five
  references arrive via the constructor.
- `structuralEqual` and `ShuffledMessagePool` are standalone, dependency-free modules — directly
  Vitest-testable with plain object fixtures, no bus, no DOM.
- The dirty-check caches (one per polled getter) and the last-fired-sting timestamp (`-Infinity`
  initial sentinel, per Rule 9) are `UiHud` instance fields, never module-level — two instances
  in the same test run never share state.
- **Tests exercising (f) must flush microtasks explicitly** (e.g. `await Promise.resolve()`) —
  Vitest's fake timers do not auto-flush `queueMicrotask`; a test that advances fake timers
  without an explicit microtask flush will read stale pre-evaluation state.
- `structuralEqual`'s own unit tests (reference equality, NaN/`-0` handling, added/removed key,
  array grow/shrink) are writable and runnable **today**, with plain object fixtures — they do
  not require the jsdom harness. Only the *"no DOM mutation occurred"* Integration-level
  assertion (AC-UH50/UH55 as written in the GDD) is blocked on Open Q#5.

## Alternatives Considered

### Alternative 1: `floorplan:viewmodel` / `scannode:viewmodel` latest-value bus events (ADR-0006(g)'s original recommendation)
- **Description**: Floor Plan/Scan Node re-emit a latest-value event on every change; UI/HUD
  subscribes instead of polling a getter.
- **Pros**: no direct reference needed; philosophically uniform with every other cross-system
  contract in the project.
- **Cons**: the GDD's own rejection reasoning holds — this is fundamentally read-every-frame
  polling, not discrete notification; wrapping it in an event adds two events whose only trigger
  is "did the tick's derived value change," duplicating the dirty-check Rule 2 already requires
  at the consumption side. Floor Plan/Scan Node would need to independently implement the same
  dirty-check to decide whether to re-emit.
- **Rejection Reason**: GDD Core Rule 2 explicitly considered and rejected this; adopting it here
  would contradict the GDD, not implement it.

### Alternative 2: `src/systems/ui-hud.js` (inside the existing gameplay-systems zone)
- **Description**: place UI/HUD alongside Floor Plan, Scan Node, etc.
- **Pros**: one fewer top-level directory.
- **Cons**: shares a directory with the exact module set the zone rule targets, so the
  "no sibling import" boundary becomes an implicit exception readable only by knowing UI/HUD
  never imports its neighbors — not a structural guarantee. The eventual concrete zone globs
  (ADR-0001(c), still open) would need an explicit carve-out.
- **Rejection Reason**: owner confirmed the cleaner `src/ui/` boundary during this ADR's
  authoring.

### Alternative 3: Win/Lose delivers its ending record via a bus event (`winlose:ended`)
- **Description**: mirror the event-driven trio (Scan Mechanic/Entity/Point Cloud) instead of
  the getter-based pair.
- **Pros**: consistent with 3 of UI/HUD's other 4 producers.
- **Cons**: the GDD's Dependencies table already distinguishes Win/Lose ("Hard, data consumer")
  from the event-driven three ("Hard/Soft, event consumer") — adopting the event pattern here
  would blur a distinction the GDD itself drew, for a value needed exactly once per session.
- **Rejection Reason**: owner confirmed the getter pattern during this ADR's authoring; matches
  Floor Plan/Scan Node's already-pinned precedent more closely.

## Consequences

### Positive
- One tested `structuralEqual`, one tested `ShuffledMessagePool`, one composition-root wiring
  pattern — no five-implementations divergence for the pure logic every downstream story would
  otherwise reinvent.
- `src/ui/**` is permanently outside the cross-system-import ban's scope — no future glob
  carve-out needed.
- Resolves ADR-0006(g) and ADR-0007(h)'s open deferral in the direction the GDD already chose.

### Negative
- `UiHud`'s constructor is the largest in the project (bus + 5 system references + config) —
  accepted, mirroring `main.js`'s own already-accepted role as the wiring bottleneck (ADR-0001's
  Negative consequence).
- Composition-root DI gives `UiHud` unrestricted *read* access to every sibling's full public
  surface, not just the filtered view-model fields — Rule 3's "never expose" guarantee rests on
  code discipline + the AC-UH05–08 test suite, not a language-enforced boundary (Decision (h)).

### Neutral
- Scan Mechanic and Entity System's injected references go unused for data (their contribution
  is bus-only) — retained per the GDD's literal Core Rule 2 wording for constructor-injection
  uniformity across all five names.

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| A future contributor adds a static import from `src/ui/**` into `src/systems/**` (or vice versa), bypassing the zone rule's intent even though not technically banned by the current glob | Low | Medium | When ADR-0001(c)'s concrete globs are fixed (first system scaffolded), explicitly ban `src/ui/** → src/systems/**` too, not just the reverse — `UiHud`'s constructor-injection pattern never needs a static import either direction |
| The dollhouse-cache reset generalisation (c) is implemented but not yet AC-covered on the GDD side | Low | Low | Flagged to the GDD owner; recommend a symmetric AC alongside AC-UH55 at the next `ui-hud.md` revision |
| `structuralEqual`'s recursion has no cycle guard | Low | Low | View models are plain-data DTOs (GDD's own bound: "not an unbounded per-point structure"); a cyclic view model would be a producer-side bug this function isn't designed to survive |
| The UI/HUD per-tick slice (dirty-check + view assembly) has no ADR-0003 budget line | Was Medium (conflict C3) | Low today, attribution-blocking later | Resolved alongside this ADR — see Performance Implications; ADR-0003(a) amended with a new slice |

## Performance Implications

| Metric | Expected | Budget |
|--------|----------|--------|
| CPU (per tick) | Two getter calls + two `structuralEqual` walks over small, bounded objects (Scan Node ≤16 nodes; Floor Plan's dollhouse view model a fixed-shape summary) — no DOM write on the common unchanged-tick path | **≤ 0.1 ms** (new ADR-0003 slice, amended alongside this ADR — estimate, not yet profiled, same caveat class as ADR-0003's own anomaly-sweep line) |
| Memory | One cached view-model reference per polled getter (2 total) + one detached DOM subtree while `DOLLHOUSE_OPEN` | Negligible |
| Load Time | N/A — constructed once at session start alongside every other system | — |

## Migration Plan
No existing UI/HUD module. Defines the first implementation. Applied alongside this ADR:
1. Amend ADR-0006(g) and ADR-0007(h) to point at this ADR instead of "the UI/HUD ADR (future)";
   ADR-0006(g)'s specific `floorplan:viewmodel` recommendation is superseded by Decision
   (b)/Alternative 1.
2. Add the UI/HUD slice to ADR-0003(a) (closes conflict C3).

**Rollback plan**: none needed — foundational; no existing code to revert.

## Validation Criteria
- [ ] `src/ui/hud.js` contains no static import of any `src/systems/**` module (grep/lint check).
- [ ] `structuralEqual` unit tests (writable today, no DOM harness needed): reference-equality
      fast path, NaN self-equality, `+0`/`-0` equality, added/removed key detection, array
      grow/shrink detection, nested-object equality across distinct references (AC-UH50/UH55
      semantics — the DOM-mutation-observation half of those ACs remains blocked on Open Q#5).
- [ ] `ShuffledMessagePool` unit tests: N draws before any repeat, no immediate repeat across a
      reshuffle boundary, N=1 vacuous case, deterministic under an injected seeded `rng`
      (AC-UH19b).
- [ ] `WinLose.getEndingRecord()` called exactly once per session, on the SEALED tick, never
      per-tick (spy count).
- [ ] Audio evaluation demonstrably deferred past the synchronous `session:tick` handler (spy
      ordering: handler returns before evaluation runs) (Rule 9 Implementation caution).

## GDD Requirements Addressed

| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/ui-hud.md` | UI/HUD | TR-ui-001 — view-model consumption is composition-root DI | (b) extends ADR-0001(a); (e) Win/Lose pull method |
| " | " | TR-ui-002 — per-tick dirty check is a hard requirement | (c) `structuralEqual` + cache/re-activation semantics |
| " | " | TR-ui-003 — panel structure, diegetic DOM, no external HUD | (a) `src/ui/` location; (d) detach-and-cache occlusion |
| " | " | TR-ui-004 — never expose forbidden fields | (h) — enforced at the source getters + code/test discipline |
| " | " | TR-ui-005 — coverage dominance measurable proxy | (h) — pure rendering logic on data (b)/(e) already deliver |
| " | " | TR-ui-006 — anomaliesLogged tally | (h) — pure logic on the `renderer:anomaly_density` subscription |
| " | " | TR-ui-007 — session-state gating + terminal screen | (e) Win/Lose pull method feeds `TERMINAL` |
| " | " | TR-ui-008 — diegetic error escalation + single audio tone/tick | (f) microtask end-of-tick evaluation; (g) shuffle-bag pool |
| " | " | TR-ui-009 — DOM test harness gap | **Not resolved here** — a `technical-preferences.md` Allowed-Libraries change (Open Q#5), not an architecture decision. Flagged, not owned, by this ADR. |
| `design/gdd/floor-plan-system.md` | Floor Plan | TR-fp-009 — dollhouse view-model transport | (b)/(e) — resolves ADR-0006(g)'s deferral |
| `design/gdd/scan-node-system.md` | Scan Node | TR-sn-008 — node-ledger view-model transport | (b)/(e) — resolves ADR-0007(h)'s deferral |

## Related
- ADR-0001 (composition root + bus wiring — extended here), ADR-0006 (Floor Plan —
  `getDollhouseViewModel()`, its (g) resolved here), ADR-0007 (Scan Node —
  `getNodeLedgerViewModel()`, its (h) resolved here), ADR-0003 (per-frame budget — amended
  alongside this ADR, conflict C3).
- `docs/architecture/architecture-review-2026-08-01.md` (conflicts C3, C4 — the requirements
  this ADR closes).
- `production/session-state/active.md` (handoff note that scoped this ADR).
