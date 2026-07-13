---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Orchestrator]]", "[[sources/Project-Worklog]]"]
tags: [tool, tooling]
aliases: ["verify-registry.mjs", "verify:registry"]
---

# Verify-Registry Tool

## Basic Information
- Type: tool (`tools/verify-registry.mjs`, run via `npm run verify:registry`)
- Source: [[sources/GDD-Orchestrator]]

## Description
A machine-checked replacement for the manual registry-fidelity audit that failed three consecutive
[[entities/Orchestrator]] design-review rounds. Parses the free-text `payload:` declarations in
[[sources/Entities-Registry-YAML|entities.yaml]] with a balanced-brace reader (no separate
structured schema needed — the registry stays single-source), diffs each event's field set against
its producing GDD's own text, and flags **producer self-contradiction** — the exact failure mode
that hid `floorplan:loop`'s 4-vs-3 `toRoom` field split for three review rounds. Ships with a
`--selftest` mode (9 parser assertions). Last known result: **14 pass, 0 fail, 5 skip
(provisional)**.

Built during Orchestrator's round-3 review as a direct response to that round's own finding: human
reviewers had twice independently believed they'd confirmed "zero deltas" and been wrong both
times.

## Related Entities
- [[entities/Orchestrator]] — this tool exists because of that GDD's own OQ6

## Related Concepts
- [[concepts/Registry-Driven-Consistency]] — this tool is the machine-checked instance of that
  concept
- [[concepts/Cross-System-Invariant-Documentation]]

## Mentions in Source
- "The manual audit's track record is poor -- the 2026-07-01 rounds each believed they had
  confirmed zero deltas, and the 2026-07-02 round-3 review found two live deltas both had missed."
  — [[sources/GDD-Orchestrator]]
- "Not yet wired into CI — `.github/workflows/tests.yml` runs `npm ci → npm run verify:registry →
  npm test` on push, added during `/test-setup`." — [[sources/Project-Worklog]]
