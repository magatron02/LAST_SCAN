---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Floor-Plan-System]]", "[[sources/ADR-0006-Floor-Plan]]", "[[sources/ADR-0005-Session-Data-Pipeline]]"]
tags: [system, gameplay]
aliases: ["Floor Plan", "the dollhouse system"]
---

# Floor Plan System

## Basic Information
- Type: system (Core layer, spatial data + perception manipulation)
- Status: **Approved** (round-4 independent re-review, 2026-06-30)
- Source: [[sources/GDD-Floor-Plan-System]]

## Description
The authoritative source of spatial truth — owns room AABBs, doors, and the property layout —
and simultaneously the system that makes that truth deliberately unreliable
([[concepts/Perception-Stripping]]). Shows the player a "dollhouse" top-down map at session start
that is progressively wrong: it desyncs from reality (a cubic curve keyed to
[[concepts/Session-Escalation|session escalation]]), it can loop geometry back on itself once
entity proximity or an anomaly reveal triggers it, and it never shows anomaly rooms at all.

[[sources/ADR-0005-Session-Data-Pipeline|ADR-0005]] pins the on-disk property schema: one
hand-authored JSON file per property, storing **both** an `estimatedPosition` (what the dollhouse
shows) and an `authoritativePosition` (what [[entities/Scan-Node-System]] and
[[entities/Scan-Mechanic]] actually use) per node — a single file, drift-proof by construction,
rather than two separate files that could fall out of sync.

[[sources/ADR-0006-Floor-Plan|ADR-0006]] leaves the dollhouse view-model's *transport* to UI
(a new bus event vs. composition-root wiring) explicitly undecided — deferred to the future
UI/HUD ADR.

## Related Entities
- [[entities/Point-Cloud-Renderer]] — renders the room AABBs this system supplies
- [[entities/Scan-Node-System]] — receives the one-time node roster via `floorplan:init`
- [[entities/FPS-Movement]] — receives collision bounds and loop-teleport commands
- [[entities/Entity-System]] — reads room/door graph for placement; favors the anomaly room post-reveal

## Related Concepts
- [[concepts/Perception-Stripping]] — this system's entire reason for existing
- [[concepts/Session-Escalation]] — drives the desync curve's severity

## Mentions in Source
- "The floor plan gives confident, legible orientation in the first minutes precisely so its later failure lands harder." — [[sources/GDD-Floor-Plan-System]]
- "one hand-authored JSON per property, single source with both estimatedPosition + authoritativePosition per node (drift-proof)" — [[sources/ADR-0005-Session-Data-Pipeline]]
