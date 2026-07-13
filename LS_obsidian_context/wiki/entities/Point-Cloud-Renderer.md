---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Point-Cloud-Renderer]]", "[[sources/ADR-0002-Point-Cloud-Renderer]]"]
tags: [system, rendering]
aliases: ["Point Cloud System", "the renderer"]
---

# Point Cloud Renderer

## Basic Information
- Type: system (Foundation layer, rendering)
- Status: Designed (GDD), architecture Proposed (self-gated on OQ1 prototype)
- Source: [[sources/GDD-Point-Cloud-Renderer]]

## Description
The sole visual output layer of the game — everything the player sees is `THREE.Points`, never a
solid mesh. Maintains a base green (`#4ade80`) point cloud of room geometry plus overlay layers
for the three [[entities/The-Antagonist-Entity|antagonist]] manifestations: Type A (void, an
invisible depth-only occluder), Type B (amber density spike), Type C (dim offset ghost-room
geometry). Consumes room AABBs from [[entities/Floor-Plan-System]] and entity
spawn/position/proximity events from [[entities/Entity-System]]; drives its own materialization
animation from [[entities/Scan-Mechanic]]'s capture-frame timing.

The system's one unresolved, HIGH-risk item is **OQ1**: whether the Type A depth-only occluder
technique (a `colorWrite:false, depthWrite:true` mesh) actually blocks points-behind-it while
staying itself invisible on Three.js r171 — this must be prototype-verified before
[[sources/ADR-0002-Point-Cloud-Renderer|ADR-0002]] can move from Proposed to Accepted.

Architecturally, [[sources/ADR-0002-Point-Cloud-Renderer|ADR-0002]] adds a **BASE_SEALED**
accretion layer so completed scans don't force a full 1.5M-point geometry rebuild on every scan —
a deliberate addition beyond what the GDD itself specified.

## Related Entities
- [[entities/Floor-Plan-System]] — supplies room AABBs (data-dependency, not a hard structural dependency)
- [[entities/Entity-System]] — drives which overlay layer is active and where
- [[entities/Scan-Mechanic]] — drives the materialization ramp during a capture
- [[entities/Orchestrator]] — the bus all of the above flows through

## Related Concepts
- [[concepts/Diegetic-UI]] — no HUD chrome, the point cloud *is* the interface
- [[concepts/Architecture-Decision-Record-Process]] — ADR-0002 pins its implementation

## Mentions in Source
- "There is no solid geometry visible at any moment in the game." — [[sources/GDD-Point-Cloud-Renderer]]
- "The player never sees a monster. They see the shape of where data should exist and does not." — [[sources/GDD-Point-Cloud-Renderer]]
- "The Type A occluder is a real engine-behaviour bet (OQ1) — gated, with a fallback ladder." — [[sources/ADR-0002-Point-Cloud-Renderer]]
