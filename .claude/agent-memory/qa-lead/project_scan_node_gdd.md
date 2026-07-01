---
name: project-scan-node-gdd
description: Scan Node System GDD review history — round 2 composition-gap pattern; round 3 found DEFERRED-as-permanent-escape-hatch risk and AC-SN31's test-readiness gap
metadata:
  type: project
---

`design/gdd/scan-node-system.md` round 1 (2026-06-30, full 5-agent + creative-director
synthesis) returned MAJOR REVISION — every blocking finding sat at the **inheritance
boundary** with a sibling doc (Floor Plan), not inside Scan Node's own logic. Fixed
same session: new Cross-System Invariants table, Floor Plan amended with AC-E17
(exactly one ANOMALY_FINAL enforced at load), AC-SN29 added (synchronous-ordering
guarantee, parity with Floor Plan AC-C05), AC-SN04/SN15/SN16/SN21 tightened for
testability, AC count 22→23.

**Round 2 (independent re-review, same day 2026-06-30):** all 4 testability rewrites
verified concretely testable. AC-SN29 verified to close the ordering gap — its "no
await, synchronously from inside its own handler" phrasing matches Floor Plan AC-C05's
precision level, not under-specified. AC count header now correctly caveats AC-SN22 as
DEFERRED (blocked on Orchestrator/Win-Lose/Scan Mechanic, explicit "do not pull into a
sprint as ready" instruction). The 5 round-1 nice-to-have ACs (position-fallback,
NULL+mixed-roster, AC-SN19 companion, same-frame race, floorplan:reveal-for-non-anomaly)
are tracked only in the review log, not in the GDD's own Open Questions — present but
in a less-discoverable place than this GDD's other deferred items.

**New finding, not on any prior list: the Cross-System Invariants table names a
shared assumption (exactly one ANOMALY_FINAL) and its owning doc (Floor Plan AC-E17)
but no AC anywhere proves the *seam* — that a layout passing AC-E17 actually produces,
through the real `floorplan:init` payload-construction path, a Scan Node roster where
`S = count(STANDARD)+1` holds.** Floor Plan AC-E17 tests its own validator in isolation;
Scan Node AC-SN01/SN03 test roster-building given a hand-rolled fixture that already
assumes exactly one ANOMALY_FINAL. Each side's AC is individually correct; nothing
composes them. Recommended an integration AC (AC-SN30) using the *real* payload-
construction code, not a fixture, as the GIVEN.

**Why this matters beyond this one instance:** this is the same shape as
[[project_floor_plan_gdd]]'s "edge cases combining two already-covered rules go
silently missing" pattern, one level up — instead of two rules *within* one GDD, it's
two GDDs' guards that each individually look airtight, but the connective payload-
construction code between them (the thing that turns a validated `PropertyLayout`
into the wire-shaped `floorplan:init` event) has zero test coverage from either side.
A Cross-System Invariants/Interaction-Matrix-style table that *names* a shared
assumption is necessary but not sufficient — it must be paired with an AC that
exercises the real boundary-crossing code, not two ACs that each mock the other side.

**How to apply:** when reviewing any GDD with a Cross-System Invariants or Interaction
Matrix table, check each row not just for "is there an AC on each side" but "is there
an AC that uses the *other* system's real output (or real validation path) as input,
rather than a hand-constructed fixture that already assumes the invariant holds."
If both sides' ACs use idealized/mocked input for the other system, the seam itself
is untested even though the table makes it look closed.

**Round 3 (independent re-review, 2026-07-01):** AC count now 26 (AC-SN22/30/31
DEFERRED, all else real). Two new findings:

1. **DEFERRED lacks a forcing function.** None of AC-SN22/30/31 has an explicit
   re-trigger/recheck condition — only a category-level blocker ("Orchestrator
   undesigned") and a blanket "don't pull into a sprint" warning. This doc already
   uses an `Owner:` / `Resolve when:` pattern for Open Questions (§Open Q#1-5) but
   doesn't apply it to the three DEFERRED ACs. Given this doc's own round-2-named
   pattern ("the requirement's location gets fixed a round before its content
   does"), DEFERRED risks becoming the same shape one level up — a gap gets a
   tracked ID instead of a tracked date/milestone, and IDs don't expire on their
   own. Recommend adding Owner/Resolve-when fields to each DEFERRED AC.
2. **AC-SN31 is not actually test-ready even once its blocker (HUD GDD) clears.**
   Its THEN clause ("coverage's visual treatment is dominant") has no measurable
   proxy — font-size ratio, DOM order, contrast, whatever — and the AC text itself
   concedes "the specific mechanism is HUD-GDD scope." That means AC-SN31 isn't a
   test spec, it's a design constraint flowed down to a future doc; the HUD GDD
   will need to write its *own* AC with a measurable proxy, and that's what
   actually gets implemented against. Contrast with AC-SN30, which — modulo not
   knowing *where* `floorplan:init` payload construction will live — at least has
   a mechanically clear THEN (`S = count(STANDARD)+1`). Worth distinguishing
   "DEFERRED because blocked on a dependency" (SN30, SN22) from "DEFERRED because
   both blocked AND under-specified as a test" (SN31) — same tag, different
   readiness once unblocked.

Also reconfirmed clean: AC-SN22 consistently cites `scan:coverage` as canonical
throughout (no reintroduced `scan:complete.coverage` ambiguity); all 9 Core Rules,
the state table, and all 8 Invariants-table rows have either a real AC or an
honestly-flagged DEFERRED/Deferred/ADVISORY marker — nothing silently unbacked.
Edge Cases 8 (`floorplan:reveal` for non-anomaly room) and 11 (same-frame race)
remain the only two Edge Cases with zero AC, unchanged since round 1's nice-to-have
list. Edge Case 11 specifically is worth a priority bump (not a blocker) given two
more ordering-sensitive contracts (AC-SN29 sync-ordering, round-2's `scan:coverage`
canonical-broadcast guarantee) have stacked on top of it since round 1 — it's now
the scenario that would stress both simultaneously.
