# UI / HUD

> **Status**: In Design
> **Author**: magatron02 + agents
> **Last Updated**: 2026-07-13
> **Implements Pillar**: Diegetic Matterport UI — no external HUD

## Overview

UI/HUD is the presentation layer that turns every other system's already-computed state into the
game's diegetic Matterport interface — it owns no gameplay logic of its own, only view-model
consumption and rendering. Every number, readout, and panel the player sees during play is data
someone else computed: coverage and node status from Scan Node, dollhouse geometry and freshness
from Floor Plan, scan phase and progress from Scan Mechanic, proximity intensity from Entity
System, and the final ending record from Win/Lose. This system's entire job is arranging that
data into the cold, clinical, monospace instrument panel the whole game is styled after — and,
just as importantly, respecting the constraints five sibling GDDs already locked about what it
must *never* show (entity type, entity position, raw distance, `entityInFrame`, anomaly rooms,
which primary outcome occurred).

To the player, this is the single most-touched surface in the game — the HUD corners, the
sidebar, the scan overlay, the dollhouse panel, the terminal screen are all here. But its design
freedom is narrower than that prominence suggests: the aesthetic (palette, typography, panel
layout) is already specified by the master concept doc, and the content rules (what varies, what
never does, what must stay ambiguous) are already specified by every system it renders. This
GDD's job is to assemble those fixed pieces into one coherent instrument, resolve the handful of
genuine open questions sibling GDDs left for it, and pin the one thing nobody else could decide:
how the panels actually coexist on screen.

## Player Fantasy

Every sibling system already wrote its own piece of this — Point Cloud's Analyst→Witness arc,
Floor Plan's "map you used to trust," Scan Node's "one honest gauge," Scan Mechanic's "the
readout is the fantasy," Entity System's "never learn which one you're facing," Win/Lose's "the
verdict delivered with the same voice regardless of what it is." UI/HUD's own fantasy isn't a new
beat — it's the physical *surface* all of those beats arrive through. The player doesn't feel
dread from a formula; they feel it from a flickering `ALIGNMENT WARNING`, a coverage ring holding
steady at green, a dollhouse marker sitting exactly where it shouldn't be.

**Competence, rendered.** In the opening minutes, this system's entire job is to make the player
feel like a skilled operator: clean HUD corners, a legible node list, a dollhouse that orients.
Every sibling system already earns this trust honestly — it's this system's job not to squander
it with sloppy layout or inconsistent framing. The interface has to be good enough, early, that
its later betrayal (a lying coverage ring, a lagging marker) reads as instrument failure and not
bad UI design.

