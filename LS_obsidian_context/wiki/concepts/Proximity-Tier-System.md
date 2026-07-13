---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Entity-System]]", "[[sources/GDD-Point-Cloud-Renderer]]", "[[sources/Systems-Index]]"]
tags: [game-design, cross-system-contract]
aliases: ["FAR/MEDIUM/NEAR/ADJACENT"]
---

# Proximity Tier System

## Definition
The canonical 4-tier vocabulary describing distance from the player to
[[entities/The-Antagonist-Entity|the antagonist]]: `FAR`, `MEDIUM`, `NEAR` (3.0–8.0m), `ADJACENT`
(0.0–3.0m). Broadcast as `entity:proximity {tier}`, a latest-value bus event, emitted only on
tier change.

## Key Characteristics
- Ratified by [[entities/Entity-System]] on 2026-07-02, closing an open cross-system item logged
  since 2026-06-27: the master concept doc's original prose described **5** descriptive states
  (Far/Medium/Near/**Very near**/Adjacent), but [[entities/Point-Cloud-Renderer]] and
  [[entities/Floor-Plan-System]] had already built real formulas against exactly 4.
- The resolution: "Very near" isn't a discrete tier — it describes the felt experience partway
  through `ADJACENT`'s own quadratic jitter curve, not a separate mechanical state.
- Only `NEAR` and `ADJACENT` had registered numeric bands before this session (they're the two
  tiers with real gameplay consequences — jitter, loop-arming). `FAR`/`MEDIUM`'s boundary
  (`proximity_tier_medium_max = 12.0m`) was a genuine gap Entity System had to fill, since it's
  the first system that actually *computes* distance→tier rather than just consuming the result.

## Applications
Consumed by [[entities/Point-Cloud-Renderer]] (jitter intensity), [[entities/Floor-Plan-System]]
(`loop_trigger_tier`, default `NEAR`), [[entities/Scan-Mechanic]] (the `entityInFrame` proxy — true
if tier was `NEAR`/`ADJACENT` at any capture beat), and [[entities/Win-Lose-Ending]] (Movement
Violation gates on `ADJACENT` specifically).

## Related Concepts
- [[concepts/Registry-Driven-Consistency]] — the registry entries this tier system had to fill in

## Related Entities
- [[entities/Entity-System]] — owns tier computation and canonical ratification
- [[entities/Point-Cloud-Renderer]]
- [[entities/Floor-Plan-System]]
- [[entities/Scan-Mechanic]]
- [[entities/Win-Lose-Ending]]

## Mentions in Source
- "The 4-tier set FAR / MEDIUM / NEAR / ADJACENT (already load-bearing in Point Cloud Renderer and Floor Plan) is ratified as canonical, resolving the open cross-system item logged since 2026-06-27." — [[sources/GDD-Entity-System]]
