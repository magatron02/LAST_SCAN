---
name: scan-node-system-reviews
description: Review history for design/gdd/scan-node-system.md — recurring "assert the what, not the how" pattern across rounds 2-3, closed round 4
metadata:
  type: project
---

`design/gdd/scan-node-system.md` (LAST SCAN) went through 4 review rounds
(2026-06-30 x3, 2026-07-01 round 4). Recurring failure pattern across rounds
2-3, distinct from [[floor-plan-system-reviews]]'s "rule-interaction" pattern:
an AC or Invariants-table row would **assert a cross-system claim without the
test mechanism that actually proves it** — the claim reads as closed on a
shallow pass but the THEN clause doesn't test what the prose says it does.

- Round 2: `scan:coverage` vs `scan:complete.coverage` had no stated canonical
  source — two BLOCKING ACs (Floor Plan AC-D01, this doc's AC-SN22) assumed
  different authoritative payloads for the same number.
- Round 3 (my finding): AC-SN29 was cited in the Cross-System Invariants table
  as proof the two payloads are "guaranteed equal," but AC-SN29's THEN clause
  only tested that `scan:complete` alone was internally fresh (state-before-
  emit ordering) — never tested the two events against each other.
- Round 4 (this round, verified independently): AC-SN29 extended with "AND, in
  the same handling cycle, listeners registered on `scan:coverage` and on
  `scan:complete` both observe the identical `coverage` value" — a genuine
  two-listener equality test, not a restated assertion. Re-derived this myself
  by checking the mechanism (two listeners, same cycle, value comparison) is
  actually specified, not just claimed. Holds.

**Round-4 full sweep result:** all 8 Cross-System Invariants rows (table has
8, not the 6 the review brief assumed — just a counting note) now correctly
either (a) cite an AC that actually proves the row's claim, or (b) honestly
label themselves DEFERRED/placeholder rather than over-claiming. DEFERRED
(design) vs DEFERRED (implementation) distinction (introduced round 3) is
correctly applied to all three deferred ACs: SN22 (design-blocked, needs
Orchestrator/Win-Lose/Scan Mechanic), SN30 (implementation-only-blocked —
Floor Plan AC-E17 already Approved, just needs the real init-payload code
path), SN31 (design-blocked, needs HUD GDD, also needs a measurable proxy
once unblocked). Formula 1 (coverage = V/S) has no unguarded boundary — S≥1
is structurally guaranteed by Floor Plan's own Approved load-time guards
(AC-E11, AC-E17); the S=0 case is explicitly scoped to an authoring-bug wire
payload, not a reachable gameplay state, and has its own tested guard
(AC-SN15).

**Verdict given: Approved, no round 5 expected to find a new blocking gap.**
This is the first system in the project where I gave a fully clean verdict
after multiple NEEDS REVISION rounds — worth noting as a calibration point:
rounds 2-4 were each narrow single-gap findings, never a reopened redesign,
which is the signal that a doc is converging rather than churning.
