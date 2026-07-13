---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/LAST-SCAN-Concept-Doc]]", "[[sources/GDD-Scan-Mechanic]]"]
tags: [design-pillar, ux]
aliases: ["no external HUD"]
---

# Diegetic UI

## Definition
A project-wide forbidden-pattern constraint: **no external/floating UI chrome, ever**. Every
piece of information the player receives is framed as an in-fiction instrument readout —
Matterport-style panels, error messages, progress bars — never a game-y overlay like a floating
"Press E to interact" prompt.

## Key Characteristics
- Cold, clinical, monospace aesthetic; dark background (`#0a0c10`); operational green
  (`#4ade80`) primary, amber (`#fbbf24`) warning, red (`#f87171`) critical.
- Scan Mechanic's own trigger prompt must render as "a highlighted node marker, minimal corner
  text" — explicitly ruled out a floating "Press E" button as breaking this pillar.
- Ambiguity is itself diegetic: instrument failure (a stale dollhouse, a corrupted scan) must read
  as "the machine is malfunctioning," never as "a UI bug" — reinforced by required labels like
  `SPATIAL DATA: CACHED (LAST SYNC ...)`.
- Combines with [[concepts/Found-Footage-Framing]]: the diegetic frame is not just "in the game
  world" but specifically "recovered sensor footage," which licenses artifacts (frame drops,
  rewinds) that a live game UI wouldn't normally have.

## Applications
Every UI Requirements section written this session cited this pillar directly:
[[entities/Scan-Mechanic]]'s trigger prompt and abort text, [[entities/Entity-System]]'s
intensity-only proximity bar, [[entities/Win-Lose-Ending]]'s terminal screen (no "you win"/"you
lose" text under any outcome).

## Related Concepts
- [[concepts/Found-Footage-Framing]]
- [[concepts/Inverted-Reward]] — diegetic ambiguity is what lets the trap stay hidden

## Related Entities
- [[entities/LAST-SCAN]] — pillar-level constraint
- [[entities/Scan-Mechanic]]
- [[entities/Entity-System]]
- [[entities/Win-Lose-Ending]]

## Mentions in Source
- "No external HUD -- all UI is diegetic (Matterport-style overlay)" — [[sources/LAST-SCAN-Concept-Doc]]
- "Trigger prompt must render as an in-fiction instrument cue... not generic UI chrome (no floating 'Press E' button)." — [[sources/GDD-Scan-Mechanic]]
