---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/ADR-0001-Orchestrator-Bus-Wiring]]", "[[sources/ADR-0002-Point-Cloud-Renderer]]"]
tags: [process, architecture]
aliases: ["ADR process"]
---

# Architecture Decision Record (ADR) Process

## Definition
This project's mechanism for pinning *how* a GDD's design gets implemented, as distinct from the
GDD itself (which specifies *what* the system must do). Each ADR has a lifecycle
(`Proposed → Accepted → Superseded`) and an Engine Compatibility table naming its knowledge risk
against the pinned Three.js r171 version.

## Key Characteristics
- **7 ADRs exist**; only **ADR-0001** (Orchestrator Bus Wiring) is **Accepted** — it had already
  passed an independent round-4 design-review before its ADR was written. The other 6
  (Point Cloud, Per-Frame Budget, Movement+Input, Session Data, Floor Plan, Scan Node) remain
  **Proposed**, an explicit owner decision this session rather than a blanket rubber-stamp.
- **Proposed ADRs auto-block stories** that would implement against them — this is a deliberate
  gate, not an oversight, per the project's docs standards.
- ADR-0002 (Point Cloud) is **self-gated**: it cannot reach Accepted until its OQ1 depth-occluder
  prototype is verified against real Three.js r171 behavior — the ADR states this explicitly
  rather than assuming the risk away.
- The `/architecture-review` skill cross-checks every ADR against every other ADR for conflicts
  and produces a traceability matrix against GDD requirements. Two runs happened this session: the
  first found the review's own architecture phase FAILing (33 of 42 requirements uncovered); the
  second, after 6 ADRs were written, moved the verdict to CONCERNS.

## Applications
This session wrote ADR-0002 through ADR-0007 in one focused pass (a separate architecture-phase
effort preceding the three GDDs this wiki otherwise covers), then flipped only ADR-0001 to
Accepted per an explicit owner choice to keep the "reviewed before accepted" discipline honest
rather than accept all 7 in bulk.

## Related Concepts
- [[concepts/Event-Bus-Architecture]] — ADR-0001's subject
- [[concepts/Registry-Driven-Consistency]] — ADRs and the registry cross-reference each other

## Related Entities
- [[entities/Orchestrator]] — owns the only Accepted ADR
- [[entities/Point-Cloud-Renderer]] — owns the one HIGH-risk, self-gated ADR

## Mentions in Source
- "Accepted 2026-07-02 — ratified after the round-4 Orchestrator design-review (5 specialists) and owner sign-off." — [[sources/ADR-0001-Orchestrator-Bus-Wiring]]
- "This exact combination is renderer OQ1 and MUST be prototype-verified against r171 before this ADR is Accepted." — [[sources/ADR-0002-Point-Cloud-Renderer]]
