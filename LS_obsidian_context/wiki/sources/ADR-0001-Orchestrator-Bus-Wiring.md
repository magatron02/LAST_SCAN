---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "docs/architecture/adr-0001-orchestrator-bus-wiring.md"
tags: [adr, accepted]
aliases: ["ADR-0001"]
---

# ADR-0001: Orchestrator Bus Wiring - Summary

## Source
- Original file: `docs/architecture/adr-0001-orchestrator-bus-wiring.md`
- Ingested: 2026-07-05

## Core Content
The project's first ADR and, as of this wiki's snapshot, its **only Accepted** one. Resolves four
implementation questions [[entities/Orchestrator]]'s GDD deliberately deferred: (a) manual
composition-root DI wiring via `src/main.js`, rejecting both a module-singleton and a
service-locator pattern; (b) the static event-override table lives in a hand-authored
`src/core/event-overrides.js`, compiled once at construction, rejecting build-time codegen from
the registry as premature; (c) an ESLint `import/no-restricted-paths` zone rule mechanically
enforces "no direct imports between gameplay systems," rejecting review-checklist-only
enforcement; (d) the bus's full delivery pass runs before `renderer.render()` every frame, with a
dev-only perf tripwire.

## Key Entities
- [[entities/Orchestrator]]

## Key Concepts
- [[concepts/Event-Bus-Architecture]]

## Main Points
- Accepted 2026-07-02, after the Orchestrator GDD's own round-4 independent design-review passed
  with 5 specialists.
- Explicitly rejects a module-singleton bus because it "would break the 34 AC-OR tests'
  order-dependent... test-isolation guarantee."
- Every other ADR in the project (0002–0007) depends on this one for its bus-injection pattern.
