---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "docs/architecture/adr-0002-point-cloud-renderer.md"
tags: [adr, proposed, high-risk]
aliases: ["ADR-0002"]
---

# ADR-0002: Point Cloud Renderer Architecture - Summary

## Source
- Original file: `docs/architecture/adr-0002-point-cloud-renderer.md`
- Ingested: 2026-07-05

## Core Content
Pins [[entities/Point-Cloud-Renderer]]'s implementation: one merged `THREE.Points`/`BufferGeometry`
per layer category (BASE, a new **BASE_SEALED** accretion layer, ENTITY_SPIKE, ENTITY_GHOST), a
depth-only invisible occluder `THREE.Mesh` for Type A voids, pre-sized typed-array rebuilds
(dispose-and-swap, never incremental), and a spatial-grid-indexed subset-write approach for
per-frame proximity jitter so cost scales with the affected area, not the whole point cloud.

## Key Entities
- [[entities/Point-Cloud-Renderer]]
- [[entities/Three-js]] — the specific r171 depth-buffer behavior this ADR bets on

## Key Concepts
- [[concepts/Architecture-Decision-Record-Process]] — this is the project's one self-gated, HIGH-risk ADR

## Main Points
- **Status: Proposed, self-gated** — cannot flip to Accepted until OQ1 (the depth-only occluder
  technique) is prototype-verified against real Three.js r171 rendering behavior.
- Introduces BASE_SEALED specifically to avoid rebuilding a 1.5M-point geometry on every single
  scan completion — a deliberate addition beyond the GDD's own explicit requirements.
- Names a 3-step fallback ladder if the depth-only occluder technique fails verification, down to
  a CPU point-deletion approach as the last resort.
