---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/Systems-Index]]"]
tags: [system, audio, not-started]
aliases: ["system #6"]
---

# Audio System

## Basic Information
- Type: system (Vertical Slice tier, cross-cutting)
- Status: **Not Started**
- Source: [[sources/Systems-Index]] (no GDD exists yet)

## Description
Depends on [[entities/Entity-System]] for adaptive proximity audio. The base SFX/ambient bus is
meant to be standalone; the adaptive layer reads proximity via [[entities/Orchestrator]]'s
`entity:proximity` event — the same [[concepts/Proximity-Tier-System]] four tiers every other
consumer already agreed on. Design order places it after all MVP systems (Vertical Slice, not
MVP), so it isn't blocking the current [[concepts/Gate-Check-Process|pre-production gate]].

## Related Entities
- [[entities/Entity-System]] — sole hard dependency
- [[entities/Orchestrator]] — event source

## Related Concepts
- [[concepts/Proximity-Tier-System]] — the tier vocabulary this system's adaptive layer will consume
- [[concepts/Event-Bus-Architecture]] — how it will receive proximity without importing Entity System directly

## Mentions in Source
- "Audio System — depends on: Entity System (adaptive proximity audio, §16-J). Base SFX/ambient bus is standalone; adaptive layer reads proximity via Orchestrator." — [[sources/Systems-Index]]
