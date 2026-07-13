---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "docs/architecture/adr-0006-floor-plan.md"
tags: [adr, proposed]
aliases: ["ADR-0006"]
---

# ADR-0006: Floor Plan Data Model + Desync/Loop Architecture - Summary

## Source
- Original file: `docs/architecture/adr-0006-floor-plan.md`
- Ingested: 2026-07-05

## Core Content
Pins [[entities/Floor-Plan-System]]'s internal structure: two independent desync mechanisms (a
continuous position-history ring buffer sampled for the lagged dollhouse marker, and a discrete
scan-state queue with per-event snapshotted delay) rather than one combined structure, since the
two have genuinely different semantics. Also pins a per-door loop finite-state-machine with an
explicit crossing-detector (tracking which side of a threshold AABB the player was on last
sample) so loops only fire on a fresh crossing, never retroactively.

## Key Entities
- [[entities/Floor-Plan-System]]

## Key Concepts
- [[concepts/Perception-Stripping]] — this ADR is the concrete mechanism behind it
- [[concepts/Session-Escalation]] — the desync curve's severity input

## Main Points
- The dollhouse view-model's transport to UI (a new bus event vs. composition-root wiring) is
  explicitly deferred to a future UI/HUD ADR — a known, tracked seam, not a gap.
- Pure functions throughout (the view model, the escalation formulas) — chosen specifically for
  direct Vitest testability without needing rendering.
