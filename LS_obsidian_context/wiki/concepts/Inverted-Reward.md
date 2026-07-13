---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/LAST-SCAN-Concept-Doc]]", "[[sources/GDD-Win-Lose-Ending]]", "[[sources/GDD-Scan-Node-System]]"]
tags: [design-thesis, game-design]
aliases: ["§9", "the trap"]
---

# Inverted Reward

## Definition
The game's central mechanical thesis: the displayed objective ("scan every node") is a trap.
Obeying it fully — reaching 100% coverage — is the bad ending (`COMPLETION_TRAP`, see
[[entities/Win-Lose-Ending]]). Surviving requires the player to deliberately *disobey* the
objective by leaving exactly one node (the anomaly-room "final" node) unscanned. Every UI
affordance in the game is built to steer the player toward the trap, not away from it.

## Key Characteristics
- The good ending (`ESCAPE`) reads as "incomplete" (coverage flagged sub-100%); the bad ending
  reads as "success" (100%, "mission accomplished" framing).
- The UI never states which ending occurred — see [[concepts/Found-Footage-Framing]]. There is no
  "you win"/"you lose" text anywhere, under any of the 4 outcomes [[entities/Win-Lose-Ending]] defines.
- The coverage ring frames higher percentage as unambiguously good throughout play (§15-H "false
  comfort"), so the reveal only lands retrospectively.
- [[entities/Scan-Node-System]]'s coverage math (`coverage = V/S`, `S = count(STANDARD)+1`) is the
  literal mechanism: the anomaly node is in the denominator from session start, so a player who
  never scans it tops out at `N/(N+1) < 100%`.

## Applications
Realized concretely by three systems this session: [[entities/Scan-Node-System]] (the coverage
math and the "one honest gauge" framing), [[entities/Scan-Mechanic]] (the verb that can capture
the entity mid-scan), and [[entities/Win-Lose-Ending]] (the evaluator that makes the thesis
mechanically real — "Win/Lose is the one place in the codebase that knows the truth the interface
is built to hide").

## Related Concepts
- [[concepts/Found-Footage-Framing]] — the reveal is environmental/implied, never stated
- [[concepts/Perception-Stripping]] — a parallel, complementary horror lever (the map lying vs. the objective lying)

## Related Entities
- [[entities/Win-Lose-Ending]]
- [[entities/Scan-Node-System]]
- [[entities/Scan-Mechanic]]
- [[entities/The-Antagonist-Entity]]

## Mentions in Source
- "Core rule: 100% coverage = bad ending (Completion Trap); deliberately incomplete = escape." — [[sources/LAST-SCAN-Concept-Doc]]
- "The trust this section describes... is delivered by contrast with Floor Plan's desync... not manufactured by any rule of its own." — [[sources/GDD-Scan-Node-System]]
- "Win/Lose is the one place in the codebase that knows the truth the interface is built to hide: that scanning the last node is a loss condition, not a completion." — [[sources/GDD-Win-Lose-Ending]]
