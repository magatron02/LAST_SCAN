---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "design/gdd/orchestrator.md"
tags: [gdd, core, approved]
aliases: ["Orchestrator GDD"]
---

# GDD: Session/Game State Orchestrator - Summary

## Source
- Original file: `design/gdd/orchestrator.md`
- Ingested: 2026-07-05

## Core Content
Full design spec for [[entities/Orchestrator]]: 7 core rules (registration-not-invention,
session lifecycle, continuous-vs-discrete events, deterministic ordering via a compiled override
set, no direct imports, provisional-flag cleanup, latest-value-vs-discrete caching), 34
acceptance criteria — the densest AC set of any GDD in the project. Four sibling GDDs
(Point Cloud, FPS Movement, Floor Plan, Scan Node) were designed *before* this one and had
marked their Orchestrator-facing contracts "provisional" until this GDD formalized them.

## Key Entities
- [[entities/Orchestrator]]

## Key Concepts
- [[concepts/Event-Bus-Architecture]] — this GDD's entire subject
- [[concepts/Registry-Driven-Consistency]] — its own OQ6 led directly to `verify-registry` tooling

## Main Points
- **Status: Approved**, round-4, 2026-07-02, after 3 prior revision rounds — the manual
  registry-audit process itself was found unreliable across all 3 rounds, which is why a scripted
  `verify-registry.mjs` tool now exists.
- Player Fantasy is explicitly "none" — pure infrastructure whose only measurable success
  criterion is invisibility.
