---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/ADR-0003-Per-Frame-Budget]]", "[[sources/ADR-0001-Orchestrator-Bus-Wiring]]"]
tags: [architecture, performance]
aliases: ["16.6ms budget", "60 FPS budget"]
---

# Frame Budget Allocation

## Definition
[[sources/ADR-0003-Per-Frame-Budget]] divides the 16.6ms (60 FPS) frame into advisory
per-system slices — [[entities/FPS-Movement]] ≤0.2ms, [[entities/Orchestrator]]'s bus delivery
≤0.3ms, [[entities/Point-Cloud-Renderer]]'s jitter ≤2.0ms, [[entities/Floor-Plan-System]]'s
per-tick work ≤0.5ms, other discrete handling ≤0.5ms — summing to an ≤8.0ms CPU soft budget,
leaving the remainder for GPU draw + compositing.

## Key Characteristics
- **Advisory, not a hard cap.** No system's overflow work is ever dropped to stay in budget —
  diagnostics over caps was an explicit choice, because dropping e.g. Orchestrator's delivery pass
  would break correctness, not just performance.
- Two dev-only diagnostics exist, both stripped in production: [[entities/Orchestrator]]'s own
  per-tick queue-length tripwire (from [[sources/ADR-0001-Orchestrator-Bus-Wiring]], warns above
  64 events) and a separate frame-time monitor that warns, throttled, naming the largest slice
  when total CPU time exceeds 8.0ms.
- Explicitly excludes bursty/one-time work from the steady-state budget: anomaly-density sampling
  (event/throttle-driven), BASE geometry rebuild (one-time per `floorplan:update`), and scan
  materialization (bounded to active-scan windows only).

## Applications
This is the project's only registered performance budget beyond
[[sources/Architecture-Registry-YAML]]'s two Orchestrator-specific entries — ADR-0003's fuller
per-system slice table is not yet mirrored into that registry file as of this wiki's snapshot, a
gap the wiki inherited rather than silently closed.

## Related Concepts
- [[concepts/Event-Bus-Architecture]] — the delivery-pass-before-render ordering this budget assumes
- [[concepts/Gate-Check-Process]] — perf budgets are part of what a future performance gate would check

## Related Entities
- [[entities/Orchestrator]] — owns the largest share of dev-diagnostic tooling here
- [[entities/Point-Cloud-Renderer]] — owns the single largest advisory slice (jitter, 2.0ms)

## Mentions in Source
- "Diagnostic only — never drops work or caps rate." — [[sources/ADR-0003-Per-Frame-Budget]]
