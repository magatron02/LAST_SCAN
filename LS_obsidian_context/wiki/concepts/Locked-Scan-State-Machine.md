---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Scan-Mechanic]]", "[[sources/GDD-FPS-Movement]]", "[[sources/UX-Interaction-Patterns]]"]
tags: [core-mechanic, state-machine]
aliases: ["P-SCAN", "the scan verb", "Mode 2"]
---

# Locked Scan State Machine

## Definition
The scan sequence owned by [[entities/Scan-Mechanic]] — `IDLE → INITIALIZING → CAPTURING (4×90°
beats) → PROCESSING → UPLOADING → IDLE`, ≈4.4 seconds total — that revokes the player's movement
and camera control during its most vulnerable window, releasing it the instant the last beat
completes, before the result is even validated.

## Key Characteristics
- Only `INITIALIZING`+`CAPTURING` (2.4s) are movement-locked; `PROCESSING`/`UPLOADING` unlock the
  player early — a deliberate mid-session amendment requiring a new
  `movement:scan_released {}` event added to [[entities/FPS-Movement]]'s own state table.
  [[entities/FPS-Movement]] owns exactly two states (`NAVIGATE`/`SCAN_LOCKED`); this event is the
  sole non-abort exit from the locked one.
- Escape is the *only* valid input during the locked phases — matches
  [[concepts/Diegetic-UI]]'s "no external HUD" constraint by rendering as an in-fiction abort cue,
  not a game-y prompt.
- Named **P-SCAN** in [[sources/UX-Interaction-Patterns]] as the core instance of the
  "Vulnerable State" meta-pattern: trading control for an action while the world keeps running —
  the antagonist is never paused during a scan.
- Camera rotation during capture reuses [[entities/Point-Cloud-Renderer]]'s existing hold-fraction
  constant (`h=0.25`), not a new one — during the first quarter of each beat the camera turns,
  the remaining three-quarters hold still while the materialization ramp plays.

## Applications
Every capture beat re-samples `entity:proximity`, so a scan started when the antagonist is far can
still end adjacent to it — "every angle is a re-roll of the abort decision," and sunk cost pulls
toward finishing exactly when finishing is riskiest, which is the mechanical engine behind
[[concepts/Inverted-Reward]]'s pressure to keep going.

## Related Concepts
- [[concepts/Diegetic-UI]] — governs how the lock/abort state is communicated
- [[concepts/Inverted-Reward]] — the sunk-cost pressure this lock creates serves the trap
- [[concepts/Capped-Delta-Time-Game-Clock]] — the same dt-cap discipline applies during capture timing

## Related Entities
- [[entities/Scan-Mechanic]] — owns the state machine
- [[entities/FPS-Movement]] — owns the two states this drives between
- [[entities/Point-Cloud-Renderer]] — driven by `scan:capture_frame` during CAPTURING

## Mentions in Source
- "It is the moment the game asks them to stop being an agent and become an instrument — camera
  locked, rotation automatic, the only choice left is to wait or abort." — [[sources/GDD-Scan-Mechanic]]
- "Every angle is a re-roll of the abort decision... sunk cost pulls hard toward finishing, exactly
  when finishing is riskiest." — [[sources/GDD-Scan-Mechanic]]
