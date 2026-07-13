---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Win-Lose-Ending]]"]
tags: [system, gameplay]
aliases: ["Win/Lose", "the ending arbiter"]
---

# Win/Lose & Ending

## Basic Information
- Type: system (Feature layer, evaluation/arbiter)
- Status: Designed (2026-07-02), not yet independently reviewed
- Source: [[sources/GDD-Win-Lose-Ending]]

## Description
The silent arbiter that watches [[entities/Scan-Node-System]], [[entities/Entity-System]], and
[[entities/FPS-Movement]]'s own already-broadcast state and decides two things: when the session
ends, and which of 4 mutually-exclusive outcomes occurred — `ESCAPE`, `COMPLETION_TRAP`,
`MOVEMENT_VIOLATION`, `SCAN_CORRUPTION`. Produces no verb, renders nothing; its only output is a
`session:request_end {reason}` call to [[entities/Orchestrator]].

**Reinterprets the master concept doc's 4 numbered "Lose Types"**: `entityEverCaptured` is treated
as an independent text-modifier flag, not a 5th mutually-exclusive category — matching §10's own
framing of one terminal screen whose text varies by several simultaneous inputs. Completion Trap
fires the instant the anomaly node resolves `VALID` (not literally "coverage=100%"); Escape fires
the instant the last standard node resolves `VALID` with the anomaly still unscanned. Both fire
fully automatically — no player-confirmed "end session" action exists.

Resolved **Movement Violation** detection (deferred here by both Scan Mechanic and Entity
System's own Open Questions): a `player:position` delta check, excluding frames where a Floor
Plan loop-teleport also resolved — no new raw-input event needed from FPS Movement.

**Known gap, deliberately not silently patched**: the ending record has no `anomaliesLogged`
field, even though the terminal-screen template needs one — flagged as this GDD's Open Question
#1, source system undecided. **RESOLVED 2026-07-10** by [[entities/UI-HUD]]'s Core Rule 5:
`anomaliesLogged` is a session-cumulative count of `renderer:anomaly_density` events, tallied by
UI/HUD itself and frozen at the `SEALED` snapshot.

## Related Entities
- [[entities/Scan-Node-System]] — `scan:complete`/`scan:integrity_failure` drive 3 of the 4 outcomes
- [[entities/Entity-System]] — `entity:proximity` gates the Movement Violation check
- [[entities/FPS-Movement]] — `player:position` is the Movement Violation signal
- [[entities/Floor-Plan-System]] — `floorplan:loop` excludes teleport false-positives
- [[entities/Orchestrator]] — receives the `session:request_end` call
- [[entities/UI-HUD]] — renders this system's text-variation matrix and resolved its
  `anomaliesLogged` gap

## Related Concepts
- [[concepts/Inverted-Reward]] — this system makes the thesis mechanically real, not just narrative
- [[concepts/Found-Footage-Framing]] — the terminal screen text mirrors this framing

## Mentions in Source
- "The game knows immediately; the player learns only at the terminal screen — that asymmetry is the entire mechanism of the Inverted Reward's horror." — [[sources/GDD-Win-Lose-Ending]]
- "There is no 'you win' or 'you lose' — there's SCAN COVERAGE: 100% or SCAN COVERAGE: 92%." — [[sources/GDD-Win-Lose-Ending]]
