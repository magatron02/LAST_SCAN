---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "docs/architecture/adr-0005-session-data-pipeline.md"
tags: [adr, proposed, data]
aliases: ["ADR-0005"]
---

# ADR-0005: Session Data + Node-Position Pipeline - Summary

## Source
- Original file: `docs/architecture/adr-0005-session-data-pipeline.md`
- Ingested: 2026-07-05

## Core Content
Pins the on-disk property schema: one hand-authored JSON file per property
(`data/properties/<id>.json`) holding rooms, doors, and a `nodes[]` array where **each node
carries both `estimatedPosition` and `authoritativePosition`** — a single file, drift-proof by
construction, rather than the two separate files ("dollhouse estimate" vs. "session truth") the
source GDDs' prose had ambiguously implied. Matterport-scan-to-JSON tooling is explicitly deferred
(YAGNI) in favor of hand-authoring for the MVP-scale pool.

## Key Entities
- [[entities/Floor-Plan-System]] — reads estimates, owns validation
- [[entities/Scan-Node-System]] — reads authoritative positions, falls back to estimates

## Key Concepts
- [[concepts/Architecture-Decision-Record-Process]]

## Main Points
- Resolves an open question both [[entities/Floor-Plan-System]] and
  [[entities/Scan-Node-System]]'s own GDDs had flagged as blocking Production.
- The estimate/authoritative divergence on the same node, in the same file, is the literal
  mechanism behind [[concepts/Perception-Stripping]]'s dollhouse-vs-reality mismatch.
