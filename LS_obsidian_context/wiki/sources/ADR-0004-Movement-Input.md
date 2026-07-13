---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "docs/architecture/adr-0004-movement-input.md"
tags: [adr, proposed, input]
aliases: ["ADR-0004"]
---

# ADR-0004: Kinematic Movement + PointerLock Input - Summary

## Source
- Original file: `docs/architecture/adr-0004-movement-input.md`
- Ingested: 2026-07-05

## Core Content
Pins [[entities/FPS-Movement]]'s implementation as an `FpsMovement(bus, camera, config)` class
with an **injected-`dt`** `update(dt)` method (never an internal clock read, so oversized-`dt`
tunneling tests can inject arbitrary values) and an injectable input source. Drives the camera via
the **native browser PointerLock API**, explicitly rejecting Three.js's `PointerLockControls`
addon because its internal sensitivity model doesn't match the GDD's exact rad/px formulas.

## Key Entities
- [[entities/FPS-Movement]]
- [[entities/Three-js]] — the addon this ADR deliberately avoids

## Key Concepts
- [[concepts/Architecture-Decision-Record-Process]]

## Main Points
- The GDD's math is treated as normative; the native API matches it 1:1 with fewer lines than the
  addon would require abstracting around.
- Camera rotation during [[entities/Scan-Mechanic]]'s locked capture sequence is left as an
  explicit seam for that system to drive, not resolved by this ADR.
