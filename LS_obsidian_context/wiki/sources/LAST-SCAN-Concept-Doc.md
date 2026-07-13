---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "design/gdd/LAST_SCAN_GDD.md"
tags: [concept-doc, master-doc]
aliases: ["master GDD", "concept doc"]
---

# LAST SCAN Concept Doc - Summary

## Source
- Original file: `design/gdd/LAST_SCAN_GDD.md`
- Ingested: 2026-07-05

## Core Content
The master design document (v0.3) for [[entities/LAST-SCAN]] — a found-footage LIDAR horror game
built in Three.js. Covers the premise (an autonomous scanning unit, `LSC-004`, documents a
property no human can access), the two movement modes, the scan sequence and its rules, the
5-tier proximity table (later reconciled to 4 tiers — see
[[concepts/Proximity-Tier-System]]), three antagonist manifestation types
([[entities/The-Antagonist-Entity]]), the procedural floor plan system, the win/lose conditions
(§9, the [[concepts/Inverted-Reward]]), the single terminal ending screen (§10), the UI aesthetic
spec (§11), the recommended tech stack (§12), and two rounds of "expansion mechanics" (§15 v0.2,
§16 v0.3) covering found-footage framing, scanner-identity body-horror, property variety, and a
cross-session persistence cycle.

## Key Entities
- [[entities/LAST-SCAN]]
- [[entities/The-Antagonist-Entity]]
- [[entities/Three-js]]

## Key Concepts
- [[concepts/Inverted-Reward]]
- [[concepts/Found-Footage-Framing]]
- [[concepts/Diegetic-UI]]

## Main Points
- Single session, single ending, ~20–30 minutes, no explanation given for the premise.
- §9/§10 rework (in a later revision) established coverage% as false comfort — the numbers read
  as good throughout play regardless of which ending they actually represent.
- §15/§16 catalog several not-yet-implemented expansion mechanics (Depth-Only Preview, Dollhouse
  Desync, Looping Geometry, Auto-Typed Log, Signal Decay, Found-Footage playback artifacts,
  scanner self-diagnostics, cross-session persistence) — most have since been formally designed
  into their owning systems; a few (Depth-Only Preview, Auto-Typed Log, Signal Decay) remain
  explicitly out of scope for MVP per later GDDs' own Open Questions.
