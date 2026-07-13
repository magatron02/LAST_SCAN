---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "docs/architecture/adr-0003-per-frame-budget.md"
tags: [adr, proposed, performance]
aliases: ["ADR-0003"]
---

# ADR-0003: Per-Frame Budget Allocation - Summary

## Source
- Original file: `docs/architecture/adr-0003-per-frame-budget.md`
- Ingested: 2026-07-05

## Core Content
A governance ADR (not a code-structure one) splitting the 16.6ms/60fps frame budget across every
per-frame consumer: input/movement (≤0.2ms), bus delivery (≤0.3ms), point-cloud jitter (≤2.0ms),
Floor Plan's per-tick desync sampling (≤0.5ms), leaving an ~8ms CPU soft budget total and the
remainder (~8.6ms) for the GPU point-cloud draw, which is the real FPS ceiling. Adds a dev-only
frame-time monitor alongside [[entities/Orchestrator]]'s existing queue tripwire.

## Key Entities
- [[entities/Orchestrator]] — owns the queue tripwire this ADR reuses
- [[entities/Point-Cloud-Renderer]] — the dominant, least-compressible cost (GPU draw)

## Key Concepts
- [[concepts/Architecture-Decision-Record-Process]]

## Main Points
- All budget numbers are explicitly v1 targets, to be revisited after real profiling — not
  assertions.
- BASE rebuilds and scan-materialization overlays are explicitly excluded from the steady-state
  per-frame budget (they're one-time or bounded-duration spikes, not continuous costs).
