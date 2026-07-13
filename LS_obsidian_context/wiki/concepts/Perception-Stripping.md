---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/LAST-SCAN-Concept-Doc]]", "[[sources/GDD-Floor-Plan-System]]"]
tags: [design-thesis, game-design]
aliases: ["§8"]
---

# Perception Stripping

## Definition
The horror lever owned by [[entities/Floor-Plan-System]]: the player is progressively stripped of
every reliable means of predicting the space ahead, until live scan data is the only ground truth
left. The map gives confident, legible orientation in the first minutes precisely so its later
failure lands harder.

## Key Characteristics
- **Dollhouse desync**: the map's player-position marker and per-room scan-state lag reality by a
  delay that grows on a *cubic* curve keyed to [[concepts/Session-Escalation]] — genuinely
  truthful early, degrades steeply only late.
- **Looping geometry**: a `loopable` door "arms" once entity proximity or an anomaly reveal
  crosses a threshold (gated by a minimum escalation floor so it can't fire before the player has
  built trust to lose), then teleports the player back into an earlier room on threshold crossing.
- **Anomaly rooms**: never shown on the dollhouse, even after being revealed and made navigable.
- Two *different* kinds of wrongness on different timers: the lagging marker is a slow erosion of
  trust in already-explored space; the anomaly reveal is a sudden admission of instrument failure.

## Applications
Owned entirely by [[entities/Floor-Plan-System]]. Downstream, [[entities/Entity-System]] favors
the anomaly room for its own manifestations once revealed, and [[entities/Win-Lose-Ending]]'s
Movement Violation check must explicitly exclude Floor Plan's loop-teleport frames from being
mistaken for player-driven movement.

## Related Concepts
- [[concepts/Session-Escalation]] — the shared dial that paces this system's severity
- [[concepts/Inverted-Reward]] — a parallel, complementary horror lever

## Related Entities
- [[entities/Floor-Plan-System]]
- [[entities/Entity-System]]
- [[entities/Win-Lose-Ending]]

## Mentions in Source
- "The map gives confident, legible orientation in the first minutes precisely so its later failure lands harder." — [[sources/LAST-SCAN-Concept-Doc]]
- "The emotional target: the slow vertigo of a map you used to trust." — [[sources/GDD-Floor-Plan-System]]
