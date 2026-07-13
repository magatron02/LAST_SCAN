---
type: source
created: 2026-07-12
updated: 2026-07-12
source_file: "design/gdd/reviews/ui-hud-review-log.md"
tags: [review, presentation, mvp]
aliases: ["UI/HUD review log"]
---

# UI/HUD Review Log - Summary

## Source
- Original file: `design/gdd/reviews/ui-hud-review-log.md`
- Ingested: 2026-07-12
- 4 review rounds so far, all `/design-review` full-mode runs (specialist agents + creative-director
  synthesis). All 4 rounds returned NEEDS REVISION, fixed same-session, per this project's standing
  pattern (see [[concepts/Design-Review-Lean-Mode]]).

## Core Content
Revision history for [[sources/GDD-UI-HUD|design/gdd/ui-hud.md]]. Unlike [[entities/Floor-Plan-System]],
[[entities/Scan-Node-System]], and [[entities/Orchestrator]] — each of which reached **Approved** on
round 4 — UI/HUD's round 4 found 3 more blockers, breaking that pattern by one pass. Expected: round
3 added Core Rules 10/53/54 late, and those unreviewed additions are exactly where round 4's
blockers live.

## Key Entities
- [[entities/UI-HUD]] — the GDD under review
- [[entities/FPS-Movement]] — newly implicated in round 4 (Open Q#9, locomotion suspension)
- [[entities/Win-Lose-Ending]] — round 4's Rule 10 finding rests on cross-checking this system's
  own AC-WL08 (Movement Violation requires a `player:position` delta)

## Round-by-round summary

**Round 1 (2026-07-10):** 4 blockers — `coverage_dominance_ratio` formula rationale incoherent
with itself + unguarded pathological inputs; "tick" never formally defined; audio-architecture ACs
locked before the Audio System GDD exists; an orphaned "proximity-tier flicker" AC citing no Core
Rule. AC 48→51.

**Round 2 (2026-07-10, same day):** 4 blockers — error-bar flash-rate ceiling measured against an
undefined "flash" (round 1's fix #4 relabeled, not resolved); Orchestrator OQ8 tick-vs-render
ordering never addressed; same-tick sting dedup didn't cover near-tick stacking; same-tick
toggle+SEALED race asserted but not staged by any AC. AC 51→53.

**Round 3 (2026-07-12):** 4 blockers — Rule 4 × Rule 8 terminal-screen collision (dominance ratio
leaking onto the neutral-voice ending screen); debounce clock-source contradiction (wall-clock vs.
disclaimed game-clock); Rule 2's dirty-check silently defeated by pure getters rebuilding
references; no stated danger channel during `DOLLHOUSE_OPEN` (new Core Rule 10 written this round
as the fix). AC 53→55.

**Round 4 (2026-07-12, independent re-review — see [[concepts/Rules-Dont-Compose]]):** all 4
round-3 fixes independently confirmed genuinely closed. 3 new blockers:
1. **Rule 2's "shallow per-field" comparator was one level too shallow** for [[entities/Scan-Node-System]]'s
   actual locked view-model shape (nested `displayPosition`, `nodesCompleted {X,Y}`) — a literal
   implementation would defeat AC-UH50 every tick, guaranteed not hypothetical. Fixed: structural
   deep comparison, SameValueZero scalar equality (NaN-safe), array length-and-pairwise equality.
2. **Rule 2's forced-write-on-reattach clause cited AC-UH50 as proof, but AC-UH50 never staged
   that exact scenario** — the 4th confirmed instance of this project's recurring "prose cites an
   AC that never stages the scenario" defect (see [[concepts/Rules-Dont-Compose]] and
   [[concepts/Blockers-Live-At-Inheritance-Boundary]]). Fixed: new AC-UH55.
3. **Core Rule 10's "total awareness trade" was mechanically a free safe-harbor, not a trade** —
   cross-checking [[entities/Win-Lose-Ending]]'s AC-WL08 (Movement Violation needs a
   `player:position` delta) showed a stationary player during `DOLLHOUSE_OPEN` cannot trigger it,
   and no scan can run mid-modal, so opening the map removed danger's *possibility*, not just its
   *warning*. The user re-decided (new mechanical evidence, not mere re-litigation): **safe-while-
   open, trap-on-close** — Rule 10 rewritten to land the danger on re-attach instead, and a new
   Open Q#9 places a locomotion-suspension requirement on [[entities/FPS-Movement]].

AC 55→57 (new: AC-UH55, AC-UH56). 7 additional recommended fixes applied same session (debounce
timestamp-on-fire-only clause, Orchestrator AC-OR08 cross-link for the end-of-tick mechanism,
A-A1/A-S1 reclassified from "vacuous compliance" to "authored risk," Open Q#5 flagging extended
from 7 to 15 Integration ACs, AC-UH12 objective rewrite, dominance-ratio and drone fallback clauses
pre-registered).

## Key Concepts
- [[concepts/Rules-Dont-Compose]] — round 4's Rule 10 finding is this pattern at the mechanic level
  (a rule that doesn't compose with a sibling system's own trigger condition), not just the AC-
  citation-gap version this project usually names it for
- [[concepts/Blockers-Live-At-Inheritance-Boundary]] — all 3 round-4 blockers were found by
  cross-checking a sibling GDD's already-locked contract (Scan Node's VM shape, Win/Lose's AC-WL08),
  not by re-reading this GDD in isolation
- [[concepts/Acceptance-Criteria-Convention]] — AC-UH55/UH56 follow the standard GIVEN/WHEN/THEN
  + tag convention

## Main Points
- Every round's blockers were fixed same-session; independent re-review each time confirmed the
  prior round's fixes held before finding new issues — no relitigating closed items.
- **Next:** round-5 independent re-review in a fresh session, plus FPS Movement's owner ratifying
  Open Q#9 (a small, reviewable amendment), before the `/gate-check pre-production` re-attempt.

## Mentions in Source
- "Four blockers, zero redesign. One focused pass from Approved." — round 3 creative-director
  synthesis
- "The map is not where the danger is; putting it away is." — round 4's Rule 10 rewrite,
  [[sources/GDD-UI-HUD]]
