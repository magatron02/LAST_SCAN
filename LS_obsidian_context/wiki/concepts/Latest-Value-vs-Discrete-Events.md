---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Orchestrator]]"]
tags: [architecture, event-bus]
aliases: ["Core Rule 7", "event caching"]
---

# Latest-Value vs. Discrete Events

## Definition
[[entities/Orchestrator]] Core Rule 7: every registered bus event is classified as one of two
kinds. **Latest-value** events describe *current state* (`session:tick`, `scan:coverage`,
`entity:proximity`, `floorplan:init`) — the bus retains the most recent payload and replays it
immediately to any subscriber that registers later. **Discrete** events describe *a thing that
happened at an instant* (`scan:complete`, `floorplan:loop`, `scan:abort`) — fire-and-forget,
never replayed. `session:end` is the sole discrete exception: it IS replayed once to a subscriber
joining a sealed session, because a late joiner must know sealing happened.

## Key Characteristics
- The distinction exists to solve a specific, real problem: a late-joining system (e.g.
  [[entities/UI-HUD]] registering mid-session) must receive the *current* `scan:coverage` and
  `entity:proximity` tier on subscribe, not silence — but must **not** receive a replay of a
  `scan:complete` for a node scanned before it joined, since re-firing a stale discrete action
  would be actively wrong (e.g. re-triggering a visual effect).
- If a latest-value event fires more than once in a single tick (e.g. `entity:proximity` crossing
  two tiers in one frame), the cached value is the **last write in delivery order** within that
  tick, not an intermediate one — this required Orchestrator's own delivery-ordering guarantees to
  even be well-defined.
- `subscribe()` is synchronously reentrant during a delivery pass — a subscriber that registers
  mid-pass (from inside another handler) gets the previously-cached value as replay plus the
  in-flight emission live, but never both for the same emission (AC-OR29).

## Applications
This classification is what makes [[entities/UI-HUD]] (not yet built) able to join the session at
an arbitrary point and immediately render correct state without every producing system needing to
special-case "a late subscriber joined."

## Related Concepts
- [[concepts/Event-Bus-Architecture]] — the broader pattern this classification is part of
- [[concepts/Registry-Driven-Consistency]] — the classification itself is a registry-entry field

## Related Entities
- [[entities/Orchestrator]] — sole owner of this classification
- [[entities/UI-HUD]] — the system whose late-join behavior this rule exists to serve

## Mentions in Source
- "A late-joining system (e.g. UI/HUD registering mid-session) receives the current value on
  subscribe, not silence." — [[sources/GDD-Orchestrator]]
