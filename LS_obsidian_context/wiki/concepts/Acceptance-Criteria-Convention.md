---
type: concept
created: 2026-07-07
updated: 2026-07-07
sources: ["[[sources/GDD-Floor-Plan-System]]", "[[sources/GDD-Scan-Node-System]]", "[[sources/GDD-Orchestrator]]"]
tags: [documentation-standard, testing]
aliases: ["AC convention", "Given-When-Then", "GWT"]
---

# Acceptance Criteria Convention

## Definition
Every GDD in this project writes its Acceptance Criteria section as numbered, prefixed,
Given-When-Then criteria — never prose like "the system should feel good," which the project's
own design-doc rules explicitly ban as unfalsifiable. Each criterion must be independently
verifiable by a QA tester without reading the rest of the document.

## Key Characteristics
- **ID scheme is per-system, not global**: `AC-C##`/`AC-D##`/`AC-E##` (Point Cloud, grouped by
  section — Core rules/formulas/Edge cases), `AC-SN##` (Scan Node, one running number), `AC-OR##`
  (Orchestrator). Sibling GDDs cite each other's AC numbers directly as load-bearing cross-references
  (e.g. Orchestrator's ordering rule cites Floor Plan's `AC-L09` and Scan Node's `AC-SN29` by ID).
- **Gate level is explicit per criterion**: `BLOCKING` (Logic/Integration — must pass before a
  story is Done) vs `ADVISORY` (Visual/Performance — recommended but not build-blocking).
  [[entities/Orchestrator]] additionally splits BLOCKING into `(Logic)` vs `(Integration)` since it
  has no visual/perf surface of its own — every criterion there cites either pure bus mechanics or
  a specific sibling GDD's own AC.
- **DEFERRED is a third state**, distinct from BLOCKING/ADVISORY: a criterion whose *design* is
  correct but whose *test* can't be written yet (design-blocked) or hasn't been written yet
  (implementation-blocked). [[entities/Scan-Node-System]] introduced an explicit
  DEFERRED-tracking table with an Owner and a "resolve-when" condition for each, specifically
  because three rounds of ad-hoc DEFERRED notes had no such structure.
- Formulas require a worked numeric example in the criterion itself — not just the formula symbol
  — so a tester can plug in the stated inputs and check the stated output without deriving it
  independently.

## Applications
This convention is what makes [[concepts/Rules-Dont-Compose]] and
[[concepts/Assert-The-What-Dont-Prove-The-How]] *detectable* at all — a vague criterion can't be
shown to be untested, but a Given-When-Then with a named mechanism can be checked against exactly
what it claims to prove.

## Related Concepts
- [[concepts/Rules-Dont-Compose]] · [[concepts/Assert-The-What-Dont-Prove-The-How]] — the two defect classes this convention exists to make visible
- [[concepts/Cross-System-Invariant-Documentation]] — the companion structural fix, upstream of the ACs themselves

## Related Entities
- [[entities/Floor-Plan-System]] (46 ACs) · [[entities/Scan-Node-System]] (26 ACs) · [[entities/Orchestrator]] (34 ACs)

## Mentions in Source
- "Acceptance criteria must be testable — a QA tester must be able to verify pass/fail... No hand-waving: 'the system should feel good' is not a valid specification." — project design-doc rules
