---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/Architecture-Review-2026-07-02]]"]
tags: [process, tooling]
aliases: ["TR-ID", "tr-registry.yaml"]
---

# Traceability (TR-ID) System

## Definition
A stable, permanent requirement-ID scheme (`TR-[system-slug]-[NNN]`, three-digit zero-padded) that
lets stories and reviews cite a specific GDD requirement without ever renumbering it. Source of
record is `tr-registry.yaml` (append-only, write-only-by-`/architecture-review`); the derived
human-readable view is `traceability-index.md`, joining each ID to its covering ADR and that ADR's
Accepted/Proposed status.

## Key Characteristics
- IDs are never renumbered or deleted — only marked `deprecated` or `superseded-by` — so a story
  file that already cites `TR-or-004` never breaks even if the requirement's text is later revised.
- **Coverage and readiness are different axes.** At last snapshot, 42/42 (100%) requirements
  traced to at least one ADR — zero gaps — but only the 9 Orchestrator-related IDs were backed by
  an **Accepted** ADR; the other 33 traced to ADRs still **Proposed**, meaning most of the
  architecture is mapped but not yet unblocked for implementation (per `docs/CLAUDE.md`'s rule:
  "stories referencing a Proposed ADR are auto-blocked").
- Populated in one pass by the project's first-ever `/architecture-review` run — the registry was
  completely empty beforehand.

## Applications
The rerun's "Known Gaps" section explicitly reframes remaining architecture work as **readiness
gaps, not coverage gaps** — a distinction that matters for prioritization: nothing new needs to be
*traced*, several things need to be *Accepted*.

## Related Concepts
- [[concepts/Architecture-Decision-Record-Process]] — the thing TR-IDs trace *to*
- [[concepts/Gate-Check-Process]] — reads traceability state as one of its required inputs

## Related Entities
- [[entities/Orchestrator]] — the only system whose full TR set is Accepted-ADR-backed

## Mentions in Source
- "42/42 (100%) requirements map to at least one ADR — zero gaps, zero partials... coverage ≠
  readiness." — [[sources/Architecture-Review-2026-07-02]]
