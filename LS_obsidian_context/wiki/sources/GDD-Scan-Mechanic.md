---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "design/gdd/scan-mechanic.md"
tags: [gdd, core, designed]
aliases: ["Scan Mechanic GDD"]
---

# GDD: Scan Mechanic - Summary

## Source
- Original file: `design/gdd/scan-mechanic.md`
- Ingested: 2026-07-05

## Core Content
Full design spec for [[entities/Scan-Mechanic]], authored this session: 10 core rules, a 5-state
machine, 2 formulas (total scan duration and per-beat target yaw, the latter reusing
[[entities/Point-Cloud-Renderer]]'s existing hold-fraction constant), 41 acceptance criteria, 6
open questions. `systems-designer` and `qa-lead` were consulted for Formulas and Acceptance
Criteria respectively (mandatory even in lean review mode).

## Key Entities
- [[entities/Scan-Mechanic]]
- [[entities/FPS-Movement]] — amended mid-session to add `movement:scan_released`

## Key Concepts
- [[concepts/Design-Review-Lean-Mode]] — a clean worked example of the full section-by-section process
- [[concepts/Inverted-Reward]] — this is the verb that can capture the entity

## Main Points
- Mid-session design pivot: unlocking the player during PROCESSING/UPLOADING (rather than for the
  full ~4.4s sequence) required amending a sibling GDD — handled with its own explicit approval
  step, separate from this GDD's own section approvals.
- Resolved Scan Node's own Open Question #2 (`entityInFrame` source) as a proximity-tier proxy,
  explicitly flagged as an MVP precision trade-off for Entity System to revisit.
