---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Orchestrator]]", "[[sources/ADR-0001-Orchestrator-Bus-Wiring]]"]
tags: [architecture-pattern, software-design]
aliases: ["pub/sub", "the bus pattern"]
---

# Event Bus Architecture

## Definition
The project-wide rule that gameplay systems never import or call each other directly — all
cross-system communication is mediated by [[entities/Orchestrator]], a single injected pub/sub
bus. Concretely implemented and pinned by
[[sources/ADR-0001-Orchestrator-Bus-Wiring|ADR-0001]], the project's only **Accepted** ADR.

## Key Characteristics
- **Composition root, not singleton**: `src/main.js` constructs the one Orchestrator instance and
  injects it via constructor (classes) or `init(bus)` (flat modules) — chosen specifically because
  a module-level singleton would make cross-test state leak and block mocking, per the project's
  DI-over-singletons coding standard.
- **Mechanically enforced, not review-discipline**: an ESLint `import/no-restricted-paths` rule
  fails any sibling import under `src/systems/**` in CI — chosen because human review had already
  missed registry drift for three consecutive review rounds on a related issue.
- **Two event kinds**: *latest-value* (cached, replayed to late subscribers — e.g.
  `entity:proximity`, `scan:coverage`) vs. *discrete* (fire-and-forget — e.g. `scan:complete`).
- **Deterministic delivery ordering**: a compiled override table (directed pairs + atomic
  adjacency groups) resolved as one stable sort per tick — never an ad-hoc per-pair comparator.
- **Delivery-before-render**: the full delivery pass completes before `renderer.render()` every
  animation frame, with a dev-only perf tripwire if a tick's queue exceeds a threshold.

## Applications
Every system this session (Scan Mechanic, Entity System, Win/Lose) was designed against this
bus's existing contract without needing to redesign it — three new events were added
(`movement:scan_released`, `scan:processing`, `scan:uploading`) but the *mechanism* itself never
changed. When Scan Mechanic needed FPS Movement to unlock early, the fix was a new event through
the bus, never a direct call.

## Related Concepts
- [[concepts/Architecture-Decision-Record-Process]] — ADR-0001 is this pattern's concrete pin
- [[concepts/Registry-Driven-Consistency]] — `entities.yaml`'s `events:` section is this bus's schema

## Related Entities
- [[entities/Orchestrator]] — the implementation
- Every other system entity — all consumers

## Mentions in Source
- "No module imports a shared bus singleton; no module constructs its own Orchestrator." — [[sources/ADR-0001-Orchestrator-Bus-Wiring]]
- "Human audit is exactly the mechanism that missed registry drift for three consecutive review rounds; Core Rule 5 needs a mechanical gate." — [[sources/ADR-0001-Orchestrator-Bus-Wiring]]
