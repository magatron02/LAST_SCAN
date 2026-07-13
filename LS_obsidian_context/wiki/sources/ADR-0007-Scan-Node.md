---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "docs/architecture/adr-0007-scan-node.md"
tags: [adr, proposed]
aliases: ["ADR-0007"]
---

# ADR-0007: Scan Node Registry + Coverage Authority - Summary

## Source
- Original file: `docs/architecture/adr-0007-scan-node.md`
- Ingested: 2026-07-05

## Core Content
Pins [[entities/Scan-Node-System]]'s internal structure: a `Map<nodeId, NodeState>` registry, and
`coverage()` as a **pure recompute** from that registry every call rather than a cached mutable
counter — deliberately avoiding a second source of truth that could drift, since the registry is
small enough (≤16 nodes) that recomputation is free. Also pins the synchronous
mutate-then-compute-then-emit ordering that makes `scan:coverage` and `scan:complete.coverage`
provably identical within one tick, backed by [[entities/Orchestrator]]'s atomic-adjacency
delivery override.

## Key Entities
- [[entities/Scan-Node-System]]
- [[entities/Orchestrator]] — the atomic-delivery mechanism this ADR depends on

## Key Concepts
- [[concepts/Inverted-Reward]] — `coverage()`'s formula is this thesis's mechanism
- [[concepts/Registry-Driven-Consistency]]

## Main Points
- Explicitly rejects a cached mutable `V` counter as "a second source of truth that can drift from
  the registry."
- Node-ledger view-model transport to UI is deferred the same way Floor Plan's was — a shared,
  tracked seam across two ADRs, both pointing at the same future UI/HUD ADR.
