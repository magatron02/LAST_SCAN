---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-FPS-Movement]]", "[[sources/GDD-Orchestrator]]", "[[sources/QA-Bug-Reports]]"]
tags: [technical-pattern, correctness]
aliases: ["dt_cap", "0.1s cap"]
---

# Capped Delta-Time Game Clock

## Definition
Every per-frame delta time in the project is hard-capped at 0.1 seconds before use — in both
[[entities/FPS-Movement]]'s own movement formula and [[entities/Orchestrator]]'s
`session:tick.elapsedSeconds` accumulation — so a backgrounded tab, a GC pause, or any other
stalled frame cannot produce a discontinuous jump.

## Key Characteristics
- Without the cap, a long stall would let a player tunnel through a wall in one frame
  ([[sources/QA-Bug-Reports|BUG-0001]], fixed 2026-06-30 with `Math.min(clock.getDelta(), 0.1)`)
  or let [[entities/Orchestrator]]'s `elapsedSeconds` snap to near-maximum on tab-restore, which
  would hand [[entities/Floor-Plan-System]]'s `session_escalation` formula a free jump to `e≈1.0`
  — breaking its own structural "D_max only via the Completion Trap" guarantee.
- The same numeric constant (`dt_cap = 0.1`) is shared across two independently-authored systems
  (FPS Movement, Orchestrator) rather than each inventing its own — registered as a cross-system
  constant, consistent with [[concepts/Registry-Driven-Consistency]].
- [[entities/FPS-Movement]]'s architecture ([[sources/ADR-0004-Movement-Input]]) pins `dt` as a
  **passed parameter** to `update(dt)`, never read from an internal clock — this is what makes the
  cap testable headlessly (a unit test can feed an arbitrary `dt` without a real browser frame
  loop).

## Applications
[[sources/QA-Bug-Reports|BUG-0001]] is the one place this pattern's *absence* was a real,
implemented bug — everywhere else (Orchestrator's `session:tick`) the cap was designed in from the
start, specifically because the FPS Movement precedent already existed to point to.

## Related Concepts
- [[concepts/Session-Escalation]] — the formula this cap protects from a tab-restore exploit
- [[concepts/Dependency-Injection-over-Singleton]] — the same testability instinct (inject rather
  than read internal state) shows up in both patterns

## Related Entities
- [[entities/FPS-Movement]] — original owner of the pattern
- [[entities/Orchestrator]] — second, independently-motivated adopter

## Mentions in Source
- "the same cap FPS Movement's Formula 1 applies to its own dt, and for the same reason: a
  backgrounded/restored tab must not produce a discontinuous jump." — [[sources/GDD-Orchestrator]]
- "Uncapped `clock.getDelta()` violates AC-EC03's 0.1s cap... fixed with
  `Math.min(clock.getDelta(), 0.1)`." — [[sources/QA-Bug-Reports]]
