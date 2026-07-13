---
type: concept
created: 2026-07-07
updated: 2026-07-07
sources: ["[[sources/Systems-Index]]", "[[sources/GDD-Point-Cloud-Renderer]]"]
tags: [documentation-standard]
aliases: ["8 required sections", "design doc standard"]
---

# GDD Standard: 8 Required Sections

## Definition
Every game design document in `design/gdd/` must contain, in order: Overview, Player Fantasy,
Detailed Rules, Formulas, Edge Cases, Dependencies, Tuning Knobs, Acceptance Criteria. This is a
project-level rule (not a per-GDD choice), enforced by the `/design-system` authoring skill and
checked by `/design-review`.

## Key Characteristics
- **Written incrementally, never all at once**: create the skeleton file with all section headers
  empty first, then fill one section at a time with explicit user approval between each — a hard
  rule, not a style preference, so decisions are locked in as they're made rather than presented as
  a fait accompli.
- **Dependencies must be bidirectional**: if system A's Dependencies section lists system B, B's
  own Dependencies section must list A back. This is checked directly — e.g.
  [[entities/FPS-Movement]]'s GDD was amended mid-session to add [[entities/Floor-Plan-System]]'s
  new `floorplan:loop` event to its own inbound interface, specifically to keep this bidirectional.
- **Formulas require variable definitions, expected ranges, and a worked example** — not just the
  symbolic expression.
- **Edge cases must state the outcome explicitly**, not defer to "handle gracefully."
- Two optional sections — Visual/Audio Requirements and UI Requirements — are added after the 8
  required ones when relevant; pure-infrastructure systems like [[entities/Orchestrator]]
  explicitly write "N/A, no pixels/UI of its own" rather than omitting the section.
- Review effort has three modes — **solo / lean / full** — gating when a specialist sub-agent
  (`systems-designer` for Formulas, `qa-lead` for Acceptance Criteria) is mandatorily consulted
  during authoring. This project runs in lean mode: only those two highest-risk sections trigger a
  mandatory specialist consult.

## Applications
All 8 designed system GDDs in this project ([[entities/Point-Cloud-Renderer]] through
[[entities/Win-Lose-Ending]]) follow this exact structure, which is what makes them
cross-comparable — a reader who knows one GDD's shape can navigate any other.

## Related Concepts
- [[concepts/Design-Review-Lean-Mode]] — the authoring *process* this standard's sections are filled through
- [[concepts/Acceptance-Criteria-Convention]] — the specific convention governing section 8

## Related Entities
- All 8 designed systems follow this template: [[entities/Point-Cloud-Renderer]],
  [[entities/FPS-Movement]], [[entities/Floor-Plan-System]], [[entities/Scan-Node-System]],
  [[entities/Orchestrator]], [[entities/Scan-Mechanic]], [[entities/Entity-System]],
  [[entities/Win-Lose-Ending]]

## Mentions in Source
- "Every GDD must include all 8 required sections... Design documents MUST be written incrementally: create skeleton first, then fill each section one at a time with user approval between sections." — project design-docs rules