> *Scope honesty: the trust-then-betray **arc** is not authored here. The betrayal is produced by
> Floor Plan's desync and Scan Node's inverted-reward coverage — this system is the static surface
> those lies arrive **through**, not the author of the arc. Concretely, this GDD owns only the
> constant rendering rules below (e.g. `coverage_dominance_ratio` is 1.5× for the whole session,
> not a value that "becomes" dominant at a beat). The felt onboarding-then-betrayal pacing is a
> product of the sibling systems' own time-varying state plus the `/ux-design` execution this GDD
> defers (Open Q#2) — the Player Fantasy above describes the surface's role in that arc, not a
> mechanic this document introduces.*

**The interface never once tells the truth about what matters most.** This is not a bug this GDD
introduces — it's the load-bearing constraint every sibling GDD already imposed, assembled here
into one coherent whole. Coverage frames as good. The node ledger never distinguishes the trap
node from any other. The proximity bar shows intensity, never direction or type. The terminal
screen never says who won. UI/HUD's fantasy is being the last, most convincing layer of that
omission — the one the player is staring at, directly, the entire time they're being lied to.

**Anchor moment:** not a single instant, but a cumulative one — the player realizing, only in
hindsight, that every panel they trusted throughout the session was constructed to hide exactly
the one thing they needed to know.

> *Note: `creative-director` not consulted — Lean mode. Given this system assembles every other
> system's own carefully-built fantasy into one surface, a manual pass before production is
> strongly recommended even though the gate itself was skipped.*

## Detailed Design

### Core Rules

1. **Panel structure — always-on instrument view + one toggle-modal.** There is no literal "tab"
   metaphor. The **always-visible HUD** (FPS scan overlay with minimal crosshair, corner readouts
   — node ID, room label, coordinates, scan %; sidebar — coverage ring, node list, proximity bar)
   is active throughout `NAVIGATE`. The **Dollhouse panel** is the one toggle-key,
   fullscreen-blocking modal Floor Plan's GDD already locked — opening it occludes the
   always-visible HUD entirely, not layers over it: the HUD's elements are removed from the render
   tree while `DOLLHOUSE_OPEN`, not merely hidden beneath a higher z-index. **Removal is
   detach-and-cache, not destroy-and-rebuild:** the HUD's DOM subtree is detached from the document
   and retained in memory, then re-attached on close — its nodes are never `createElement`-rebuilt
   on toggle. This keeps the toggle a sub-frame operation (no reconstruction cost, no reflow thrash,
   no flash) even under rapid toggle-spam, and is what makes the paired "instant hard cut"
   (Visual/Audio Requirements) achievable. This resolves the destroy-vs-hide ambiguity Open Q#3
   raised. A **Log panel** (master GDD's third "tab") is
   explicitly **out of scope for this GDD** — its only designed content (D-1 Auto-Typed Log) is
   itself flagged out-of-scope by Scan Mechanic's Open Q#5 and the master GDD's own v0.2 tag; there
   is no content for this GDD to render yet (see Open Questions).

2. **View-model consumption is composition-root DI, not new bus events.** UI/HUD receives direct
   references to Floor Plan, Scan Node, Scan Mechanic, Entity System, and Win/Lose at construction
   (the same manual-composition pattern `src/main.js` already uses per ADR-0001). Of those, only
   **Floor Plan (`getDollhouseViewModel()`) and Scan Node (`getNodeLedgerViewModel()`) expose a
   polled view-model getter** — those two are called every render tick (each while its own panel is
   active). Scan Mechanic, Entity System, and Point Cloud Renderer are **event-driven** (the HUD
   caches their latest `scan:*` / `entity:proximity` / `renderer:anomaly_density` payloads), and
   Win/Lose delivers a one-shot ending record at `SEALED` — none of these three is polled per tick.
   This resolves the transport question both Floor Plan's ADR-0006(g) and Scan Node's ADR-0007(h)
   explicitly deferred here — recorded as this GDD's recommendation for its own future ADR to
   formalize, not a new bus event per view model (would add 2 new latest-value events for what is
   fundamentally read-every-frame polling, not discrete notification).

   **Render-tick dirty-checking (perf contract).** Because both getters are polled every tick, the
   HUD MUST compare each getter's returned view model against the previous tick's cached value and
   **skip the DOM write when they are equal** — no DOM mutation or reflow occurs on a tick where the
   underlying view model is unchanged. **Equality is by value over the rendered fields, compared
   structurally to full depth.** Nested plain-data objects — e.g. the ledger's per-node
   `displayPosition` and the top-level `nodesCompleted {X, Y}`, real nested shapes Scan Node's
   view model already locks — are equal **iff their key sets match (same keys, same count) AND each
   field compares equal recursively** (a field-walk keyed off only one side's own properties is
   non-conforming — it would miss an added/removed key, the object-shape analogue of the array
   grow/shrink bug); arrays are equal **iff
   their lengths match AND their elements compare equal pairwise** (a `min(length)` iteration that
   ignores grow/shrink is non-conforming); scalars compare by **SameValueZero** (`Object.is`-style
   semantics, so a legitimately-`NaN` field equals itself and cannot force a DOM write on every
   tick, as it would under `===`). A one-level shallow comparison is **explicitly insufficient**:
   a pure getter freshly allocates those nested objects on every call, so shallow comparison would
   read them as "changed" every tick and silently defeat this rule — the exact failure AC-UH50
   exists to catch. The HUD makes **no referential-stability assumption** about
   the getters — a pure getter (per ADR-0006(b)/0007(h)) may legitimately return a freshly-built
   object/array on every call, so reference equality alone would never match and would silently
   defeat this rule. Reference equality is a permitted *fast path* when references do happen to
   match, never the required mechanism. This is a hard requirement, not an optimization (AC-UH50).
   **Cost bound.** The deep compare runs every tick against the 16.6 ms / 60 FPS budget
   (`technical-preferences.md`), so it is only affordable because both polled view models are
   **small and bounded**: the node ledger is one entry per scan node at realistic node counts (Scan
   Node's own view-model shape), and the dollhouse view model is a fixed-shape summary — not an
   unbounded per-point structure. A per-point collection MUST NOT be routed through this per-tick
   compare; if a future view model grows unbounded, this contract needs a keyed/versioned dirty-flag
   instead of a full structural walk. The reference-equality fast path above short-circuits the
   common unchanged-tick case before the deep walk runs.
   **Re-attach invalidates the cache.** Because the always-visible HUD's `getNodeLedgerViewModel()`
   is *not* polled while detached during `DOLLHOUSE_OPEN` (Rule 1), its cached "previous tick" value
   goes stale during that interval. On re-attach the HUD MUST discard that cached value and force a
   write on the first post-re-attach tick regardless of the equality result — otherwise the HUD
   could re-appear showing multi-tick-old state. The detached subtree's reference is held on the HUD
   instance (not a module-level global), so ownership is unambiguous. (AC-UH55 stages this exact
   detach→re-attach→value-identical forced write; AC-UH50's continuous-polling setup never enters it.)
   **First-tick cold start.** Before the HUD's very first render tick the "previous tick" cache holds
   a distinct sentinel (never a real or default-shaped view model), so the equality check on the first
   tick always fails and the first render always writes — the same reasoning as Rule 9's `-Infinity`
   sting sentinel, applied to the dirty-check. A cache initialised to an empty object or a plausible
   default view model is non-conforming: it could compare equal to a genuinely-empty first view model
   and skip the session's first paint. (AC-UH50's N-consecutive-unchanged-ticks setup begins *after*
   this first forced write, so it does not exercise the cold start; the sentinel choice is a stated
   contract, not a test-covered one.)

3. **Never expose what a producing system forbids.** This system inherits, verbatim, every
   "must never expose" constraint already written into a sibling GDD's UI Requirements:
   entity `currentType` and position (Entity System), `entityInFrame` (Scan Mechanic), anomaly
   rooms and true real-time scan state within the desync window (Floor Plan), and which
   `primaryOutcome` occurred (Win/Lose). This system does not re-derive these rules — it is bound
   by them.

4. **Coverage is the visually dominant element wherever it co-locates with nodesCompleted.**
   Restates Scan Node's own load-bearing, previously-`DEFERRED` constraint (`AC-SN31`) and gives it
   the measurable proxy Scan Node's own GDD said it lacked: `coverage`'s numeric display uses a
   **larger font-size ratio** (`coverage_dominance_ratio`, new knob, default 1.5×) than
   `nodesCompleted`'s, and precedes it in DOM/reading order. This closes `AC-SN31 DEFERRED` — the
   first concrete, testable resolution of a constraint 2 sibling GDDs carried forward as prose.

   **In-session sidebar only — never the terminal screen.** The dominance ratio applies solely to
   the always-visible HUD's co-located widget during `HUD_ACTIVE`. On the `TERMINAL` screen
   (Rule 8), `coverage` and `nodesCompleted` render at the **same base size** (ratio effectively
   1.0): Win/Lose's "same voice regardless of outcome" guarantee requires the ending screen to
   weight both numbers with strict neutrality — a dominance cue there would visually argue for one
   reading at exactly the moment the player must do dispassionate arithmetic on both. AC-SN31's
   trust-framing constraint is an *in-session* constraint; it does not follow the pair onto the
   ending screen. (AC-UH53.)

5. **anomaliesLogged is a session-cumulative count of `renderer:anomaly_density` events.**
   Resolves Win/Lose's own flagged gap (its ending record has no `anomaliesLogged` field). UI/HUD
   maintains its own tally — incremented once per `renderer:anomaly_density` event received,
   regardless of the sign of `sigma` (spike, σ>0, or deficit, σ<0; the payload carries no type
   label per the producer's 2026-07-15 revision) — and reads it at session end for the terminal screen.
   Chosen over tallying Entity System manifestation changes because `renderer:anomaly_density` is
   the more literal match for "anomaly *logged*" (a detected data anomaly, not merely "the entity
   moved") and requires no new event from any other system.

6. **Diegetic error-message escalation.** Point Cloud's `renderer:anomaly_density` and Entity
   System's `entity:proximity` tier changes drive the master GDD's §7 error-message pool
   (`ALIGNMENT ERROR`, `DEPTH SENSOR TIMEOUT`, `UNEXPECTED GEOMETRY DETECTED`, etc.), escalating
   in specificity as proximity tier decreases: `FAR`/`MEDIUM` → generic alignment/depth messages;
   `NEAR` → geometry/density messages; `ADJACENT` → operator/signal-loss messages, then UI freeze
   (per Entity System's own tier-to-feedback mapping, already fixed). UI/HUD owns message
   *selection and display*, not the underlying anomaly detection.

   - **Selection within a pool is anti-repeating, not random.** When a pool is entered, the HUD
     draws the pool's messages in a **shuffled cycle** — every string in the pool is shown once
     before any repeats, and the immediately-previous string is never the first of the next cycle.
     This rules out both "always the first string" (repetitive) and unbounded pure-random
     (clustered repeats) implementations. The concrete per-pool string list is inherited from
     master GDD §7 and finalized in the error-bar UX spec (`design/ux/hud.md`, Open Q#2); this GDD
     fixes the *selection discipline*, not the exact copy. (AC-UH16–18 test pool membership per tier;
     AC-UH19 tests tier-independent anomaly-density push, not membership; AC-UH19b tests
     non-repetition.)
   - **Error-bar display discipline.** The error bar shows **one** message at a time; a new message
     **replaces** the current one (no stack, no scrollback). Rapid successive pushes therefore never
     accumulate — the bar always reflects the most recent error only. A pushed message persists until
     replaced or until `SEALED` freezes it (Rule 7). This bounds the anomaly-burst flooding case
     (Edge Cases): dozens of same-tick `renderer:anomaly_density` events resolve to the single
     latest string, not a pile-up.
   - **Audio at ADJACENT yields to §13's silence-drop** — see Rule 9 and Visual/Audio Requirements:
     the error-bar *sting* does not fire at `ADJACENT`, where master GDD §13 drops all sound except
     the low subsonic rumble. The error message itself still displays; only its audio cue is
     suppressed at that one tier.

7. **Session-state gating.** UI/HUD subscribes to Orchestrator's cached session-state
   (`LOADING`/`ACTIVE`/`SEALED`). The always-visible HUD and Dollhouse panel are only interactive
   during `ACTIVE`. On `SEALED`, all panels freeze in place and the terminal screen (Win/Lose's
   ending record) takes over — see Rule 8.

   **Gating mechanism (implementation seam).** Input gating is a **single guard checked at the top
   of the HUD's input handler**: `if (sessionState !== 'ACTIVE') return;` before any toggle/key is
   acted on. It is not implemented by adding/removing DOM listeners per transition (which risks
   lost-event races on fast transitions) — the listeners stay attached and the guard short-circuits
   them. This gives AC-UH20 a single, testable seam (drive an input at `LOADING`/`SEALED`, assert
   no state change) rather than leaving the mechanism to implementer choice.

8. **Terminal screen renders Win/Lose's text-variation matrix exactly as specified.** UI/HUD is
   the implementer, not the author, of the ending-screen content logic Win/Lose's GDD already
   fixed: the 2-register `STATUS` split, the `entityEverCaptured` single-field modulation, the
   static fields. This GDD fixes the *structural* rules (which fields exist, which register each
   outcome maps to, that `entityEverCaptured` modulates exactly one existing field) and their
   ACs (UH23–26); the **actual copy strings** are **deferred to the terminal-screen UX spec**
   (`design/ux/hud.md`, Open Q#2 + Open Q#5) — they are *not* authored in this GDD. Rationale:
   the strings must be written and tuned against the real §10 layout to guarantee they never leak
   `primaryOutcome` (AC-UH08/UH26), which cannot be verified against prose in isolation. Until then
   the register templates are referenced structurally, not filled.

   **Register-identity constraint (protects Win/Lose's "same voice").** The two outcomes sharing a
   register MUST render from the **identical template/component** — the same DOM structure and the
   same static copy — differing *only* in the named interpolated numeric fields Win/Lose's matrix
   permits. No implementer may add outcome-specific colour, iconography, ordering, or any other
   channel that would make the two same-register outcomes visually distinguishable (AC-UH23/UH24).
   This closes the "register split is decodable across replays" risk: sameness is enforced at the
   template level, not merely at the tonal-prose level.

9. **Error-triggering events fire a single audio alert tone per tick.** Both
   `renderer:anomaly_density` and an escalation-relevant `entity:proximity` tier change (Rule 6)
   are error-triggering events. If more than one arrives within the same tick, the audio alert
   tone (Visual/Audio Requirements) fires **exactly once** for that tick — never once per event —
   to avoid a doubled/stacked sting. This does not affect visual display: each event still
   independently drives its own message/display target (Rule 6), only the audio cue is
   deduplicated per tick.

   **Definition of "tick" and the required evaluation order.** A **tick** is one Orchestrator
   `session:tick` (the game's fixed update step, one per rendered frame at 60 FPS). UI/HUD
   subscribes to `session:tick` purely as the **tick boundary** for its end-of-tick audio
   evaluation and its render-tick dirty-check (Rule 2) — it consumes the event's *arrival*, **not
   its `elapsedSeconds` payload**. UI/HUD drives **no** per-frame visual or time-phased computation
   off `elapsedSeconds` (it renders no flash, drift, or animation timed to game-clock; see Rule 6
   and the Visual/Audio Requirements). This closes Orchestrator's Open Question 8's trigger for
   this system: because nothing here reads `elapsedSeconds` for a visual, the `session:tick`-vs-
   `renderer.render()` ordering inside the rAF callback does **not** constrain UI/HUD, and this GDD
   neither requires Orchestrator to pin tick-before-render nor needs to accept a one-frame lag.
   (See Open Q#7.) Bus events are drained into the HUD's per-tick input buffer as they arrive;
   **audio is not emitted the instant an event is received** — it is evaluated **once, at
   end-of-tick**, after all of that tick's events and any `SEALED` transition have been applied.
   This deferred-evaluation model is mandatory (not an optimization): it is the *only* ordering
   under which the guarantees below are implementable — and it depends only on Orchestrator's
   already-fixed *internal* bus delivery order (`player:position` → `session:tick` → queued
   events, Orchestrator Core Rule 3/4), never on where the WebGL draw call sits.
   **Implementation caution (for the Open Q#4 ADR):** that same fixed order means the
   `session:tick` handler runs *before* this tick's queued error-triggering events are delivered
   (Orchestrator AC-OR08: `player:position` → `session:tick` → queued events, synchronously within
   one rAF callback). "End-of-tick" evaluation therefore **cannot run inside the `session:tick`
   handler itself** — it must be deferred past the synchronous queued-event drain (e.g. a
   microtask scheduled from the handler, which drains after the whole rAF callback completes).
   A literal evaluate-in-the-tick-handler implementation evaluates one event-batch early on every
   tick. Recorded here so the eventual ADR pins the mechanism, not just the semantics.
   - **Dedup:** at end-of-tick, if ≥1 error-triggering event landed this tick, the tone fires once.
   - **SEALED precedence:** if the transition to `SEALED` (Rule 7) also landed this tick, the tone
     does **not** fire at all this tick, regardless of which error event(s) also arrived — the
     end-of-tick check sees `SEALED` already applied and suppresses the tone. Because audio is
     buffered to end-of-tick, no tone can have "already played" before the `SEALED` check runs.
   - **ADJACENT suppression:** the tone is likewise suppressed when the resolved proximity tier is
     `ADJACENT` (§13 silence-drop, Rule 6) — the message still displays; only its sting is silent.
   - **Cross-tick debounce (min re-trigger interval).** Per-tick dedup alone does *not* prevent
     *stacked* stings across adjacent ticks: a sting is ~`error_sting_min_interval_ms` long
     (default 200ms ≫ one 16.6ms tick), so two error-triggering events a few frames apart would
     otherwise each fire a full, overlapping sting — exactly the "doubled/stacked sting" the dedup
     rationale claims to prevent, but only narrows to the same-tick case. The tone therefore also
     honours a **minimum re-trigger interval**: at end-of-tick, if a sting has already fired within
     the last `error_sting_min_interval_ms`, a new tone is suppressed (the triggering message still
     displays — consistent with Rule 6's replace-not-stack discipline; only the audio is
     debounced). Dedup handles the same-tick collision; the debounce handles the near-tick one.
     **The last-fired timestamp is written only on an actual fire.** A suppressed evaluation —
     same-tick dedup, `SEALED`, `ADJACENT`, `DOLLHOUSE_OPEN`, or the debounce itself — never
     updates the timestamp; otherwise a sustained burst arriving faster than the interval would
     push the timestamp forward indefinitely and silence stings for the whole burst — exactly the
     flooding case the debounce exists to bound, inverted into a mute switch.
     **Cold-start sentinel.** Before any sting has fired this session the last-fired timestamp MUST
     be initialised to a sentinel that is unconditionally ≥`error_sting_min_interval_ms` in the past
     — `-Infinity` (or `null` special-cased to "always fire"), **never `0`**. A `0` initial value
     against a mock clock that also starts at `0` (AC-UH52's own methodology) would compute an
     offset `< interval` and wrongly suppress the session's very first sting. The first
     error-triggering event of a session always fires (subject only to the same-tick/`SEALED`/
     `ADJACENT`/`DOLLHOUSE_OPEN` suppressions). (AC-UH52.)
     **Clock source:** the debounce interval is measured on an **injected monotonic wall-clock
     source** (`performance.now()` in production; a mock clock in tests, per AC-UH52) — **not** on
     `session:tick.elapsedSeconds`, which this system already disclaims. Open Q#7's boundary-only
     contract is unaffected: this is audio *trigger-timing*, not a game-clock-timed visual, so it
     neither reads `elapsedSeconds` nor re-opens Orchestrator OQ8. **Boundary:** a new tone is
     suppressed when the offset since the last fired sting is **strictly less than**
     `error_sting_min_interval_ms`; at an offset exactly equal to the interval the tone **fires**
     (< suppresses, ≥ fires — matching AC-UH52). (AC-UH52.)
   - **DOLLHOUSE_OPEN suppression:** while the Dollhouse panel is open, the tone is suppressed
     entirely (Rule 10's blackout), and no deferred/retroactive sting fires on close.

10. **DOLLHOUSE_OPEN is safe-while-open, trap-on-close — the blackout defers danger's *check*,
    not its *setup*.** While `DOLLHOUSE_OPEN`, the player perceives **no UI-owned danger signal**:
    the always-visible HUD (proximity bar, error bar) is detached (Rule 1), the dollhouse view
    model carries no entity/proximity signal (Rule 3), and the UI-owned error-sting alert is
    suppressed (Rule 9), with no deferred/retroactive sting on close.
    **Scope of the claim — UI-owned channels only.** This rule governs only what UI/HUD owns. The
    ambient proximity drone is Audio-owned (GDD #6, Not Started): this GDD makes **no claim** that
    it is silenced during `DOLLHOUSE_OPEN` — whether it persists (a partial danger channel) or
    yields is the Audio System GDD's to fix, flagged alongside Open Q#6.
    **What the mechanics actually do during the blackout** (cross-verified against siblings): the
    player is stationary while the modal is open — locomotion suspension is a requirement this GDD
    places on FPS Movement, which currently defines no dollhouse state (Open Q#9, mirroring the
    `SCAN_LOCKED` precedent). A stationary player cannot trigger Movement Violation (Win/Lose
    AC-WL08 requires a `player:position` delta), and no scan can run mid-modal (Scan Corruption
    and capture are impossible). What persists is the **setup** of danger: the entity keeps
    approaching, and Entity System dwell keeps accruing (tier-based, not movement-based). The
    trade therefore lands on **close**, not during: the player may re-attach already at
    `ADJACENT`, having received no warning, and their first blind step can be an instant Movement
    Violation. Rule 2's forced write puts the freshest cached error message on screen on the first
    post-re-attach tick — but **that single 16.6 ms frame is an input-lockout guarantee, not a
    perceptible warning**: it is far below human read-and-react time (~200 ms+), so the player cannot
    actually process the message within it. What it buys is a *race-condition* guarantee, not a
    reaction budget.
    **Reattach input-lockout — fixed here: no Movement Violation can resolve on the reattach frame.**
    The round-5 version deferred *whether* the single forced frame was a sufficient reaction budget to
    an unwritten `/ux-design` spec, leaving a same-frame instant-loss possible on the first blind step.
    That specific race is now settled at the mechanic level: on the `DOLLHOUSE_OPEN → HUD_ACTIVE`
    transition the HUD enters a **one-tick reattach-grace sub-state** — the forced-write tick (Rule 2)
    — during which it does **not** emit the locomotion-resume signal. Because the player cannot produce
    the `player:position` delta AC-WL08 requires until locomotion actually resumes (the *following*
    tick), **no Movement Violation can resolve on the reattach frame itself**. This closes the
    *simultaneous-frame* death race only — it is **not** a claim that the player has a fair chance to
    read the warning and evade. On the very next tick the player, possibly already holding a movement
    key, can step blind into `ADJACENT`. So the trap still lands on close and remains, by design,
    consistent with the Player Fantasy's "cumulative… only in hindsight" anchor (§B): the fix removes a
    zero-warning *engine race*, not the hindsight beat itself. **AC-UH58** (BLOCKING Logic) asserts the
    input-lockout at the state-machine level — the state timing, not a perceptual guarantee.
    **Cross-system seam.** The *enforcement* that the player physically cannot translate on the
    grace tick rides FPS Movement honouring the withheld resume signal — i.e. it depends on Open Q#9's
    locomotion-suspension contract, whose release timing this rule now pins to "one tick after
    reattach, not simultaneous." UI/HUD owns the grace-tick state and the resume-signal timing
    (testable here); FPS Movement owns obeying it (Open Q#9). Whether a *human-scaled* reaction budget
    (a multi-frame readable interval or an on-close cue) is warranted at all — beyond this one-tick
    engine-race fix — remains an open `/ux-design` dollhouse-spec call, not resolved here.
    **Bookkeeping continues un-suppressed** — events are still cached (Rule 2), `anomaliesLogged`
    still increments (Rule 5); only *presentation* is withheld, never state.
    **Accessibility note — authored risk, not A-A1/A-S1/A-V/reduced-distortion compliance.** During
    this window no survival-relevant cue exists on any UI-owned channel for *any* player — a
    total-blackout case outside what A-A1/A-S1 were written to test (single-channel reliance). This
    GDD does not claim those requirements are satisfied here. **Reduced-distortion-mode users are
    explicitly no better off:** because zero alerts render during `DOLLHOUSE_OPEN`, AC-UH44's
    two-non-distortion-channel guarantee is **not exercised** — it passes *vacuously*, not because
    the protection is present. The blackout is strictly worse than any single-channel case AC-UH44
    was built to catch, for every accessibility profile equally (hearing/non-hearing, reduced-
    distortion on/off). This is recorded as an **unclassified authored risk** for `/ux-design`
    (`design/ux/dollhouse.md`) to evaluate on its own terms — specifically the **in-modal blackout**
    itself (zero cue while open), which affects all accessibility profiles identically. The *reattach*
    half is only *partially* closed: the one-tick input-lockout (BLOCKING **AC-UH58**) removes the
    simultaneous-frame death race, but it is **not** a human-scaled reaction budget — whether the
    close transition needs a genuine readable interval for any accessibility profile remains a
    `/ux-design` question alongside the while-open blackout, not settled here.
    (AC-UH54.)

### States and Transitions

| State | Description | Entry | Exit |
|---|---|---|---|
| `HUD_ACTIVE` | Always-visible instrument view rendering (scan overlay, corner readouts, sidebar) | Session `ACTIVE` begins | Dollhouse toggled open (→ `DOLLHOUSE_OPEN`), or session `SEALED` (→ `TERMINAL`) |
| `DOLLHOUSE_OPEN` | Fullscreen-blocking dollhouse panel; always-visible HUD occluded, not stopped | Dollhouse toggle key pressed | Dollhouse toggle key pressed again → `HUD_ACTIVE`; OR session `SEALED` → `TERMINAL` |
| `TERMINAL` | Ending screen rendering Win/Lose's ending record | Session `SEALED` | — (terminal; session over) |

**Pre-`ACTIVE` (`LOADING`) rendering.** Before session state reaches `ACTIVE`, the HUD is in a
non-interactive **acquiring** sub-state of `HUD_ACTIVE`: corner readouts and sidebar render a
neutral "acquiring" placeholder (Edge Cases — getters return empty/loading view models), input is
gated off (Rule 7), and no `DOLLHOUSE_OPEN` transition is possible. This is not a distinct
interactive state — it is `HUD_ACTIVE` rendering its empty view models — so the three-state machine
above is complete; `ACTIVE` merely populates it. (AC-UH38 covers the getter behavior.)

**Same-tick precedence — `SEALED` wins over a toggle press.** If a Dollhouse toggle-key press and
the transition to `SEALED` land in the same tick while in `HUD_ACTIVE` (or `DOLLHOUSE_OPEN`), the
`SEALED` transition to `TERMINAL` takes precedence and the toggle is discarded — mirroring Rule 9's
audio precedence and evaluated in the same end-of-tick order (session-state transition applied
before input is processed). No intermediate `DOLLHOUSE_OPEN` frame is rendered. This exact
simultaneity is tested by **AC-UH51** (staging a toggle press and the `SEALED` transition in the
identical tick — not AC-UH32/UH35, which each test `SEALED` in isolation).

### Interactions with Other Systems

| System | Direction | Interface |
|---|---|---|
| Floor Plan | in | `getDollhouseViewModel()` (polled while `DOLLHOUSE_OPEN`) |
| Scan Node | in | `getNodeLedgerViewModel()` (polled while `HUD_ACTIVE`) |
| Scan Mechanic | in | `movement:scan_triggered`, `scan:capture_frame`, `scan:processing`, `scan:uploading`, `movement:scan_released`, `scan:captured` (scan-readout state) |
| Entity System | in | `entity:proximity {tier}` (proximity bar + error-message escalation) |
| Point Cloud Renderer | in | `renderer:anomaly_density {sigma}` (error messages + `anomaliesLogged` tally; `sigma` is signed, no type label — producer revision 2026-07-15) |
| Win/Lose | in | Ending record `{primaryOutcome, coverage, nodesCompleted, entityEverCaptured}` + this system's own `anomaliesLogged` tally, at `SEALED` |
| Orchestrator | in | Cached session state (`LOADING`/`ACTIVE`/`SEALED`); `session:tick` (subscribed as the per-tick **boundary** for end-of-tick audio evaluation + render-tick dirty-check — `elapsedSeconds` payload **not** consumed, see Rule 9) |
| FPS Movement | in | `player:position {x,y,z}` (diegetic coordinate display, corner HUD) |

## Formulas

This system contains no curve-shaped formulas of its own — it aggregates and renders state other
systems already compute. It owns two quantifiable tuning constants: the coverage-dominance ratio
(Core Rule 4), which resolves Scan Node's own previously-`DEFERRED` `AC-SN31` constraint, and the
error-sting minimum re-trigger interval (Core Rule 9), which bounds cross-tick sting stacking.

### Tuning Constant — `coverage_dominance_ratio`

| Field | Value |
|---|---|
| Definition | `coverageFontSize = nodesCompletedFontSize × coverage_dominance_ratio`. `nodesCompleted`'s font size is the fixed base (set by the clinical-panel type scale); the ratio scales `coverage` **up** from it. The ratio only ever grows `coverage`; it does not itself resize `nodesCompleted`. **Scope: `HUD_ACTIVE` only** — the `TERMINAL` screen renders both numbers at base size, ratio not applied (Core Rule 4's carve-out, AC-UH53). |
| Default | **1.5×** |
| Safe range | **1.3× – 1.75×** (inclusive) |
| Rationale (lower bound) | Below ~1.3× the size delta is too subtle to overcome the integer-completeness bias the requirement exists to correct — the player still reads `12/12` as "done." |
| Rationale (upper bound) | Above ~1.75× `coverage` grows large enough to break the co-located widget's shared clinical grid — it stops reading as one instrument row with `nodesCompleted` and starts reading as a separate oversized headline, which reintroduces the very "two competing gauges" split the co-location was meant to avoid. (Note: this is about `coverage` becoming *too dominant*, not about `nodesCompleted` shrinking — the formula never shrinks `nodesCompleted`.) |
| Out-of-range guard | Values `≤ 1.0` (no dominance; `0`→invisible; negative→invalid CSS) and any value outside the safe range are **rejected at config load**: the loader clamps to the nearest safe-range bound and logs a warning; it never applies a raw out-of-range value. `1.0` and below can never satisfy Rule 4 and are treated as a config error, not a valid tuning choice. **Non-numeric input** (`NaN`, `undefined`, a non-number string) is treated as *absent* and falls back to the 1.5× default with a logged warning — the clamp comparison is never evaluated against `NaN`. (AC-UH49.) |

No registry entry needed — single-GDD tuning value, no cross-system reuse.

> *Validation status: the **1.5× default is unvalidated-by-design, not closed.** The math and the
> safe range are settled, but whether a session-constant ratio actually makes a player *trust*
> `coverage` without *clocking* it as authored emphasis (the Player-Fantasy intent behind AC-SN31)
> is a perceptual question no static-analysis AC can answer — AC-UH12 verifies the ratio and the
> absence of competing cues, not player comprehension. Treat 1.5× as a playtest-calibrated
> starting point; a comprehension check ("which readout told you the truth?") **MUST** accompany the
> first HUD playtest before this ratio is considered final — this is a required gate on finalizing
> the value, not a suggestion. The backfire hypothesis (this game trains "visual deviation = danger,"
> so authored emphasis may read as *the manipulated thing*, not the trusted thing) is escalated to
> Scan Node's owner as a challenge to AC-SN31 itself; if the playtest confirms it, the fix belongs
> there, not here. **Fallback pre-registered:** if the backfire is confirmed, the contingency is
> `coverage_dominance_ratio → 1.0` (size dominance withdrawn) with the trust-priority re-expressed
> through a non-size channel chosen by Scan Node's AC-SN31 owner — pre-registered here so a
> confirmed backfire has a ready fix path instead of stalling between two owners each deferring to
> the other.*

### Tuning Constant — `error_sting_min_interval_ms`

| Field | Value |
|---|---|
| Definition | Minimum wall-clock interval between two audible error stings, measured on the **injected monotonic wall-clock source** Core Rule 9 names (`performance.now()` in production, mock clock in tests) — never `session:tick.elapsedSeconds`. Offset since last fired sting `<` interval → suppressed; `≥` interval → fires (Core Rule 9's cross-tick debounce). The triggering message still displays; only the audio is debounced. |
| Default | **200ms** |
| Safe range | **150ms – 400ms** |
| Rationale (lower bound) | Below ~150ms the interval drops under the sting's own ~100–200ms envelope (Visual/Audio Requirements), so two stings can still audibly overlap — defeating the debounce's purpose. *(That envelope is itself a provisional placeholder — re-validate this floor when the Audio System GDD authors the real sting.)* |
| Rationale (upper bound) | Above ~400ms the debounce starts swallowing genuinely-distinct alerts the player *should* hear as separate events, flattening the error channel's information rate. |
| Ownership note | This is the sting's **trigger-timing**, which is UI-owned (Visual/Audio Requirements authority split). The sting's *sonic character* remains the Audio System GDD's (#6) to author; the debounce interval is not sonic character and is fixed here. |

No registry entry needed — single-GDD tuning value, no cross-system reuse.

> *Note: `systems-designer` consulted (Section D high-risk spawn, per lean-mode rule — scoped
> narrowly to these two constants, as no curve-shaped formula exists in this system).*

## Edge Cases

- **If the Dollhouse toggle key is pressed during `SCAN_LOCKED`** (Scan Mechanic's camera lock):
  the toggle is ignored — the always-visible HUD's scan overlay stays exclusive during a locked
  capture; the player cannot open the dollhouse while vulnerable. Matches the project's existing
  "one modal interruption at a time" pattern (Scan Mechanic's own trigger-suppression logic).

- **If `session:end`/`SEALED` arrives while the Dollhouse panel is open**: the panel closes
  immediately and the terminal screen (`TERMINAL` state) takes over — the ending screen is never
  occluded by a stale modal.

- **If a `renderer:anomaly_density` event and an `entity:proximity` tier change arrive in the same
  tick**: both independently drive their own display (error message pool + proximity bar) — no
  deduplication or priority ordering between them, since Point Cloud Renderer's own GDD already
  states the renderer "does not throttle its own events" and expects UI to handle overlap.

- **If `anomaliesLogged` would be incremented after `SEALED`**: it is not — Win/Lose's ending
  record is snapshotted at trigger time (its own Core Rule 8); any `renderer:anomaly_density`
  arriving after that point is a no-op for the tally, matching Orchestrator's own post-SEAL drop
  rule for late events.

- **If a producing system's `get*ViewModel()` is called before that system has emitted its own
  first `init`-equivalent event** (e.g. `getDollhouseViewModel()` before `floorplan:init`): returns
  an empty/loading-state view model rather than throwing — the always-visible HUD's corner
  readouts and sidebar render a neutral "acquiring" state during the brief `LOADING` window before
  `ACTIVE` begins.

- **If the player never opens the Dollhouse panel for an entire session**: no consequence — the
  panel is purely player-initiated; Floor Plan's own desync/loop mechanics continue regardless of
  whether the player ever looks at their effects.

- **If two `renderer:anomaly_density` events fire in the exact same tick** (Point Cloud Renderer's
  own documented possibility, e.g. two tiles crossing threshold simultaneously): `anomaliesLogged`
  increments once per event, not once per tick — each is an independent detection.

## Dependencies

**Upstream — what UI/HUD consumes:**

| System | Dependency type | Interface |
|---|---|---|
| Orchestrator | Event bus + composition root (hard) | Cached session state; `session:tick` (per-tick boundary only — `elapsedSeconds` not consumed, Rule 9 / Open Q#7); the composition root that injects all system references below (construction wiring pends Orchestrator Open Q#9(a), see Open Q#8) |
| Floor Plan | Hard (DI) | `getDollhouseViewModel()`, polled while `DOLLHOUSE_OPEN` |
| Scan Node | Hard (DI) | `getNodeLedgerViewModel()`, polled while `HUD_ACTIVE` |
| Scan Mechanic | Hard (event consumer) | Scan-sequence events for the readout + progress bars |
| Entity System | Hard (event consumer) | `entity:proximity {tier}` for the proximity bar + error-message escalation |
| Point Cloud Renderer | Hard (event consumer) | `renderer:anomaly_density` for error messages + `anomaliesLogged` |
| FPS Movement | Soft (event consumer) | `player:position` for the diegetic coordinate display only — cosmetic, not load-bearing. ⚠ Rule 10 additionally places a **locomotion-suspension requirement during `DOLLHOUSE_OPEN`** on this system, pending its owner's ratification (Open Q#9) |
| Win/Lose | Hard (data consumer, at `SEALED`) | Ending record + this system's own `anomaliesLogged` tally |

UI/HUD is the only system in the project with a hard dependency on nearly every other system —
consistent with its Presentation-layer position at the top of the dependency graph. It calls no
system's *mutating* methods, only read-only view-model getters and event subscriptions.

**Downstream — systems that depend on UI/HUD:** none within MVP scope. Found-Footage Layer (#13,
Vertical Slice tier, undesigned) will post-process this system's rendered output (playback
artifacts, frame drops) but does not depend on its internal state.

**Bidirectional actions:** none required — every producing system's own GDD already recorded a
"📌 UX Flag" pointing at this system; no sibling GDD needed amendment to support this one.

## Tuning Knobs

| Knob | Default | Safe Range | Too High | Too Low |
|---|---|---|---|---|
| `coverage_dominance_ratio` | 1.5× | 1.3×–1.75× | `coverage` grows into a separate oversized headline, breaking the shared clinical grid and reintroducing "two competing gauges" | Integer-completeness bias isn't overcome; player still trusts the wrong number. At `≤1.0` there is no dominance at all (rejected at config load) |
| `error_sting_min_interval_ms` | 200ms | 150ms–400ms | Debounce swallows genuinely-distinct alerts the player should hear as separate events, flattening the error channel's information rate | Interval drops under the sting's own ~100–200ms envelope, so two stings can still audibly overlap — defeating the cross-tick debounce (Rule 9) |

These are the two tuning knobs this system owns. Every value it renders (coverage, node counts,
proximity tiers, coordinates) is calibrated by the producing system, not here — UI/HUD only owns
*how* those values are displayed, not their thresholds or curves.

**Interaction note:** neither knob has cross-system coupling. `coverage_dominance_ratio`'s 1.5×
default is **unvalidated-by-design pending playtest** (see Formulas) — treat it as a starting point,
not a settled value. `error_sting_min_interval_ms` is sting *trigger-timing* (UI-owned), distinct
from the sting's sonic character (Audio System GDD's, #6).

## Visual/Audio Requirements

Palette, typography, and panel layout are already locked by the master GDD §11 — not this
section's to redesign. This section covers the two things not yet decided: panel-transition feel
and two new UI-specific audio cues the master audio table (§13) doesn't cover.

**Dollhouse transition — instant hard cut, no wipe/dissolve.** A dissolve or slide would read as
*animation*, pulling the panel back toward "menu" — exactly what the locked interaction pattern
(`P-DOLLHOUSE`: "a toggle, not a hold... cost is divided attention, not input friction") is meant
to avoid. Real clinical instruments cut between display modes; they don't dissolve. This also
extends Entity System's own no-fade, hard-cut precedent ("vanishes instantly, no fade") rather
than introducing a second, competing motion grammar. A silent instant pop risks reading as a
stutter the first time a player sees it — mitigated by pairing the cut with the toggle audio cue
below (one frame + one sound, satisfying the project's multi-channel cue rule `A-S1` without
adding motion).

**New audio cues:**

| Trigger | Cue | Direction |
|---|---|---|
| Dollhouse toggle **open** | Short (<150ms) mechanical relay-click / solenoid-snap, slight upward micro-inflection | Reads as the instrument physically engaging a display mode, not a UI chime; duration capped so the sound never outlasts the instant visual cut. *Deliberately **not** a "shutter" transient — §13 reserves the camera-shutter motif for `Scan initializing`, the core diegetic verb; the Dollhouse toggle must not borrow it and risk a false scan-affordance.* |
| Dollhouse toggle **close** | Same transient family, slight downward micro-inflection | Mirrors Scan Mechanic's convention of distinguishing states via directional motif on one sound family, not a new instrument |
| New error message appears in error bar (tiers `FAR`–`NEAR`) | Short (~100–200ms) single low tone with subtle distortion — **flat, non-escalating** across `FAR`–`NEAR` | Refines master GDD §13's existing "Error message" row by pinning it to a discrete trigger (each new string pushed to the bar); deliberately does not scale with proximity tier |
| New error message appears at `ADJACENT` | **No sting** — the message displays silently | §13 defines `ADJACENT` as "all sound drops except low subsonic rumble." The sting yields to that silence-drop so it does not become the loudest sound at the exact tier meant to go quiet. The error text still appears; only its audio cue is suppressed. (Rule 6, Rule 9; trigger logic BLOCKING **AC-UH57**, cue character ADVISORY AC-UH48) |

Both cues are pure mechanical/procedural transients — no musical stingers, consistent with the
existing audio table's vocabulary (servo, whir, click, chime).

> **Authority split (Vertical Delegation).** UI/HUD owns the **trigger logic** for these cues —
> *when* a cue fires, the per-tick dedup, the `SEALED` and `ADJACENT` suppressions (Rule 9). It does
> **not** author the cues' **sonic character**. The exact timbre, pitch-inflection, envelope, and
> the master §13 vocabulary reconciliation are the **Audio System GDD's (#6, Not Started) to fix** —
> the descriptions above (relay/shutter-snap, <150ms, directional micro-inflection, ~100–200ms low
> tone) are **provisional placeholders** for Audio to confirm or replace. Accordingly, the two ACs
> that assert cue *character* (AC-UH47, AC-UH48) are tagged **PROVISIONAL** and must be ratified by
> the Audio System GDD before they gate anything; the trigger-logic ACs (AC-UH27–29) remain
> BLOCKING here because they test UI-side event handling, not sound design. This GDD also does not
> lock the escalating proximity drone it references — that ambient bed is Audio's to define; UI only
> guarantees its own sting stays flat and yields at `ADJACENT`. **The flat-vs-escalating strategy
> itself is likewise provisional**: confining audio escalation to the drone + message content (rather
> than an escalating sting) is a strategic audio-character call the Audio System GDD may ratify or
> overturn — it is recorded here as this GDD's recommendation, not settled. Audio should also note
> the forward dependency: the 200ms debounce means rapid anomaly bursts go audibly flat after the
> first sting — a distinct burst/crescendo cue is Audio's tool to compensate with, if wanted.
> **Fallback clause:** if the Audio System GDD, when authored, does not commit to the escalating
> proximity drone (or declines it), the flat-sting strategy above is **void** and defaults to a
> **graduated/escalating sting** — the flat sting must never ship as the audio channel's only
> proximity signal. This makes the strategy's dependency on the drone explicit rather than
> silently contingent on an orphaned deliverable (Open Q#6).

*No `/asset-spec` flag yet — this system's assets are almost entirely 2D UI (CSS/HTML), out of
this template's per-3D-asset scope; revisit once the art bible's UI section exists.*

## UI Requirements

Unlike every sibling GDD, this system *is* the UI — this section covers what this GDD requires
of its own eventual detailed UX specs, not a hand-off to another system.

- **Accessibility compliance is inherited, not re-derived.** Every requirement in
  `design/ux/accessibility-requirements.md` applies directly: non-colour channel on the coverage
  ring and node status (A-V1); **independent text scaling (A-V2)**; full input remapping for the
  Dollhouse toggle key (A-M1); and the
  screen-reader-limitation acknowledgment (A-S1) — this system is where A-S1's "at least two of
  {shape, position, text, distortion}" requirement is actually implemented, not just specified.
- **A-V2 (text scaling) composes with `coverage_dominance_ratio` by uniform multiplication — the
  ratio is preserved, but absolute size needs its own clamp.** There are **two distinct grid-break
  failure modes and they must not be conflated**:
  - **Ratio break (handled by uniform application).** `coverage_dominance_ratio` (Rule 4) sets the
    *ratio* between `coverage` and `nodesCompleted`; A-V2's user text-scale multiplies the **whole HUD
    type scale uniformly**, so both numbers scale by the same A-V2 factor and the coverage:nodesCompleted
    ratio is **invariant** under A-V2. This rules out the naïve failure of applying A-V2 to `coverage`'s
    *already-dominance-scaled* size as an independent third multiplier (1.75 × 1.5 = 2.625× on `coverage`
    alone while `nodesCompleted` stays at 1.5×), which would compound the ratio past Rule 4's ceiling.
    The contract: **A-V2 applies to both elements uniformly** (equivalently, apply the ratio to the base
    scale then A-V2 to the result — the two operations commute, so order is not the invariant; *uniform
    application to both numbers* is). Ratio invariance holds at **any** A-V2 value. (AC-UH59 part 1.)
  - **⚠ Absolute break (NOT handled by ratio invariance — needs an explicit clamp).** Rule 4's own
    upper-bound rationale is about `coverage`'s **absolute** size (~1.75× base) breaking the shared
    clinical grid — a concern ratio invariance says **nothing** about. `accessibility-requirements.md`
    documents A-V2 only as a **floor** ("scalable ≥1.5× without loss of meaning") with **no ceiling**;
    an in-spec A-V2 = 3× therefore renders `coverage` at `1.75 × 3 = 5.25×` base — an absolute size the
    grid was never validated against. **Contract:** the HUD MUST apply an **absolute maximum
    font-size / container clamp** to the co-located widget, independent of `coverage_dominance_ratio`,
    so that at large A-V2 the widget reflows/clamps rather than overrunning the clinical grid. This is a
    UI-authorable clamp (this GDD's own to specify); **separately, an explicit A-V2 upper bound is
    routed to `accessibility-requirements.md`** — pinning a documented ceiling there is that spec's call,
    not this GDD's. (AC-UH59 part 2.)
  **A-V3 (photosensitivity ceiling) is satisfied vacuously for this system: UI/HUD renders no
  flicker, flash, or time-phased animation of its own.** The error bar updates by discrete text
  *replacement* (Rule 6), not a pulse or flash; the proximity-tier point-cloud flicker that A-V3
  was written for belongs to Point Cloud Renderer (ADR-0002(e), its own A-V3 obligation). This is
  why UI/HUD consumes no `session:tick.elapsedSeconds` for any visual (Rule 9 / Open Q#7) — it has
  no game-clock-timed visual to gate.
- **Interaction patterns are inherited, not re-derived.** `P-DOLLHOUSE` and `P-DIEGETIC` from
  `design/ux/interaction-patterns.md` are this system's own patterns to implement, not merely
  reference.
- **Detailed per-screen specs are deferred to `/ux-design`.** Both Floor Plan and Scan Node's
  GDDs already flagged this with a 📌 UX Flag pointing at `design/ux/dollhouse.md` and
  `design/ux/hud.md` respectively — this GDD confirms those flags rather than resolving them
  itself. Pre-Production must run `/ux-design` for both before epics are written; UI stories
  should cite those UX specs, not this GDD directly, for exact pixel/layout decisions.

> **📌 UX Flag — UI/HUD**: this entire system is a UI surface. `/ux-design` for both
> `design/ux/dollhouse.md` and `design/ux/hud.md` is a hard prerequisite before any UI/HUD story
> is written — more so than any sibling GDD's own flag, since this is the aggregation point all
> of them converge on.

## Acceptance Criteria

60 criteria: 36 BLOCKING (Logic) + 16 BLOCKING (Integration) + 8 ADVISORY (of which AC-UH47/UH48
are ADVISORY — PROVISIONAL, pending the Audio System GDD). AC-UH58 was upgraded ADVISORY → BLOCKING
(Logic) in round 6 — the reattach **input-lockout** is now a state-machine timing assertion (one-tick
reattach-grace, resume-signal withheld), not a playtest deferred to `/ux-design`. It asserts the
engine-race guarantee only, not a human-perceptible reaction budget (Rule 10). Unlike Win/Lose or
Entity System, this system *is* the presentation layer — its rendering, layout, and feel work is
ADVISORY (screenshot + lead sign-off, per `.claude/docs/coding-standards.md`'s Testing Standards
table), while its pure computation (tally logic, ratio math + clamp, message-pool selection, audio
dedup + debounce, state gating, dirty-check) is BLOCKING like any other Logic/Integration system. One Core Rule item (the Log
panel, Rule 1) is explicitly out of scope for this GDD and is flagged N/A below rather than given
a criterion.

> **⚠ Sixteen Integration ACs are currently unwritable** — AC-UH02, UH05–08, UH10, UH15, UH22–26,
> UH35, UH42, UH50, and UH55 assert rendered DOM/CSS/text output and require the jsdom/Testing Library
> harness that is **not yet on the allowed-libraries list** (Open Q#5). Each is marked inline
> "⚠ blocked on Open Q#5". No story may open against these until Open Q#5 resolves; they must
> **not** be silently downgraded to manual walkthrough. (This list is exhaustive by construction:
> *every* Integration AC that inspects rendered output carries the marker — an Integration AC
> without it is one testable against pure state via a fake bus. AC-UH02, asserting render-tree
> membership, was added to this list in round 5.)

**Testability requirements for the implementer:**
- Pure logic (the `anomaliesLogged` tally, `coverage_dominance_ratio` font-size math, tier→message
  pool selection, the per-tick audio-alert dedup, and the `HUD_ACTIVE`/`DOLLHOUSE_OPEN`/`TERMINAL`
  state machine) must be extractable into functions/classes testable via a fake event bus in
  Vitest — no real DOM, no real Floor Plan/Scan Node/Scan Mechanic/Entity System/Win/Lose
  instances required. `renderer:anomaly_density`, `entity:proximity`, `scan:*` events, cached
  session state, and Win/Lose's ending record are injected directly.
- DOM/reading-order assertions (AC-UH10, UH50, UH55) and "never expose" assertions (AC-UH05–08) require a
  lightweight rendering harness (jsdom via Vitest + Testing Library, or an equivalent
  component-render test) — these are Integration-tagged specifically because they exercise the
  render output, not pure logic in isolation. **⚠ Dependency flag:** jsdom/Testing Library is **not
  yet on** `technical-preferences.md`'s Allowed Libraries list (currently `three`,
  PointerLockControls, GLTFLoader, Vite, Vitest, Web Audio). Adding a DOM test harness is a
  prerequisite for these Integration ACs and must be **approved and added to the allowed-libraries
  list** before they can be written — tracked as Open Q#5.
- `get*ViewModel()` calls from Floor Plan/Scan Node/Scan Mechanic/Entity System/Win/Lose are
  mocked/stubbed in all tests above — this system never depends on a real producing system's
  internal state to prove its own contract.
- `coverage_dominance_ratio` must be an injectable/mockable config parameter — tests inject fixed
  values (default 1.5×, and boundary values within 1.3×–1.75×), never depend on a real config file.
- ADVISORY items are evidenced by screenshot + lead sign-off in `production/qa/evidence/`, not
  automated tests — per this system's Presentation-layer classification.

### Panel Structure (Rule 1)

**AC-UH01 — HUD_ACTIVE is the state whenever session is ACTIVE and the Dollhouse is closed**
GIVEN session state is `ACTIVE` and the Dollhouse panel is not open, WHEN the HUD state machine is
inspected, THEN its state is `HUD_ACTIVE` (the state whose render target is the FPS scan overlay +
corner readouts + sidebar). Pure state assertion — the actual DOM presence of those elements is
proven by AC-UH02's render harness, not here. **BLOCKING (Logic)**

**AC-UH02 — Dollhouse modal removes the always-visible HUD from the render tree, never layers over it**
GIVEN the Dollhouse toggle key is pressed while `HUD_ACTIVE`, WHEN the panel opens, THEN the
always-visible HUD's elements are removed from the render tree (not merely hidden beneath a
higher z-index) while `DOLLHOUSE_OPEN` is active — the Dollhouse panel is the sole occupant of the
view. **BLOCKING (Integration) — ⚠ blocked on Open Q#5** (asserts render-tree membership, an
inspected-DOM check like UH10/UH35/UH50; requires the jsdom harness).

> **Log panel (master GDD's third "tab")**: explicitly out of scope for this GDD (Rule 1) — its
> only designed content is itself flagged out-of-scope elsewhere. **No AC written; N/A by design.**

### View-Model Consumption (Rule 2)

**AC-UH03 — System references are constructor-injected, not delivered via new bus events**
GIVEN UI/HUD is constructed, WHEN it is instantiated, THEN it receives direct references to Floor
Plan, Scan Node, Scan Mechanic, Entity System, and Win/Lose as constructor arguments — no new
`ui:*_viewmodel_request` style event is published or subscribed to obtain them. Pure
constructor-argument assertion (no render output involved). **BLOCKING (Logic)**

**AC-UH04 — get*ViewModel() is polled every render tick while its panel is active**
GIVEN `HUD_ACTIVE` is the current state, WHEN a render tick occurs, THEN `getNodeLedgerViewModel()`
is called that tick; conversely, GIVEN `DOLLHOUSE_OPEN`, WHEN a render tick occurs, THEN
`getDollhouseViewModel()` is called that tick. Verified by spy call-counts on the injected getters —
pure logic, no render output. **BLOCKING (Logic)**

**AC-UH50 — No DOM mutation on a tick whose view model is unchanged (dirty-check)**
GIVEN the active panel's `get*ViewModel()` returns, **on every call, a freshly-constructed object
with a distinct reference but nested values equal to the previous tick's** (the real pure-getter
shape per ADR-0006(b)/0007(h) — NOT a reused same-reference object, which would mask the bug this AC
exists to catch under a naive `===`), WHEN that tick's render runs, THEN no DOM write/reflow occurs
for that panel — proven by a mutation observer (or a spied DOM-write path) recording zero writes
across N consecutive unchanged ticks, and ≥1 write on the tick the view model next changes.
**BLOCKING (Integration) — ⚠ blocked on Open Q#5**

**AC-UH55 — Re-attach forces a write even when the post-re-attach view model is value-identical to the pre-detach cache**
GIVEN state goes `HUD_ACTIVE` → `DOLLHOUSE_OPEN` → `HUD_ACTIVE`, and `getNodeLedgerViewModel()`
returns a **freshly-constructed, distinct-reference object** whose first post-re-attach value is
equal (per Rule 2's value comparison) to the last value cached before detach, WHEN the first
post-re-attach tick renders, THEN a DOM write occurs for the
always-visible HUD **regardless of the equality result** — the detach interval invalidated the
cache (Rule 2's forced-write clause) — AND on the following unchanged tick no write occurs (the
normal dirty-check resumes). Stages the exact scenario Rule 2's re-attach clause exists for, which
AC-UH50's continuous-polling setup never enters. **BLOCKING (Integration) — ⚠ blocked on Open Q#5**

### Never Expose — Inherited Constraints (Rule 3)

**AC-UH05 — Entity currentType and position never appear in any rendered output or intermediate view model**
GIVEN Entity System's real state includes a non-null `currentType` and a `currentPosition`, WHEN
UI/HUD renders the proximity bar or any other panel, THEN neither `currentType` nor
`currentPosition`/distance appears anywhere in the rendered output or in any view model this
system constructs for rendering. **BLOCKING (Integration) — ⚠ blocked on Open Q#5**

**AC-UH06 — entityInFrame is never exposed**
GIVEN Scan Mechanic's internal state includes an `entityInFrame` value for the current capture,
WHEN UI/HUD renders the scan readout, THEN `entityInFrame` does not appear anywhere in the
rendered output. **BLOCKING (Integration) — ⚠ blocked on Open Q#5**

**AC-UH07 — Anomaly rooms and true real-time scan state within the desync window are never exposed**
GIVEN Floor Plan's dollhouse view model includes desync-window internals (anomaly-room identity,
true real-time scan state), WHEN the Dollhouse panel renders `getDollhouseViewModel()`'s output,
THEN neither the anomaly room's identity nor the true (non-desynced) real-time scan state appears
in the rendered dollhouse. **BLOCKING (Integration) — ⚠ blocked on Open Q#5**

**AC-UH08 — Which primaryOutcome occurred is never leaked, verbatim or inferable**
GIVEN Win/Lose's ending record includes a `primaryOutcome` value, WHEN the terminal screen
renders, THEN the literal outcome name does not appear anywhere in the rendered text, and no
field independently reveals which of the 4 outcomes occurred beyond what Win/Lose's own
text-variation matrix (its Rule 8 / UI Requirements) already permits. **BLOCKING (Integration) — ⚠ blocked on Open Q#5**

### Coverage Dominance (Rule 4, Formula — `coverage_dominance_ratio`)

**AC-UH09 — coverage's font size equals nodesCompleted's font size × coverage_dominance_ratio**
GIVEN `coverage_dominance_ratio = 1.5` (default) and a given base font size for `nodesCompleted`,
WHEN the co-located coverage/nodesCompleted widget renders, THEN `coverage`'s computed font size
is `toBeCloseTo(nodesCompletedFontSize * 1.5, 5)`. **BLOCKING (Logic)**

**AC-UH10 — coverage precedes nodesCompleted in DOM/reading order**
GIVEN the co-located coverage/nodesCompleted widget renders, WHEN its DOM structure is inspected,
THEN the `coverage` element appears before the `nodesCompleted` element in document/reading
order. **BLOCKING (Integration) — ⚠ blocked on Open Q#5**

**AC-UH11 — coverage_dominance_ratio is configurable within its documented safe range**
GIVEN `coverage_dominance_ratio` is injected at each of 1.3×, 1.5× (default), and 1.75×, WHEN the
font-size computation runs at each value, THEN the resulting ratio matches the injected value
exactly (`toBeCloseTo`) — proving the ratio is read from config, not hardcoded.
**BLOCKING (Logic)**

**AC-UH49 — Out-of-range coverage_dominance_ratio is clamped at config load, never applied raw**
GIVEN `coverage_dominance_ratio` is injected at each of `0`, `-1`, `1.0`, `1.29`, and `1.76`, WHEN
config load runs, THEN each is clamped to the nearest safe-range bound (`1.3` for `0`/`-1`/`1.0`/
`1.29`; `1.75` for `1.76`), a warning is logged, and the raw out-of-range value is never used in the
font-size computation — proving `0` (invisible), negative (invalid CSS), and `≤1.0` (no dominance)
can never reach the renderer. AND GIVEN `NaN`, `undefined`, or a non-number string is injected, WHEN
config load runs, THEN the value falls back to the `1.5` default with a logged warning — the clamp
comparison is never evaluated against a non-numeric value. **BLOCKING (Logic)**

**AC-UH53 — Terminal screen renders coverage and nodesCompleted at equal base size (no dominance ratio)**
GIVEN the terminal screen renders an ending record containing both `coverage` and `nodesCompleted`,
WHEN their font sizes are computed, THEN both use the same base size — `coverage_dominance_ratio`
is not applied in `TERMINAL` (ratio effectively 1.0) regardless of the configured in-session value,
per Core Rule 4's carve-out protecting Win/Lose's neutral-voice guarantee. **BLOCKING (Logic)**

**AC-UH12 — coverage visually reads as the dominant element at the default ratio**
GIVEN the co-located widget renders at the default 1.5× ratio, WHEN a lead reviews the evidence
against this checklist, THEN **all** hold: (1) `coverage`'s font size matches AC-UH09's computed
ratio; (2) `nodesCompleted` carries **no competing** dominance cue — its `color`, `font-weight`,
and `transform`/`scale` are recorded from **`getComputedStyle()`** (devtools inspection or a scripted
capture), **not inferred from the screenshot**: a raster screenshot cannot distinguish a legitimate
font-size increase from a `transform: scale()` faking one — the exact ambiguity this item exists to
rule out — so item (2) MUST cite actual computed-style values, and `nodesCompleted`'s `color`/
`font-weight` must equal `coverage`'s with no additional `transform`/scale beyond the base type scale
(the size delta itself is already proven computationally by AC-UH09); (3) `coverage` precedes
`nodesCompleted` in reading order (AC-UH10). The screenshot supports **only** the perceptual read
("does `coverage` look dominant"); the computed-style facts come from the recorded values. Passing
all three closes `AC-SN31 DEFERRED` as a genuinely observed, not merely computed, resolution.
Evidence: screenshot **+ recorded `getComputedStyle()` values** + lead sign-off in
`production/qa/evidence/`. **ADVISORY**

**AC-UH59 — coverage_dominance_ratio composes with A-V2 by uniform multiplication (ratio invariant), AND an absolute clamp bounds coverage's size at high A-V2**
GIVEN `coverage_dominance_ratio` is injected at its safe-range max (1.75×) and an A-V2 user text
scale is injected at each of 1.0×, 1.5×, and a **large** plausible value (e.g. 3×), WHEN the
co-located widget's font sizes are computed, THEN:
**Part 1 (ratio invariance):** for every A-V2 value, `coverage`'s size ÷ `nodesCompleted`'s size
equals `coverage_dominance_ratio` exactly (`toBeCloseTo`), unchanged by A-V2 — proving A-V2 is
applied uniformly to both numbers and never as an independent third multiplier on `coverage`'s
already-dominance-scaled size, so the two 1.5×-class multipliers never compound the *ratio* past
Rule 4's ceiling.
**Part 2 (absolute clamp):** at the large A-V2 value where `ratio × A-V2 × base` would exceed the
widget's absolute grid ceiling, `coverage`'s computed size (or its container) is **clamped to that
absolute maximum**, not rendered at the raw `1.75 × 3 = 5.25×` product — proving ratio invariance
alone does not leave absolute size unbounded (per UI Requirements' two-failure-mode contract).
Both factors and the absolute-max are injectable/mockable config, never a real config file.
**BLOCKING (Logic)**

### anomaliesLogged Tally (Rule 5)

**AC-UH13 — Tally increments exactly once per renderer:anomaly_density event, regardless of sigma sign**
GIVEN a `renderer:anomaly_density {sigma: 5.0}` event (spike) and a `renderer:anomaly_density
{sigma: -4.0}` event (deficit) each fire once, WHEN each is received, THEN `anomaliesLogged`
increments by exactly 1 per event, for both sigma signs identically. **BLOCKING (Logic)**

**AC-UH14 — Tally is session-cumulative across all ticks**
GIVEN multiple `renderer:anomaly_density` events fire across many separate ticks over a session,
WHEN the tally is read at any point, THEN it equals the running total of all events received so
far, never reset mid-session. **BLOCKING (Logic)**

**AC-UH15 — Tally value is read and included at SEALED for the terminal screen**
GIVEN a non-zero `anomaliesLogged` tally at the moment session state becomes `SEALED`, WHEN the
terminal screen renders, THEN it displays that exact tally value as `ANOMALIES LOGGED: [X]`.
**BLOCKING (Integration) — ⚠ blocked on Open Q#5**

### Diegetic Error-Message Escalation (Rule 6)

**AC-UH16 — FAR/MEDIUM tiers select the generic alignment/depth message pool**
GIVEN cached proximity tier is `FAR` or `MEDIUM`, WHEN an escalation-relevant tier change fires,
THEN the selected message is drawn from the generic alignment/depth-sensor pool (e.g.
`ALIGNMENT WARNING`, `DEPTH SENSOR TIMEOUT`), never the geometry/density or operator pools.
**BLOCKING (Logic)**

**AC-UH17 — NEAR tier selects the geometry/density message pool**
GIVEN cached proximity tier is `NEAR`, WHEN an escalation-relevant tier change fires, THEN the
selected message is drawn from the geometry/density pool (e.g. `UNEXPECTED GEOMETRY DETECTED`),
distinct from the FAR/MEDIUM pool. **BLOCKING (Logic)**

**AC-UH18 — ADJACENT tier selects the operator/signal-loss pool and triggers UI freeze**
GIVEN cached proximity tier is `ADJACENT`, WHEN an escalation-relevant tier change fires, THEN
the selected message is drawn from the operator/signal-loss pool AND the always-visible HUD's
panels enter their freeze state — matching Entity System's own tier-to-feedback mapping.
**BLOCKING (Logic)**

**AC-UH19 — renderer:anomaly_density independently drives error-message display regardless of tier**
GIVEN cached proximity tier is `FAR`, WHEN a `renderer:anomaly_density` event fires, THEN a new
error message is pushed to the error bar — the anomaly-density message pathway is not gated by
proximity tier. **BLOCKING (Logic)**

**AC-UH19b — Message selection within a pool is anti-repeating (shuffled cycle, no immediate repeat)**
GIVEN a message pool of size N and N+1 successive selections from it, WHEN the selected strings are
recorded, THEN the first N are all distinct (every string shown once before any repeats) AND no two
consecutive selections are the identical string across the cycle boundary — ruling out both
"always the first string" and immediate-repeat random selection. For a pool of size N=1 the
anti-repeat clause is vacuous (every selection is necessarily the same string) and does not apply.
**BLOCKING (Logic)**

**AC-UH56 — Error bar holds exactly one message; a same-tick burst resolves to the single latest string**
GIVEN N ≥ 2 error-triggering events arrive within one tick, each mapping to a message push, WHEN
that tick resolves, THEN the error bar's displayed-message state holds exactly one string — the
most recent push — with no stack, queue, or scrollback retaining the earlier N−1 strings (Rule 6's
replace-not-stack discipline). Pure state assertion on the current-message field; no DOM harness
required. **BLOCKING (Logic)**

### Session-State Gating (Rule 7)

**AC-UH20 — HUD and Dollhouse panel are interactive only during ACTIVE**
GIVEN session state is `LOADING` or `SEALED`, WHEN player input targeting the HUD or Dollhouse
toggle is received, THEN it has no effect — interactivity is gated strictly to `ACTIVE`.
**BLOCKING (Logic)**

**AC-UH21 — On SEALED, all panels freeze in place**
GIVEN session state transitions to `SEALED`, WHEN the transition processes, THEN whichever panel
was active (`HUD_ACTIVE` or `DOLLHOUSE_OPEN`) stops updating and holds its last-rendered values —
no further `get*ViewModel()` polling occurs for that panel. **BLOCKING (Logic)**

**AC-UH22 — On SEALED, the terminal screen takes over rendering**
GIVEN session state transitions to `SEALED`, WHEN the transition processes, THEN state becomes
`TERMINAL` and Win/Lose's ending record renders in place of whatever was previously shown.
**BLOCKING (Integration) — ⚠ blocked on Open Q#5**

### Terminal Screen (Rule 8)

**AC-UH23 — STATUS Register A renders from the identical template for ESCAPE and COMPLETION_TRAP**
GIVEN two ending records identical except `primaryOutcome` is `ESCAPE` in one and
`COMPLETION_TRAP` in the other, WHEN the terminal screen renders `STATUS` for each, THEN both
render from the **same Register-A template/component** — byte-identical DOM structure and static
copy — differing **only** in the named interpolated numeric fields Win/Lose's matrix permits to
vary. No outcome-specific class, colour, icon, ordering, or copy difference is present. (Objective
assertion — compare the two rendered subtrees for equality modulo the permitted numeric fields; no
"tone" judgment.) **BLOCKING (Integration) — ⚠ blocked on Open Q#5**

**AC-UH24 — STATUS Register B renders from the identical template for MOVEMENT_VIOLATION and SCAN_CORRUPTION, and the two registers differ**
GIVEN two ending records identical except `primaryOutcome` is `MOVEMENT_VIOLATION` in one and
`SCAN_CORRUPTION` in the other, WHEN the terminal screen renders `STATUS` for each, THEN both
render from the **same Register-B template/component** (byte-identical DOM + static copy, differing
only in permitted interpolated fields), AND the Register-B template is **not** equal to the
Register-A template. Same objective subtree-equality method as AC-UH23. **BLOCKING (Integration) — ⚠ blocked on Open Q#5**

**AC-UH25 — entityEverCaptured modulates exactly one existing field, never adds a new line**
GIVEN two otherwise-identical ending records differing only in `entityEverCaptured`, WHEN the
terminal screen renders both, THEN the set of rendered fields/lines is identical between the two
— only the word-choice within the one designated field (`STATUS` or `ANOMALIES LOGGED`) differs.
**BLOCKING (Integration) — ⚠ blocked on Open Q#5**

**AC-UH26 — No literal "YOU WIN"/"YOU LOSE" text appears under any outcome**
GIVEN the terminal screen renders for each of the 4 primary outcomes in turn, WHEN the rendered
text is inspected, THEN no instance of "YOU WIN", "YOU LOSE", or an equivalent explicit verdict
string appears in any of the 4 renders. **BLOCKING (Integration) — ⚠ blocked on Open Q#5**

### Audio Dedup and SEALED Precedence (Rule 9)

**AC-UH27 — Audio alert tone fires exactly once per tick when 2+ error-triggering events arrive that tick**
GIVEN a `renderer:anomaly_density` event and an escalation-relevant `entity:proximity` tier
change both arrive within the same tick, WHEN that tick's audio output is evaluated, THEN the
audio alert tone fires exactly once — not twice, not once per event. **BLOCKING (Logic)**

**AC-UH28 — Each event still independently drives its own visual display despite audio dedup**
GIVEN the same same-tick scenario as AC-UH27, WHEN visual display is evaluated for that tick,
THEN both the error message (from `renderer:anomaly_density`) and the proximity bar (from the
tier change) update independently — audio dedup does not suppress or merge either visual output.
**BLOCKING (Logic)**

**AC-UH29 — Either error-triggering event type landing the same tick as the transition to SEALED does not fire the audio tone**
GIVEN a `renderer:anomaly_density` event, or separately an escalation-relevant `entity:proximity`
tier change, arrives within the same tick as the transition to `SEALED`, WHEN that tick's audio
output is evaluated for either case, THEN the audio alert tone does NOT fire in either case —
Rule 7's freeze takes precedence over the same-tick alert regardless of which event type
triggered it, per Rule 9's explicit clause. **BLOCKING (Logic)**

**AC-UH57 — At ADJACENT, an error-triggering event displays its message but fires no audio sting (no SEALED involved)**
GIVEN the resolved proximity tier is `ADJACENT` and NO transition to `SEALED` lands this tick, WHEN
an error-triggering event (`renderer:anomaly_density` or an escalation-relevant `entity:proximity`
tier change) arrives and end-of-tick audio is evaluated, THEN the audio alert tone does **not** fire
(§13 silence-drop, Rule 6/Rule 9) AND the error message still displays. This isolates the
ADJACENT-suppression clause from AC-UH29's SEALED-suppression — the two are distinct suppression
paths and AC-UH29 never stages a non-SEALED ADJACENT tick. Pure end-of-tick audio-decision
assertion via a fake bus; no DOM harness required. **BLOCKING (Logic)**

**AC-UH52 — A sting is suppressed when a prior sting fired within error_sting_min_interval_ms (cross-tick debounce)**
GIVEN a sting fired on tick T, WHEN a new error-triggering event arrives on a later tick T+k whose
wall-clock offset from T is **less than** `error_sting_min_interval_ms` (default 200ms), THEN no new
sting fires for that event, while its visual message still displays (Rule 6); AND GIVEN the offset
is **≥** `error_sting_min_interval_ms`, THEN the new sting fires normally.
AND GIVEN **no sting has yet fired this session** (the last-fired timestamp holds its initial
sentinel) and the injected mock clock reads `0`, WHEN the session's **first** error-triggering event
arrives, THEN the sting **fires** — proving the sentinel is initialised to a value unconditionally
`≥ error_sting_min_interval_ms` in the past (`-Infinity`/`null`), never `0`: a `0` initial value
against a `0`-start mock clock would compute offset `0 < interval` and wrongly suppress the session's
very first sting (Rule 9 "Cold-start sentinel"). This branch is what distinguishes a correct
sentinel from `0`; the two prior-fire branches above never exercise it.
`error_sting_min_interval_ms`
is an injectable/mockable config parameter (tests inject fixed values within 150–400ms and a mock
clock via the injected time source Rule 9 names, never a real timer or config file). Proves Rule 9's
cross-tick debounce, distinct from the same-tick dedup of AC-UH27. **BLOCKING (Logic)**

**AC-UH54 — No audio sting fires while DOLLHOUSE_OPEN, none fires retroactively on close; bookkeeping continues**
GIVEN state is `DOLLHOUSE_OPEN`, WHEN one or more error-triggering events (`renderer:anomaly_density`
and/or an escalation-relevant `entity:proximity` tier change) arrive, THEN no audio alert tone fires
during `DOLLHOUSE_OPEN` and no deferred/retroactive tone fires on the transition back to
`HUD_ACTIVE`; AND `anomaliesLogged` still increments once per qualifying event, AND the latest
cached error message renders on the first post-re-attach tick (Rule 2's forced write) — proving
Rule 10 withholds presentation only, never state. **BLOCKING (Logic)**

**AC-UH58 — Reattach input-lockout: locomotion-resume is withheld for exactly one tick after DOLLHOUSE_OPEN closes (state timing, not a perceptual guarantee)**
GIVEN state transitions `DOLLHOUSE_OPEN → HUD_ACTIVE` (the player closes the panel) while the cached
proximity tier is `ADJACENT`, WHEN the first post-re-attach tick is processed, THEN (1) the HUD is in
its one-tick **reattach-grace** sub-state and does **not** emit the locomotion-resume signal on that
tick; (2) it emits the resume signal on the **following** tick (grace lasts exactly one tick, not
longer); AND (3) the forced cached-error-message write (Rule 2 / AC-UH55) occurs on the grace tick —
so the message-write frame and the movement-suppressed frame are the same frame. Verified via
the HUD state machine + a spy on the resume-signal emission against a fake bus — pure logic, no DOM
harness, no playtest. This asserts the **input-lockout / race-condition** guarantee Rule 10 fixes:
because AC-WL08's Movement Violation needs a `player:position` delta that cannot occur until resume,
no instant loss can land on the *same frame* the player reattaches. It does **not** assert that the
single 16.6 ms frame is a human-perceptible reaction budget (Rule 10 — that is an open `/ux-design`
question). **BLOCKING (Logic)**

> *Any **human-scaled reaction budget** beyond this one-tick engine-race lockout (a multi-frame
> readable interval or an on-close cue) is a `/ux-design` dollhouse-spec call, tracked at Rule 10's
> cross-system seam and Open Q#2 — the simultaneous-frame race is settled here; the perceptibility
> question is not. The
> enforcement that the player physically cannot translate on the grace tick rides FPS Movement
> honouring the withheld resume signal (Open Q#9).*

### States and Transitions

**AC-UH30 — HUD_ACTIVE transitions to DOLLHOUSE_OPEN on toggle key press**
GIVEN state is `HUD_ACTIVE`, WHEN the Dollhouse toggle key is pressed, THEN state transitions to
`DOLLHOUSE_OPEN`. **BLOCKING (Logic)**

**AC-UH31 — DOLLHOUSE_OPEN transitions back to HUD_ACTIVE on toggle key press again**
GIVEN state is `DOLLHOUSE_OPEN`, WHEN the Dollhouse toggle key is pressed again, THEN state
transitions to `HUD_ACTIVE`. **BLOCKING (Logic)**

**AC-UH32 — Either HUD_ACTIVE or DOLLHOUSE_OPEN transitions to TERMINAL on SEALED**
GIVEN state is `HUD_ACTIVE` or, separately, `DOLLHOUSE_OPEN`, WHEN session state becomes `SEALED`
in each case, THEN state transitions to `TERMINAL` from either starting state.
**BLOCKING (Logic)**

**AC-UH33 — TERMINAL is a true terminal state**
GIVEN state is `TERMINAL`, WHEN each of the following is received in turn — a Dollhouse toggle-key
press, a repeat `SEALED`, an `ACTIVE` session-state event, a `renderer:anomaly_density` event, an
`entity:proximity` tier change, and one arbitrary unhandled event type — THEN in every case no
state transition occurs; `TERMINAL` has no exit edge for any member of this closed set.
**BLOCKING (Logic)**

**AC-UH51 — A toggle press and the SEALED transition in the same tick resolve to TERMINAL with no DOLLHOUSE_OPEN frame**
GIVEN state is `HUD_ACTIVE` and, within one single tick, BOTH a Dollhouse toggle-key press AND the
transition to `SEALED` are staged in the input/event buffer, WHEN that tick is resolved at
end-of-tick, THEN the state machine transitions directly to `TERMINAL`, the toggle is discarded, and
`DOLLHOUSE_OPEN` is **never entered** for even one frame (assert the state never equals
`DOLLHOUSE_OPEN` at any point during or after the tick). Same GIVEN starting from `DOLLHOUSE_OPEN`
(a toggle-to-close press + `SEALED` same tick) → `TERMINAL`, no extra `HUD_ACTIVE` frame. Mirrors
Rule 9's audio SEALED-precedence (AC-UH29) for the state machine; the simultaneity AC-UH32/UH35 did
not stage. **BLOCKING (Logic)**

### Edge Cases

**AC-UH34 — Dollhouse toggle pressed during SCAN_LOCKED is ignored**
GIVEN Scan Mechanic's camera lock (`SCAN_LOCKED`) is currently active, WHEN the Dollhouse toggle
key is pressed, THEN no state transition occurs — the always-visible HUD's scan overlay remains
exclusive. **BLOCKING (Logic)**

**AC-UH35 — SEALED arriving while Dollhouse is open closes the panel immediately and shows the terminal**
GIVEN state is `DOLLHOUSE_OPEN`, WHEN session state becomes `SEALED`, THEN the Dollhouse panel is
not rendered at all after that tick, and the terminal screen renders instead — no stale modal
frame is ever shown alongside or after the terminal screen. **BLOCKING (Integration) — ⚠ blocked on Open Q#5**

**AC-UH36 — renderer:anomaly_density and entity:proximity tier change in the same tick each independently drive their own display, with no dedup/priority between the two visual channels**
GIVEN both events arrive in the same tick, WHEN visual output is evaluated, THEN the error
message bar and the proximity bar both update, with neither event suppressing or delaying the
other's visual channel — distinct from AC-UH27's audio-only dedup. **BLOCKING (Logic)**

**AC-UH37 — anomaliesLogged is not incremented for events arriving after SEALED**
GIVEN session state is `SEALED`, WHEN a `renderer:anomaly_density` event arrives afterward, THEN
`anomaliesLogged` does not increment — the tally is frozen at whatever value it held at the
moment of the ending-record snapshot. **BLOCKING (Logic)**

**AC-UH38 — get*ViewModel() called before its producing system's first init-equivalent event returns an empty/loading-state view model, not a throw**
GIVEN `floorplan:init` (or the equivalent for another producing system) has not yet fired, WHEN
`getDollhouseViewModel()` (or the equivalent) is called, THEN it returns a defined
empty/loading-state view model rather than throwing an exception. **BLOCKING (Logic)**

**AC-UH39 — A session where the Dollhouse panel is never opened completes with no error or side effect**
GIVEN a full session in which the Dollhouse toggle key is never pressed, WHEN the session reaches
`SEALED`, THEN no error occurs and no Dollhouse-specific state prevents or alters the terminal
screen's rendering. **BLOCKING (Logic)**

**AC-UH40 — Two renderer:anomaly_density events in the same tick increment anomaliesLogged twice**
GIVEN two separate `renderer:anomaly_density` events (e.g. two tiles crossing threshold
simultaneously) arrive within the same tick, WHEN both are processed, THEN `anomaliesLogged`
increments by exactly 2 for that tick — once per event, not once per tick.
**BLOCKING (Logic)**

### UI Requirements — Inherited Accessibility and Interaction Patterns

**AC-UH41 — Coverage ring and node status carry their committed non-colour channel (A-V1)**
GIVEN the coverage ring and node-status indicators render, WHEN reviewed with colour removed
(greyscale), THEN each remains distinguishable via its **committed** non-colour channel: the
**coverage ring** by **arc-length / fill proportion** (the ring's swept angle encodes coverage
independent of colour), and **per-node status** by a **distinct glyph/icon per state** (e.g.
unscanned / valid / invalid each have their own shape, not merely their own colour). Citing "some
non-colour channel" is insufficient — these specific channels are the checkable requirement.
Evidence: greyscale screenshot + manual walkthrough doc in `production/qa/evidence/`. **ADVISORY**

**AC-UH42 — Error bar renders no flash/animation; A-V3 has no applicable target in this system**
GIVEN a new error message is pushed to the error bar, WHEN the bar updates, THEN it updates by
**discrete text replacement only** — no CSS `transition`, `animation`, keyframe, or flash is applied
to the message-swap path, and no element the error bar owns pulses or flickers. Because this system
renders no time-phased visual, A-V3's **≤ 3 flashes/second** ceiling has no applicable target here.
*Scope note: the proximity-tier point-cloud flicker/jitter A-V3 was written for is **not** UI/HUD's
— it is rendered by Point Cloud Renderer (ADR-0002(e) jitter, its own A-V3 obligation). This system
renders no flicker of its own.* Verified by an objective DOM/CSS assertion (absence of any
transition/animation on the error-bar element), not a perceptual judgment. **BLOCKING (Integration)
— ⚠ blocked on Open Q#5** (jsdom/Testing Library harness).

**AC-UH43 — Dollhouse toggle key is fully remappable (A-M1)**
GIVEN the input-remapping UI, WHEN the player rebinds the Dollhouse toggle key, THEN the new
binding is honored and the default binding no longer triggers the toggle. Evidence: manual
walkthrough doc. **ADVISORY**

**AC-UH44 — Each alert implements its committed two of {shape, position, text} (A-S1), surviving reduced-distortion mode**
GIVEN each alert state this system renders, WHEN reviewed against A-S1 **with the reduced-distortion
toggle ON**, THEN the **committed per-alert channel pair** — drawn only from the reduced-distortion-
*safe* set `{shape, position, text}`, never `distortion` — is still fully present: **error message**
= **text + position** (the string, in the fixed error-bar location); **proximity escalation** =
**text + position** (the escalating message rendered in a dedicated, fixed escalation slot whose
occupancy/prominence is the second channel); **UI freeze (ADJACENT)** = **text + position**
(a `SIGNAL LOST`/frozen-state label + the panels holding their last values in place). Distortion,
where the game renders it (reduced-distortion OFF), is an **additional reinforcing** channel — it is
**never** counted toward the committed pair, so no alert degrades below two channels when distortion
is disabled. This closes the reduced-distortion single-channel gap: assigning a distortion-free pair
per alert (not just "any two") is the checkable requirement. Evidence: manual walkthrough doc, run
with the reduced-distortion toggle ON. **ADVISORY**

**AC-UH45 — P-DOLLHOUSE and P-DIEGETIC interaction patterns are implemented as specified**
GIVEN the Dollhouse toggle interaction and the overall diegetic-UI presentation, WHEN compared
against `design/ux/interaction-patterns.md`, THEN **each** of these enumerated checkpoints holds —
**P-DOLLHOUSE:** (1) toggle, not hold; (2) fullscreen-blocking, not a translucent overlay; (3)
world *simulation* continues while open — the entity keeps approaching and dwell keeps accruing
(Rule 10); (4) toggle key is rebindable. **P-DIEGETIC:** (5) no
external/DOM HUD outside the diegetic surface; (6) critical state carries ≥2 channels per A-S1
(AC-UH44); (7) coverage/status carry a non-colour channel per A-V1 (AC-UH41). Each numbered item is
a separate pass/fail line in the walkthrough. Evidence: manual walkthrough doc. **ADVISORY**

> **⚠ Known conformance gap — player *locomotion* during `DOLLHOUSE_OPEN`.** This AC deliberately
> asserts checkpoint (3) as *world-simulation* continuity only, **not** live player locomotion.
> `interaction-patterns.md`'s current P-DOLLHOUSE cost line ("lingering can walk you into a loop
> door or the entity") reads as though the player can *move* while the map is open — the **opposite**
> of Rule 10's stationary/safe-while-open/trap-on-close model (Open Q#9). Until FPS Movement ratifies
> the locomotion-suspension requirement (Open Q#9) and `interaction-patterns.md` is updated to match,
> this GDD does **not** claim conformance to any "walk while open" reading of P-DOLLHOUSE. The two
> docs are in a coordination conflict, not two ratified designs — flagged for a coordinated
> pattern-library update, not resolved here.

### Visual/Audio Requirements — Feel

**AC-UH46 — Dollhouse transition is an instant hard cut, no wipe/dissolve**
GIVEN the Dollhouse toggle key is pressed (either direction), WHEN the panel transition plays,
THEN it is a single-frame hard cut with no dissolve, slide, or fade animation. Evidence:
screenshot/recording + lead sign-off. **ADVISORY**

**AC-UH47 — Dollhouse toggle open/close audio cues match spec**
GIVEN the Dollhouse toggle key is pressed (either direction), WHEN the paired audio cue plays,
THEN it is a <150ms mechanical relay/shutter-snap transient with the correct directional
micro-inflection (upward on open, downward on close). Evidence: lead sign-off. **ADVISORY —
PROVISIONAL** (cue *character* is the Audio System GDD's to ratify; see Visual/Audio Requirements
authority split. UI owns only that a cue fires on toggle, not its timbre.)

**AC-UH48 — Error-bar audio sting stays flat/non-escalating across FAR–NEAR, and is suppressed at ADJACENT**
GIVEN a new error message is pushed to the error bar at tiers `FAR`–`NEAR`, WHEN the accompanying
sting plays, THEN its character (duration ~100–200ms, low tone, subtle distortion) does not scale or
intensify with tier; AND GIVEN a new error message at `ADJACENT`, WHEN it is pushed, THEN **no sting
plays** (message displays silently, yielding to §13's silence-drop — Rule 6/Rule 9). Escalation is
confined to message content and the proximity drone, never the sting. Evidence: lead sign-off.
**ADVISORY — PROVISIONAL** (sting *character* is the Audio System GDD's to ratify; the
ADJACENT-suppression *trigger logic* is UI-owned and covered by BLOCKING **AC-UH57** — not AC-UH29,
which stages only the SEALED-same-tick suppression, a distinct path.)

## Coverage Validation

| Source | AC(s) |
|---|---|
| Core Rule 1 (panel structure) | AC-UH01, UH02; Log panel N/A by design |
| Core Rule 2 (DI view-model consumption + dirty-check + forced write on re-attach) | AC-UH03, UH04, UH50, UH55 |
| Core Rule 3 (never expose — 4 inherited constraints) | AC-UH05, UH06, UH07, UH08 |
| Core Rule 4 / Formula (`coverage_dominance_ratio` + out-of-range clamp + terminal carve-out + A-V2 composition) | AC-UH09, UH10, UH11, UH12, UH49, UH53, UH59 |
| Formula (`error_sting_min_interval_ms` debounce, Rule 9) | AC-UH52 |
| Core Rule 5 (anomaliesLogged tally) | AC-UH13, UH14, UH15 |
| Core Rule 6 (diegetic error escalation + anti-repeat selection + replace-not-stack) | AC-UH16, UH17, UH18, UH19, UH19b, UH56 |
| Core Rule 7 (session-state gating) | AC-UH20, UH21, UH22 |
| Core Rule 8 (terminal screen matrix) | AC-UH23, UH24, UH25, UH26 |
| Core Rule 9 (audio dedup + SEALED precedence + ADJACENT suppression + cross-tick debounce) | AC-UH27, UH28, UH29, UH54, UH57, UH52 |
| Core Rule 10 (DOLLHOUSE_OPEN blackout — safe-while-open, trap-on-close + reattach input-lockout) | AC-UH54, UH58 |
| State table: HUD_ACTIVE / DOLLHOUSE_OPEN / TERMINAL (+ same-tick toggle/SEALED race) | AC-UH30, UH31, UH32, UH33, UH51 |
| Edge Cases (all 7) | AC-UH34, UH35, UH36, UH37, UH38, UH39, UH40 |
| UI Requirements — inherited accessibility/interaction patterns (incl. A-V2 text-scale composition) | AC-UH41, UH42, UH43, UH44, UH45, UH59 |
| Visual/Audio Requirements — feel | AC-UH46, UH47, UH48 |

No Core Rule, the Formula/tuning knob, the state table, or any Edge Case is left without a
corresponding criterion, with **two disclosed exceptions**: (1) the Log panel (Rule 1) is explicitly
out of scope per this GDD's own text; (2) Rule 2's **first-tick cold-start sentinel** is a stated
contract, not a test-covered one — AC-UH50's N-consecutive-unchanged-ticks setup begins *after* the
first forced write and never exercises the cold start (Rule 2's own note). Unlike Rule 9's analogous
sting cold-start sentinel — which *is* AC-covered by AC-UH52's zero-prior-fires branch — the Rule 2
dirty-check cold start is deliberately left as a contract-only exception, not a gap. Neither exception
is a missing criterion for an in-scope, test-reachable behaviour.

**Tag totals**: 36 BLOCKING (Logic) + 16 BLOCKING (Integration) + 8 ADVISORY = **60 criteria**
(AC-UH47/UH48 are ADVISORY — PROVISIONAL, to be ratified by the Audio System GDD; sixteen
Integration ACs — UH02, UH05–08, UH10, UH15, UH22–26, UH35, UH42, UH50, UH55 — are ⚠ blocked on
Open Q#5 until the DOM test harness is approved). New in round 5: BLOCKING **AC-UH57** (ADJACENT
audio-suppression in isolation). New in round 6: BLOCKING **AC-UH59** (`coverage_dominance_ratio` ×
A-V2 text-scale composition). Changed in round 6: **AC-UH58** upgraded ADVISORY → BLOCKING (Logic)
— reattach **input-lockout** is now a state-machine timing assertion (one-tick reattach-grace), not a
`/ux-design` placeholder; it asserts the engine-race guarantee only, not a human-perceptible reaction
budget (Rule 10, reworded round 7).

## Open Questions

1. **Log panel content** — out of scope for this GDD (Rule 1); revisit once Scan Mechanic's Open
   Q#5 (D-1 Auto-Typed Log) and the master GDD's v0.2-tagged Log tab are actually scoped in.
2. **`/ux-design` for `design/ux/dollhouse.md` and `design/ux/hud.md`** — flagged as a hard
   prerequisite (📌 UX Flag above) before any UI/HUD implementation story is written; this GDD
   fixes *content and behavior*, not exact pixel layout. **Includes the terminal-screen copy
   strings** (Rule 8): this GDD fixes the register/field *structure* + ACs but explicitly defers the
   actual §10 copy to the terminal-screen UX spec, where they can be tuned against real layout and
   verified not to leak `primaryOutcome` (AC-UH08/UH26). Also inherits Win/Lose Open Q#3 (which
   single field `entityEverCaptured` modulates).
3. **DOM occlusion implementation for Dollhouse (Rule 1)** — **RESOLVED**: Rule 1 now specifies
   **detach-and-cache** (retain the HUD's DOM subtree in memory, re-attach on close), not mere
   z-index/visibility hiding *and* not destroy-and-rebuild — keeping the toggle sub-frame and
   flash-free under rapid toggling. Closes the ambiguity `qa-lead`/`ui-programmer` flagged around
   AC-UH02.
4. **Composition-root DI as this system's own future ADR** — Core Rule 2 resolves the transport
   question Floor Plan's ADR-0006(g) and Scan Node's ADR-0007(h) deferred, but only as a GDD-level
   recommendation; formalizing it as an ADR is pre-production/architecture-phase work, not this
   GDD's own scope. The per-tick dirty-check (Rule 2, AC-UH50) should be captured in that ADR.
5. **DOM test harness not yet in Allowed Libraries** — the Integration ACs that assert render output
   (AC-UH05–08, UH10, UH50) require jsdom/Testing Library, which is **not** on
   `technical-preferences.md`'s allowed-libraries list. Adding it needs explicit approval before
   those ACs can be written — a pre-production/architecture-phase decision, tracked here so it is not
   silently assumed.
6. **Audio cue *character* pending Audio System GDD (#6)** — the sonic character of the three new
   cues (toggle open/close, error sting) and the escalating proximity drone this GDD references are
   the Audio System GDD's to author; AC-UH47/UH48 are ADVISORY — PROVISIONAL until it ratifies them.
   UI/HUD owns only the cue *trigger logic* (dedup, debounce, `SEALED`/`ADJACENT` suppression —
   BLOCKING AC-UH27–29, UH52). **Forcing function:** the Audio System GDD's own Coverage Validation
   table MUST list AC-UH47 and AC-UH48 by ID as items it ratifies — a prose cross-reference here is
   not sufficient to guarantee they are re-opened once #6 is authored.
   ⚠ **Also:** an *escalating proximity drone* is now assumed by **both** this GDD and
   `entity-system.md`, both deferred to Audio System GDD #6 (Not Started) — **no document currently
   commits to authoring it.** Flag for `producer`/`creative-director` as a pipeline gap before #6 is
   scoped, not a UI/HUD defect.

7. **Orchestrator OQ8 (`session:tick` vs `renderer.render()` ordering) — CLOSED for this system.**
   UI/HUD consumes `session:tick` only as a tick *boundary* (end-of-tick audio evaluation +
   render-tick dirty-check) and drives **no** per-frame visual or time-phased computation off
   `elapsedSeconds` (Rule 9; error bar is discrete text replacement, no flash/animation — Rule 6,
   AC-UH42). Because nothing here reads `elapsedSeconds` for a visual, Orchestrator OQ8's trigger
   condition ("first `session:tick`-consuming *visual* GDD") is not met by UI/HUD — this GDD neither
   requires Orchestrator to pin tick-before-render nor needs to accept a one-frame lag. If a future
   revision adds a game-clock-timed visual (e.g. a re-introduced flash), OQ8 re-opens for this
   system and must be resolved then.

8. **Composition-root DI wiring pends Orchestrator OQ9(a)** — Core Rule 2's constructor injection of
   all five system references + Orchestrator assumes a composition root that constructs and hands
   out those instances. *Who* constructs the one production Orchestrator and how each system obtains
   it is Orchestrator's own Open Q#9(a), not settled here. UI/HUD is a leaf consumer (constructed
   last, after its five dependencies exist), but its constructor wiring must not be implemented until
   OQ9(a)'s ADR lands, to avoid inventing a divergent pattern. Cross-referenced, not resolved, here.

9. **Locomotion suspension during `DOLLHOUSE_OPEN` pends FPS Movement ratification.** Rule 10's
   safe-while-open/trap-on-close design assumes the player is stationary while the modal is open.
   FPS Movement's GDD currently defines no dollhouse-adjacent input state (its only suppression
   state is `SCAN_LOCKED`) — the suspension is recorded here as a **requirement placed on FPS
   Movement**, to be ratified (or contested) by its owner, mirroring the `SCAN_LOCKED` precedent.
   If FPS Movement instead keeps locomotion live while the panel is open, Rule 10's mechanical
   analysis changes materially (Movement Violation becomes possible mid-blackout) and Rule 10 must
   be re-reviewed. Flag also to the future `design/ux/dollhouse.md` spec (whether WASD becomes
   map-pan or goes dead is its call, within "player does not translate" as the fixed constraint).
   ⚠ **Existing-doc conflict (round 5):** `design/ux/interaction-patterns.md`'s P-DOLLHOUSE cost
   line ("lingering can walk you into a loop door or the entity") currently describes the *opposite*
   (live-locomotion) model. This is not merely an unratified requirement — it is a **standing
   contradiction with an already-authored pattern-library doc**. Resolving Open Q#9 MUST include a
   coordinated update to `interaction-patterns.md` so the two documents agree; AC-UH45 has been
   scoped to not claim conformance to the contested "walk while open" reading until then.
   ⚠ **Round-6 addition — the FPS Movement ask now includes reattach-grace release timing.** Rule 10's
   reattach **input-lockout** (AC-UH58) pins locomotion-*resume* to **one tick after** the
   `DOLLHOUSE_OPEN → HUD_ACTIVE` transition, not simultaneous with it — closing the *same-frame* death
   race (not a human-scaled reaction budget; see Rule 10). FPS Movement's ratification of Open Q#9 must therefore cover
   not only *suspension while open* but *delayed resume on close* (honour the resume signal UI/HUD
   withholds for exactly the grace tick). UI/HUD owns the grace-tick state + resume-signal timing
   (testable here, AC-UH58); FPS Movement owns obeying it. This is a one-tick extension of the same
   suspension contract, not a new mechanic.
   ⚠ **Also unresolved (round 6, ux-designer):** `interaction-patterns.md`'s *meta-pattern*
   "Consistency Rule 2" ("world never pauses for a menu — dollhouse-open… keep the sim live") asserts
   the live-locomotion model at a **broader** level than the P-DOLLHOUSE bullet alone — the
   coordinated pattern-library update must reconcile the meta-pattern too, not just the single bullet.
   Until then, AC-UH45 checkpoint (3) is verifiable only against Entity System's internal dwell state
   (a fake-bus unit test), **not** a UI walkthrough (Rule 10 renders zero UI signal of the continuing
   simulation) — its evidence type should be reclassified when Open Q#9 resolves.
