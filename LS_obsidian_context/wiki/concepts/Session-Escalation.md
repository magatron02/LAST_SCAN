---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Floor-Plan-System]]", "[[sources/GDD-Entity-System]]"]
tags: [formula, game-design]
aliases: ["e", "the escalation dial"]
---

# Session Escalation (e)

## Definition
A single 0–1 dial, `e = clamp(w_t·(t/T_session) + w_c·coverage, 0, 1)`, blending elapsed session
time against scan coverage. **Registered** as a cross-system formula (source:
[[entities/Floor-Plan-System]]) so any system needing a shared "how far into the dread curve are
we" signal reads the exact same value from the exact same inputs, rather than each system
inventing its own pacing curve.

## Key Characteristics
- `w_t` is capped at 0.8 (so `w_c ≥ 0.2`) — a structural guarantee that coverage always retains
  nonzero pull on `e`, meaning `e` can never reach exactly 1.0 from elapsed time alone. Only the
  Completion Trap (scanning the anomaly node) can push `e` to its true maximum.
- Feeds [[entities/Floor-Plan-System]]'s own `desync_delay` (a *cubic* curve on `e`) and,
  discovered this session, [[entities/Entity-System]]'s Type C pursuit speed (also cubic) and
  manifestation retarget interval (deliberately *linear*, not cubic — see below).
- Not itself broadcast as a bus event — [[entities/Entity-System]] computes the same registered
  formula **locally** from the same already-broadcast `session:tick`/`scan:coverage` inputs,
  rather than requiring Floor Plan to emit a redundant `e` event.

## Applications
A worked design decision from this session: when Entity System needed an escalation input for 3
of its own formulas, the choice was between (a) inventing a parallel curve or (b) reusing this
formula. (b) was chosen specifically to keep the whole game escalating in lockstep — "no risk of
two independent escalation curves drifting out of sync with each other." One of the three
resulting curves (manifestation retarget cadence) was deliberately made *linear* rather than
cubic like the other two, specifically to avoid three independent severity changes all landing in
the same narrow late-session window — "a cadence curve, not a severity curve."

## Related Concepts
- [[concepts/Perception-Stripping]] — the system this formula was originally built for
- [[concepts/Registry-Driven-Consistency]] — this formula is a registry entry other GDDs cite by name

## Related Entities
- [[entities/Floor-Plan-System]] — source and owner
- [[entities/Entity-System]] — second consumer, computed locally

## Mentions in Source
- "w_t capped at 0.8 (w_c >= 0.2) as of 2026-06-30 re-review -- without the cap, w_t=1.0 let e reach 1.0 from elapsed time alone, breaking the desync_delay D_max-only-via-trap guarantee." — [[sources/GDD-Floor-Plan-System]]
- "Entity computes e (session escalation) locally, using Floor Plan's own registered session_escalation formula and the same tuning config... Not a new event — the same formula computed twice from shared raw inputs, guaranteed identical." — [[sources/GDD-Entity-System]]
