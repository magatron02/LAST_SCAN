---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "docs/registry/architecture.yaml"
tags: [registry, architecture, tooling]
aliases: ["architecture.yaml"]
---

# Registry: architecture.yaml - Summary

## Source
- Original file: `docs/registry/architecture.yaml`
- Ingested: 2026-07-05

## Core Content
The architecture-layer registry of cross-ADR stances: state ownership, interface contracts,
performance budgets, API decisions, and forbidden patterns — checked before authoring a new ADR to
detect conflicts at authoring time, before stories get created against contradictory decisions.
Every currently-registered stance originates from
[[sources/ADR-0001-Orchestrator-Bus-Wiring|ADR-0001]] alone: 1 interface (`cross_system_communication`,
pattern `event_bus`), 2 performance budgets (global 60fps/16.6ms target; orchestrator delivery
slice ≤0.3ms), 3 API decisions (`bus_wiring`, `override_set_storage`,
`cross_system_import_enforcement`), 2 forbidden patterns (`direct_cross_system_import`,
`module_singleton_bus`). `state_ownership` is still empty — a scaffolding section with a worked
example only.

## Key Entities
- [[entities/Orchestrator]]

## Key Concepts
- [[concepts/Architecture-Decision-Record-Process]]
- [[concepts/Dependency-Injection-over-Singleton]]

## Main Points
- Notable coverage gap: none of ADR-0002 through 0007 have added their own stances yet (e.g.
  ADR-0002's VOID_MASK depth-occluder technique, ADR-0007's coverage-purity contract), even though
  they meet the file's own "constrains how other systems must be built" registration criterion.
