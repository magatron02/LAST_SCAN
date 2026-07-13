---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/Systems-Index]]"]
tags: [system, meta, not-started]
aliases: ["system #11"]
---

# Cycle / Meta Layer

## Basic Information
- Type: system (Meta category, Alpha tier, outside the core game loop)
- Status: **Not Started**
- Source: [[sources/Systems-Index]] (no GDD exists yet)

## Description
Depends on [[entities/Persistence]], [[entities/Win-Lose-Ending]] (reads the final outcome), and
[[entities/Orchestrator]]. Implements the master concept doc's §16-I: an incrementing unit ID
(finish as LSC-004, the next playthrough starts as LSC-005), an accreting operator log that
persists across sessions, and "house memory" — the property itself accumulating history across
playthroughs. This is the mechanism that makes [[entities/LAST-SCAN|LAST SCAN]]'s single-session,
single-ending structure into a cycle rather than a one-off.

## Related Entities
- [[entities/Persistence]] — storage substrate
- [[entities/Win-Lose-Ending]] — reads which of the 4 outcomes just happened
- [[entities/Orchestrator]] — event bus

## Related Concepts
- [[concepts/Found-Footage-Framing]] — the cycle is the mechanical expression of "you are viewer N of a series"
- [[concepts/Inverted-Reward]] — each cycle's outcome (Escape vs. Completion Trap) is what accretes

## Mentions in Source
- "Cycle / Meta Layer — depends on: Persistence, Win/Lose (final outcome), Orchestrator. Incrementing unit ID, accreting log, house memory (§16-I)." — [[sources/Systems-Index]]
