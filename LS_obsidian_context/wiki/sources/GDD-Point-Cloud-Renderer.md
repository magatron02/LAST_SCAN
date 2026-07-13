---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "design/gdd/point-cloud-renderer.md"
tags: [gdd, foundation]
aliases: ["Point Cloud Renderer GDD"]
---

# GDD: Point Cloud Renderer - Summary

## Source
- Original file: `design/gdd/point-cloud-renderer.md`
- Ingested: 2026-07-05

## Core Content
Full design spec for [[entities/Point-Cloud-Renderer]]: the layer stack (BASE always active,
overlays additive), 4 formulas (surface point density, anomaly-density sigma, proximity jitter
magnitude — quadratic in distance, and scan-materialization opacity — hold-then-linear-ramp), 19
acceptance criteria, and 4 open questions including the HIGH-risk Type A depth-occluder
verification (OQ1) later carried into [[entities/Point-Cloud-Renderer]]'s ADR.

## Key Entities
- [[entities/Point-Cloud-Renderer]]
- [[entities/The-Antagonist-Entity]] — its three types are rendering targets this system owns

## Key Concepts
- [[concepts/Diegetic-UI]] — the entire visual language is this system

## Main Points
- Status: "Designed," not yet independently reviewed as of this wiki's snapshot.
- Player Fantasy frames a two-phase arc: "the Analyst" (reading data as abstraction) transitioning
  to "the Witness" (recognizing the data as evidence) — without anything in the renderer itself
  changing.
- Point budget ceiling 1.5M points with load-time auto-scale; no jump scares, no lighting, no
  bloom on the point cloud itself.
