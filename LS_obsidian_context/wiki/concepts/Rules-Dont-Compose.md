---
type: concept
created: 2026-07-07
updated: 2026-07-07
sources: ["[[sources/GDD-Floor-Plan-System]]", "[[sources/GDD-Scan-Node-System]]", "[[sources/GDD-Orchestrator]]"]
tags: [review-pattern, qa]
aliases: ["individually-correct-rules-don't-compose", "composition gap"]
---

# "Rules Don't Compose"

## Definition
A recurring `qa-lead` finding, confirmed across three separate GDD review arcs, at three
different scales: two rules (or two acceptance criteria, or two automated tests) can each be
independently correct and independently *tested* correct, while their **interaction** — what
happens when both are true at once, or fire in the same tick — is never verified anywhere.

## Key Characteristics
- First scale: **within one GDD.** [[entities/Floor-Plan-System]]'s Interaction Matrix exists
  because this happened three review rounds running before it was fixed structurally rather than
  patched criterion-by-criterion.
- Second scale: **across GDDs.** A layout satisfying [[entities/Floor-Plan-System]]'s own
  AC-E17 (exactly one `ANOMALY_FINAL` node) was assumed, not verified, by
  [[entities/Scan-Node-System]]'s `S = count(STANDARD) + 1` coverage formula — two correct rules
  in two correct GDDs, un-composed.
- Third scale: **across tests.** Even after both GDDs were individually fixed, qa-lead flagged
  that no test exercised the *seam* through real payload-construction code — tracked as AC-SN30, a
  DEFERRED composition test, specifically because unit-level correctness in each GDD still didn't
  prove the handoff worked.
- [[entities/Orchestrator]]'s own review found the same shape again at a fourth scale — ordering
  overrides and the latest-value cache, individually well-specified, never tested *together* for a
  subscriber joining mid-resolution (closed by that GDD's AC-OR29 and sibling composition ACs).

## Applications
This is why [[entities/Orchestrator]]'s Acceptance Criteria section explicitly asks, for every
pair of adjacent rules: "does a test exist where BOTH are true in the same frame?" — a direct
methodological response to this pattern recurring across three prior review arcs.

## Related Concepts
- [[concepts/Cross-System-Invariant-Documentation]] — the documentation-layer fix for this class of bug
- [[concepts/Blockers-Live-At-Inheritance-Boundary]] — a closely related but distinct pattern: this one is about rule *interaction*, that one is about rule *inheritance*
- [[concepts/Acceptance-Criteria-Convention]] — the GWT format this pattern's fixes get written in

## Related Entities
- [[entities/Floor-Plan-System]] · [[entities/Scan-Node-System]] · [[entities/Orchestrator]]

## Mentions in Source
- "Individually-correct-rules-don't-compose pattern, now confirmed at 3 scales: within-GDD, cross-GDD rules, cross-GDD tests." — [[sources/GDD-Scan-Node-System]]
