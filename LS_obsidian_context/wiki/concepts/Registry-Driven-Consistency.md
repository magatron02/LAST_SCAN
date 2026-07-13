---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Orchestrator]]", "[[sources/Systems-Index]]"]
tags: [process, tooling]
aliases: ["entities.yaml", "the registry"]
---

# Registry-Driven Consistency

## Definition
`design/registry/entities.yaml` is the project's single source of truth for any named fact that
crosses document boundaries — events, formulas, constants — indexed by which GDD "owns" it
(`source`) and which GDDs cite it (`referenced_by`). Every `/design-system` session checks this
registry before authoring new content and updates it after.

## Key Characteristics
- A **machine-checked** variant exists for events specifically: `tools/verify-registry.mjs`
  diffs each event's payload field set between the registry and its producing GDD, catching drift
  a purely manual audit missed for three consecutive review rounds (e.g. `floorplan:loop`'s
  `toRoom` field silently diverging between two of its own citing tables).
- IDs and entries are **append-only** — never renumbered or deleted, only marked `deprecated` or
  `superseded-by`, so story files that already reference a `TR-ID` never break.
- This session found and closed **two pre-existing gaps** the registry's own comments had already
  anticipated: `coverage` and `corruption_threshold` both carried a `# Win/Lose GDD (when
  authored)` comment for months before this session's Win/Lose GDD actually closed the loop.
- Also caught a genuine omission: [[entities/Point-Cloud-Renderer]]'s own hold-fraction constant
  `h` had never been registered at all, despite being a real tuning knob, until
  [[entities/Scan-Mechanic]] became the first system to cross-reference it.

## Applications
Every GDD authored this session (Scan Mechanic, Entity System, Win/Lose) ran a registry check
before drafting Formulas, and a registry update after — adding new events, closing anticipated
comments, and in one case registering a constant that predated the registry-checking discipline
itself.

## Related Concepts
- [[concepts/Event-Bus-Architecture]] — the `events:` section is this bus's schema
- [[concepts/Architecture-Decision-Record-Process]] — ADRs and the registry cross-reference each other

## Related Entities
- [[entities/Orchestrator]] — the registry's `verify-registry` tooling exists because of this system's OQ6

## Mentions in Source
- "The manual audit's track record is poor -- the 2026-07-01 rounds each believed they had confirmed zero deltas, and the 2026-07-02 round-3 review found two live deltas both had missed." — [[sources/GDD-Orchestrator]]
