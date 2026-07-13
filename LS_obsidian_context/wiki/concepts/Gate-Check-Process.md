---
type: concept
created: 2026-07-05
updated: 2026-07-10
sources: ["[[sources/Gate-Check-Pre-Production]]", "[[sources/Architecture-Review-2026-07-02]]", "[[sources/GDD-UI-HUD]]"]
tags: [process, production]
aliases: ["/gate-check", "phase gate"]
---

# Gate-Check Process

## Definition
The `/gate-check [phase]` skill validates readiness to advance between development phases,
producing a PASS/CONCERNS/FAIL verdict with specific named blockers — distinct from
`/architecture-review` (which validates GDD↔ADR traceability) and `/design-review` (which
validates a single GDD). A gate-check reads the *output* of both.

## Key Characteristics
- The verdict is deliberately framed as **expected, not punitive** for a first pass: [[sources/Gate-Check-Pre-Production]]'s
  own text calls a first-attempt FAIL "the correct and expected state," not a quality judgment.
- Checks compound: `/gate-check pre-production` at 2026-07-02 was FAIL specifically *because* the
  upstream `/architecture-review` had only reached CONCERNS (not PASS) and because 4 MVP GDDs were
  still undesigned — the gate doesn't re-derive those verdicts, it consumes them as inputs.
- All-green infrastructure criteria (cross-ADR conflicts, engine pinning, test scaffolding, UX
  foundations, traceability) can coexist with an overall FAIL, since the gate is a conjunction —
  every criterion must pass, not a weighted average.

## Applications
The 2026-07-02 pre-production gate check named a specific path to PASS: finish
[[entities/UI-HUD]] (the last undesigned MVP GDD), independently review the unreviewed GDDs
([[entities/Point-Cloud-Renderer]], [[entities/FPS-Movement]], and later
[[entities/Scan-Mechanic]]/[[entities/Entity-System]]/[[entities/Win-Lose-Ending]]), flip the
remaining Proposed ADRs to Accepted (including [[sources/ADR-0002-Point-Cloud-Renderer]]'s
OQ1-prototype gate), and re-run `/architecture-review` targeting PASS.

**Update 2026-07-10**: the design-phase half of that path is now complete —
[[entities/UI-HUD]] is Designed, closing out **9/9 MVP systems Designed**. The remaining path to
a `/gate-check pre-production` PASS is now purely review/architecture work: `/design-review` for
the 6 still-unreviewed MVP GDDs, and flipping the remaining Proposed ADRs (including
[[entities/UI-HUD]]'s own recommended composition-root DI pattern, not yet formalized as an ADR)
to Accepted.

## Related Concepts
- [[concepts/Architecture-Decision-Record-Process]] — one of the gate's required inputs
- [[concepts/Design-Review-Lean-Mode]] — GDD approval status is another required input

## Related Entities
- [[entities/LAST-SCAN]]
- [[entities/UI-HUD]] — was the single remaining design-phase blocker; now Designed (2026-07-10)

## Mentions in Source
- "Not a knock on the GDDs... FAIL per the skill's definition... this is the correct and expected
  state for a first architecture review." — [[sources/Architecture-Review-2026-07-02]]
