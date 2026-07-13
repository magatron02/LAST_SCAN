---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "design/registry/entities.yaml"
tags: [registry, tooling]
aliases: ["entities.yaml"]
---

# Registry: entities.yaml - Summary

## Source
- Original file: `design/registry/entities.yaml`
- Ingested: 2026-07-05

## Core Content
The design-layer single source of truth for any named fact crossing GDD boundaries: events,
formulas, and tuning constants, each tagged with a `source` GDD and a `referenced_by` list. Holds
21 registered events (3 Orchestrator-owned: `session:tick`/`session:end`/`session:request_end`; 18
per-system-owned), 3 formulas (`session_escalation`, `coverage`, `desync_delay`), and 18 constants.
7 events still read `status: provisional` pending their producing GDD's independent
`/design-review` approval (`movement:scan_triggered`, `movement:scan_released`, `scan:started`,
`scan:captured`, `scan:capture_frame`, `scan:processing`, `scan:uploading`); `entity:proximity`
also still reads provisional despite [[entities/Entity-System]] now being Designed.

## Key Entities
- [[entities/Orchestrator]] — the bus this registry's `events:` section schemas

## Key Concepts
- [[concepts/Registry-Driven-Consistency]] — this file *is* the registry that concept describes
- [[concepts/Event-Bus-Architecture]]

## Main Points
- Append-only by convention — entries are never renumbered/deleted, only marked deprecated or
  superseded.
- `verify-registry.mjs` machine-checks this file's event payloads against producing GDDs; the
  `entities`/`items` sections remain empty (`[]`) — this project is systems/infra-heavy, not
  itemized, so nothing has needed them yet.
