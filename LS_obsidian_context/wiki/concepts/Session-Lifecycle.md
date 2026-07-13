---
type: concept
created: 2026-07-07
updated: 2026-07-07
sources: ["[[sources/GDD-Orchestrator]]", "[[sources/GDD-Floor-Plan-System]]"]
tags: [architecture, state-machine]
aliases: ["LOADING/ACTIVE/SEALED", "project-wide session state"]
---

# Session Lifecycle (LOADING → ACTIVE → SEALED)

## Definition
A single project-wide state machine, first defined inside [[entities/Floor-Plan-System]]'s own
per-session state table and then explicitly **adopted verbatim** (not re-invented) as the
project's one true session lifecycle when [[entities/Orchestrator]] was designed — Orchestrator
names this directly as "mirroring Floor Plan's own naming," a deliberate act of inheriting a
precedent rather than creating a competing state machine.

## Key Characteristics
- **`LOADING`**: session start, before any gameplay system has received its first event. Exits to
  `ACTIVE` once [[entities/Floor-Plan-System]]'s initial `floorplan:init` **and**
  `floorplan:update` have both fired — the first system in the dependency chain to become ready
  gates the whole game's start.
- **`ACTIVE`**: normal play. [[entities/Orchestrator]] emits `session:tick {elapsedSeconds}` once
  per animation frame. Exits to `SEALED` on any `session:request_end {reason}` call.
- **`SEALED`**: terminal, no further mutation permitted anywhere. `session:end` fires exactly once,
  synchronously, immediately before entering this state — every listening system is guaranteed to
  receive it before any post-seal event could otherwise arrive.
- **The end-trigger source is deliberately decoupled from the state machine itself**:
  `session:request_end {reason}` is an intake any future system can call (Win/Lose, a hard
  failure, a debug command) — but [[entities/Orchestrator]] alone actually flips state and emits
  `session:end`. This mirrors the project's separately-documented Entity↔Scan Mechanic circular
  dependency resolution: mediate through the bus, grant no direct authority to an unbuilt system.
- A second call to `session:request_end` after the first has already sealed the session is a
  **single-fire guarantee, not an error** — a no-op, logged but otherwise silent.
  [[entities/Win-Lose-Ending]]'s own 4-outcome precedence system explicitly mirrors this same
  single-fire pattern for its own terminal decision.

## Applications
[[entities/Win-Lose-Ending]] is the first system designed *after* Orchestrator to actually call
`session:request_end` — its own Core Rule 7 (single-fire guarantee across 4 mutually-exclusive
outcomes with a strict precedence order) is a direct reuse of this lifecycle's own terminal-state
discipline, applied one layer up.

## Related Concepts
- [[concepts/Latest-Value-vs-Discrete-Events]] — `session:end`'s special cached-replay-on-SEALED-join behavior is a lifecycle/event-caching interaction
- [[concepts/Inverted-Reward]] — the lifecycle this state machine terminates into is what Win/Lose evaluates

## Related Entities
- [[entities/Floor-Plan-System]] — origin of the LOADING/ACTIVE/SEALED naming
- [[entities/Orchestrator]] — sole owner of the adopted, project-wide version
- [[entities/Win-Lose-Ending]] — primary future caller of `session:request_end`

## Mentions in Source
- "Session lifecycle — Orchestrator is sole owner. LOADING → ACTIVE → SEALED, mirroring Floor Plan's own per-session state table." — [[sources/GDD-Orchestrator]]
