---
name: project-last-scan
description: Core context on LAST SCAN — found-footage LIDAR horror game, its central design pillar, and the project's review culture
metadata:
  type: project
---

LAST SCAN is a web-based (Three.js) found-footage LIDAR horror game. Core loop:
navigate -> scan nodes -> survive an entity that must not enter the scan data.
Signature mechanics: inverted reward (100% scan coverage is the BAD ending, not
the good one) and found-footage framing (player is reviewing a recovered session
after the fact). No jump scares — horror is built from "the familiar made wrong"
and diegetic UI failures (Matterport-style dollhouse map), not startle.

Central design pillar referenced constantly across GDDs: **Perception Stripping**
(LAST_SCAN_GDD.md §8) — the player is slowly stripped of any reliable way to
predict the space ahead, until live scan data is the only ground truth left.
Floor Plan System is the system that implements this pillar mechanically (dollhouse
desync, anomaly room reveals, looping geometry).

**Why this matters:** any GDD review on this project should treat "does this serve
perception stripping / the familiar-made-wrong feeling" as the primary lens, the
same way MDA aesthetics are normally the primary lens. See
[[floor-plan-review-history]] for how this plays out in practice.

**Review culture on this project:** this team runs genuinely independent multi-round
`/design-review` passes (not rubber-stamping). Rounds explicitly build on each other
via `design/gdd/reviews/[doc]-review-log.md`, which records prior verdicts, blocking
items, and what was revised. When re-reviewing, always read the full review log
history before forming an opinion — findings are tracked by source agent
(`[game-designer]`, `[creative-director]`, etc.) and disagreements between agents
and creative-director are surfaced explicitly, not silently resolved. creative-director
sometimes overrules a specialist's blocking classification (downgrades to
recommended) with stated reasoning — that's a normal, expected part of this
project's process, not a process failure. It's fine to keep disagreeing in a later
round if the underlying concern wasn't actually resolved, just frame it as
"here's a narrower/different angle on the same concern," not as re-litigating the
verdict itself.
