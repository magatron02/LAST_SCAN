---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Scan-Node-System]]", "[[sources/ADR-0007-Scan-Node]]"]
tags: [system, gameplay]
aliases: ["Scan Node", "the node ledger"]
---

# Scan Node System

## Basic Information
- Type: system (Core layer, state authority)
- Status: **Approved** (round-4 independent re-review, 2026-07-01, unanimous)
- Source: [[sources/GDD-Scan-Node-System]]

## Description
The single source of truth for every scan node's state (`UNSCANNED → SCANNING → VALID|INVALID`)
and for `coverage = V/S` (valid nodes ÷ total scannable). This is the "one honest gauge" in a game
built to make every other instrument lie — and that honesty is exactly what the
[[concepts/Inverted-Reward]] weaponizes: the ledger reports scanning the trap node in the same
neutral tone as any other.

[[sources/ADR-0007-Scan-Node|ADR-0007]] pins `coverage()` as a **pure recompute from the node
registry** (a `Map<nodeId, NodeState>`), not a cached counter — deliberately avoiding a second
source of truth that could drift. It also pins the synchronous ordering guarantee (`AC-SN29`)
that makes `scan:coverage` and `scan:complete.coverage` provably equal within one tick, backed by
[[entities/Orchestrator]]'s atomic-adjacency delivery override.

## Related Entities
- [[entities/Floor-Plan-System]] — supplies the roster via `floorplan:init`; reciprocally consumes `scan:complete` for anomaly reveals
- [[entities/Scan-Mechanic]] — the only system allowed to report `scan:started`/`scan:captured`
- [[entities/Win-Lose-Ending]] — reads `coverage`, node status, and `entityEverCaptured` to evaluate endings
- [[entities/Orchestrator]] — atomic-delivery override keeps `scan:coverage`/`scan:complete` in lockstep

## Related Concepts
- [[concepts/Inverted-Reward]] — this system's coverage math *is* the trap's mechanism
- [[concepts/Registry-Driven-Consistency]] — `coverage` is a registered cross-system formula

## Mentions in Source
- "The system feels, to the player, like the one honest gauge in a failing machine; mechanically it is a node registry, a per-node state machine, and the coverage math that the win/lose condition reads." — [[sources/GDD-Scan-Node-System]]
- "No cached mutable counter to drift from the registry (satisfies 'coverage is a pure function of node states')." — [[sources/ADR-0007-Scan-Node]]
