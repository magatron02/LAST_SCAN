---
type: concept
created: 2026-07-07
updated: 2026-07-07
sources: ["[[sources/GDD-Scan-Node-System]]"]
tags: [review-pattern, qa]
aliases: ["inheritance boundary pattern"]
---

# "Blockers Live at the Inheritance Boundary"

## Definition
A pattern named by `creative-director` during [[entities/Scan-Node-System]]'s first design-review
round: every single blocking finding that round was Scan Node **failing to inherit or
cross-reference a precedent already established in a sibling document** (Floor Plan, or the
master concept doc) — none were an internal logic flaw original to Scan Node itself.

## Key Characteristics
- Concrete instance: Scan Node's `S = count(STANDARD) + 1` coverage formula assumed exactly one
  `ANOMALY_FINAL` node existed, but [[entities/Floor-Plan-System]] had never actually *guaranteed*
  that — its own chained-reveal edge case technically allowed two. The fix
  ([[entities/Floor-Plan-System]] AC-E17) landed in the *sibling* doc, not in Scan Node.
- A second, distinct-but-related defect recurred across *later* rounds of the same GDD:
  [[concepts/Assert-The-What-Dont-Prove-The-How]] — cited as proof of something without actually
  testing it. `creative-director` explicitly resolved a tension between two specialists over
  this: one read it as a design pass, the other as a documentation-blocking fail. Ruling: **design
  review verdicts grade the document, not just the design underneath it** — a doc that asserts a
  true fact without proving it is still a blocking documentation defect.
- The pattern is why [[concepts/Cross-System-Invariant-Documentation]] tables point *outward* —
  once you know blockers cluster at inheritance boundaries, the fix is a subsection whose entire
  job is naming what's inherited from where.

## Applications
This is the reason [[entities/Orchestrator]] — designed *after* this pattern was named — was
explicitly built as "registration, not invention": every event name and payload shape in its
Interface Registry is taken **verbatim** from the producing GDD's own Interactions table, precisely
to avoid re-creating an inheritance-boundary gap between itself and the four sibling GDDs that
already existed when it was authored.

## Related Concepts
- [[concepts/Rules-Dont-Compose]] — sibling pattern; that one is about rule *interaction*, this one is about rule *inheritance*
- [[concepts/Assert-The-What-Dont-Prove-The-How]] — the specific recurring defect found inside this pattern's later rounds
- [[concepts/Cross-System-Invariant-Documentation]] — the structural fix this pattern motivated

## Related Entities
- [[entities/Scan-Node-System]] — where the pattern was named
- [[entities/Floor-Plan-System]] — the sibling doc most often being under-inherited from
- [[entities/Orchestrator]] — designed to avoid this pattern by construction

## Mentions in Source
- "Blockers live at the inheritance boundary — every round-1 blocker was Scan Node failing to inherit/cross-ref a sibling-doc precedent (Floor Plan, or master GDD), not internal logic." — [[sources/GDD-Scan-Node-System]] review log
