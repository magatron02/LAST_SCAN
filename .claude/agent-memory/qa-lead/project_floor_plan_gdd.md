---
name: project-floor-plan-gdd
description: Floor Plan System GDD review history and recurring AC quality patterns found across review rounds
metadata:
  type: project
---

`design/gdd/floor-plan-system.md` has been through two prior review rounds
(2026-06-27 full 5-agent review → MAJOR REVISION; 2026-06-28 solo Codex
re-review → NEEDS REVISION, both addressed same-session). A third independent
re-review (this one, 2026-06-30) found the AC set structurally much stronger
than round 1 ("byte-identical" / "within a single frame" phrasings are gone,
replaced with synchronous-handler + field-by-field assertions) but still
surfaced 4 testability issues and 7 coverage gaps (4 with zero AC backing:
stale-room-past-session-end, loop-fires-while-marker-lagged, room-interior-
not-navigable rejection, node-outside-AABB rejection).

**Why:** This GDD is unusually rule-dense (9 Core Rules, 3 state tables, 17
edge cases) and has accreted ACs incrementally across rounds (23 → 34). Each
round's rework tends to fix the specific phrasing flagged previously but
doesn't always re-derive coverage from scratch — e.g. round 2 added AC-E09
(position lag) but didn't add the edge-case-listed "loop fires while marker
lagged" interaction AC even though both Rule 6 and Rule 7 existed at that
point. Edge case bullets that combine two already-covered mechanics (e.g.
desync + loop) are easy to silently miss because each individual mechanic
*looks* covered by its own ACs.

**How to apply:** When re-reviewing this file (or doing acceptance-criteria
review on other GDDs with a similarly dense Edge Cases section), explicitly
build a literal table: every edge-case bullet → AC ID, every state-table row
(both entry AND exit transitions) → AC ID. Don't trust that "the mechanics
are covered elsewhere" — interaction edge cases between two already-tested
rules are the most common silent gap. Also watch for AC pairs that test the
same formula twice with different framing (AC-D04 vs AC-D06 here) — these
read as thorough but may be redundant rather than additive; check whether
the second AC actually exercises a different code path (e.g. chained
formula 1→2) before accepting it as real coverage.

**Round 4 update (2026-06-30, AC count 34→43→43 verified clean):** all 4
round-3 testability rewrites (AC-C03/D06/L01/E09) and all 8 gap-closing ACs
(AC-C08/D08/L10/L11/E12/E13/E14/E15) independently re-verified as correct —
including recomputing AC-D06's formula chain by hand (2.36s / 18.77s, both
correct). One NEW pattern found: when a state-table branch has TWO arm/clear
paths (here: proximity vs. anomaly-reveal), fixing the negative-path AC
(AC-L11: COOLDOWN→DORMANT when proximity lapses) and the OTHER path's
positive AC (AC-L08: anomaly persists/re-arms) can still leave the first
path's own positive transition (COOLDOWN→ARMED when proximity *still* holds
at re-evaluation) asserted only by inference via an unrelated AC (AC-L02's
"t0+8s or later it is allowed" doesn't state the condition is still met).
**Apply going forward:** when a gap-closing round adds a negative-case AC for
one of two parallel paths, check whether the positive case for *that same
path* (not just the other path) also got an explicit AC — round 3 closed
L10 (proximity DORMANT→ARMED, no crossing yet) and L11 (proximity COOLDOWN→
DORMANT) but not "proximity COOLDOWN→ARMED, condition still held" — a
genuine sibling gap that wasn't on the original named list and so wasn't
checked for. Also: Interaction Matrix rows can cite a real AC that doesn't
fully prove the row's claim (AC-L03 is cited for "door stays armed" during
SCAN_LOCKED, but AC-L03's GIVEN/WHEN/THEN never directly asserts door state,
only event suppression + resumption) — verify the matrix row's claim against
the AC's actual assertions, not just that the AC ID exists and is roughly
on-topic.
