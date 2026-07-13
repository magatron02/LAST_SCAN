---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Orchestrator]]", "[[sources/ADR-0001-Orchestrator-Bus-Wiring]]"]
tags: [system, infrastructure]
aliases: ["the bus", "the event bus", "Session State Orchestrator"]
---

# Orchestrator

## Basic Information
- Type: system (Core/Foundation layer, infrastructure)
- Status: **Approved** (round-4, 2026-07-02); [[sources/ADR-0001-Orchestrator-Bus-Wiring|ADR-0001]] is the only **Accepted** ADR in the project
- Source: [[sources/GDD-Orchestrator]]

## Description
The central pub/sub event bus and session-state machine (`LOADING → ACTIVE → SEALED`) every other
system publishes to and reads from. Owns no gameplay logic itself — only the registered name and
payload shape of every cross-system event, delivery ordering guarantees within a tick, and the
distinction between *latest-value* events (cached, replayed to late subscribers — e.g.
`entity:proximity`) and *discrete* events (fire-and-forget — e.g. `scan:complete`).

[[sources/ADR-0001-Orchestrator-Bus-Wiring|ADR-0001]] resolves four implementation questions the
GDD deliberately left open: (a) `src/main.js` as the sole composition root injecting the bus via
constructor/`init(bus)` — no singleton; (b) the static override table lives in a hand-authored
`src/core/event-overrides.js`, compiled once; (c) an ESLint `import/no-restricted-paths` rule
mechanically enforces "no direct imports between gameplay systems"; (d) the delivery pass runs
before `renderer.render()` every frame, with a dev-only perf tripwire.

Its own Player Fantasy section states its success criterion is **invisibility** — a player who
notices the Orchestrator at all has noticed a bug.

## Related Entities
- Every other system in the project — all communication is mediated through this one.

## Related Concepts
- [[concepts/Event-Bus-Architecture]] — this entity *is* the concrete implementation of that concept
- [[concepts/Architecture-Decision-Record-Process]] — ADR-0001 is the project's first and, so far, only Accepted ADR

## Mentions in Source
- "A player who notices the Orchestrator at all — a dropped event, an out-of-order state transition, two systems disagreeing about whether a scan is active — has noticed a bug, not a feature." — [[sources/GDD-Orchestrator]]
- "No module imports a shared bus singleton; no module constructs its own Orchestrator." — [[sources/ADR-0001-Orchestrator-Bus-Wiring]]
