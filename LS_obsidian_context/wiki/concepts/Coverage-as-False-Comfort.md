---
type: concept
created: 2026-07-05
updated: 2026-07-10
sources: ["[[sources/GDD-Scan-Node-System]]", "[[sources/LAST-SCAN-Concept-Doc]]", "[[sources/GDD-Win-Lose-Ending]]", "[[sources/GDD-UI-HUD]]"]
tags: [design-thesis, ui]
aliases: ["§15-H", "trust valence"]
---

# Coverage as False Comfort

## Definition
Throughout play, [[entities/Scan-Node-System]]'s `coverage` number and the deliberately-divergent
`nodesCompleted` counter are both framed by the UI as unambiguously good — a rising green
progress ring, an affirming log — even though the same numbers are exactly what damns a
Completion Trap player and saves an Escape player. The interface's positive framing is never
corrected before the ending; the reveal is entirely retrospective.

## Key Characteristics
- `coverage = V/S` (`S` includes the anomaly node) and `nodesCompleted` (a standard-only
  denominator) deliberately diverge on purpose: an escaping player sees "12/12" (reads as
  complete) and "92.3%" (reads as incomplete) *simultaneously* — see
  [[entities/Scan-Node-System]]'s Open Question #1, which explicitly forbids "reconciling" the two.
- [[entities/Scan-Node-System]]'s own AC-SN31 (previously DEFERRED) required `coverage` to be the
  visually **dominant** element over `nodesCompleted`, because integer-completeness bias otherwise
  makes "12/12" read as more finished/trustworthy than "92.3%" — backwards from
  [[concepts/Inverted-Reward]]'s intent. **RESOLVED 2026-07-10** by [[entities/UI-HUD]]'s Core
  Rule 4: `coverage_dominance_ratio` (new tuning knob, default 1.5×, range 1.3×–1.75×) — a larger
  font-size ratio plus DOM/reading-order precedence — closing `AC-SN31` as `AC-UH09`–`AC-UH12`,
  the first concrete, testable resolution after 2 sibling GDDs carried it forward as prose only.
  The GDD itself flags the ratio as **unvalidated-by-design**: a "backfire hypothesis" that
  authored emphasis reads as *manipulation* rather than *trust* in a game whose entire visual
  grammar trains "deviation = threat." A required playtest comprehension check gates finalizing
  the value, and round 4 (2026-07-12, see [[sources/UI-HUD-Review-Log]]) pre-registered a fallback
  (`coverage_dominance_ratio → 1.0`, trust re-expressed through a non-size channel) so a confirmed
  backfire has a ready fix path instead of stalling between [[entities/Scan-Node-System]] and
  [[entities/UI-HUD]] each deferring to the other.
- The pattern is not a UI bug to fix — the entire horror mechanism depends on the numbers *not*
  editorializing, matching [[concepts/Found-Footage-Framing]]'s "routine process" tone.

## Applications
Was inherited as an unresolved obligation by [[entities/UI-HUD]]; that system's own GDD (designed
2026-07-10) now owns the resolution — `coverage_dominance_ratio` is the measurable dominance
proxy, no longer an open item, though its default value remains playtest-pending rather than
closed for good (see fallback note above).

## Related Concepts
- [[concepts/Inverted-Reward]] — this is the specific UI-trust mechanism that makes the thesis work
- [[concepts/Found-Footage-Framing]] — the same neutral-tone requirement, applied to the ending screen

## Related Entities
- [[entities/Scan-Node-System]] — owns the underlying divergent math
- [[entities/UI-HUD]] — resolved the display obligation via `coverage_dominance_ratio`
- [[entities/Win-Lose-Ending]] — the terminal screen where the truth finally surfaces

## Mentions in Source
- "Confirm the player-experience framing with `creative-director` when designing the HUD, and do
  not 'reconcile' the two denominators." — [[sources/GDD-Scan-Node-System]]
- "There is no 'you win' or 'you lose' — there's SCAN COVERAGE: 100% or SCAN COVERAGE: 92%." —
  [[sources/GDD-Win-Lose-Ending]]
- "Below ~1.3× the size delta is too subtle to overcome the integer-completeness bias the
  requirement exists to correct; above ~1.75× `nodesCompleted` shrinks enough... to read as
  caption/disabled text." — [[sources/GDD-UI-HUD]]
