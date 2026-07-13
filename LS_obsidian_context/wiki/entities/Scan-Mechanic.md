---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Scan-Mechanic]]"]
tags: [system, gameplay]
aliases: ["the scan verb"]
---

# Scan Mechanic

## Basic Information
- Type: system (Core layer, gameplay verb)
- Status: Designed (2026-07-02), not yet independently reviewed
- Source: [[sources/GDD-Scan-Mechanic]]

## Description
The state machine and timing authority behind the locked 360° scan sequence: `IDLE →
INITIALIZING → CAPTURING (4 beats: 0°/90°/180°/270°) → PROCESSING → UPLOADING → IDLE`, ≈4.4
seconds total. Only `INITIALIZING`+`CAPTURING` (2.4s) are movement-locked — a deliberate
mid-session-design decision to **unlock the player during PROCESSING/UPLOADING** rather than hold
the lock for the full sequence, which required a new `movement:scan_released` event and a small
amendment to [[entities/FPS-Movement]]'s GDD.

Camera rotation during capture reuses [[entities/Point-Cloud-Renderer]]'s existing hold-fraction
constant (`h=0.25`) rather than inventing a new one — during the first quarter of each 0.5s beat
the camera physically turns; during the remaining three-quarters it holds still while the
renderer's materialization ramp plays.

Resolves [[entities/Scan-Node-System]]'s own Open Question #2 (who computes `entityInFrame`) for
MVP: a **proximity-tier proxy** — true if the [[entities/Entity-System|entity]]'s tier was
`NEAR`/`ADJACENT` at any of the 4 capture-beat samples. Distance-only, no facing/frustum check;
flagged as a precision trade-off for Entity System to revisit.

## Related Entities
- [[entities/FPS-Movement]] — locked/released via `movement:scan_triggered`/`movement:scan_released`
- [[entities/Point-Cloud-Renderer]] — driven via `scan:capture_frame`, reuses its `h`/`T` constants
- [[entities/Scan-Node-System]] — receives `scan:started`/`scan:captured`, the sole authority on validity
- [[entities/Entity-System]] — reads `entity:proximity` for the `entityInFrame` proxy

## Related Concepts
- [[concepts/Event-Bus-Architecture]] — introduced 3 new bus events this session
- [[concepts/Inverted-Reward]] — this is the verb that can capture the entity in a scan

## Mentions in Source
- "It is the moment the game asks them to stop being an agent and become an instrument — camera locked, rotation automatic, the only choice left is to wait or abort." — [[sources/GDD-Scan-Mechanic]]
- "Every angle is a re-roll of the abort decision... sunk cost pulls hard toward finishing, exactly when finishing is riskiest." — [[sources/GDD-Scan-Mechanic]]
