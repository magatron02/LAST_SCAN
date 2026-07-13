---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "design/gdd/entity-system.md"
tags: [gdd, core, designed]
aliases: ["Entity System GDD"]
---

# GDD: Entity System - Summary

## Source
- Original file: `design/gdd/entity-system.md`
- Ingested: 2026-07-05

## Core Content
Full design spec for [[entities/Entity-System]], authored this session: 10 core rules, a 4-state
machine (`DORMANT`+3 manifestation states), 3 formulas (Type A silhouette growth —
diminishing-returns curve; Type C pursuit speed — cubic curve on
[[concepts/Session-Escalation]]; manifestation retarget interval — deliberately linear), 46
acceptance criteria, 7 open questions. `systems-designer` and `art-director` were both consulted
(the latter twice, after a clarifying round of decisions).

## Key Entities
- [[entities/Entity-System]]
- [[entities/The-Antagonist-Entity]] — the in-fiction subject this system implements

## Key Concepts
- [[concepts/Proximity-Tier-System]] — ratified as canonical here, closing a 2026-06-27 open item
- [[concepts/Session-Escalation]] — reused, not reinvented, for this system's own curves

## Main Points
- Chose "one entity, mutable manifestation type" over "three simultaneous hazard pools" for
  simplicity — a real design fork, resolved by explicit user decision rather than assumed.
- Type C's cubic pursuit-speed curve deliberately mirrors Floor Plan's `desync_delay` shape and
  reasoning, while the retarget-cadence curve was deliberately made *linear* instead, to avoid
  three severity/cadence changes clustering in the same late-session window.
