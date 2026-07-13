---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "design/gdd/floor-plan-system.md"
tags: [gdd, core, approved]
aliases: ["Floor Plan GDD"]
---

# GDD: Floor Plan System - Summary

## Source
- Original file: `design/gdd/floor-plan-system.md`
- Ingested: 2026-07-05

## Core Content
Full design spec for [[entities/Floor-Plan-System]]: the data model (`PropertyLayout`, `Room`,
`Door`), 9 core rules, an Interaction Matrix explicitly tracking rule-pair interactions (built
after 3 review rounds kept finding blockers at exactly those boundaries), 2 formulas
([[concepts/Session-Escalation]] and the cubic desync-delay curve), 46 acceptance criteria.

## Key Entities
- [[entities/Floor-Plan-System]]

## Key Concepts
- [[concepts/Perception-Stripping]] — this GDD's entire subject
- [[concepts/Session-Escalation]] — originates here

## Main Points
- **Status: Approved**, round-4 independent re-review, 2026-06-30 — one of only 3 Approved GDDs
  in the project as of this wiki's snapshot.
- The Interaction Matrix is itself a process artifact worth noting: "every blocking finding across
  three review rounds has lived at the interaction between two individually-correct rules, not a
  flaw in either rule alone."
- `w_t` capped at 0.8 specifically to guarantee coverage always retains pull on `e`, structurally
  preventing the desync curve from maxing out on elapsed time alone.
