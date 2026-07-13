---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/ADR-0005-Session-Data-Pipeline]]", "[[sources/GDD-Floor-Plan-System]]", "[[sources/GDD-Scan-Node-System]]"]
tags: [architecture, data-pattern]
aliases: ["estimatedPosition / authoritativePosition"]
---

# Authoritative vs. Estimated State

## Definition
A data-modeling pattern pinned by [[sources/ADR-0005-Session-Data-Pipeline]]: every scan node
carries **both** an `estimatedPosition` (what [[entities/Floor-Plan-System]]'s dollhouse shows the
player) and an `authoritativePosition` (what [[entities/Scan-Node-System]] and
[[entities/Scan-Mechanic]] actually use for gameplay) in the **same** node record inside one JSON
file per property — never two separate files that could drift out of sync.

## Key Characteristics
- This isn't just a data-modeling convenience — it's the structural backbone of
  [[concepts/Perception-Stripping]]: the whole point of the dollhouse is that its numbers *can*
  differ from the truth, and this pattern makes that divergence a first-class, intentional field
  rather than an emergent bug.
- Explicitly rejected the two-file alternative (`data/properties/` for estimates +
  `data/sessions/` for authoritative) because it was "a lockstep-drift risk, the exact failure
  class prior reviews kept flagging" — the same instinct as
  [[concepts/Registry-Driven-Consistency]] applied to gameplay data instead of design documents.
- [[entities/Floor-Plan-System]] projects `estimatedPosition` into its own event payloads at load;
  [[entities/Scan-Node-System]] reads `authoritativePosition`, falling back to the estimate only if
  the authoritative field is absent.

## Applications
Resolved two GDDs' previously-open questions in one stroke: Floor Plan's Open Question #3 and
Scan Node's Open Question #4 (both "resolve before Production," per those GDDs' own text) — a
single ADR closing two sibling open items is unusual in this project's history and reflects how
tightly the two systems' data needs overlap.

## Related Concepts
- [[concepts/Perception-Stripping]] — this pattern is the data-layer mechanism underneath it
- [[concepts/Registry-Driven-Consistency]] — same single-source-of-truth instinct, different layer

## Related Entities
- [[entities/Floor-Plan-System]] — reads `estimatedPosition`
- [[entities/Scan-Node-System]] — reads `authoritativePosition`

## Mentions in Source
- "Rejected: two separate files... a lockstep-drift risk, the exact failure class prior reviews
  kept flagging." — [[sources/ADR-0005-Session-Data-Pipeline]]
