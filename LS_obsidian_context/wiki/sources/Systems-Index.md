---
type: source
created: 2026-07-05
updated: 2026-07-12
source_file: "design/gdd/systems-index.md"
tags: [index, production]
aliases: ["systems index"]
---

# Systems Index - Summary

## Source
- Original file: `design/gdd/systems-index.md`
- Ingested: 2026-07-05; updated 2026-07-10, 2026-07-12

## Core Content
The authoritative enumeration of all 13 systems in [[entities/LAST-SCAN]], their category,
priority tier (MVP/Vertical Slice/Alpha/Full Vision), design status, and dependency graph. Tracks
progress (as of this wiki's last update: **9 of 9 MVP systems designed** — all MVP systems
Designed — 3 independently reviewed and Approved, 1 ([[entities/UI-HUD]]) **In Review** as of
2026-07-12, round-4 revised) and an "Open Cross-System Items" log for ambiguities surfaced by
`/consistency-check` runs before the owning system is formally designed.

## Key Entities
- All 9 designed systems: [[entities/Point-Cloud-Renderer]], [[entities/FPS-Movement]],
  [[entities/Floor-Plan-System]], [[entities/Scan-Node-System]], [[entities/Orchestrator]],
  [[entities/Scan-Mechanic]], [[entities/Entity-System]], [[entities/Win-Lose-Ending]],
  [[entities/UI-HUD]]

## Key Concepts
- [[concepts/Proximity-Tier-System]] — its "Open Cross-System Items" entry tracked the 4-vs-5-tier
  ambiguity from 2026-06-27 until Entity System's GDD resolved it
- [[concepts/Coverage-as-False-Comfort]] — its "Open Cross-System Items" entry (AC-SN31's missing
  measurable proxy) tracked open until UI/HUD's GDD resolved it with `coverage_dominance_ratio`

## Main Points
- Design order follows Foundation → Core → Feature → Presentation, matching the project's own
  documented layering convention.
- The Entity ↔ Scan Mechanic circular dependency (scanning while near triggers aggression; a scan
  can capture the entity) is explicitly resolved by mediating through
  [[entities/Orchestrator]] rather than either system importing the other.
- As of 2026-07-10, all 9 MVP systems were Designed — [[entities/UI-HUD]] (#12) was the last one,
  and both of its own Open Cross-System Items are marked RESOLVED in this index.
- As of 2026-07-12, [[entities/UI-HUD]]'s row status changed **Designed → In Review** (round-4
  revised; round-5 independent re-review pending) — the first of the 6 unreviewed MVP GDDs to
  enter the review pipeline. See [[sources/UI-HUD-Review-Log]].
