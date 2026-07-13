---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/LAST-SCAN-Concept-Doc]]", "[[sources/GDD-Entity-System]]"]
tags: [character, game-world]
aliases: ["the entity", "the antagonist"]
---

# The Antagonist Entity (in-fiction)

> Not to be confused with [[entities/Entity-System]], the code system that implements this.

## Basic Information
- Type: character / game-world threat
- Source: [[sources/LAST-SCAN-Concept-Doc]]

## Description
The game's only antagonist, and it never appears as a creature — only as corruption of the point
cloud data itself. Three manifestations, never simultaneous: **Type A "Null Point"** (a void
where data should exist — a humanoid absence that grows the longer the player lingers near it),
**Type B "Density Spike"** (an impossibly dense amber cluster pretending to be furniture, drifting
slowly), **Type C "Scan Remnant"** (a ghost second-room outline that "knows player location, can
move through walls, follows scan path" — implemented as tracking the player's position history
from several seconds ago, not their current position).

The player is never told which type is active in a given room. Proximity to it corrupts the point
cloud in escalating tiers ([[concepts/Proximity-Tier-System]]) — subtle jitter at `NEAR`, frozen
paralysis at `ADJACENT`. It can be captured in an active scan, which — depending on which node —
either doesn't matter or ends the game (see [[concepts/Inverted-Reward]]).

## Related Entities
- [[entities/Entity-System]] — the code system that spawns, positions, and animates it
- [[entities/Point-Cloud-Renderer]] — renders all three manifestations
- [[entities/Win-Lose-Ending]] — reads `entityEverCaptured` as an ending-text modifier

## Related Concepts
- [[concepts/Proximity-Tier-System]]
- [[concepts/Perception-Stripping]] — the entity is one of several instruments-gone-wrong

## Mentions in Source
- "The player never sees a monster. They see the shape of where data should exist and does not." — [[sources/LAST-SCAN-Concept-Doc]]
- "A ghost room bleeding through the current one is a repeat that shouldn't exist — the horror of déjà vu made literal and hostile." — [[sources/GDD-Entity-System]]
