---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Entity-System]]"]
tags: [system, gameplay, ai]
aliases: ["the antagonist system"]
---

# Entity System (code system)

> Not to be confused with [[entities/The-Antagonist-Entity]], the in-fiction thing this system
> spawns and controls.

## Basic Information
- Type: system (Core layer, spawning/behavior logic)
- Status: Designed (2026-07-02), not yet independently reviewed
- Source: [[sources/GDD-Entity-System]]

## Description
Owns spawning, positioning, movement, and behavior for exactly one entity instance per session,
whose active manifestation type (A/B/C) can change over time — despawn-then-spawn, never two
types simultaneously. Renders nothing; tells [[entities/Point-Cloud-Renderer]] what to draw via
`entity:spawn`/`entity:despawn`/`entity:proximity`.

**Resolved a standing open item**: ratified the 4-tier proximity vocabulary
([[concepts/Proximity-Tier-System]]) as canonical, closing a cross-system ambiguity open since
2026-06-27 between the master concept doc's 5-tier prose and the 4-tier contract two other
systems had already built against.

Each entity type has a distinct behavior model: Type A (void) grows a diminishing-returns
silhouette scale with dwell time; Type B (spike) does a slow pause-and-shift random walk; Type C
(ghost) **trails the player's position history from 4 seconds ago**, not their current position —
"arrives where the player *was*." Type C's pursuit speed uses a cubic curve on
[[concepts/Session-Escalation|session escalation]] (matching Floor Plan's `desync_delay`
precedent) so it stays outrunnable for roughly 80% of a session before exceeding the player's own
movement speed late-game.

## Related Entities
- [[entities/The-Antagonist-Entity]] — the in-fiction thing this system implements
- [[entities/Point-Cloud-Renderer]] — receives spawn/despawn to activate visual layers
- [[entities/Floor-Plan-System]] — room/door graph for placement; shares its `session_escalation` formula
- [[entities/Scan-Mechanic]] — consumes `entity:proximity` for the `entityInFrame` proxy
- [[entities/FPS-Movement]] — reads `player:position` for distance/tracking

## Related Concepts
- [[concepts/Proximity-Tier-System]] — ratified here as canonical
- [[concepts/Session-Escalation]] — computed locally, reusing Floor Plan's registered formula

## Mentions in Source
- "Something with intent, expressed only through three different flavors of wrongness, and you never learn which one you're facing until it's already close." — [[sources/GDD-Entity-System]]
- "The 4-tier set FAR / MEDIUM / NEAR / ADJACENT (already load-bearing in Point Cloud Renderer and Floor Plan) is ratified as canonical." — [[sources/GDD-Entity-System]]
