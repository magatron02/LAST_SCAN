---
type: entity
created: 2026-07-05
updated: 2026-07-12
sources: ["[[sources/GDD-FPS-Movement]]", "[[sources/ADR-0004-Movement-Input]]", "[[sources/UI-HUD-Review-Log]]"]
tags: [system, input]
aliases: ["Movement System"]
---

# FPS Movement

## Basic Information
- Type: system (Foundation layer, input/camera)
- Status: Designed (GDD), architecture Proposed
- Source: [[sources/GDD-FPS-Movement]]

## Description
Owns player camera and locomotion in exactly two states: `NAVIGATE` (free WASD + PointerLock
mouse-look, fixed 1.6 m/s gait, no jump/crouch/sprint — kinematic, no physics engine) and
`SCAN_LOCKED` (all input revoked while [[entities/Scan-Mechanic]] drives the camera through its
capture sequence). The fixed, un-acceleratable gait is a deliberate design assertion: "the
scanner moves exactly this way because it is a machine."

[[sources/ADR-0004-Movement-Input|ADR-0004]] pins the implementation to the **native browser
PointerLock API**, not Three.js's `PointerLockControls` addon — the addon's euler/sensitivity
model doesn't match the GDD's exact rad/px formulas, so using it would make several acceptance
criteria untestable as written.

This GDD was **amended during the Scan Mechanic design session** to add a new
`movement:scan_released {}` exit from `SCAN_LOCKED`, fired by Scan Mechanic the instant its 4th
capture beat completes — before [[entities/Scan-Node-System|Scan Node]] has even validated the
result. The original `scan:complete`/`scan:abort` exit still handles the abort path.

**Open obligation from [[entities/UI-HUD]]'s round-4 review (2026-07-12, unratified):** this GDD
currently defines no dollhouse-adjacent input state — only `NAVIGATE` and `SCAN_LOCKED`. UI/HUD's
Core Rule 10 (rewritten round 4, see [[sources/UI-HUD-Review-Log]]) needs the player stationary
while the Dollhouse modal is open, for its "safe-while-open, trap-on-close" design to hold — that
locomotion-suspension requirement is recorded as this system's own **Open Q#9**, mirroring the
`SCAN_LOCKED` precedent, pending this GDD's owner to ratify (or contest, which would materially
change UI/HUD's Rule 10 mechanical analysis).

## Related Entities
- [[entities/Scan-Mechanic]] — triggers and releases the lock; drives camera rotation while locked
- [[entities/Floor-Plan-System]] — supplies collision bounds and loop-teleport repositioning
- [[entities/Entity-System]] — reads `player:position` for proximity/tracking, never called directly
- [[entities/Orchestrator]] — the bus mediating all of the above

## Related Concepts
- [[concepts/Event-Bus-Architecture]] — the cross-GDD amendment pattern (adding `movement:scan_released`)
- [[concepts/Blockers-Live-At-Inheritance-Boundary]] — the Open Q#9 obligation is another instance
  of a downstream GDD ([[entities/UI-HUD]]) placing a requirement back on an upstream one

## Mentions in Source
- "The scanner does not run. This is the first thing the player learns, and it may be the last thing they forget." — [[sources/GDD-FPS-Movement]]
- "PointerLockControls is not used: its euler handling and pointerSpeed/polar-angle model don't match the GDD's rad/px sensitivity and ±80° pitch clamp." — [[sources/ADR-0004-Movement-Input]]
