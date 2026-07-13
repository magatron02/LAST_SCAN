---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/ADR-0001-Orchestrator-Bus-Wiring]]", "[[sources/Architecture-Registry-YAML]]", "[[sources/ADR-0004-Movement-Input]]"]
tags: [architecture, coding-standard]
aliases: ["composition root", "no singletons"]
---

# Dependency Injection over Singleton

## Definition
A project-wide coding standard (`.claude/docs/coding-standards.md`): systems must be
constructor-injected and unit-testable, never wired through module-level singletons. Made
concrete for the whole game by [[sources/ADR-0001-Orchestrator-Bus-Wiring|ADR-0001]]'s **manual
composition root** — `src/main.js` constructs the single [[entities/Orchestrator]] instance once
and injects it into every gameplay module via constructor parameter or an exported `init(bus)`.

## Key Characteristics
- Two anti-patterns are formally banned in [[sources/Architecture-Registry-YAML]]:
  `direct_cross_system_import` (see [[concepts/Event-Bus-Architecture]]) and
  `module_singleton_bus` — the latter specifically because it "would make the 34 AC-OR tests
  order-dependent" (cached latest-value state and session state would leak across tests) "and
  block consumers from mocking the bus in their own unit tests."
- The project has **no DI container** in its allowed-libraries list — the manual composition-root
  pattern is a deliberate low-tech substitute, chosen over a service-locator (rejected as "the
  singleton problem by another name").
- [[sources/ADR-0004-Movement-Input]] applies the same instinct one level deeper:
  [[entities/FPS-Movement]]'s `update(dt)` takes `dt` as a **passed parameter**, never reading an
  internal clock, specifically so tests can feed synthetic input without a real browser frame loop.
- The static event-override table itself follows the same "explicit over implicit" instinct: a
  hand-authored data module (`src/core/event-overrides.js`) compiled once at construction, not a
  runtime-mutable registry.

## Applications
Every one of the 34 Orchestrator acceptance criteria assumes a **fresh instance per test** — this
is only possible because the composition-root pattern was pinned before any implementation began,
rather than discovered as a refactor need later.

## Related Concepts
- [[concepts/Event-Bus-Architecture]] — the pattern this DI approach specifically wires
- [[concepts/Capped-Delta-Time-Game-Clock]] — the same injected-not-read instinct applied to time

## Related Entities
- [[entities/Orchestrator]] — the primary subject of the composition-root decision
- [[entities/FPS-Movement]] — the second system to apply the same instinct to its own state

## Mentions in Source
- "No module imports a shared bus singleton; no module constructs its own Orchestrator." —
  [[sources/ADR-0001-Orchestrator-Bus-Wiring]]
- "`update(dt)` where `dt` is a passed parameter, capped to `config.dtCap`... never read from an
  internal clock (testability, AC-EC03)." — [[sources/ADR-0004-Movement-Input]]
