---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "design/gdd/fps-movement.md"
tags: [gdd, foundation]
aliases: ["FPS Movement GDD"]
---

# GDD: FPS Movement - Summary

## Source
- Original file: `design/gdd/fps-movement.md`
- Ingested: 2026-07-05

## Core Content
Full design spec for [[entities/FPS-Movement]]: two states (`NAVIGATE`/`SCAN_LOCKED`), 4 formulas
(frame position delta, AABB clamp, yaw update, pitch update with clamp), 18 acceptance criteria.
**Amended during this session's Scan Mechanic design** to add a `movement:scan_released` exit
from `SCAN_LOCKED` for the successful-capture path, alongside the original `scan:abort` exit for
the abort path.

## Key Entities
- [[entities/FPS-Movement]]
- [[entities/Scan-Mechanic]] — the amending system

## Key Concepts
- [[concepts/Event-Bus-Architecture]] — the amendment is a worked example of adding a bus event rather than a direct call

## Main Points
- Fixed 1.6 m/s gait framed as a design assertion, not a placeholder: "This is not a prototype
  constraint. It is a design assertion. The scanner moves exactly this way because it is a
  machine."
- World simulation (and the antagonist) does not pause when PointerLock is lost — an intentional
  design choice, not an oversight.
