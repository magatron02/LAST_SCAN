---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/Systems-Index]]"]
tags: [system, ui, not-started]
aliases: ["system #13"]
---

# Found-Footage Layer

## Basic Information
- Type: system (UI category, Presentation layer, Vertical Slice tier)
- Status: **Not Started**
- Source: [[sources/Systems-Index]] (no GDD exists yet)

## Description
Depends on [[entities/UI-HUD]], [[entities/Orchestrator]], and [[entities/Entity-System]]. This is
the system that makes [[concepts/Found-Footage-Framing]] mechanically real rather than purely
tonal: a viewer reveal (the UI occasionally admits it's being *watched*, not driven, by the
player), excised-footage jump cuts (`[FOOTAGE MISSING 00:03:22–00:04:01]` — playback skips a gap,
control is lost and the player is repositioned across it), and playback artifacts (frame stutter,
dropped frames, brief involuntary rewind that double as an entity-proximity tell bypassing the
explicit proximity bar).

Logged in [[sources/Systems-Index]] as a **Technical high-risk system**: convincing fake
frame-drops/rewinds/excised-footage jumps without breaking input state is unproven. Mitigation:
prototype playback artifacts in isolation, gated behind [[entities/Orchestrator]] state so input
stays consistent.

## Related Entities
- [[entities/UI-HUD]] — presentation-layer sibling and hard dependency
- [[entities/Orchestrator]] — gates artifact timing against real session state
- [[entities/Entity-System]] — proximity drives artifact intensity

## Related Concepts
- [[concepts/Found-Footage-Framing]] — this system is that concept's primary mechanical expression
- [[concepts/Event-Bus-Architecture]] — artifacts must be gated through the bus, not ad-hoc timers, to avoid desyncing input state

## Mentions in Source
- "Convincing fake frame-drops / rewinds / excised-footage jumps without breaking input state is unproven. Mitigation: Prototype playback artifacts in isolation; gate behind Orchestrator state so input stays consistent." — [[sources/Systems-Index]]
