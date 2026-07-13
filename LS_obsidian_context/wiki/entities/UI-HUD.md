---
type: entity
created: 2026-07-05
updated: 2026-07-12
sources: ["[[sources/GDD-UI-HUD]]", "[[sources/Systems-Index]]", "[[sources/UI-HUD-Review-Log]]"]
tags: [system, ui, in-review]
aliases: ["HUD", "system #12"]
---

# UI / HUD

## Basic Information
- Type: system (Presentation layer, MVP tier)
- Status: **In Review** (round-4 revised 2026-07-12; round-5 independent re-review pending). Was
  Designed 2026-07-10, the last of the 9 MVP systems; **all MVP systems are Designed**, but this
  one is now mid-review, 4 rounds deep. See [[sources/UI-HUD-Review-Log]] for full history.
- Source: [[sources/GDD-UI-HUD]]

## Description
The presentation layer that turns every other system's already-computed state into the game's
diegetic Matterport interface. Owns no gameplay logic of its own — only view-model consumption and
rendering. Depends on [[entities/Scan-Mechanic]], [[entities/Entity-System]],
[[entities/Scan-Node-System]], [[entities/Floor-Plan-System]], [[entities/Win-Lose-Ending]], and
[[entities/Orchestrator]], all under the [[concepts/Diegetic-UI]] pillar (no external HUD, ever).
As of round 4 it also places a new requirement on [[entities/FPS-Movement]] (Open Q#9, unratified).

**10 Core Rules**, most-consequential first (Rule 10 added round 3, rewritten round 4):

1. **No literal "tab" metaphor.** Always-visible HUD instrument view (scan overlay, corner
   readouts, sidebar) + one toggle-key, fullscreen-blocking Dollhouse modal that *removes* the HUD
   from the render tree while open (not merely z-index hiding). A Log panel (master GDD's third
   "tab") is explicitly out of scope — no designed content exists for it yet.
2. **View-model transport resolved**: composition-root DI + per-render-tick polling of each
   producing system's existing `get*ViewModel()` method — closes the seam both
   [[sources/ADR-0006-Floor-Plan|ADR-0006(g)]] and [[sources/ADR-0007-Scan-Node|ADR-0007(h)]]
   explicitly deferred here. Recommended as this system's own future ADR, not yet formalized.
3. **Inherits every sibling "never expose" constraint verbatim** — entity `currentType`/position,
   `entityInFrame`, anomaly rooms, true real-time scan state, and which `primaryOutcome` occurred.
4. **`coverage_dominance_ratio`** (new tuning knob, default 1.5×, range 1.3×–1.75×) gives Scan
   Node's previously-DEFERRED `AC-SN31` a measurable proxy at last — see
   [[concepts/Coverage-as-False-Comfort]].
5. **`anomaliesLogged`** = session-cumulative count of `renderer:anomaly_density` events, tallied
   by UI/HUD itself and frozen at the `SEALED` snapshot — closes [[entities/Win-Lose-Ending]]'s
   flagged gap.
6. **Diegetic error-message escalation** — tier-driven message pool (generic → geometry/density →
   operator/signal-loss, then freeze), matching [[entities/Entity-System]]'s tier-to-feedback map.
7. **Session-state gating** — `LOADING`/`ACTIVE`/`SEALED`; on `SEALED` all panels freeze and the
   terminal screen takes over.
8. **Terminal screen renders [[entities/Win-Lose-Ending]]'s text-variation matrix exactly** — this
   GDD only writes the copy strings and lays out the template, not the content logic.
9. **Audio-alert dedup**: 2+ error-triggering events in the same tick fire the alert tone once, not
   once per event (visual display stays independent per event). Either event type landing the same
   tick as `SEALED` fires no tone at all — Rule 7's freeze wins.
10. **`DOLLHOUSE_OPEN` is safe-while-open, trap-on-close** (rewritten round 4 — see
    [[sources/UI-HUD-Review-Log]]). While the modal is open, no UI-owned danger signal exists on
    any channel (proximity bar, error bar, error-sting audio all withheld). But the mechanics
    underneath are **not** a true trade: the player is stationary (locomotion suspension pends new
    Open Q#9 on [[entities/FPS-Movement]]), so Movement Violation and Scan Corruption are
    mechanically impossible mid-modal — only the entity's approach and dwell-tier accrual keep
    ticking. Danger therefore lands on **close**, not during: the player may re-attach already at
    `ADJACENT` with zero warning, and their first blind step can be an instant Movement Violation.
    The one honest beat is Rule 2's forced write — the freshest cached error message renders on
    the very first post-re-attach tick. The scope of the "no danger signal" claim is also now
    explicitly limited to UI-owned channels — whether the ambient proximity drone (Audio-owned,
    GDD #6, unauthored) persists during the blackout is not this system's claim to make.

**Acceptance Criteria**: 57 total (55→57 in round 4) — 33 BLOCKING (Logic), 16 BLOCKING
(Integration), 8 ADVISORY (this is the one MVP system where a healthy chunk of criteria are
screenshot/manual-walkthrough evidence rather than automated, since it *is* the presentation
layer). 15 Integration ACs are ⚠ blocked on Open Q#5 (jsdom/Testing Library not yet an approved
dependency).

**Self-caught process note**: a Core Rule insertion was initially mis-numbered ("7b" placed before
the existing Rule 7) mid-session; caught and fixed by re-appending it as a properly-numbered
Rule 9 after the existing Rule 8, rather than leaving the out-of-order sequence.

**All three original cross-system obligations logged against this system are resolved:**
1. `nodesCompleted` vs `coverage` denominator divergence — confirmed intentional, not reconciled
   (Rule text simply renders both as-is).
2. `coverage` dominance over `nodesCompleted` — resolved by Rule 4 / `coverage_dominance_ratio`,
   with a pre-registered fallback (ratio→1.0) if the round-4-flagged backfire hypothesis is
   confirmed by playtest.
3. Deferred view-model transport for Floor Plan + Scan Node — resolved by Rule 2.
4. `anomaliesLogged` gap [[entities/Win-Lose-Ending]] surfaced — resolved by Rule 5.

**New obligation opened round 4:** Open Q#9 places a locomotion-suspension requirement on
[[entities/FPS-Movement]] during `DOLLHOUSE_OPEN` — that GDD currently defines no dollhouse-
adjacent input state (only `SCAN_LOCKED`). Unratified; mirrors the precedent where UI/HUD's
sibling systems have previously had obligations placed on them by a downstream GDD (e.g.
[[entities/Win-Lose-Ending]]'s `anomaliesLogged` gap, resolved the other direction).

## Related Entities
- [[entities/Scan-Mechanic]] · [[entities/Entity-System]] · [[entities/Scan-Node-System]] ·
  [[entities/Orchestrator]] · [[entities/Win-Lose-Ending]] · [[entities/Floor-Plan-System]]

## Related Concepts
- [[concepts/Diegetic-UI]] — the governing pillar for everything this system owns
- [[concepts/Coverage-as-False-Comfort]] — the dominance-ratio proxy resolves this concept's
  previously-open obligation (now with a pre-registered fallback if playtest confirms backfire)
- [[concepts/Inverted-Reward]] — the coverage/nodesCompleted trust-valence problem exists to serve this thesis
- [[concepts/Dependency-Injection-over-Singleton]] — Rule 2's composition-root polling pattern
- [[concepts/Gate-Check-Process]] — this was the last design-phase blocker on the pre-production gate
- [[concepts/Rules-Dont-Compose]] — Rule 10's round-4 rewrite is a case of a rule overclaiming what
  it composes with (Movement Violation's own trigger condition), caught by cross-referencing
  siblings rather than reading this GDD in isolation

## Mentions in Source
- "This system's entire job is to make the player feel like a skilled operator... it's this
  system's job not to squander it with sloppy layout or inconsistent framing." — [[sources/GDD-UI-HUD]]
- "The interface never once tells the truth about what matters most... UI/HUD's fantasy is being
  the last, most convincing layer of that omission." — [[sources/GDD-UI-HUD]]
- "Rule 7's freeze takes precedence over any same-tick alert, regardless of which event type
  triggered it." — [[sources/GDD-UI-HUD]]
- "The map is not where the danger is; putting it away is." — [[sources/GDD-UI-HUD]], Rule 10
  (round 4 rewrite)
