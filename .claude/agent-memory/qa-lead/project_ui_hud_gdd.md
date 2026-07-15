---
name: project-ui-hud-gdd
description: UI/HUD System GDD (#12) re-review history — same "combinatorial edge case silently untested" pattern found in Floor Plan/Scan Node, now a third confirmed instance
metadata:
  type: project
---

`design/gdd/ui-hud.md` round 1 (2026-07-10, full synthesis) returned NEEDS REVISION,
4 blockers fixed same session (ratio-formula incoherence, undefined "tick", audio
architecture locked pre-Audio-GDD, orphaned proximity-flicker reference). AC count
48→51. This is the re-review (same day) per `design/gdd/reviews/ui-hud-review-log.md`.

**Confirmed: AC-SN31 (Scan Node's previously-flagged "not test-ready even once
unblocked" DEFERRED constraint, see [[project_scan_node_gdd]] round 3) is now
genuinely closed** — UI/HUD's AC-UH09 gives it a measurable proxy
(`coverage_dominance_ratio` font-size multiple, `toBeCloseTo` assertion) instead of
prose "visual treatment is dominant." Good example of a DEFERRED AC being properly
resolved by the consuming GDD, not just relocated.

**New finding — third confirmed instance of the [[project_floor_plan_gdd]]
combinatorial-edge-case pattern:** the "Same-tick precedence — SEALED wins over a
toggle press" prose paragraph (States and Transitions section) describes a specific
race condition (Dollhouse toggle + SEALED landing same tick → toggle discarded, no
intermediate DOLLHOUSE_OPEN frame) and cites AC-UH32/UH35 as covering it. Neither
actually tests the concurrent-event scenario: AC-UH32 tests SEALED from each
*starting* state independently (not simultaneity with a toggle press); AC-UH35 tests
DOLLHOUSE_OPEN→SEALED generally, not a same-tick toggle race. This is the same shape
as Floor Plan's "loop fires while marker lagged" gap and Scan Node's composition-gap:
two individually-covered mechanics (toggle transition, SEALED transition) whose
*combination* is asserted by a Coverage-Validation-style citation but not actually
exercised by either cited AC. The GDD's own Rule 9 got this right for the analogous
audio case (AC-UH29 explicitly tests error-event + SEALED same-tick) — the state-
machine same-tick case didn't get the same treatment.

**How to apply going forward:** whenever a GDD's body prose describes a same-tick /
simultaneous-event precedence rule and cites existing ACs as proof, check that at
least one cited AC's GIVEN clause actually stages *both* events in the same tick —
not just that each event's own transition is tested separately. This is now a
confirmed cross-GDD pattern (Floor Plan → Scan Node → UI/HUD), worth checking as a
standing item on every future GDD re-review, not just when flagged.

**Secondary findings (recommended/nice-to-have, not blocking):** UH47/UH48
ADVISORY-PROVISIONAL tagging has no forcing function beyond Open Q#6 prose (same
"DEFERRED lacks a forcing function" gap Scan Node round 3 flagged); the jsdom/Testing
Library blocker (Open Q#5) is only flagged in the Testability-requirements preamble,
not inline on the affected ACs (UH05-08, UH10, UH50) themselves; AC-UH46 (hard-cut
transition) and part of AC-UH41 (non-colour channel) bundle an objectively-testable
sub-claim (no CSS transition/animation applied; icon-name-per-state mapping has no
duplicates) inside an ADVISORY-only screenshot criterion — could be split so only the
genuine perceptual judgment stays ADVISORY.

**Round 4 (2026-07-12, independent re-review): fourth confirmed instance of the
[[project_floor_plan_gdd]] combinatorial/sequential-gap pattern, this time sequential
rather than same-tick.** Rule 2's "re-attach invalidates the cache" sub-clause (HUD MUST
discard the stale cached ledger value and force a DOM write on the first post-re-attach
tick "regardless of the equality result") is cited by the Coverage Validation table as
covered by AC-UH50 — but AC-UH50's own GIVEN/WHEN only stages a continuously-polled
unchanged-vs-changed scenario; it never stages the detach (`DOLLHOUSE_OPEN`) → close →
re-attach sequence where the ledger's post-re-attach value happens to be byte-identical
to its pre-detach value. That is exactly the scenario the re-attach rule exists to force
a write for, and no AC currently exercises it. Recommended fix: extend AC-UH50 (or add a
new AC) with GIVEN state transitions `HUD_ACTIVE`→`DOLLHOUSE_OPEN`→`HUD_ACTIVE` and the
ledger's re-attach-tick value equals its pre-detach value, THEN a DOM write still occurs
on the first post-re-attach tick despite value-equality. Same shape as Floor Plan → Scan
Node → UI/HUD-same-tick-toggle (round 3): a Rule's prose names a specific scenario, cites
an AC as proof, and that AC's GIVEN never actually stages the scenario. Standing check
confirmed to also apply across non-same-tick (sequential/stateful) scenarios, not just
same-tick races.

**Also flagged round 4 (minor):** AC-UH12's screenshot checklist item (2) — "no
brighter/warmer colour, no bolder weight, no **larger-looking** treatment" — still
carries a residual subjective qualifier ("looking") the AC's own framing claims to avoid;
recommend restating as three purely computed-style checks (identical `color`, identical
`font-weight`, no additional `transform`/`scale`) with the ratio/order sub-claims left to
AC-UH09/UH10 as already designed. Rule 6's "replace not stack" / anomaly-burst-flooding
claim also has no dedicated AC — AC-UH40 only proves the `anomaliesLogged` tally
increments per-event on a same-tick burst, not that the error bar itself collapses to a
single displayed string. AC-UH19b's N=1 vacuous-repeat-clause exclusion is a known,
already-tracked gap (round 2 log: "Rule 6 pool minimum-size" deferred-recommended item) —
no AC asserts any real pool actually has ≥2 members, so a size-1 pool ships without ever
exercising the anti-repeat branch. Tag-count arithmetic (32 Logic + 15 Integration + 8
Advisory = 55) verified correct by direct AC recount; the 9→8 ADVISORY figure some earlier
round text cites is not a live inconsistency — it's explained by AC-UH42's round-2
ADVISORY→Integration retag (confirmed in `ui-hud-review-log.md` line 104).

**Round 7 (2026-07-13, independent re-review): AC count/tag arithmetic (60 = 36 Logic + 16
Integration + 8 Advisory) and the 16-item Open-Q#5-blocked Integration list both verified
correct by direct recount — no discrepancy this round.** The self-referential AC citations
checked (AC-UH52 self-cite, AC-UH54/UH58↔Rule 10, AC-UH24's "same method as AC-UH23") were all
accurate.

**New finding — 5th confirmed instance of the citation-integrity/exhaustiveness-claim defect
class (round 6 log already called this "a controlled experiment with an unambiguous result:
human review cannot close this class").** Round 6 added Rule 2's "First-tick cold start"
sentinel sub-clause as a *recommended* fix (mirroring Rule 9's `-Infinity` sentinel) — but its
own prose self-admits "AC-UH50's N-consecutive-unchanged-ticks setup begins *after* this first
forced write, so it does not exercise the cold start; the sentinel choice is a stated contract,
not a test-covered one." No AC tests it. Yet the Acceptance Criteria section's "exhaustive by
construction" claim and the Coverage Validation table list only the Log panel (Rule 1) as the
sole exception — Rule 2's cold-start clause is a second, undisclosed exception. Contrast: Rule
9's analogous sting cold-start sentinel *did* get a real AC (UH52's zero-prior-fires branch,
added round 6 for the exact same reason) — so the doc got this right once and missed it the
second time in the same round. Secondary/minor: the Coverage Validation table's Rule 9 row
(AC-UH27/28/29/57/52) omits AC-UH54, even though Rule 9's own prose contains a "DOLLHOUSE_OPEN
suppression" bullet asserting the tone is suppressed — that assertion's only citation is via
Rule 10's row, not Rule 9's own.

**How to apply going forward:** whenever a round's "recommended, applied" fix list adds new
Core Rule prose (not just fixes an existing AC's citation), check whether that new prose was
also given a covering AC — a "recommended" fix is exactly the kind of low-scrutiny addition
this defect class hides in, distinct from the higher-scrutiny "blocking item" fixes. This is a
new standing check to add alongside the existing same-tick/sequential-gap check
([[project_floor_plan_gdd]] pattern).
