---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "design/gdd/scan-node-system.md"
tags: [gdd, core, approved]
aliases: ["Scan Node GDD"]
---

# GDD: Scan Node System - Summary

## Source
- Original file: `design/gdd/scan-node-system.md`
- Ingested: 2026-07-05

## Core Content
Full design spec for [[entities/Scan-Node-System]]: node types (STANDARD/ANOMALY_FINAL/NULL), the
`UNSCANNED→SCANNING→VALID|INVALID` state machine, the `coverage = V/S` formula, a
Cross-System Invariants table (mirroring Floor Plan's Interaction Matrix, pointed at sibling
docs instead of internal rules), 26 acceptance criteria, 3 explicitly DEFERRED criteria with an
Owner/Resolve-when table distinguishing design-blocked from implementation-blocked deferrals.

## Key Entities
- [[entities/Scan-Node-System]]

## Key Concepts
- [[concepts/Inverted-Reward]] — this GDD's coverage math is the trap's literal mechanism

## Main Points
- **Status: Approved**, round-4, 2026-07-01, the project's first unanimous 4-specialist verdict
  after 3 prior rounds of revision.
- `nodesCompleted` (standard-only denominator) and `coverage` (N+1 denominator, includes the
  anomaly node from init) are deliberately different numbers, co-located but never reconciled —
  flagged as load-bearing for the Inverted Reward, not a bug for implementers to "fix."
- Player Fantasy explicitly reframes: the system's own honesty is delivered *by contrast* with
  Floor Plan's desync, not manufactured by any rule of its own.
