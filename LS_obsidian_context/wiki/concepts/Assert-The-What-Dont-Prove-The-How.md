---
type: concept
created: 2026-07-07
updated: 2026-07-07
sources: ["[[sources/GDD-Scan-Node-System]]", "[[sources/GDD-Floor-Plan-System]]"]
tags: [review-pattern, qa, acceptance-criteria]
aliases: ["assert the what don't prove the how"]
---

# "Assert the What, Don't Prove the How"

## Definition
A named recurring defect in acceptance criteria across this project's review history: an AC
states a guarantee is true, and even cites another AC as its "proof" — but the cited AC never
actually exercises the mechanism that would make the guarantee true. The claim and the test
drift apart without anyone noticing, because the claim *sounds* tested.

## Key Characteristics
- Confirmed as a **4th recurrence** during [[entities/Scan-Node-System]]'s round-3 review: AC-SN29
  was cited as proof that `scan:coverage` and `scan:complete.coverage` are always numerically
  equal — but the AC it pointed to only tested `scan:complete`'s own freshness, never actually
  compared the two values against each other. Fixed by extending AC-SN29 itself to assert both
  events' payloads are identical in the same cycle.
- Same shape found independently in [[entities/Orchestrator]]'s own draft Acceptance Criteria: a
  criterion titled "SEALED is terminal" explicitly declined to test it, deferring to two other ACs
  that only tested *entry into* SEALED — not that nothing ever exits it. Rewritten as a real test:
  process further input at SEALED, then check state is still SEALED several frames later.
- The fix pattern is always the same: stop citing, start asserting — extend or rewrite the
  criterion so it directly exercises the mechanism, rather than pointing at a neighbor.

## Applications
`creative-director` used a recurrence of this exact pattern to settle a review-verdict dispute
during [[entities/Scan-Node-System]]'s round 3: one specialist read the document as functionally
correct (APPROVED), another flagged the untested claim as blocking (NEEDS REVISION).  Ruling —
now a standing precedent for this project's review process — **design-review verdicts grade the
document as written, not just the design underneath it.** A true fact, asserted without being
proven, is still a blocking documentation defect.

## Related Concepts
- [[concepts/Blockers-Live-At-Inheritance-Boundary]] — where this pattern was first named, as one of two recurring defect types found there
- [[concepts/Rules-Dont-Compose]] — a related but distinct failure: that one is about untested *interactions*, this one is about untested *claims*
- [[concepts/Acceptance-Criteria-Convention]] — the GWT format every fix for this pattern gets rewritten into

## Related Entities
- [[entities/Scan-Node-System]] — 4 confirmed recurrences across its own review arc
- [[entities/Orchestrator]] — caught and fixed at draft stage before its own review even began

## Mentions in Source
- "AC-SN29 cited as proof scan:coverage=scan:complete.coverage but never actually tested that... 4th recurrence of 'assert the what, don't prove the how.'" — [[sources/GDD-Scan-Node-System]] review log
- "Names a guarantee ('terminal'), doesn't test the mechanism... exactly the 'assert the what, don't prove the how' pattern." — [[sources/GDD-Orchestrator]] qa-lead review
