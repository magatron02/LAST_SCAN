---
type: source
created: 2026-07-10
updated: 2026-07-12
source_file: "design/gdd/ui-hud.md"
tags: [gdd, presentation, mvp, in-review]
aliases: ["UI/HUD GDD"]
---

# GDD: UI / HUD - Summary

## Source
- Original file: `design/gdd/ui-hud.md`
- Ingested: 2026-07-10
- Authored via `/design-system`, lean review mode (Formulas and Acceptance Criteria sections
  specialist-consulted: `systems-designer`, `qa-lead`; `art-director` consulted for Visual/Audio
  Requirements).

## Core Content
The 9th and final MVP system GDD. Assembles five sibling systems' already-locked content
(dollhouse view model, node ledger, scan readout, proximity bar, ending screen text-variation
matrix) into one diegetic Matterport instrument panel, and resolves the handful of genuine open
questions those siblings deferred here: view-model transport mechanism, the `coverage` dominance
proxy, and the `anomaliesLogged` tally source.

## Key Entities
- [[entities/UI-HUD]] (this GDD's own entity page has the full Core Rule breakdown)
- [[entities/Scan-Mechanic]], [[entities/Entity-System]], [[entities/Scan-Node-System]],
  [[entities/Floor-Plan-System]], [[entities/Win-Lose-Ending]], [[entities/Orchestrator]]
- [[entities/FPS-Movement]] — newly implicated by round 4's Open Q#9
- [[sources/UI-HUD-Review-Log]] — the 4-round review history summarized above

## Key Concepts
- [[concepts/Diegetic-UI]] — the governing pillar
- [[concepts/Coverage-as-False-Comfort]] — `coverage_dominance_ratio` closes this concept's
  previously-open obligation
- [[concepts/Dependency-Injection-over-Singleton]] — the composition-root DI pattern this GDD
  formalizes as its own recommended future ADR

## Main Points
- 3 states: `HUD_ACTIVE` / `DOLLHOUSE_OPEN` / `TERMINAL`, with `TERMINAL` as a true terminal state
  (no exit edge).
- Two formula/tuning constants of its own: `coverage_dominance_ratio` (default 1.5×, range
  1.3×–1.75×, fallback→1.0 pre-registered if playtest confirms the backfire hypothesis) and
  `error_sting_min_interval_ms` (default 200ms, range 150–400ms, added round 2) — no registry
  entries, single-GDD consumers.
- 7 Edge Cases, including same-tick `renderer:anomaly_density` vs. `entity:proximity` tier change
  (both independently drive display, no dedup) and same-tick `anomaliesLogged` vs. `SEALED`
  (frozen at the ending-record snapshot, later arrivals are no-ops).
- **10 Core Rules** as of round 4 (was 9 as designed) — Rule 10 (`DOLLHOUSE_OPEN` behavior) was
  added in round 3 and rewritten in round 4 from "total awareness trade" to "safe-while-open,
  trap-on-close" after cross-checking [[entities/Win-Lose-Ending]]'s Movement Violation trigger
  condition showed the original framing was mechanically a free safe-harbor. See
  [[sources/UI-HUD-Review-Log]] for full history.
- **57 Acceptance Criteria** (`AC-UH01`–`AC-UH56`, some IDs reserved/renumbered across rounds): 33
  BLOCKING (Logic), 16 BLOCKING (Integration, 15 of which are ⚠ blocked on Open Q#5's jsdom
  harness), 8 ADVISORY — the ADVISORY share is unusually large for this project because this
  system *is* the presentation layer (screenshot/manual-walkthrough evidence, not automated tests,
  for feel and accessibility-inheritance criteria).
- 9 Open Questions as of round 4: Log panel scope (deferred), `/ux-design` for
  `dollhouse.md`/`hud.md` as a hard prerequisite, the DOM-removal-vs-hidden clarification for Rule
  1 (resolved), formalizing Rule 2's DI pattern as its own ADR, the jsdom/Testing Library harness
  approval (Open Q#5), audio cue character pending the Audio System GDD (Open Q#6, escalated
  harder in round 4 — the flat-sting strategy's premise depends on an unauthored drone), the
  Orchestrator tick-vs-render ordering question (closed for this system), composition-root DI
  wiring pending Orchestrator's own OQ9(a), and the new **Open Q#9**: locomotion suspension during
  `DOLLHOUSE_OPEN` is a requirement placed on [[entities/FPS-Movement]], unratified.
- Closed out **all 9 MVP systems as Designed** on 2026-07-10 — the milestone the pre-production
  gate's 2026-07-02 FAIL was blocking on. As of round 4 (2026-07-12) this GDD's own status is
  **In Review**, not yet Approved — 4 review rounds deep, round 5 pending.

## Mentions in Source
- "UI/HUD is the only system in the project with a hard dependency on nearly every other system —
  consistent with its Presentation-layer position at the top of the dependency graph." — GDD body
- "This does not affect visual display: each event still independently drives its own
  message/display target, only the audio cue is deduplicated per tick." — Core Rule 9
