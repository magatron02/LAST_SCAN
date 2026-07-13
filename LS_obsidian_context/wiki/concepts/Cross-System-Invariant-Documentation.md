---
type: concept
created: 2026-07-07
updated: 2026-07-07
sources: ["[[sources/GDD-Floor-Plan-System]]", "[[sources/GDD-Scan-Node-System]]", "[[sources/GDD-Orchestrator]]"]
tags: [process, documentation-pattern]
aliases: ["Interaction Matrix", "Cross-System Invariants table"]
---

# Cross-System Invariant Documentation

## Definition
A recurring GDD subsection this project invented and then propagated forward, deliberately, as a
structural fix — not a one-off idea. It exists because three review rounds in a row found the
*same class* of bug: two individually-correct rules, each fine in isolation, that silently
conflict where they meet.

## Key Characteristics
- First appeared in [[entities/Floor-Plan-System]] as the **Interaction Matrix** — a subsection
  added specifically because "every blocker so far = interaction between two individually-correct
  rules" (a pattern named across three review rounds before the fix landed).
- [[entities/Scan-Node-System]]'s review generalized it into a **Cross-System Invariants** table
  that points *outward* at sibling docs rather than only inward at its own rules — the version
  named "blockers live at the inheritance boundary."
- [[entities/Orchestrator]] inherited both precedents directly when it was authored, rather than
  discovering the same gap a third time — the explicit intent stated in its own review log.
- [[entities/Verify-Registry-Tool]] is the machine-checked descendant of the same idea: manual
  Interaction Matrix review still missed real deltas twice, so a parser-based tool replaced the
  human step for the one specific invariant (registry payload shape) it could fully automate.

## Applications
Every "hub" GDD in this project (Floor Plan, Scan Node, Orchestrator) now carries some form of
this table before its Acceptance Criteria section, specifically so that composition gaps get
caught during authoring rather than during a later review round.

## Related Concepts
- [[concepts/Rules-Dont-Compose]] — the failure mode this documentation pattern exists to catch
- [[concepts/Blockers-Live-At-Inheritance-Boundary]] — the generalized version of the same lesson
- [[concepts/Registry-Driven-Consistency]] — the cross-*document* version of the same idea, applied to shared data instead of shared rule interactions

## Related Entities
- [[entities/Floor-Plan-System]] — origin (Interaction Matrix)
- [[entities/Scan-Node-System]] — generalization (Cross-System Invariants)
- [[entities/Orchestrator]] — inherited it at authoring time
- [[entities/Verify-Registry-Tool]] — automated the registry-specific instance of it

## Mentions in Source
- "Every blocker so far = interaction between two individually-correct rules." — [[sources/GDD-Floor-Plan-System]] review log
- "Cross-System Invariants table (Floor Plan's Interaction Matrix pointed outward at sibling docs)." — [[sources/GDD-Scan-Node-System]]
