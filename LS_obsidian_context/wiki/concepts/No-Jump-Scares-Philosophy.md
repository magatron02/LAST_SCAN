---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/LAST-SCAN-Concept-Doc]]", "[[sources/GDD-Entity-System]]", "[[sources/UX-Accessibility-Requirements]]"]
tags: [design-pillar]
aliases: ["§7", "no jump scares"]
---

# No-Jump-Scares Philosophy

## Definition
One of the project's four core design pillars, and an explicitly **forbidden pattern**
(`.claude/docs/technical-preferences.md`): horror is delivered exclusively through escalating
Matterport-style error messages, point-cloud distortion/jitter, and quiet contradictions (a lying
map, looping geometry) — never a startle cue or musical sting.

## Key Characteristics
- [[entities/Entity-System]]'s despawn-at-`ADJACENT` is instant with no fade — a design choice
  that could easily have been a jump-scare beat, deliberately built otherwise.
- [[entities/Scan-Mechanic]]'s audio requirements explicitly forbid non-diegetic stings on abort
  or scan completion — even the moment of narrowly escaping a bad outcome doesn't get a "phew"
  musical cue.
- [[entities/Point-Cloud-Renderer]]'s abrupt-cessation-not-fade rule (materialization simply stops
  rather than fading out) is horror-via-wrongness, not horror-via-surprise.
- Directly load-bearing for [[sources/UX-Accessibility-Requirements]]'s photosensitivity
  requirement (A-V3): because startle-based flicker/strobe is off the table by design, the
  project's only remaining flicker source is the entity-proximity jitter effect — which is why
  that specific effect needed an explicit ≤3 flashes/sec cap rather than the pillar itself ruling
  out photosensitivity risk entirely.

## Applications
This pillar and [[concepts/Perception-Stripping]] are explicitly complementary, not redundant:
one is about *how* horror is delivered (never a shock), the other is about *what* is being taken
away (predictive ability). A system can violate perception-stripping's spirit while still
technically obeying no-jump-scares (e.g. an abrupt, un-telegraphed change that isn't a "scare" but
still reads as a bug rather than fiction) — which is why
[[sources/UX-Interaction-Patterns|P-DEGRADE]] exists as a separate, explicit pattern governing the
*framing* of instrument failure.

## Related Concepts
- [[concepts/Perception-Stripping]] — the complementary "what," where this concept is the "how"
- [[concepts/Diegetic-UI]] — both pillars co-govern how wrongness is communicated

## Related Entities
- [[entities/LAST-SCAN]] — pillar-level constraint
- [[entities/Entity-System]]
- [[entities/Scan-Mechanic]]
- [[entities/Point-Cloud-Renderer]]

## Mentions in Source
- "No jump scares -- horror via error messages / point cloud distortion only." —
  [[sources/LAST-SCAN-Concept-Doc]]
- "a flagged photosensitivity requirement capping flicker/jitter at ≤3 flashes/sec with a
  reduced-distortion toggle." — [[sources/UX-Accessibility-Requirements]]
