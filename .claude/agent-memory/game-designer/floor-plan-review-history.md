---
name: floor-plan-review-history
description: Round-by-round history of design-review findings on design/gdd/floor-plan-system.md, the recurring fault pattern, and round-4 (2026-06-30 solo) findings
metadata:
  type: project
---

`design/gdd/floor-plan-system.md` has been through 4 review rounds as of 2026-06-30.
Full history lives in `design/gdd/reviews/floor-plan-system-review-log.md` — read
that file first on any future review, this is a summary/index on top of it.

**Recurring fault pattern (rounds 1-3):** almost every blocking finding lived at the
*interaction between two individually-correct rules*, not a flaw in either rule
alone (e.g. w_t=1.0 + Formula 2 silently broke the "Completion Trap only" guarantee;
COOLDOWN state + anomaly-reveal arrival was undefined). Round 3's creative-director
synthesis pushed a structural fix: an explicit **Interaction Matrix** subsection in
Detailed Design (cross-checking state pairs against the AC that resolves them) instead
of relying on each new round to rediscover the next interaction by inspection. This
worked — round 4 (my solo re-review, 2026-06-30) found the matrix genuinely
comprehensive and did not find a new *rule-interaction* bug of that class.

**Round 4 (game-designer solo, 2026-06-30) findings** — none blocking:
1. The Tuning Knobs "Desync ramp x loop-arm floor" pacing note (added round 3 in
   response to my round-3 sequencing concern) is directionally right but has no
   numeric anchor — it tells a playtester to "watch for blurring" without giving a
   measurable target, unlike every AC-backed interaction elsewhere in the doc.
   Recommended fix: state the actual desync_delay value at e=loop_arm_floor (0.4)
   explicitly so the gap is falsifiable, not vibes-only.
2. The Player Fantasy reconciliation paragraph (desync vs. anomaly-reveal as "two
   distinct kinds of wrongness") is substantively good, not a bolt-on — but sits as
   a trailing coda *after* the anchor-moment paragraph and an italicized review note,
   rather than inline where the two beats are first juxtaposed. Reader hits the
   unresolved tension before the resolution. Cheap reorder, not blocking.
3. New: the dollhouse toggle-key access paradigm (locked round 3) and the anchor
   moment's timing dependency are unconnected — player-controlled check frequency
   vs. a specific window where lag is "legible as wrongness" rather than imperceptible
   or "broken-reading." Same root cause as #1, recommend folding into the same
   playtest note.
4. New: infinite anomaly-door re-arm (creative-director ruled this is P.T.-style
   recurring hazard, not a fantasy violation, in round 3 — I accept that framing) has
   a *separate*, still-open problem: zero discoverable signal distinguishing "door
   currently safe" from "door might loop again." No audio/visual cue specified
   anywhere (Visual/Audio Requirements requires none). Undercuts competence/SDT —
   player can't learn to predict it. Only place this could be addressed is Open Q#6
   (§15-C2 subtle-difference injection, still unauthored stub).
5. New: proximity-armed loops vs. anomaly-armed loops are mechanically independent
   (Tuning Knobs note acknowledges this) but experientially indistinguishable to the
   player — both present as identical instant teleports. The mechanical question is
   resolved; the *fantasy* question (should the player ever be able to tell these
   apart?) is not addressed anywhere. Recommend one sentence making the ambiguity
   deliberate.

**Pattern to remember for next rounds:** when this GDD comes back for round 5+,
check whether items 1/3 (pacing note teeth) and 4/5 (loop-door legibility) were
acted on — they're the kind of finding likely to get folded into a Tuning Knob note
or Open Question rather than a hard rule, which is the established style for
feel-dependent concerns on this doc.
