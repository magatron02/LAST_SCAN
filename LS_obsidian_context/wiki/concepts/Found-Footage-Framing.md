---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/LAST-SCAN-Concept-Doc]]", "[[sources/GDD-Win-Lose-Ending]]"]
tags: [design-pillar, narrative]
aliases: ["§16-F", "the viewer framing"]
---

# Found-Footage Framing

## Definition
One of the project's four core pillars: the player is not the hero of a live event — they are
someone who *found* a recovered session and is watching it, after the fact. The in-game unit
(`LSC-004`) "did not return to base," and a replacement unit (`LSC-005`) is already queued,
implying the whole game is one iteration of a recurring cycle.

## Key Characteristics
- Licenses specific presentation choices a live game UI wouldn't have: playback artifacts (frame
  stutter, dropped frames, brief rewinds) when the antagonist is near, occasional "footage
  missing" gaps, a viewer-count/`PLAYBACK` badge hint — all owned by a future, undesigned
  "Found-Footage Layer" system (#13).
- Directly shapes [[entities/Win-Lose-Ending]]'s terminal screen: it reads as a routine upload log
  (`SESSION ID`, `NEXT SCHEDULED SCAN`, `REPLACEMENT UNIT`), never as a game-over screen — "the
  reveal is environmental/implied — the game never states which ending the player got."
- Combines with [[concepts/Diegetic-UI]]: the framing is why ambiguity (a stale dollhouse, an
  unconfirmed entity capture) reads as "sensor/recording corruption" rather than "a bug."

## Applications
This session's most direct application was [[entities/Win-Lose-Ending]]'s text-variation matrix:
a `narrative-director` consult established that the ending screen's `STATUS` line uses only a
2-register split (not 4 unique strings) specifically because the found-footage log's "routine
process" voice must sound identical for the good and bad endings — the entire horror mechanism
depends on the log not editorializing.

## Related Concepts
- [[concepts/Diegetic-UI]]
- [[concepts/Inverted-Reward]] — the framing is *why* the trap can stay hidden until the end

## Related Entities
- [[entities/LAST-SCAN]] — pillar-level
- [[entities/Win-Lose-Ending]]

## Mentions in Source
- "The player is not the hero — they are someone who found the saved session and is viewing it." — [[sources/LAST-SCAN-Concept-Doc]]
- "The reveal is environmental/implied — the game never states which ending the player got." — [[sources/LAST-SCAN-Concept-Doc]]
